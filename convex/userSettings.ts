import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		const settings = await ctx.db
			.query("userSettings")
			.withIndex("byUserId", (q) => q.eq("userId", identity.subject))
			.first();

		return settings ?? null;
	},
});

export const upsert = mutation({
	args: {
		paySchedule: v.union(
			v.literal("semimonthly"),
			v.literal("biweekly"),
			v.literal("weekly"),
			v.literal("monthly"),
		),
		payDays: v.array(v.number()),
		payAmount: v.optional(v.number()),
	},
	handler: async (ctx, { paySchedule, payDays, payAmount }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		const existing = await ctx.db
			.query("userSettings")
			.withIndex("byUserId", (q) => q.eq("userId", identity.subject))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, { paySchedule, payDays, payAmount });
			return existing._id;
		}

		return await ctx.db.insert("userSettings", {
			userId: identity.subject,
			paySchedule,
			payDays,
			payAmount,
		});
	},
});

export const setPayAmount = mutation({
	args: { payAmount: v.number() },
	handler: async (ctx, { payAmount }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		const existing = await ctx.db
			.query("userSettings")
			.withIndex("byUserId", (q) => q.eq("userId", identity.subject))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, { payAmount });
			return existing._id;
		}

		return await ctx.db.insert("userSettings", {
			userId: identity.subject,
			paySchedule: "semimonthly",
			payDays: [15, 0],
			payAmount,
		});
	},
});

export const setTheme = mutation({
	args: {
		themeId: v.string(),
	},
	handler: async (ctx, { themeId }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		const existing = await ctx.db
			.query("userSettings")
			.withIndex("byUserId", (q) => q.eq("userId", identity.subject))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, { themeId });
			return existing._id;
		}

		return await ctx.db.insert("userSettings", {
			userId: identity.subject,
			paySchedule: "semimonthly",
			payDays: [15, 0],
			themeId,
		});
	},
});
