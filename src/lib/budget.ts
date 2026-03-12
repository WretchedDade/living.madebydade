import type { Doc } from "convex/_generated/dataModel";

type PaySchedule = "semimonthly" | "biweekly" | "weekly" | "monthly";
type Frequency = "weekly" | "biweekly" | "monthly";

/** How many times per month a given frequency occurs */
export function monthlyMultiplier(frequency: Frequency): number {
	switch (frequency) {
		case "weekly":
			return 52 / 12;
		case "biweekly":
			return 26 / 12;
		case "monthly":
			return 1;
	}
}

/** Calculate monthly income from paycheck amount and schedule */
export function calcMonthlyIncome(payAmountCents: number, paySchedule: PaySchedule): number {
	return Math.round(payAmountCents * monthlyMultiplier(
		paySchedule === "semimonthly" ? "biweekly" : paySchedule,
	));
}

/** Semimonthly is exactly 2x per month */
export function calcMonthlyIncomeExact(payAmountCents: number, paySchedule: PaySchedule): number {
	if (paySchedule === "semimonthly") return payAmountCents * 2;
	return calcMonthlyIncome(payAmountCents, paySchedule);
}

/** Calculate monthly cost of a budget item */
export function calcMonthlyItemCost(item: Pick<Doc<"budgetItems">, "amount" | "frequency">): number {
	return Math.round(item.amount * monthlyMultiplier(item.frequency));
}

/** Frequency display labels */
export function frequencyLabel(frequency: Frequency): string {
	switch (frequency) {
		case "weekly":
			return "/wk";
		case "biweekly":
			return "/2wk";
		case "monthly":
			return "/mo";
	}
}
