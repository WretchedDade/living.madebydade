import { v, Infer } from 'convex/values';

export const LocationSchema = v.object({
	address: v.optional(v.union(v.null(), v.string())),
	city: v.optional(v.union(v.null(), v.string())),
	region: v.optional(v.union(v.null(), v.string())),
	postalCode: v.optional(v.union(v.null(), v.string())),
	country: v.optional(v.union(v.null(), v.string())),
	lat: v.optional(v.union(v.null(), v.number())),
	lon: v.optional(v.union(v.null(), v.number())),
	storeNumber: v.optional(v.union(v.null(), v.string())),
});

// PaymentMeta schema
const PaymentMetaSchema = v.object({
	byOrderOf: v.optional(v.union(v.null(), v.string())),
	payee: v.optional(v.union(v.null(), v.string())),
	payer: v.optional(v.union(v.null(), v.string())),
	paymentMethod: v.optional(v.union(v.null(), v.string())),
	paymentProcessor: v.optional(v.union(v.null(), v.string())),
	ppdId: v.optional(v.union(v.null(), v.string())),
	reason: v.optional(v.union(v.null(), v.string())),
	referenceNumber: v.optional(v.union(v.null(), v.string())),
});

// PersonalFinanceCategory schema
const PersonalFinanceCategorySchema = v.object({
	primary: v.string(),
	detailed: v.string(),
	confidenceLevel: v.optional(v.string()),
});

// BusinessFinanceCategory schema
const BusinessFinanceCategorySchema = v.object({
	primary: v.string(),
	detailed: v.string(),
});

// TransactionCode schema
const TransactionCodeSchema = v.object({
	code: v.string(),
});

// TransactionCounterparty schema
const TransactionCounterpartySchema = v.object({
	name: v.optional(v.string()),
	type: v.optional(v.string()),
	logoUrl: v.optional(v.string()),
	website: v.optional(v.string()),
	entityId: v.optional(v.string()),
});

export const PlaidTransactionSchema = v.object({
	accountId: v.string(),
	amount: v.number(),
	isoCurrencyCode: v.union(v.null(), v.string()),
	unofficialCurrencyCode: v.union(v.null(), v.string()),
	checkNumber: v.optional(v.union(v.null(), v.string())),
	date: v.string(),
	location: LocationSchema,
	name: v.string(),
	merchantName: v.optional(v.union(v.null(), v.string())),
	originalDescription: v.optional(v.union(v.null(), v.string())),
	paymentMeta: PaymentMetaSchema,
	pending: v.boolean(),
	pendingTransactionId: v.union(v.null(), v.string()),
	accountOwner: v.union(v.null(), v.string()),
	transactionId: v.string(),
	logoUrl: v.optional(v.union(v.null(), v.string())),
	website: v.optional(v.union(v.null(), v.string())),
	authorizedDate: v.union(v.null(), v.string()),
	authorizedDatetime: v.union(v.null(), v.string()),
	datetime: v.union(v.null(), v.string()),
	paymentChannel: v.string(),
	personalFinanceCategory: v.optional(PersonalFinanceCategorySchema),
	businessFinanceCategory: v.optional(BusinessFinanceCategorySchema),
	transactionCode: v.string(),
	personalFinanceCategoryIconUrl: v.optional(v.string()),
	counterparties: v.optional(v.array(TransactionCounterpartySchema)),
	merchantEntityId: v.optional(v.union(v.null(), v.string())),
});

export type PlaidTransaction = Infer<typeof PlaidTransactionSchema>;

// A leaner transaction shape for storage in Convex to reduce document size.
// Keep only fields needed for summaries, recurring detection, and UI display.
export const LeanTransactionSchema = v.object({
	transactionId: v.string(),
	accountId: v.string(),
	date: v.string(),
	authorizedDate: v.union(v.null(), v.string()),
	amount: v.number(),
	isoCurrencyCode: v.union(v.null(), v.string()),
	pending: v.boolean(),
	name: v.string(),
	merchantName: v.union(v.null(), v.string()),
	merchantEntityId: v.union(v.null(), v.string()),
	categoryPrimary: v.union(v.null(), v.string()),
	categoryDetailed: v.union(v.null(), v.string()),
	pendingTransactionId: v.union(v.null(), v.string()),
	paymentChannel: v.union(v.null(), v.string()),
	transactionCode: v.union(v.null(), v.string()),
});

export type LeanTransaction = Infer<typeof LeanTransactionSchema>;

// Temporary compat schema: superset of LeanTransactionSchema plus legacy heavy fields as optional.
// Use this in the table during migration so existing docs validate; later switch to LeanTransactionSchema.
export const LeanTransactionCompatSchema = v.object({
	// Lean required/nullable fields
	transactionId: v.string(),
	accountId: v.string(),
	date: v.string(),
	authorizedDate: v.union(v.null(), v.string()),
	amount: v.number(),
	isoCurrencyCode: v.union(v.null(), v.string()),
	pending: v.boolean(),
	name: v.string(),
	merchantName: v.optional(v.union(v.null(), v.string())),
	merchantEntityId: v.optional(v.union(v.null(), v.string())),
	categoryPrimary: v.optional(v.union(v.null(), v.string())),
	categoryDetailed: v.optional(v.union(v.null(), v.string())),
	pendingTransactionId: v.union(v.null(), v.string()),
	paymentChannel: v.union(v.null(), v.string()),
	transactionCode: v.union(v.null(), v.string()),

	// Legacy heavy fields kept optional for compatibility during migration
	location: v.optional(LocationSchema),
	paymentMeta: v.optional(PaymentMetaSchema),
	personalFinanceCategory: v.optional(PersonalFinanceCategorySchema),
	businessFinanceCategory: v.optional(BusinessFinanceCategorySchema),
	counterparties: v.optional(v.array(TransactionCounterpartySchema)),
	website: v.optional(v.union(v.null(), v.string())),
	logoUrl: v.optional(v.union(v.null(), v.string())),
	personalFinanceCategoryIconUrl: v.optional(v.string()),
	originalDescription: v.optional(v.union(v.null(), v.string())),
	unofficialCurrencyCode: v.optional(v.union(v.null(), v.string())),
	checkNumber: v.optional(v.union(v.null(), v.string())),
	accountOwner: v.optional(v.union(v.null(), v.string())),
	authorizedDatetime: v.optional(v.union(v.null(), v.string())),
	datetime: v.optional(v.union(v.null(), v.string())),

	// Migration marker
	migratedToLean: v.optional(v.boolean()),
});

export type LeanTransactionCompat = Infer<typeof LeanTransactionCompatSchema>;
