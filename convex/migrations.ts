import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api";
import { action, internalMutation } from "./_generated/server";
import { computeCashCreditDeltas } from "./cashCreditSummaries";
import { DateTime } from "luxon";
import { EST_TIMEZONE } from "../constants";
import { DataModel, Doc } from "./_generated/dataModel";
import { TAccountType } from "./transactionSchema";

export const migrations = new Migrations<DataModel>(components.migrations);

function periodStart(dateIso: string, period: "day" | "week" | "month") {
	const d = DateTime.fromISO(dateIso, { zone: EST_TIMEZONE });
	const start = d.startOf(period);
	const end = d.endOf(period);
	return { start: start.toISO()!, end: end.toISO()! };
}

function splitAmount(amount: number) {
	if (amount < 0) return { inflow: Math.abs(amount), outflow: 0, net: amount };
	return { inflow: 0, outflow: amount, net: amount };
}

// Delete transactions older than 6 months based on authorizedDate using index
export const deleteOldTransactionsByAuthorizedDate = (() => {
	const thresholdISO = DateTime.now().setZone(EST_TIMEZONE).minus({ months: 6 }).startOf("day").toISODate()!;
	return migrations.define({
		table: "transactions",
		batchSize: 500,
		customRange: query => query.withIndex("authorizedDate", q => q.lt("authorizedDate", thresholdISO)),
		migrateOne: async (ctx, txn) => {
			// Defense in depth: ensure auth date is indeed older than threshold
			const authDate = txn.authorizedDate as string | null;
			if (authDate && authDate < thresholdISO) {
				await ctx.db.delete(txn._id);
			}
		},
	});
})();

// Delete any remaining transactions older than 6 months when authorizedDate is null (fallback to date)
export const deleteOldTransactionsByPostedDate = (() => {
	const thresholdISO = DateTime.now().setZone(EST_TIMEZONE).minus({ months: 6 }).startOf("day").toISODate()!;
	return migrations.define({
		table: "transactions",
		batchSize: 300,
		migrateOne: async (ctx, txn) => {
			const authDate = txn.authorizedDate as string | null;
			if (authDate) return; // handled by the indexed migration
			const postedDate = txn.date as string;
			if (postedDate < thresholdISO) {
				await ctx.db.delete(txn._id);
			}
		},
	});
})();

// De-duplicate transactions by transactionId, keeping the newest document
export const dedupeTransactionsByTransactionId = migrations.define({
	table: "transactions",
	batchSize: 200,
	// Process in transactionId groups by scanning per-doc; safe since it's one-time and datasets are moderate.
	migrateOne: async (ctx, txn) => {
		const txns = await ctx.db
			.query("transactions")
			.withIndex("byTransactionId", q => q.eq("transactionId", (txn as { transactionId: string }).transactionId))
			.collect();
		if (txns.length <= 1) return;

		// Keep the most recently created document (largest _creationTime)
		let keeper = txns[0];
		for (const t of txns) {
			if ((t._creationTime as number) > (keeper._creationTime as number)) keeper = t;
		}

		for (const t of txns) {
			if (t._id !== keeper._id) {
				await ctx.db.delete(t._id);
			}
		}
	},
});

// Cash/Credit summaries migrations
export const clearCashCreditSummaries = migrations.define({
	table: "cashCreditSummaries",
	migrateOne: async (ctx, doc) => {
		await ctx.db.delete(doc._id);
	},
});

export const buildCashCreditSummaries = migrations.define({
	table: "transactions",
	batchSize: 200,
	migrateOne: async (ctx, txn) => {
		// Lookup user/accountType from txn (prefer txn field, fallback to plaidAccounts)
		let userId = (txn as { userId?: string }).userId;
		let accountType = (txn as { accountType?: TAccountType }).accountType;
		if (!userId || !accountType) {
			const acct = await ctx.db
				.query("plaidAccounts")
				.withIndex("byAccountId", q => q.eq("accountId", txn.accountId as string))
				.first();
			userId = userId ?? (acct?.userId as string | undefined);
			accountType = accountType ?? (acct?.accountType as TAccountType | undefined);
		}
		if (!userId) return;

		// Compute deltas using shared helper to keep logic consistent
		const deltas = computeCashCreditDeltas(
			{
				amount: txn.amount as number,
				authorizedDate: (txn.authorizedDate as string | null) ?? null,
				date: txn.date as string,
				isoCurrencyCode: ((txn as { isoCurrencyCode?: string | null }).isoCurrencyCode ?? null) as
					| string
					| null,
				name: (txn as { name?: string }).name ?? "",
				categoryPrimary: (txn as { categoryPrimary?: string | null }).categoryPrimary ?? null,
				categoryDetailed: (txn as { categoryDetailed?: string | null }).categoryDetailed ?? null,
				paymentChannel: (txn as { paymentChannel?: string | null }).paymentChannel ?? null,
			} as Pick<
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
			accountType,
		);

		const {
			cashIncomeExternal,
			cashSpending,
			cashSavingsContributions,
			ccPurchases,
			ccPayments,
			ccInterestFees,
			ccRefunds,
			ccPrincipalDelta,
			effectiveDate,
			currency,
		} = deltas;

		for (const p of ["day", "week", "month"] as const) {
			const { start, end } = periodStart(effectiveDate, p);
			let doc = await ctx.db
				.query("cashCreditSummaries")
				.withIndex("byUserPeriodStart", q =>
					q
						.eq("userId", userId as string)
						.eq("period", p)
						.eq("startDate", start),
				)
				.first();

			if (!doc) {
				await ctx.db.insert("cashCreditSummaries", {
					userId: userId as string,
					period: p,
					startDate: start,
					endDate: end,
					currency,
					cashIncomeExternal,
					cashSpending,
					cashSavingsContributions,
					cashNetChange: undefined,
					ccPurchases,
					ccPayments,
					ccInterestFees,
					ccRefunds,
					ccPrincipalDelta,
					extNetFlow: undefined,
					buildVersion: "v1",
				});
			} else {
				await ctx.db.patch(doc._id, {
					cashIncomeExternal: (doc.cashIncomeExternal ?? 0) + cashIncomeExternal,
					cashSpending: (doc.cashSpending ?? 0) + cashSpending,
					cashSavingsContributions: (doc.cashSavingsContributions ?? 0) + cashSavingsContributions,
					ccPurchases: (doc.ccPurchases ?? 0) + ccPurchases,
					ccPayments: (doc.ccPayments ?? 0) + ccPayments,
					ccInterestFees: (doc.ccInterestFees ?? 0) + ccInterestFees,
					ccRefunds: (doc.ccRefunds ?? 0) + ccRefunds,
					ccPrincipalDelta: (doc.ccPrincipalDelta ?? 0) + ccPrincipalDelta,
					currency: doc.currency ?? currency,
				});
			}
		}
	},
});

// --- Transaction field backfills ---

// Backfill userId/accountType onto transactions from plaidAccounts
export const backfillTransactionUserAndType = migrations.define({
	table: "transactions",
	batchSize: 200,
	migrateOne: async (ctx, txn) => {
		const hasUserId = (txn as { userId?: string }).userId != null;
		const hasAccountType = (txn as { accountType?: TAccountType }).accountType != null;
		if (hasUserId && hasAccountType) return;

		const acct = await ctx.db
			.query("plaidAccounts")
			.withIndex("byAccountId", q => q.eq("accountId", txn.accountId as string))
			.first();
		if (!acct) return;

		await ctx.db.patch(txn._id, {
			userId: acct.userId as string,
			accountType: (acct.accountType as TAccountType | undefined) ?? undefined,
		});
	},
});

// Minimal heuristic flags for legacy transactions (does not attempt cross-ledger pairing)
function detectTxnFlags(
	txn: {
		amount: number;
		name?: string;
		categoryPrimary?: string | null;
		categoryDetailed?: string | null;
		paymentChannel?: string | null;
	},
	accountType: TAccountType | undefined,
) {
	const name = (txn.name ?? "").toLowerCase();
	const primary = (txn.categoryPrimary ?? "").toUpperCase();
	const detailed = (txn.categoryDetailed ?? "").toUpperCase();

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

export const backfillTransactionDetectionFlags = migrations.define({
	table: "transactions",
	batchSize: 200,
	migrateOne: async (ctx, txn) => {
		const accountType = (txn as { accountType?: TAccountType }).accountType;
		const alreadyFlagged =
			(txn as { isInternalTransfer?: boolean }).isInternalTransfer != null &&
			(txn as { isCreditCardPayment?: boolean }).isCreditCardPayment != null &&
			(txn as { isRefundOrReversal?: boolean }).isRefundOrReversal != null &&
			(txn as { isInterestOrFee?: boolean }).isInterestOrFee != null;
		if (alreadyFlagged) return;

		const flags = detectTxnFlags(
			{
				amount: txn.amount as number,
				name: (txn as { name?: string }).name,
				categoryPrimary: (txn as { categoryPrimary?: string | null }).categoryPrimary ?? null,
				categoryDetailed: (txn as { categoryDetailed?: string | null }).categoryDetailed ?? null,
				paymentChannel: (txn as { paymentChannel?: string | null }).paymentChannel ?? null,
			},
			accountType,
		);
		await ctx.db.patch(txn._id, flags);
	},
});

// --- Accounts backfill: populate type/subtype/accountType on plaidAccounts ---
function deriveAccountType(type: string | undefined, subtype: string | undefined): TAccountType | undefined {
	if (type === "credit") return "credit";
	if (type === "depository" && (subtype === "checking" || subtype === "prepaid")) return "checking";
	if (type === "depository" && subtype === "savings") return "savings";
	return undefined;
}

export const backfillPlaidAccountTypeFields = migrations.define({
	table: "plaidAccounts",
	batchSize: 200,
	migrateOne: async (ctx, acct) => {
		const hasType = (acct as { type?: string }).type != null;
		const hasSubtype = (acct as { subtype?: string }).subtype != null;
		const hasAccountType = (acct as { accountType?: TAccountType }).accountType != null;
		if (hasType && hasSubtype && hasAccountType) return;

		// Lookup the owning item to access original Plaid accounts payload
		const item = await ctx.db
			.query("plaidItems")
			.withIndex("byItemId", q => q.eq("itemId", acct.itemId as string))
			.first();
		if (!item) return;

		const accounts = (item as { accounts?: Array<{ id: string; type?: string; subtype?: string }> }).accounts ?? [];
		const match = accounts.find(a => a.id === (acct.accountId as string));
		const type = match?.type;
		const subtype = match?.subtype;
		const accountType = deriveAccountType(type, subtype);

		// If nothing to set, skip
		if (type == null && subtype == null && accountType == null) return;

		await ctx.db.patch(acct._id, {
			...(type != null ? { type } : {}),
			...(subtype != null ? { subtype } : {}),
			...(accountType != null ? { accountType } : {}),
		});
	},
});

// Runners
export const runAll = migrations.runner([
	// First prune old transactions
	internal.migrations.deleteOldTransactionsByAuthorizedDate,
	internal.migrations.deleteOldTransactionsByPostedDate,

	// Then dedupe current dataset
	internal.migrations.dedupeTransactionsByTransactionId,

	// Then backfill any missing account type information
	internal.migrations.backfillPlaidAccountTypeFields,

	// Then backfill any missing user and type information
	internal.migrations.backfillTransactionUserAndType,
	internal.migrations.backfillTransactionDetectionFlags,

	// Then clear and rebuild cash/credit summaries
	internal.migrations.clearCashCreditSummaries,
	internal.migrations.buildCashCreditSummaries,
]);

export const runClearCashCreditSummaries = migrations.runner([internal.migrations.clearCashCreditSummaries]);
export const runBuildCashCreditSummaries = migrations.runner([internal.migrations.buildCashCreditSummaries]);
