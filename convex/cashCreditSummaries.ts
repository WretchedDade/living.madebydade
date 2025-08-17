import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { DateTime } from "luxon";
import { EST_TIMEZONE } from "../constants";
import type { Doc } from "./_generated/dataModel";
import type { TAccountType } from "./transactionSchema";

type Period = "day" | "week" | "month";

function periodStart(dateIso: string, period: Period) {
	const d = DateTime.fromISO(dateIso, { zone: EST_TIMEZONE });
	const start = d.startOf(period);
	const end = d.endOf(period);
	return { start: start.toISO()!, end: end.toISO()! };
}

export type DetectionFlags = {
	isInternalTransfer?: boolean;
	isCreditCardPayment?: boolean;
	isRefundOrReversal?: boolean;
	isInterestOrFee?: boolean;
};

function detectFlags(
	txn: Pick<Doc<"transactions">, "amount" | "name" | "categoryPrimary" | "categoryDetailed" | "paymentChannel">,
	accountType: TAccountType | undefined,
): DetectionFlags {
	const name = (txn.name || "").toLowerCase();
	const primary = (txn.categoryPrimary || "").toUpperCase();
	const detailed = (txn.categoryDetailed || "").toUpperCase();

	const isInterestOrFee =
		detailed.includes("INTEREST") ||
		detailed.includes("ANNUAL_FEE") ||
		detailed.includes("LATE_FEE") ||
		primary.includes("BANK_FEES");

	const isRefundOrReversal = name.includes("refund") || detailed.includes("REFUND");

	const looksLikePaymentText =
		name.includes("payment") || name.includes("thank you") || detailed.includes("CREDIT_CARD_PAYMENT");
	const isCreditCardPayment =
		accountType === "credit" && (looksLikePaymentText || detailed.includes("DEBT_PAYMENTS"));

	const isInternalTransfer = primary.includes("TRANSFER") || detailed.includes("TRANSFER");

	return { isInternalTransfer, isCreditCardPayment, isRefundOrReversal, isInterestOrFee };
}

function getEffectiveDate(txn: Pick<Doc<"transactions">, "authorizedDate" | "date">): string {
	return (txn.authorizedDate as string | null) ?? (txn.date as string);
}

export function computeCashCreditDeltas(
	txn: Pick<
		Doc<"transactions">,
		| "amount"
		| "authorizedDate"
		| "date"
		| "isoCurrencyCode"
		| "name"
		| "categoryPrimary"
		| "categoryDetailed"
		| "paymentChannel"
	>,
	accountType: TAccountType | undefined,
	flags?: DetectionFlags,
) {
	const f = flags ?? detectFlags(txn, accountType);
	const amount = txn.amount as number; // Plaid: positive = outflow, negative = inflow

	// Override: savings transactions from Fidelity/Brokerage rails (e.g., "FID BKG SVC LLC MONEYLINE …")
	// should be treated as external (not internal transfers)
	const nm = (txn.name || "").toLowerCase();
	const isFidelityLike = nm.includes("fid bkg svc") || nm.includes("moneyline") || nm.includes("fidelity");
	if (accountType === "savings" && isFidelityLike) {
		f.isInternalTransfer = false;
	}

	// Initialize all deltas as 0
	let cashIncomeExternal = 0;
	let cashSpending = 0;
	let cashSavingsContributions = 0;
	let ccPurchases = 0;
	let ccPayments = 0;
	let ccInterestFees = 0;
	let ccRefunds = 0;
	let ccPrincipalDelta = 0;

	if (accountType === "checking" || accountType === "savings") {
		// Cash side
		if (amount < 0) {
			// Inflow to cash
			if (!f.isInternalTransfer && !f.isCreditCardPayment) {
				cashIncomeExternal += Math.abs(amount);
			}
		} else if (amount > 0) {
			// Outflow from cash
			if (f.isInternalTransfer) {
				// Track net contributions into savings: Only count transfers where the savings account is the destination.
				// Without pair matching, approximate: on savings accounts, inflow => +, outflow => -.
				// From cash account perspective, we can't tell direction reliably. We'll only compute when accountType === 'savings'.
			} else if (!f.isCreditCardPayment) {
				cashSpending += amount;
			}
		}

		if (accountType === "savings" && f.isInternalTransfer) {
			// For savings account internal transfers, amount < 0 is contribution into savings
			cashSavingsContributions += amount < 0 ? Math.abs(amount) : -amount; // net into savings
		}
	} else if (accountType === "credit") {
		// Credit side
		if (f.isInterestOrFee) {
			ccInterestFees += Math.abs(amount);
		} else if (f.isCreditCardPayment) {
			// Payment reduces principal
			ccPayments += Math.abs(amount);
			ccPrincipalDelta -= Math.abs(amount);
		} else if (f.isRefundOrReversal) {
			ccRefunds += Math.abs(amount);
			ccPrincipalDelta -= Math.abs(amount);
		} else {
			// Purchase increases principal; Plaid amounts generally positive for card purchases
			ccPurchases += Math.abs(amount);
			ccPrincipalDelta += Math.abs(amount);
		}
	}

	return {
		cashIncomeExternal,
		cashSpending,
		cashSavingsContributions,
		ccPurchases,
		ccPayments,
		ccInterestFees,
		ccRefunds,
		ccPrincipalDelta,
		effectiveDate: getEffectiveDate(txn),
		currency: txn.isoCurrencyCode ?? undefined,
	} as const;
}

export const applyTxn = internalMutation({
	args: {
		userId: v.string(),
		period: v.optional(v.union(v.literal("day"), v.literal("week"), v.literal("month"))), // optional single-period override
		// Minimal txn fields to compute deltas
		amount: v.number(),
		dateIso: v.string(),
		currency: v.optional(v.string()),
		accountType: v.optional(v.union(v.literal("checking"), v.literal("savings"), v.literal("credit"))),
		name: v.optional(v.string()),
		categoryPrimary: v.optional(v.union(v.string(), v.null())),
		categoryDetailed: v.optional(v.union(v.string(), v.null())),
		paymentChannel: v.optional(v.union(v.string(), v.null())),
		flags: v.optional(
			v.object({
				isInternalTransfer: v.optional(v.boolean()),
				isCreditCardPayment: v.optional(v.boolean()),
				isRefundOrReversal: v.optional(v.boolean()),
				isInterestOrFee: v.optional(v.boolean()),
			}),
		),
		// Multiplier, use -1 to subtract on delete or when rolling back
		multiplier: v.optional(v.number()),
	},
	handler: async (
		ctx,
		{
			userId,
			period,
			amount,
			dateIso,
			currency,
			accountType,
			name,
			categoryPrimary,
			categoryDetailed,
			paymentChannel,
			flags,
			multiplier = 1,
		},
	) => {
		const baseTxn = {
			amount,
			authorizedDate: null as string | null,
			date: dateIso,
			isoCurrencyCode: currency ?? null,
			name: name ?? "",
			categoryPrimary: (categoryPrimary as string | null) ?? null,
			categoryDetailed: (categoryDetailed as string | null) ?? null,
			paymentChannel: (paymentChannel as string | null) ?? null,
		} as unknown as Doc<"transactions">;

		const deltas = computeCashCreditDeltas(baseTxn, accountType as TAccountType | undefined, flags ?? {});

		const periods: Period[] = period ? [period] : (["day", "week", "month"] as Period[]);

		for (const p of periods) {
			const { start, end } = periodStart(dateIso, p);
			let doc = await ctx.db
				.query("cashCreditSummaries")
				.withIndex("byUserPeriodStart", q => q.eq("userId", userId).eq("period", p).eq("startDate", start))
				.first();

			if (!doc) {
				await ctx.db.insert("cashCreditSummaries", {
					userId,
					period: p,
					startDate: start,
					endDate: end,
					currency,
					cashIncomeExternal: (deltas.cashIncomeExternal ?? 0) * multiplier,
					cashSpending: (deltas.cashSpending ?? 0) * multiplier,
					cashSavingsContributions: (deltas.cashSavingsContributions ?? 0) * multiplier,
					cashNetChange: undefined,
					ccPurchases: (deltas.ccPurchases ?? 0) * multiplier,
					ccPayments: (deltas.ccPayments ?? 0) * multiplier,
					ccInterestFees: (deltas.ccInterestFees ?? 0) * multiplier,
					ccRefunds: (deltas.ccRefunds ?? 0) * multiplier,
					ccPrincipalDelta: (deltas.ccPrincipalDelta ?? 0) * multiplier,
					extNetFlow: undefined,
					buildVersion: "v1",
				});
			} else {
				await ctx.db.patch(doc._id, {
					cashIncomeExternal: (doc.cashIncomeExternal ?? 0) + (deltas.cashIncomeExternal ?? 0) * multiplier,
					cashSpending: (doc.cashSpending ?? 0) + (deltas.cashSpending ?? 0) * multiplier,
					cashSavingsContributions:
						(doc.cashSavingsContributions ?? 0) + (deltas.cashSavingsContributions ?? 0) * multiplier,
					ccPurchases: (doc.ccPurchases ?? 0) + (deltas.ccPurchases ?? 0) * multiplier,
					ccPayments: (doc.ccPayments ?? 0) + (deltas.ccPayments ?? 0) * multiplier,
					ccInterestFees: (doc.ccInterestFees ?? 0) + (deltas.ccInterestFees ?? 0) * multiplier,
					ccRefunds: (doc.ccRefunds ?? 0) + (deltas.ccRefunds ?? 0) * multiplier,
					ccPrincipalDelta: (doc.ccPrincipalDelta ?? 0) + (deltas.ccPrincipalDelta ?? 0) * multiplier,
					currency: doc.currency ?? currency,
				});
			}
		}
	},
});

export const listByPeriod = query({
	args: {
		period: v.union(v.literal("day"), v.literal("week"), v.literal("month")),
		pageSize: v.optional(v.number()),
		cursor: v.optional(v.union(v.string(), v.null())),
	},
	handler: async (ctx, { period, pageSize = 30, cursor = null }) => {
		const user = await ctx.auth.getUserIdentity();
		if (!user) throw new Error("User not authenticated");

		const page = await ctx.db
			.query("cashCreditSummaries")
			.withIndex("byUserPeriodStart", qi => qi.eq("userId", user.subject).eq("period", period))
			.order("desc")
			.paginate({ cursor, numItems: pageSize });

		return { page: page.page, cursor: page.continueCursor, isDone: page.isDone };
	},
});
