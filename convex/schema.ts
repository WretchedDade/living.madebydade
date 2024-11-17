import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	bills: defineTable({
		amount: v.float64(),
		dayDue: v.optional(v.float64()),
		dueType: v.union(v.literal('Fixed'), v.literal('EndOfMonth')),
		isAutoPay: v.boolean(),
		name: v.string(),
		ownerId: v.optional(v.string()),
	}),
	billPayments: defineTable({
		dateDue: v.string(),
		datePaid: v.optional(v.string()),
		billId: v.id('bills'),
		ownerId: v.optional(v.string()),
	}),
});
