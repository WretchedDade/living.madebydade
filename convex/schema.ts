import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

import { activityType, activityDetails } from "./activitySchema";
import { LeanTransactionSchema, AccountType } from "./transactionSchema";

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
		userId: v.optional(v.string()),
		amount: v.number(), // integer cents (e.g. 1200 = $12.00)
		dayDue: v.optional(v.number()),
		dueType: v.union(v.literal("Fixed"), v.literal("EndOfMonth")),
		isAutoPay: v.boolean(),
		name: v.string(),
	}).index("byUserId", ["userId"]),
	billPayments: defineTable({
		userId: v.optional(v.string()),
		dateDue: v.string(),
		datePaid: v.optional(v.string()),
		billId: v.id("bills"),
		isAutoPay: v.boolean(),
	})
		.index("byUserId", ["userId"])
		.index("byBillId", ["billId"])
		.index("byDatePaid", ["datePaid"])
		.index("byUnpaidDue", ["datePaid", "dateDue"])
		.index("byUnpaidAutoDue", ["datePaid", "isAutoPay", "dateDue"])
		.index("byUserUnpaidDue", ["userId", "datePaid", "dateDue"])
		.index("byUserDatePaid", ["userId", "datePaid"]),
	activity: defineTable({
		type: activityType,
		userId: v.string(),
		targetId: v.string(),
		timestamp: v.number(),
		details: activityDetails,
	})
		.index("byUserIdTimestamp", ["userId", "timestamp"])
		.index("byTargetIdTimestamp", ["targetId", "timestamp"])
		.index("byTimestamp", ["timestamp"]),
	plaidItems: defineTable(PlaidItemSchema).index("byUserId", ["userId"]).index("byItemId", ["itemId"]),
	plaidAccounts: defineTable({
		accountId: v.string(),
		itemId: v.string(),
		userId: v.string(),
		type: v.optional(v.string()), // Plaid type (e.g., depository, credit)
		subtype: v.optional(v.string()), // Plaid subtype (e.g., checking, savings)
		accountType: v.optional(AccountType), // Derived: checking | savings | credit
	})
		.index("byAccountId", ["accountId"])
		.index("byItemId", ["itemId"])
		.index("byUserId", ["userId"])
		.index("byUserIdAccountType", ["userId", "accountType"]),
	transactions: defineTable(LeanTransactionSchema)
		.index("authorizedDate", ["authorizedDate"])
		.index("date", ["date"])
		.index("byTransactionId", ["transactionId"]),

	// Cash vs Credit per-period summary
	userSettings: defineTable({
		userId: v.string(),
		paySchedule: v.union(
			v.literal("semimonthly"),
			v.literal("biweekly"),
			v.literal("weekly"),
			v.literal("monthly"),
		),
		payDays: v.array(v.number()),
	}).index("byUserId", ["userId"]),

	cashCreditSummaries: defineTable({
		userId: v.string(),
		period: v.union(v.literal("day"), v.literal("week"), v.literal("month")),
		startDate: v.string(),
		endDate: v.string(),
		currency: v.optional(v.string()),
		// Cash (integer cents)
		cashIncomeExternal: v.number(),
		cashSpending: v.number(),
		cashSavingsContributions: v.number(),
		cashNetChange: v.optional(v.number()),
		// Credit (integer cents)
		ccPurchases: v.number(),
		ccPayments: v.number(),
		ccInterestFees: v.number(),
		ccRefunds: v.number(),
		ccPrincipalDelta: v.number(),
		// Meta
		extNetFlow: v.optional(v.number()),
		buildVersion: v.optional(v.string()),
	}).index("byUserPeriodStart", ["userId", "period", "startDate"]),
});
