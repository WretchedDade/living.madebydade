import { convexAction, convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { api } from "convex/_generated/api";
import type { Account } from "convex/accounts";
import type { BillPaymentWithBill } from "convex/billPayments";
import { EST_TIMEZONE } from "@/constants";

type PaySchedule = "semimonthly" | "biweekly" | "weekly" | "monthly";
type Frequency = "weekly" | "biweekly" | "monthly";

/** Number of days before a due date that a bill should be "ready to pay" */
const BILL_LEAD_DAYS = 3;

export interface BillInPeriod {
	name: string;
	amount: number;
	dateDue: string;
}

export interface PayPeriod {
	label: string;
	startDate: DateTime;
	endDate: DateTime;
	bills: BillInPeriod[];
	totalBills: number;
	budgetItems: BudgetBreakdownItem[];
	totalBudget: number;
	paycheckAmount: number;
	/** Running balance at end of this period (after bills + budget + paycheck) */
	endBalance: number;
}

export interface BudgetBreakdownItem {
	name: string;
	icon: string;
	/** Prorated dollar amount across the two-period window */
	proratedAmount: number;
}

function occurrencesInPeriod(frequency: Frequency, days: number): number {
	switch (frequency) {
		case "weekly": return Math.round(days / 7);
		case "biweekly": return Math.round(days / 14);
		case "monthly": return Math.round(days / (365 / 12));
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
 * Calculates available spending money across two pay periods.
 *
 * Uses a 3-day lead time so bills are slotted into the pay period where
 * money needs to be ready (e.g., mortgage due the 1st → slotted into
 * the prior EOM pay period).
 *
 * The waterfall shows:
 *   Period 1: checking balance − bills due in period 1
 *   + Paycheck
 *   Period 2: − bills due in period 2
 *   − Budget items (prorated across the full window)
 *   = Free Spending
 */
export function useSpendingMoney() {
	const unpaidPaymentsQuery = useQuery(convexQuery(api.billPayments.listUnpaid, { includeAutoPay: true }));
	const accountsQuery = useQuery(convexAction(api.accounts.get, {}));
	const userSettingsQuery = useQuery(convexQuery(api.userSettings.get, {}));
	const budgetItemsQuery = useQuery(convexQuery(api.budgetItems.list, {}));

	const today = DateTime.now().setZone(EST_TIMEZONE).startOf("day");

	const paySchedule: PaySchedule = userSettingsQuery.data?.paySchedule ?? "semimonthly";
	const payDays: number[] = userSettingsQuery.data?.payDays ?? [15, 0];
	const payAmountCents: number = userSettingsQuery.data?.payAmount ?? 0;
	const payAmountDollars = payAmountCents / 100;

	// Two upcoming paychecks
	const nextPaycheckDate = computeNextPaycheckDate(today, paySchedule, payDays);
	const secondPaycheckDate = computeNextPaycheckDate(nextPaycheckDate, paySchedule, payDays);

	// Sum checking balances
	const totalCheckingAmount = ((accountsQuery.data as Account[] | undefined) ?? []).reduce((total, account) => {
		if (account.subtype === "checking") {
			if (account.balances?.available != null) return total + account.balances.available;
			if (account.balances?.current != null) return total + account.balances.current;
		}
		return total;
	}, 0);

	// Slot each unpaid bill into a period using the 3-day lead time
	const payments = (unpaidPaymentsQuery.data as BillPaymentWithBill[] | undefined) ?? [];

	const period1Bills: BillInPeriod[] = [];
	const period2Bills: BillInPeriod[] = [];

	for (const payment of payments) {
		const due = DateTime.fromISO(payment.dateDue).setZone(EST_TIMEZONE).startOf("day");
		const effectiveDue = due.minus({ days: BILL_LEAD_DAYS });
		const billAmount = (payment.bill?.amount ?? 0) / 100;
		const bill: BillInPeriod = {
			name: payment.bill?.name ?? "Unknown",
			amount: billAmount,
			dateDue: payment.dateDue,
		};

		if (effectiveDue < nextPaycheckDate) {
			period1Bills.push(bill);
		} else if (effectiveDue < secondPaycheckDate) {
			period2Bills.push(bill);
		}
		// Bills beyond 2nd paycheck are not included in the window
	}

	const totalPeriod1Bills = period1Bills.reduce((sum, b) => sum + b.amount, 0);
	const totalPeriod2Bills = period2Bills.reduce((sum, b) => sum + b.amount, 0);

	// Budget items prorated per period based on days in each
	const period1Days = Math.max(1, Math.round(nextPaycheckDate.diff(today, "days").days));
	const period2Days = Math.max(1, Math.round(secondPaycheckDate.diff(nextPaycheckDate, "days").days));
	const totalDays = period1Days + period2Days;

	const rawBudgetItems = (budgetItemsQuery.data ?? []).map(item => ({
		name: item.name,
		icon: item.icon ?? "📦",
		amount: item.amount / 100,
		frequency: item.frequency,
	}));

	const period1Budget: BudgetBreakdownItem[] = rawBudgetItems
		.map(item => ({
			name: item.name,
			icon: item.icon,
			proratedAmount: item.amount * Math.max(1, occurrencesInPeriod(item.frequency, period1Days)),
		}))
		.sort((a, b) => b.proratedAmount - a.proratedAmount);
	const totalPeriod1Budget = period1Budget.reduce((sum, item) => sum + item.proratedAmount, 0);

	const period2Budget: BudgetBreakdownItem[] = rawBudgetItems
		.map(item => ({
			name: item.name,
			icon: item.icon,
			proratedAmount: item.amount * Math.max(1, occurrencesInPeriod(item.frequency, period2Days)),
		}))
		.sort((a, b) => b.proratedAmount - a.proratedAmount);
	const totalPeriod2Budget = period2Budget.reduce((sum, item) => sum + item.proratedAmount, 0);

	// Period 1: checking − bills − budget
	const endPeriod1 = totalCheckingAmount - totalPeriod1Bills - totalPeriod1Budget;

	// + Paycheck
	const afterPaycheck = endPeriod1 + payAmountDollars;

	// Period 2: − bills − budget
	const endPeriod2 = afterPaycheck - totalPeriod2Bills - totalPeriod2Budget;

	// Format period labels
	const formatDate = (d: DateTime) =>
		d.toLocaleString({ month: "short", day: "numeric" });

	const periods: [PayPeriod, PayPeriod] = [
		{
			label: `${formatDate(today)} – ${formatDate(nextPaycheckDate.minus({ days: 1 }))}`,
			startDate: today,
			endDate: nextPaycheckDate.minus({ days: 1 }),
			bills: period1Bills,
			totalBills: totalPeriod1Bills,
			budgetItems: period1Budget,
			totalBudget: totalPeriod1Budget,
			paycheckAmount: 0,
			endBalance: endPeriod1,
		},
		{
			label: `${formatDate(nextPaycheckDate)} – ${formatDate(secondPaycheckDate.minus({ days: 1 }))}`,
			startDate: nextPaycheckDate,
			endDate: secondPaycheckDate.minus({ days: 1 }),
			bills: period2Bills,
			totalBills: totalPeriod2Bills,
			budgetItems: period2Budget,
			totalBudget: totalPeriod2Budget,
			paycheckAmount: payAmountDollars,
			endBalance: endPeriod2,
		},
	];

	// Combined budget breakdown for compatibility
	const budgetBreakdown: BudgetBreakdownItem[] = rawBudgetItems
		.map(item => ({
			name: item.name,
			icon: item.icon,
			proratedAmount: item.amount * Math.max(1, occurrencesInPeriod(item.frequency, totalDays)),
		}))
		.sort((a, b) => b.proratedAmount - a.proratedAmount);
	const totalBudgetProrated = totalPeriod1Budget + totalPeriod2Budget;
	const freeSpending = endPeriod2;

	// Legacy fields for HeroSection / SpendingMoneyCard compatibility
	const totalUnpaidBillsAmount = totalPeriod1Bills + totalPeriod2Bills;
	const spendingMoney = freeSpending;

	return {
		spendingMoney,
		freeSpending,
		totalCheckingAmount,
		totalUnpaidBillsAmount,
		nextPaycheckDate: nextPaycheckDate.toISO(),
		secondPaycheckDate: secondPaycheckDate.toISO(),
		isLoading: unpaidPaymentsQuery.isLoading || accountsQuery.isLoading || userSettingsQuery.isLoading || budgetItemsQuery.isLoading,
		accountsQuery,
		unpaidPaymentsQuery,
		periods,
		payAmountDollars,
		budgetBreakdown,
		totalBudgetProrated,
		totalDays,
	};
}
