import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";

export const list = query({
	args: {},
	handler: async ctx => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		return await ctx.db
			.query("bills")
			.withIndex("byUserId", q => q.eq("userId", identity.subject))
			.collect();
	},
});

export const listWithPayments = internalQuery({
	args: {},
	handler: async ctx => {
		const bills = await ctx.db.query("bills").collect();

		return Promise.all(
			bills.map(async bill => {
				const billPayments = await ctx.db
					.query("billPayments")
					.withIndex("byBillId", q => q.eq("billId", bill._id))
					.collect();

				return { ...bill, payments: billPayments };
			}),
		);
	},
});

export const upsertBill = mutation({
	args: {
		id: v.optional(v.id("bills")),
		amount: v.float64(),
		dayDue: v.optional(v.float64()),
		dueType: v.union(v.literal("Fixed"), v.literal("EndOfMonth")),
		isAutoPay: v.boolean(),
		name: v.string(),
	},
	handler: async (ctx, { id, ...values }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		if (id == null) {
			const billId = await ctx.db.insert("bills", { ...values, userId: identity.subject });
			return billId;
		}

		const bill = await ctx.db.get(id);

		if (!bill) {
			throw new Error("Bill not found");
		}

		if (bill.userId !== identity.subject) {
			throw new Error("Not authorized to modify this bill");
		}

		await ctx.db.replace(id, { ...values, userId: identity.subject });

		return id;
	},
});

export const deleteBill = mutation({
	args: {
		id: v.id("bills"),
	},
	handler: async (ctx, { id }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		const bill = await ctx.db.get(id);

		if (!bill) {
			throw new Error("Bill not found");
		}

		if (bill.userId !== identity.subject) {
			throw new Error("Not authorized to delete this bill");
		}

		await ctx.db.delete(id);
	},
});

// Query to get a bill by its id
export const getBillById = query({
	args: { id: v.optional(v.id("bills")) },
	handler: async (ctx, { id }) => {
		if (id == null) return undefined;

		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		const bill = await ctx.db.get(id);

		if (bill && bill.userId !== identity.subject) {
			throw new Error("Not authorized to view this bill");
		}

		return bill;
	},
});
