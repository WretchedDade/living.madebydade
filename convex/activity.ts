// Activity table schema for tracking app events
import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

import { activityType, activityDetails } from "./activitySchema";

export const logActivityInternal = internalMutation({
	args: {
		type: activityType,
		targetId: v.string(),
		details: activityDetails,
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("activity", {
			type: args.type,
			userId: "",
			targetId: args.targetId,
			details: args.details,
			timestamp: Date.now(),
		});
	},
});

// Mutation: Log a new activity event
export const logActivity = mutation({
	args: {
		type: activityType,
		userId: v.string(),
		targetId: v.string(), // Bill ID or Quest ID
		details: activityDetails,
	},
	handler: async (ctx, args) => {
		const timestamp = Date.now();
		return await ctx.db.insert("activity", {
			...args,
			timestamp,
		});
	},
});

// Query: Get recent activity (optionally filter by user)
export const listRecentActivity = query({
	args: {
		userId: v.optional(v.string()),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;
		if (args.userId) {
			return await ctx.db
				.query("activity")
				.withIndex("byUserIdTimestamp", q => q.eq("userId", args.userId!))
				.order("desc")
				.take(limit);
		}
		return await ctx.db.query("activity").withIndex("byTimestamp").order("desc").take(limit);
	},
});

// Query: Get activity for a specific bill or quest
export const listActivityForTarget = query({
	args: {
		targetId: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;
		return await ctx.db
			.query("activity")
			.withIndex("byTargetIdTimestamp", q => q.eq("targetId", args.targetId))
			.order("desc")
			.take(limit);
	},
});
