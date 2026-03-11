import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type { Doc } from "convex/_generated/dataModel";
import { getCategoryMeta, type CategoryMeta } from "~/lib/categories";
import { formatCurrency } from "~/utils/formatters";
import { PillBadge } from "~/components/ui/PillBadge";

interface CategoryBreakdownProps {
	transactions: Doc<"transactions">[];
}

interface CategoryGroup {
	key: string;
	meta: CategoryMeta;
	totalCents: number;
	transactions: Doc<"transactions">[];
}

function groupByCategory(transactions: Doc<"transactions">[]): CategoryGroup[] {
	const map = new Map<string, { meta: CategoryMeta; totalCents: number; txns: Doc<"transactions">[] }>();

	for (const t of transactions) {
		// Only count outflows that are actual spending
		if (t.amount <= 0) continue;
		if (t.isInternalTransfer || t.isCreditCardPayment || t.isRefundOrReversal || t.isInterestOrFee)
			continue;

		const meta = getCategoryMeta(t.categoryPrimary, t.categoryDetailed);
		if (meta.classification === "excluded") continue;

		const key = t.categoryPrimary?.toUpperCase() ?? "UNCATEGORIZED";
		const existing = map.get(key);
		if (existing) {
			existing.totalCents += Math.abs(t.amount);
			existing.txns.push(t);
		} else {
			map.set(key, { meta, totalCents: Math.abs(t.amount), txns: [t] });
		}
	}

	return Array.from(map.entries())
		.map(([key, { meta, totalCents, txns }]) => ({
			key,
			meta,
			totalCents,
			transactions: txns.sort(
				(a, b) => new Date(b.authorizedDate ?? b.date).getTime() - new Date(a.authorizedDate ?? a.date).getTime(),
			),
		}))
		.sort((a, b) => b.totalCents - a.totalCents);
}

export function CategoryBreakdown({ transactions }: CategoryBreakdownProps) {
	const groups = groupByCategory(transactions);
	const grandTotal = groups.reduce((s, g) => s + g.totalCents, 0) || 1;
	const [expandedKey, setExpandedKey] = useState<string | null>(null);

	if (groups.length === 0) {
		return (
			<div className="px-5 md:px-10 lg:px-12 py-8 text-center text-muted-foreground text-sm">
				No spending transactions for this period.
			</div>
		);
	}

	return (
		<div className="px-5 md:px-10 lg:px-12 py-6">
			<h2 className="text-sm font-semibold text-foreground mb-4">By Category</h2>
			<div className="space-y-1">
				{groups.map((group) => (
					<CategoryRow
						key={group.key}
						group={group}
						grandTotal={grandTotal}
						expanded={expandedKey === group.key}
						onToggle={() =>
							setExpandedKey(expandedKey === group.key ? null : group.key)
						}
					/>
				))}
			</div>
		</div>
	);
}

function CategoryRow({
	group,
	grandTotal,
	expanded,
	onToggle,
}: {
	group: CategoryGroup;
	grandTotal: number;
	expanded: boolean;
	onToggle: () => void;
}) {
	const pct = Math.round((group.totalCents / grandTotal) * 100);
	const badgeTone = group.meta.classification === "essential" ? "good" : "neutral";
	const badgeLabel = group.meta.classification === "essential" ? "Essential" : "Non-essential";

	return (
		<div className="rounded-lg overflow-hidden">
			{/* Row header */}
			<button
				onClick={onToggle}
				className="w-full flex items-center gap-3 px-3 py-3.5 min-h-[44px] hover:bg-muted/40 transition-colors rounded-lg text-left"
			>
				<span className="text-lg leading-none shrink-0">{group.meta.icon}</span>

				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between gap-2">
						<span className="text-sm font-medium text-foreground truncate">
							{group.meta.displayName}
						</span>
						<span className="text-sm font-semibold text-foreground tabular-nums shrink-0">
							{formatCurrency(group.totalCents)}
						</span>
					</div>

					{/* Proportion bar + badge */}
					<div className="mt-1.5 flex items-center gap-2">
						<div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
							<div
								className="h-full rounded-full transition-all duration-500"
								style={{
									width: `${pct}%`,
									backgroundColor:
										group.meta.classification === "essential"
											? "hsl(var(--primary))"
											: "hsl(var(--secondary))",
								}}
							/>
						</div>
						<span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
							{pct}%
						</span>
						<PillBadge label={badgeLabel} tone={badgeTone} />
					</div>
				</div>

				{expanded ? (
					<ChevronUpIcon className="w-4 h-4 text-muted-foreground shrink-0" />
				) : (
					<ChevronDownIcon className="w-4 h-4 text-muted-foreground shrink-0" />
				)}
			</button>

			{/* Expanded transaction list */}
			{expanded && (
				<div className="pb-2 px-3">
					<div className="rounded-lg bg-muted/30 divide-y divide-border/50 overflow-hidden">
						{group.transactions.map((t) => (
							<TransactionRow key={t._id} transaction={t} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function TransactionRow({ transaction: t }: { transaction: Doc<"transactions"> }) {
	const effectiveDate = t.authorizedDate ?? t.date;
	const dateStr = new Date(effectiveDate).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});

	return (
		<div className="flex items-center justify-between gap-3 px-3 py-3 min-h-[44px]">
			<div className="flex-1 min-w-0">
				<div className="text-sm text-foreground truncate" title={t.merchantName ?? t.name}>
					{t.merchantName ?? t.name}
				</div>
				<div className="text-[11px] text-muted-foreground">{dateStr}</div>
			</div>
			<div className="text-sm font-semibold text-foreground tabular-nums shrink-0">
				{formatCurrency(Math.abs(t.amount))}
			</div>
		</div>
	);
}
