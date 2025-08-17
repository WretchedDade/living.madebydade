import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

import { activityType, activityDetails } from "./activitySchema";
import { LeanTransactionSchema, AccountType } from "./transactionSchema";
import { v as values } from "convex/values";

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
		dueType: v.union(v.literal("Fixed"), v.literal("EndOfMonth")),
		isAutoPay: v.boolean(),
		name: v.string(),
	}),
	billPayments: defineTable({
		dateDue: v.string(),
		datePaid: v.optional(v.string()),
		billId: v.id("bills"),
		isAutoPay: v.boolean(),
	})
		.index("byBillId", ["billId"])
		.index("byDatePaid", ["datePaid"])
		.index("byUnpaidDue", ["datePaid", "dateDue"])
		.index("byUnpaidAutoDue", ["datePaid", "isAutoPay", "dateDue"]),
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
	cashCreditSummaries: defineTable({
		userId: v.string(),
		period: v.union(v.literal("day"), v.literal("week"), v.literal("month")),
		startDate: v.string(),
		endDate: v.string(),
		currency: v.optional(v.string()),
		// Cash
		cashIncomeExternal: v.float64(),
		cashSpending: v.float64(),
		cashSavingsContributions: v.float64(),
		cashNetChange: v.optional(v.float64()),
		// Credit
		ccPurchases: v.float64(),
		ccPayments: v.float64(),
		ccInterestFees: v.float64(),
		ccRefunds: v.float64(),
		ccPrincipalDelta: v.float64(),
		// Meta
		extNetFlow: v.optional(v.float64()),
		buildVersion: v.optional(v.string()),
	}).index("byUserPeriodStart", ["userId", "period", "startDate"]),
});
