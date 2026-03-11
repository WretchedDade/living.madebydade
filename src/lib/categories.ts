/**
 * Plaid personal_finance_category mapping.
 * Display names, icons, and essential/non-essential classification.
 *
 * All values are hardcoded — no user customization.
 * Categories not in this map fall back to a generic "Other" entry.
 */

export type CategoryClassification = "essential" | "non-essential" | "excluded";

export interface CategoryMeta {
	displayName: string;
	icon: string;
	classification: CategoryClassification;
}

const CATEGORY_MAP: Record<string, CategoryMeta> = {
	// --- Essential ---
	RENT_AND_UTILITIES: {
		displayName: "Rent & Utilities",
		icon: "🏠",
		classification: "essential",
	},
	FOOD_AND_DRINK: {
		displayName: "Food & Drink",
		icon: "🍔",
		classification: "essential",
	},
	TRANSPORTATION: {
		displayName: "Transportation",
		icon: "🚗",
		classification: "essential",
	},
	MEDICAL: {
		displayName: "Healthcare",
		icon: "🏥",
		classification: "essential",
	},
	LOAN_PAYMENTS: {
		displayName: "Loan Payments",
		icon: "💳",
		classification: "essential",
	},
	GOVERNMENT_AND_NON_PROFIT: {
		displayName: "Government & Taxes",
		icon: "🏛️",
		classification: "essential",
	},
	HOME_IMPROVEMENT: {
		displayName: "Home Improvement",
		icon: "🔨",
		classification: "essential",
	},
	GENERAL_SERVICES: {
		displayName: "General Services",
		icon: "🔧",
		classification: "essential",
	},

	// --- Non-essential ---
	ENTERTAINMENT: {
		displayName: "Entertainment",
		icon: "🎮",
		classification: "non-essential",
	},
	GENERAL_MERCHANDISE: {
		displayName: "Shopping",
		icon: "🛍️",
		classification: "non-essential",
	},
	PERSONAL_CARE: {
		displayName: "Personal Care",
		icon: "💆",
		classification: "non-essential",
	},
	TRAVEL: {
		displayName: "Travel",
		icon: "✈️",
		classification: "non-essential",
	},
	RECREATION: {
		displayName: "Recreation",
		icon: "⚽",
		classification: "non-essential",
	},

	// --- Excluded (not spending) ---
	INCOME: {
		displayName: "Income",
		icon: "💰",
		classification: "excluded",
	},
	TRANSFER_IN: {
		displayName: "Transfer In",
		icon: "↩️",
		classification: "excluded",
	},
	TRANSFER_OUT: {
		displayName: "Transfer Out",
		icon: "↪️",
		classification: "excluded",
	},
	BANK_FEES: {
		displayName: "Bank Fees",
		icon: "🏦",
		classification: "excluded",
	},
};

const FALLBACK_META: CategoryMeta = {
	displayName: "Other",
	icon: "📦",
	classification: "non-essential",
};

/** Look up metadata for a Plaid primary category string */
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

/** Check if a category counts as spending (not excluded) */
export function isSpendingCategory(categoryPrimary: string | null): boolean {
	const meta = getCategoryMeta(categoryPrimary);
	return meta.classification !== "excluded";
}

export { CATEGORY_MAP };
