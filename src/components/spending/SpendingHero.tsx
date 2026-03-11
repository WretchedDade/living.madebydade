import { TrendingUpIcon, TrendingDownIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { formatCurrency } from "~/utils/formatters";
import type { Doc } from "convex/_generated/dataModel";
import type { CategoryClassification } from "~/lib/categories";
import { getCategoryMeta } from "~/lib/categories";

type Period = "month" | "week";

interface SpendingHeroProps {
	currentSummary: Doc<"cashCreditSummaries"> | undefined;
	previousSummary: Doc<"cashCreditSummaries"> | undefined;
	/** All transactions for the current period, for essential/non-essential split */
	transactions: Doc<"transactions">[];
	period: Period;
	onPeriodChange: (period: Period) => void;
}

function getTotalSpending(summary: Doc<"cashCreditSummaries"> | undefined): number {
	if (!summary) return 0;
	return (summary.cashSpending ?? 0) + (summary.ccPurchases ?? 0);
}

function classifyTransactionSpending(transactions: Doc<"transactions">[]): {
	essential: number;
	nonEssential: number;
} {
	let essential = 0;
	let nonEssential = 0;

	for (const t of transactions) {
		// Only count outflows that are actual spending
		if (t.amount <= 0) continue;
		if (t.isInternalTransfer || t.isCreditCardPayment || t.isRefundOrReversal || t.isInterestOrFee)
			continue;

		const meta = getCategoryMeta(t.categoryPrimary);
		if (meta.classification === "excluded") continue;

		const cents = Math.abs(t.amount);
		if (meta.classification === "essential") {
			essential += cents;
		} else {
			nonEssential += cents;
		}
	}

	return { essential, nonEssential };
}

export function SpendingHero({
	currentSummary,
	previousSummary,
	transactions,
	period,
	onPeriodChange,
}: SpendingHeroProps) {
	const totalSpending = getTotalSpending(currentSummary);
	const prevSpending = getTotalSpending(previousSummary);
	const { essential, nonEssential } = classifyTransactionSpending(transactions);

	// % change vs previous period
	const pctChange = prevSpending > 0 ? ((totalSpending - prevSpending) / prevSpending) * 100 : 0;
	const isUp = pctChange > 0;
	const hasPrevious = prevSpending > 0;

	const periodLabel = period === "month" ? "This Month" : "This Week";
	const prevLabel = period === "month" ? "vs last month" : "vs last week";

	return (
		<div className="relative px-5 md:px-10 lg:px-12 pt-16 md:pt-24 pb-8 md:pb-10 bg-gradient-to-br from-secondary/8 via-card to-primary/6 overflow-hidden">
			{/* Decorative blurs */}
			<div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-secondary/10 blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
			<div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-primary/8 blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

			<div className="relative z-10">
				{/* Period tabs */}
				<div className="flex gap-1 mb-6 bg-muted/50 backdrop-blur-sm rounded-lg p-1 w-fit">
					<PeriodTab
						label="Monthly"
						active={period === "month"}
						onClick={() => onPeriodChange("month")}
					/>
					<PeriodTab
						label="Weekly"
						active={period === "week"}
						onClick={() => onPeriodChange("week")}
					/>
				</div>

				{/* Headline */}
				<div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">
					{periodLabel} Spending
				</div>
				<div className="flex items-baseline gap-3 mb-4">
					<span className="text-3xl sm:text-5xl font-extrabold text-foreground tabular-nums tracking-tight leading-none">
						{formatCurrency(totalSpending)}
					</span>
					{hasPrevious && (
						<span
							className={`flex items-center gap-1 text-xs font-semibold ${isUp ? "text-destructive" : "text-success"}`}
						>
							{isUp ? (
								<TrendingUpIcon className="w-3.5 h-3.5" />
							) : (
								<TrendingDownIcon className="w-3.5 h-3.5" />
							)}
							{Math.abs(Math.round(pctChange))}% {prevLabel}
						</span>
					)}
				</div>

				{/* Essential / Non-essential pills */}
				<div className="flex flex-wrap gap-2.5">
					<ClassificationPill
						icon={<ShieldCheckIcon className="w-3.5 h-3.5" />}
						label="Essential"
						value={formatCurrency(essential)}
						classification="essential"
					/>
					<ClassificationPill
						icon={<SparklesIcon className="w-3.5 h-3.5" />}
						label="Non-essential"
						value={formatCurrency(nonEssential)}
						classification="non-essential"
					/>
				</div>
			</div>
		</div>
	);
}

function PeriodTab({
	label,
	active,
	onClick,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			onClick={onClick}
			className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
				active
					? "bg-background text-foreground shadow-sm"
					: "text-muted-foreground hover:text-foreground"
			}`}
		>
			{label}
		</button>
	);
}

function ClassificationPill({
	icon,
	label,
	value,
	classification,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	classification: CategoryClassification;
}) {
	const colorClass = classification === "essential" ? "text-primary" : "text-secondary";
	return (
		<div className="flex items-center gap-2 bg-background/50 backdrop-blur-md rounded-lg px-3 py-2 shadow-sm">
			<span className={`${colorClass} opacity-70`}>{icon}</span>
			<div>
				<div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none">
					{label}
				</div>
				<div className={`text-sm font-bold tabular-nums ${colorClass} leading-snug`}>
					{value}
				</div>
			</div>
		</div>
	);
}
