import { v } from "convex/values";

export const activityType = v.union(
	v.literal("billPaid"),
	v.literal("questCompleted"),
	v.literal("billAdded"),
	v.literal("billUpdated"),
	v.literal("billRemoved"),
	v.literal("billDue"),
);

export const activityDetails = v.object({
	description: v.optional(v.string()),
	amount: v.optional(v.number()),
	billName: v.optional(v.string()),
	questName: v.optional(v.string()),
	xpEarned: v.optional(v.number()),
	changes: v.optional(
		v.array(
			v.object({
				field: v.string(),
				before: v.any(),
				after: v.any(),
			}),
		),
	),
	dueDate: v.optional(v.string()),
});
