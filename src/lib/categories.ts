/**
 * Plaid personal_finance_category mapping.
 * Display names and icons for the category breakdown.
 *
 * Categories not in this map fall back to a generic "Other" entry.
 */

export type CategoryClassification = "spending" | "excluded";

export interface CategoryMeta {
	displayName: string;
	icon: string;
	classification: CategoryClassification;
}

const CATEGORY_MAP: Record<string, CategoryMeta> = {
	// --- Spending categories ---
	RENT_AND_UTILITIES: { displayName: "Rent & Utilities", icon: "🏠", classification: "spending" },
	FOOD_AND_DRINK: { displayName: "Food & Drink", icon: "🍔", classification: "spending" },
	TRANSPORTATION: { displayName: "Transportation", icon: "🚗", classification: "spending" },
	MEDICAL: { displayName: "Healthcare", icon: "🏥", classification: "spending" },
	LOAN_PAYMENTS: { displayName: "Loan Payments", icon: "💳", classification: "spending" },
	GOVERNMENT_AND_NON_PROFIT: { displayName: "Government & Taxes", icon: "🏛️", classification: "spending" },
	HOME_IMPROVEMENT: { displayName: "Home Improvement", icon: "🔨", classification: "spending" },
	GENERAL_SERVICES: { displayName: "General Services", icon: "🔧", classification: "spending" },
	ENTERTAINMENT: { displayName: "Entertainment", icon: "🎮", classification: "spending" },
	GENERAL_MERCHANDISE: { displayName: "Shopping", icon: "🛍️", classification: "spending" },
	PERSONAL_CARE: { displayName: "Personal Care", icon: "💆", classification: "spending" },
	TRAVEL: { displayName: "Travel", icon: "✈️", classification: "spending" },
	RECREATION: { displayName: "Recreation", icon: "⚽", classification: "spending" },

	// --- Excluded (not spending) ---
	INCOME: { displayName: "Income", icon: "💰", classification: "excluded" },
	TRANSFER_IN: { displayName: "Transfer In", icon: "↩️", classification: "excluded" },
	TRANSFER_OUT: { displayName: "Transfer Out", icon: "↪️", classification: "excluded" },
	BANK_FEES: { displayName: "Bank Fees", icon: "🏦", classification: "excluded" },
};

const FALLBACK_META: CategoryMeta = {
	displayName: "Other",
	icon: "📦",
	classification: "spending",
};

/** Look up display metadata for a Plaid category */
export function getCategoryMeta(categoryPrimary: string | null): CategoryMeta {
	if (!categoryPrimary) return FALLBACK_META;
	const key = categoryPrimary.toUpperCase();
	return CATEGORY_MAP[key] ?? {
		...FALLBACK_META,
		displayName: prettyCategoryName(key),
	};
}

/** Convert a raw Plaid category key to a human-readable name */
export function prettyCategoryName(raw: string): string {
	return raw
		.replace(/[._-]+/g, " ")
		.split(" ")
		.filter(Boolean)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(" ");
}

export { CATEGORY_MAP };
