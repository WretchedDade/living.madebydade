import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

import { activityType, activityDetails } from './activitySchema';

export default defineSchema({
	bills: defineTable({
		amount: v.float64(),
		dayDue: v.optional(v.float64()),
		dueType: v.union(v.literal('Fixed'), v.literal('EndOfMonth')),
		isAutoPay: v.boolean(),
		name: v.string(),
	}),
	billPayments: defineTable({
		dateDue: v.string(),
		datePaid: v.optional(v.string()),
		billId: v.id('bills'),
		isAutoPay: v.boolean(),
	}),
  activity: defineTable({
	type: activityType,
	userId: v.string(),
	targetId: v.string(),
	timestamp: v.number(),
	details: activityDetails,
  }),
});
