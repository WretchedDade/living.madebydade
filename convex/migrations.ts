import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { DateTime } from "luxon";
import { EST_TIMEZONE } from "../constants";
import { DataModel } from "./_generated/dataModel";

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

export const clearTransactionSummaries = migrations.define({
	table: "transactionSummaries",
	migrateOne: async (ctx, doc) => {
		await ctx.db.delete(doc._id);
	},
});

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

export const buildTransactionSummaries = migrations.define({
	table: "transactions",
	batchSize: 200, // safe and fast
	migrateOne: async (ctx, txn) => {
		// Fast lookup owning user by accountId via plaidAccounts table
		const acct = await ctx.db
			.query("plaidAccounts")
			.withIndex("byAccountId", q => q.eq("accountId", txn.accountId as string))
			.first();
		const userId = acct?.userId;
		if (!userId) return;

		const dateIso = txn.authorizedDate ?? txn.date;
		const { inflow, outflow, net } = splitAmount(txn.amount);

		for (const period of ["day", "week", "month"] as const) {
			const { start, end } = periodStart(dateIso, period);
			// Upsert summary doc
			let doc = await ctx.db
				.query("transactionSummaries")
				.withIndex("byUserPeriodStart", q => q.eq("userId", userId).eq("period", period).eq("startDate", start))
				.first();

			if (!doc) {
				await ctx.db.insert("transactionSummaries", {
					userId,
					period,
					startDate: start,
					endDate: end,
					currency: txn.isoCurrencyCode ?? undefined,
					inflow,
					outflow,
					net,
					count: 1,
				});
			} else {
				await ctx.db.patch(doc._id, {
					inflow: (doc.inflow ?? 0) + inflow,
					outflow: (doc.outflow ?? 0) + outflow,
					net: (doc.net ?? 0) + net,
					count: (doc.count ?? 0) + 1,
					currency: doc.currency ?? txn.isoCurrencyCode ?? undefined,
					endDate: doc.endDate ?? end,
				});
			}
		}
	},
});

// Runners
export const runAll = migrations.runner([
	// First prune old transactions
	internal.migrations.deleteOldTransactionsByAuthorizedDate,
	internal.migrations.deleteOldTransactionsByPostedDate,
	// Then clear and rebuild summaries
	internal.migrations.clearTransactionSummaries,
	internal.migrations.buildTransactionSummaries,
]);
