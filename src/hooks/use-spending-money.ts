import { convexAction, convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { api } from "convex/_generated/api";
import type { Account } from "convex/accounts";
import type { BillPaymentWithBill } from "convex/billPayments";
import { EST_TIMEZONE } from "@/constants";

type PaySchedule = "semimonthly" | "biweekly" | "weekly" | "monthly";

/**
 * Number of days before a due date that money needs to be in the account.
 * A bill due on the 1st with a 3-day lead means the money has to be there by the 28th/29th,
 * so it's counted against the paycheck that lands before that date.
 */
const BILL_LEAD_DAYS = 3;

/** Reference Monday used for biweekly cycle alignment */
const BIWEEKLY_REFERENCE = DateTime.fromISO("2024-01-01", { zone: EST_TIMEZONE }).startOf("day");

function computeNextPaycheckDate(
	today: DateTime,
	paySchedule: PaySchedule,
	payDays: number[],
): DateTime {
	switch (paySchedule) {
		case "semimonthly": {
			const [first, second] = payDays;
			const firstDay = first === 0 ? today.endOf("month").startOf("day") : today.set({ day: first });
			const secondDay = second === 0 ? today.endOf("month").startOf("day") : today.set({ day: second });
			const candidates = [firstDay, secondDay].filter((d) => d > today);
			if (candidates.length === 0) {
				const nextMonth = today.plus({ months: 1 });
				const nextFirst = first === 0 ? nextMonth.endOf("month").startOf("day") : nextMonth.set({ day: first });
				const nextSecond = second === 0 ? nextMonth.endOf("month").startOf("day") : nextMonth.set({ day: second });
				return nextFirst <= nextSecond ? nextFirst : nextSecond;
			}
			return candidates.reduce((a, b) => (a <= b ? a : b));
		}
		case "weekly": {
			const targetDow = payDays[0];
			const todayDow = today.weekday % 7;
			const daysUntil = (targetDow - todayDow + 7) % 7 || 7;
			return today.plus({ days: daysUntil });
		}
		case "biweekly": {
			const targetDow = payDays[0];
			const todayDow = today.weekday % 7;
			const daysUntilDow = (targetDow - todayDow + 7) % 7 || 7;
			const nextOccurrence = today.plus({ days: daysUntilDow });
			const daysSinceRef = nextOccurrence.diff(BIWEEKLY_REFERENCE, "days").days;
			const weeksSinceRef = Math.floor(daysSinceRef / 7);
			if (weeksSinceRef % 2 !== 0) {
				return nextOccurrence.plus({ weeks: 1 });
			}
			return nextOccurrence;
		}
		case "monthly": {
			const dayOfMonth = payDays[0];
			const candidate = today.set({ day: dayOfMonth });
			if (candidate > today) return candidate;
			return today.plus({ months: 1 }).set({ day: dayOfMonth });
		}
	}
}

/**
 * Calculates available spending money based on:
 *  - Total checking account balances
 *  - Sum of unpaid bill payments whose effective due date (dueDate − 3 days)
 *    falls before the next paycheck.
 *
 * The result answers the simple question:
 *   "After I cover the bills due before my next paycheck, how much do I have left?"
 *
 * If the number is negative, you'll need to pull from savings or defer purchases.
 */
export function useSpendingMoney() {
	const unpaidPaymentsQuery = useQuery(convexQuery(api.billPayments.listUnpaid, { includeAutoPay: true }));
	const accountsQuery = useQuery(convexAction(api.accounts.get, {}));
	const userSettingsQuery = useQuery(convexQuery(api.userSettings.get, {}));

	const today = DateTime.now().setZone(EST_TIMEZONE).startOf("day");

	const paySchedule: PaySchedule = userSettingsQuery.data?.paySchedule ?? "semimonthly";
	const payDays: number[] = userSettingsQuery.data?.payDays ?? [15, 0];

	const nextPaycheckDate = computeNextPaycheckDate(today, paySchedule, payDays);

	const totalCheckingAmount = ((accountsQuery.data as Account[] | undefined) ?? []).reduce((total, account) => {
		if (account.subtype === "checking") {
			if (account.balances?.available != null) return total + account.balances.available;
			if (account.balances?.current != null) return total + account.balances.current;
		}
		return total;
	}, 0);

	const totalUnpaidBillsAmount = ((unpaidPaymentsQuery.data as BillPaymentWithBill[] | undefined) ?? []).reduce(
		(sum, payment) => {
			const due = DateTime.fromISO(payment.dateDue).setZone(EST_TIMEZONE).startOf("day");
			const effectiveDue = due.minus({ days: BILL_LEAD_DAYS });
			if (effectiveDue < nextPaycheckDate) {
				return sum + ((payment.bill?.amount ?? 0) / 100);
			}
			return sum;
		},
		0,
	);

	const spendingMoney = totalCheckingAmount - totalUnpaidBillsAmount;

	return {
		spendingMoney,
		totalCheckingAmount,
		totalUnpaidBillsAmount,
		nextPaycheckDate: nextPaycheckDate.toISO(),
		isLoading: unpaidPaymentsQuery.isLoading || accountsQuery.isLoading || userSettingsQuery.isLoading,
		accountsQuery,
		unpaidPaymentsQuery,
	};
}
