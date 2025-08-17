import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { DateTime } from "luxon";
import { EST_TIMEZONE } from "../constants";

// needed for internal references
import { internal } from "./_generated/api";

export type Period = "day" | "week" | "month";

function periodStart(dateIso: string, period: Period) {
	const d = DateTime.fromISO(dateIso, { zone: EST_TIMEZONE });
	const start = d.startOf(period);
	const end = d.endOf(period);
	return { start: start.toISO()!, end: end.toISO()! };
}

function splitAmount(amount: number) {
	// Plaid amounts: positive = outflow (money out), negative = inflow (money in)
	if (amount < 0) {
		return { inflow: Math.abs(amount), outflow: 0, net: amount };
	}
	return { inflow: 0, outflow: amount, net: amount };
}

export const applyDelta = internalMutation({
	args: {
		userId: v.string(),
		dateIso: v.string(), // effective date (authorizedDate || date)
		amountDelta: v.number(), // signed amount, negative for credits
		countDelta: v.number(), // typically 1 for add, -1 for delete, +/-1 for move, 0 for pure amount change
		currency: v.optional(v.string()),
	},
	handler: async (ctx, { userId, dateIso, amountDelta, countDelta, currency }) => {
		for (const period of ["day", "week", "month"] as Period[]) {
			const { start, end } = periodStart(dateIso, period);

			let doc = await ctx.db
				.query("transactionSummaries")
				.withIndex("byUserPeriodStart", q => q.eq("userId", userId).eq("period", period).eq("startDate", start))
				.first();

			const { inflow, outflow, net } = splitAmount(amountDelta);

			if (!doc) {
				await ctx.db.insert("transactionSummaries", {
					userId,
					period,
					startDate: start,
					endDate: end,
					currency,
					inflow,
					outflow,
					net,
					count: Math.max(0, countDelta),
				});
			} else {
				await ctx.db.patch(doc._id, {
					inflow: (doc.inflow ?? 0) + inflow,
					outflow: (doc.outflow ?? 0) + outflow,
					net: (doc.net ?? 0) + net,
					count: Math.max(0, (doc.count ?? 0) + countDelta),
					// keep earliest currency if present
					currency: doc.currency ?? currency,
				});
			}
		}
	},
});

// Backfill actions were replaced by @convex-dev/migrations. Only keep applyDelta for real-time updates during sync.
