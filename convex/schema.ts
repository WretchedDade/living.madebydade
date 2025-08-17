import { defineSchema, defineTable } from 'convex/server';
import { Infer, v } from 'convex/values';

import { activityType, activityDetails } from './activitySchema';
import { LeanTransactionSchema } from './transactionSchema';
import { v as values } from 'convex/values';

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
	transactions: defineTable(LeanTransactionSchema)
		.index('authorizedDate', ['authorizedDate'])
		.index('date', ['date']),
	transactionSummaries: defineTable({
		userId: v.string(),
		period: v.union(v.literal('day'), v.literal('week'), v.literal('month')),
		startDate: v.string(), // ISO date for start of period in app timezone
		endDate: v.string(), // ISO date for end of period in app timezone
		currency: v.optional(v.string()),
		inflow: v.float64(), // absolute sum of credits (money in)
		outflow: v.float64(), // sum of debits (money out)
		net: v.float64(), // inflow - outflow OR sum of signed amounts
		count: v.number(),
	}).index('byUserPeriodStart', ['userId', 'period', 'startDate']),
});
