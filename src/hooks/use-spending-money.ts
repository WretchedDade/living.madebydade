import { convexAction, convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { api } from "convex/_generated/api";
import type { Account } from "convex/accounts";
import type { BillPaymentWithBill } from "convex/billPayments";
import { EST_TIMEZONE } from "@/constants";

type PaySchedule = "semimonthly" | "biweekly" | "weekly" | "monthly";
type Frequency = "weekly" | "biweekly" | "monthly";

export interface BudgetBreakdownItem {
	name: string;
	icon: string;
	/** Prorated dollar amount for the current pay period */
	proratedAmount: number;
}

function frequencyToDays(frequency: Frequency): number {
	switch (frequency) {
		case "weekly": return 7;
		case "biweekly": return 14;
		case "monthly": return 365 / 12;
	}
}

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
				// Both dates have passed this month — next month
				const nextMonth = today.plus({ months: 1 });
				const nextFirst = first === 0 ? nextMonth.endOf("month").startOf("day") : nextMonth.set({ day: first });
				const nextSecond = second === 0 ? nextMonth.endOf("month").startOf("day") : nextMonth.set({ day: second });
				return nextFirst <= nextSecond ? nextFirst : nextSecond;
			}
			return candidates.reduce((a, b) => (a <= b ? a : b));
		}
		case "weekly": {
			const targetDow = payDays[0]; // 0=Sun … 6=Sat
			const todayDow = today.weekday % 7; // luxon: 1=Mon…7=Sun → 0=Sun…6=Sat
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
			// If the week parity is odd relative to ref, push one more week
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
 *  - Sum of unpaid bill payments due BEFORE the next paycheck
 *
 * Pay schedule is read from user settings, defaulting to semimonthly (15th + EOM).
 *
 * A bill due after the next paycheck (or on the next paycheck date) is NOT subtracted
 * from the current spending money, because it will be covered by that upcoming paycheck.
 */
export function useSpendingMoney() {
	// Always include auto-pay when computing obligations
	const unpaidPaymentsQuery = useQuery(convexQuery(api.billPayments.listUnpaid, { includeAutoPay: true }));

	const accountsQuery = useQuery(convexAction(api.accounts.get, {}));

	const userSettingsQuery = useQuery(convexQuery(api.userSettings.get, {}));

	const budgetItemsQuery = useQuery(convexQuery(api.budgetItems.list, {}));

	const today = DateTime.now().setZone(EST_TIMEZONE).startOf("day");

	const paySchedule: PaySchedule = userSettingsQuery.data?.paySchedule ?? "semimonthly";
	const payDays: number[] = userSettingsQuery.data?.payDays ?? [15, 0];

	// Compute next paycheck date
	const nextPaycheckDate = computeNextPaycheckDate(today, paySchedule, payDays);

	// Special-case: if the upcoming paycheck is end-of-month (semimonthly with EOM), also include
	// bills due on the 1st (day after EOM). This covers scenarios like a 1st-of-month mortgage
	// intentionally paid from the 15th's paycheck.
	const isEomPaycheck = paySchedule === "semimonthly" && payDays.includes(0) && today.day >= 15;
	const includeDayAfter = isEomPaycheck ? nextPaycheckDate.plus({ days: 1 }) : null;

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
				return sum + ((payment.bill?.amount ?? 0) / 100);
			}
			return sum;
		},
		0,
	);

	const spendingMoney = totalCheckingAmount - totalBillsBeforeNextPaycheck;

	// Budget items prorated to the current pay period
	const daysUntilPaycheck = Math.max(1, Math.round(nextPaycheckDate.diff(today, "days").days));

	const budgetBreakdown: BudgetBreakdownItem[] = (budgetItemsQuery.data ?? [])
		.map(item => ({
			name: item.name,
			icon: item.icon ?? "📦",
			proratedAmount: ((item.amount / 100) / frequencyToDays(item.frequency)) * daysUntilPaycheck,
		}))
		.sort((a, b) => b.proratedAmount - a.proratedAmount);

	const totalBudgetProrated = budgetBreakdown.reduce((sum, item) => sum + item.proratedAmount, 0);
	const freeSpending = spendingMoney - totalBudgetProrated;

	return {
		spendingMoney,
		totalCheckingAmount,
		totalUnpaidBillsAmount: totalBillsBeforeNextPaycheck,
		nextPaycheckDate: nextPaycheckDate.toISO(),
		isLoading: unpaidPaymentsQuery.isLoading || accountsQuery.isLoading || userSettingsQuery.isLoading || budgetItemsQuery.isLoading,
		accountsQuery,
		unpaidPaymentsQuery,
		budgetBreakdown,
		totalBudgetProrated,
		freeSpending,
		daysUntilPaycheck,
	};
}
