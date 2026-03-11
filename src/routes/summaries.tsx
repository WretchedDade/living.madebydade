import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useState, useMemo, useEffect, useCallback } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { SpendingHero, analyzeSpending } from "~/components/spending/SpendingHero";
import { SpendingTrend } from "~/components/spending/SpendingTrend";
import { ClassificationTrend } from "~/components/spending/ClassificationTrend";
import { CategoryBreakdown } from "~/components/spending/CategoryBreakdown";
import { LoaderIcon } from "lucide-react";
import type { Doc } from "convex/_generated/dataModel";

type Period = "month" | "week";

/** Compute start/end ISO date strings for a period offset from today.
 *  offset=0 is the current period, -1 is previous, etc. */
function getPeriodRange(period: Period, offset: number): { startDate: string; endDate: string } {
	const now = new Date();
	if (period === "month") {
		const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
		const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
		const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
		const end = lastDay.toISOString().slice(0, 10);
		return { startDate: start, endDate: end };
	}
	// Weekly
	const day = now.getDay();
	const mondayDiff = day === 0 ? 6 : day - 1;
	const monday = new Date(now);
	monday.setDate(now.getDate() - mondayDiff + offset * 7);
	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);
	return {
		startDate: monday.toISOString().slice(0, 10),
		endDate: sunday.toISOString().slice(0, 10),
	};
}

/** Aggregate multiple summary rows for the same period (shared users) into one */
function aggregateSummaries(
	summaries: Doc<"cashCreditSummaries">[],
): Doc<"cashCreditSummaries">[] {
	const map = new Map<string, Doc<"cashCreditSummaries">>();
	for (const s of summaries) {
		const key = `${s.period}:${s.startDate}`;
		const existing = map.get(key);
		if (!existing) {
			map.set(key, { ...s });
		} else {
			map.set(key, {
				...existing,
				cashIncomeExternal: (existing.cashIncomeExternal ?? 0) + (s.cashIncomeExternal ?? 0),
				cashSpending: (existing.cashSpending ?? 0) + (s.cashSpending ?? 0),
				cashSavingsContributions: (existing.cashSavingsContributions ?? 0) + (s.cashSavingsContributions ?? 0),
				ccPurchases: (existing.ccPurchases ?? 0) + (s.ccPurchases ?? 0),
				ccPayments: (existing.ccPayments ?? 0) + (s.ccPayments ?? 0),
				ccInterestFees: (existing.ccInterestFees ?? 0) + (s.ccInterestFees ?? 0),
				ccRefunds: (existing.ccRefunds ?? 0) + (s.ccRefunds ?? 0),
				ccPrincipalDelta: (existing.ccPrincipalDelta ?? 0) + (s.ccPrincipalDelta ?? 0),
			});
		}
	}
	return Array.from(map.values()).sort(
		(a, b) => (b.startDate > a.startDate ? 1 : a.startDate > b.startDate ? -1 : 0),
	);
}

function SpendingPage() {
	const [period, setPeriod] = useState<Period>("month");
	const [offset, setOffset] = useState(0);
	const [isClient, setIsClient] = useState(false);
	useEffect(() => setIsClient(true), []);

	// Reset offset when period type changes
	const handlePeriodChange = useCallback((p: Period) => {
		setPeriod(p);
		setOffset(0);
	}, []);

	// Selected period date range
	const { startDate, endDate } = useMemo(() => getPeriodRange(period, offset), [period, offset]);
	const { startDate: prevStartDate, endDate: prevEndDate } = useMemo(
		() => getPeriodRange(period, offset - 1),
		[period, offset],
	);

	// Can't go forward past current period
	const isCurrentPeriod = offset === 0;

	// Summaries for the trend chart (always fetch most recent 12)
	const { data: summaryData, isLoading: summariesLoading } = useQuery(
		convexQuery(api.cashCreditSummaries.listByPeriod, { period, pageSize: 24 }),
	);
	const aggregatedSummaries = useMemo(
		() => aggregateSummaries(summaryData?.page ?? []),
		[summaryData?.page],
	);

	// Current period transactions
	const { data: txnData, isLoading: txnsLoading } = useQuery(
		convexQuery(api.transactions.listByDateRange, { startDate, endDate, limit: 1000 }),
	);
	const transactions = txnData?.items ?? [];

	// Previous period transactions (for comparison)
	const { data: prevTxnData } = useQuery(
		convexQuery(api.transactions.listByDateRange, {
			startDate: prevStartDate,
			endDate: prevEndDate,
			limit: 1000,
		}),
	);
	const previousTransactions = prevTxnData?.items ?? [];

	// Transaction-based totals for the selected period (matches hero)
	const currentPeriodAnalysis = useMemo(
		() => analyzeSpending(transactions),
		[transactions],
	);

	// Wide-range transactions for the classification trend chart
	const trendRange = useMemo(() => {
		if (aggregatedSummaries.length === 0) return { trendStart: startDate, trendEnd: endDate };
		const sorted = [...aggregatedSummaries].sort(
			(a, b) => (a.startDate < b.startDate ? -1 : 1),
		);
		return {
			trendStart: sorted[0].startDate.slice(0, 10),
			trendEnd: sorted[sorted.length - 1].endDate.slice(0, 10),
		};
	}, [aggregatedSummaries, startDate, endDate]);

	const { data: trendTxnData } = useQuery(
		convexQuery(api.transactions.listByDateRange, {
			startDate: trendRange.trendStart,
			endDate: trendRange.trendEnd,
			limit: 5000,
		}),
	);
	const trendTransactions = trendTxnData?.items ?? [];

	const isLoading = summariesLoading || txnsLoading;

	return (
		<AppLayout>
			<main className="flex-1 w-full min-h-0">
				<SpendingHero
					transactions={transactions}
					previousTransactions={previousTransactions}
					period={period}
					onPeriodChange={handlePeriodChange}
					startDate={startDate}
					endDate={endDate}
					offset={offset}
					onOffsetChange={setOffset}
					isCurrentPeriod={isCurrentPeriod}
				/>

				{isLoading && aggregatedSummaries.length === 0 ? (
					<div className="flex items-center justify-center py-20">
						<LoaderIcon className="w-6 h-6 text-muted-foreground animate-spin" />
					</div>
				) : (
					<>
						{isClient && (
							<SpendingTrend
								summaries={aggregatedSummaries}
								currentPeriodSpending={currentPeriodAnalysis.totalSpending}
								currentPeriodIncome={currentPeriodAnalysis.income}
								currentPeriodStart={startDate}
							/>
						)}

						{isClient && (
							<ClassificationTrend
								transactions={trendTransactions}
								period={period}
							/>
						)}

						{/* Divider */}
						<div className="mx-5 md:mx-10 lg:mx-12">
							<div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
						</div>

						<CategoryBreakdown transactions={transactions} />
					</>
				)}
			</main>
		</AppLayout>
	);
}

export const Route = createFileRoute("/summaries")({
	component: SpendingPage,
	loader: async ({ context }) => {
		try {
			await Promise.all([
				context.queryClient.prefetchQuery(
					convexQuery(api.cashCreditSummaries.listByPeriod, { period: "month", pageSize: 24 }),
				),
			]);
		} catch {
			// Auth may not be available during SSR
		}
	},
});
