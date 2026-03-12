import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const frequencyValidator = v.union(
	v.literal("weekly"),
	v.literal("biweekly"),
	v.literal("monthly"),
);

export const list = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		return await ctx.db
			.query("budgetItems")
			.withIndex("byUserId", (q) => q.eq("userId", identity.subject))
			.collect();
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		amount: v.number(),
		frequency: frequencyValidator,
		icon: v.optional(v.string()),
	},
	handler: async (ctx, { name, amount, frequency, icon }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		return await ctx.db.insert("budgetItems", {
			userId: identity.subject,
			name,
			amount,
			frequency,
			icon,
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("budgetItems"),
		name: v.string(),
		amount: v.number(),
		frequency: frequencyValidator,
		icon: v.optional(v.string()),
	},
	handler: async (ctx, { id, name, amount, frequency, icon }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		const item = await ctx.db.get(id);
		if (!item || item.userId !== identity.subject) {
			throw new Error("Budget item not found");
		}

		await ctx.db.patch(id, { name, amount, frequency, icon });
	},
});

export const remove = mutation({
	args: { id: v.id("budgetItems") },
	handler: async (ctx, { id }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		const item = await ctx.db.get(id);
		if (!item || item.userId !== identity.subject) {
			throw new Error("Budget item not found");
		}

		await ctx.db.delete(id);
	},
});
