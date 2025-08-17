import { defineSchema, defineTable } from 'convex/server';
import { Infer, v } from 'convex/values';

import { activityType, activityDetails } from './activitySchema';
import { LeanTransactionCompatSchema } from './transactionSchema';

export const PlaidInstitutionSchema = v.object({
	id: v.string(),
	name: v.string(),
});

export const PlaidAccountSchema = v.object({
	id: v.string(),
	name: v.string(),
	mask: v.string(),
	type: v.string(),
	subtype: v.string(),
	verification_status: v.union(v.null(), v.string()),
});

export const PlaidItemSchema = v.object({
	userId: v.string(),
	itemId: v.string(),
	accessToken: v.string(),

	institution: v.optional(PlaidInstitutionSchema),
	accounts: v.array(PlaidAccountSchema),

	transactionCursor: v.optional(v.string()),
});

export type PlaidItem = Infer<typeof PlaidItemSchema>;

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
	plaidItems: defineTable(PlaidItemSchema),
	transactions: defineTable(LeanTransactionCompatSchema).index('authorizedDate', ['authorizedDate']),
});
