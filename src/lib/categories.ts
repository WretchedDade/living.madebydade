/**
 * Plaid personal_finance_category mapping.
 * Display names, icons, and essential/non-essential classification.
 *
 * Uses categoryDetailed when available to refine classification
 * (e.g., groceries at Walmart = essential, but general shopping = not).
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
		classification: "non-essential", // Default; groceries override below
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
		classification: "non-essential", // Superstores override below
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

/**
 * Detailed category overrides — when the detailed category matches one of
 * these patterns, its classification wins over the primary category default.
 */
const DETAILED_ESSENTIAL_PATTERNS = [
	"GROCERIES",
	"SUPERMARKETS_AND_GROCERIES",
	"SUPERSTORES",
];

const DETAILED_NON_ESSENTIAL_PATTERNS = [
	"RESTAURANTS",
	"FAST_FOOD",
	"COFFEE",
	"BEER_WINE_AND_LIQUOR",
	"VENDING_MACHINES",
];

const FALLBACK_META: CategoryMeta = {
	displayName: "Other",
	icon: "📦",
	classification: "non-essential",
};

/** Look up metadata for a Plaid category, using detailed category for refined classification */
export function getCategoryMeta(
	categoryPrimary: string | null,
	categoryDetailed?: string | null,
): CategoryMeta {
	if (!categoryPrimary) return FALLBACK_META;
	const key = categoryPrimary.toUpperCase();
	const baseMeta = CATEGORY_MAP[key] ?? {
		...FALLBACK_META,
		displayName: prettyCategoryName(key),
	};

	// Apply detailed overrides if available
	if (categoryDetailed) {
		const detail = categoryDetailed.toUpperCase();
		if (DETAILED_ESSENTIAL_PATTERNS.some((p) => detail.includes(p))) {
			return { ...baseMeta, classification: "essential" };
		}
		if (DETAILED_NON_ESSENTIAL_PATTERNS.some((p) => detail.includes(p))) {
			return { ...baseMeta, classification: "non-essential" };
		}
	}

	return baseMeta;
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
export function isSpendingCategory(
	categoryPrimary: string | null,
	categoryDetailed?: string | null,
): boolean {
	const meta = getCategoryMeta(categoryPrimary, categoryDetailed);
	return meta.classification !== "excluded";
}

export { CATEGORY_MAP };
