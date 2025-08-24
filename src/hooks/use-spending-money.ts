import { convexAction, convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { api } from "convex/_generated/api";
import type { Account } from "convex/accounts";
import type { BillPaymentWithBill } from "convex/billPayments";
import { EST_TIMEZONE } from "@/constants";

/**
 * Calculates available spending money based on:
 *  - Total checking account balances
 *  - Sum of unpaid bill payments due BEFORE the next paycheck
 *
 * Pay schedule: 15th and last day of each month.
 *
 * A bill due after the next paycheck (or on the next paycheck date) is NOT subtracted
 * from the current spending money, because it will be covered by that upcoming paycheck.
 *
 * Logic:
 *  - Determine today's date (start of day in EST)
 *  - Determine next paycheck date:
 *      * If today.day < 15 -> next paycheck is the 15th of current month
 *      * Else -> next paycheck is end of current month
 *  - Bills counted toward "must cover now" are those whose due date is strictly < nextPaycheckDate.
 */
export function useSpendingMoney() {
	// Always include auto-pay when computing obligations
	const unpaidPaymentsQuery = useQuery(convexQuery(api.billPayments.listUnpaid, { includeAutoPay: true }));

	const accountsQuery = useQuery(convexAction(api.accounts.get, {}));

	const today = DateTime.now().setZone(EST_TIMEZONE).startOf("day");

	// Compute next paycheck date
	const nextPaycheckDate = (() => {
		if (today.day < 15) {
			return today.set({ day: 15 });
		}
		// 15th or later -> end of month
		return today.endOf("month").startOf("day");
	})();

	// Special-case: if the upcoming paycheck is end-of-month, also include bills due on the 1st (day after EOM).
	// This covers scenarios like a 1st-of-month mortgage intentionally paid from the 15th's paycheck,
	// ensuring it's accounted for before the EOM paycheck is spent.
	const includeDayAfter = today.day >= 15 ? nextPaycheckDate.plus({ days: 1 }) : null;

	// Sum checking balances (available preferred, fallback current)
	const totalCheckingAmount = ((accountsQuery.data as Account[] | undefined) ?? []).reduce((total, account) => {
		if (account.subtype === "checking") {
			if (account.balances?.available != null) return total + account.balances.available;
			if (account.balances?.current != null) return total + account.balances.current;
			console.warn(
				`Encountered checking account (${account.name} ${account.mask}) with no balance information when calculating total checking amount.`,
			);
		}
		return total;
	}, 0);

	// Determine obligations before next paycheck
	const totalBillsBeforeNextPaycheck = ((unpaidPaymentsQuery.data as BillPaymentWithBill[] | undefined) ?? []).reduce(
		(sum, payment) => {
			const due = DateTime.fromISO(payment.dateDue).setZone(EST_TIMEZONE).startOf("day");
			const isBeforeNextPaycheck = due < nextPaycheckDate;
			const isDayAfterEomPaycheck = includeDayAfter != null && due.hasSame(includeDayAfter, "day");

			if (isBeforeNextPaycheck || isDayAfterEomPaycheck) {
				return sum + (payment.bill.amount ?? 0);
			}
			return sum;
		},
		0,
	);

	const spendingMoney = totalCheckingAmount - totalBillsBeforeNextPaycheck;

	return {
		spendingMoney,
		totalCheckingAmount,
		totalUnpaidBillsAmount: totalBillsBeforeNextPaycheck,
		nextPaycheckDate: nextPaycheckDate.toISO(),
		isLoading: unpaidPaymentsQuery.isLoading || accountsQuery.isLoading,
		accountsQuery,
		unpaidPaymentsQuery,
	};
}
