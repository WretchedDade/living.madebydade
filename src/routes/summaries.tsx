import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { SpendingHero } from "~/components/spending/SpendingHero";
import { SpendingTrend } from "~/components/spending/SpendingTrend";
import { CategoryBreakdown } from "~/components/spending/CategoryBreakdown";
import { LoaderIcon } from "lucide-react";

type Period = "month" | "week";

/** Get ISO date string for start of current month */
function currentMonthStart(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Get ISO date string for end of current month */
function currentMonthEnd(): string {
	const now = new Date();
	const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	return lastDay.toISOString().slice(0, 10);
}

/** Get ISO date string for start of current week (Monday) */
function currentWeekStart(): string {
	const now = new Date();
	const day = now.getDay();
	const diff = day === 0 ? 6 : day - 1; // Monday = 0 offset
	const monday = new Date(now);
	monday.setDate(now.getDate() - diff);
	return monday.toISOString().slice(0, 10);
}

/** Get ISO date string for end of current week (Sunday) */
function currentWeekEnd(): string {
	const now = new Date();
	const day = now.getDay();
	const diff = day === 0 ? 0 : 7 - day;
	const sunday = new Date(now);
	sunday.setDate(now.getDate() + diff);
	return sunday.toISOString().slice(0, 10);
}

function SpendingPage() {
	const [period, setPeriod] = useState<Period>("month");
	const [isClient, setIsClient] = useState(false);
	useEffect(() => setIsClient(true), []);

	// Summaries for the trend chart + hero stats
	const summaryPageSize = period === "month" ? 12 : 12;
	const { data: summaryData, isLoading: summariesLoading } = useQuery(
		convexQuery(api.cashCreditSummaries.listByPeriod, { period, pageSize: summaryPageSize }),
	);
	const summaries = summaryData?.page ?? [];

	// Current and previous period from summaries
	const currentSummary = summaries[0];
	const previousSummary = summaries[1];

	// Date range for transactions (category breakdown)
	const { startDate, endDate } = useMemo(() => {
		if (currentSummary) {
			return {
				startDate: currentSummary.startDate.slice(0, 10),
				endDate: currentSummary.endDate.slice(0, 10),
			};
		}
		// Fallback to calculated dates
		if (period === "month") {
			return { startDate: currentMonthStart(), endDate: currentMonthEnd() };
		}
		return { startDate: currentWeekStart(), endDate: currentWeekEnd() };
	}, [currentSummary, period]);

	// Transactions for the current period
	const { data: txnData, isLoading: txnsLoading } = useQuery(
		convexQuery(api.transactions.listByDateRange, {
			startDate,
			endDate,
			limit: 1000,
		}),
	);
	const transactions = txnData?.items ?? [];

	const isLoading = summariesLoading || txnsLoading;

	return (
		<AppLayout>
			<main className="flex-1 w-full min-h-0">
				<SpendingHero
					currentSummary={currentSummary}
					previousSummary={previousSummary}
					transactions={transactions}
					period={period}
					onPeriodChange={setPeriod}
				/>

				{isLoading && summaries.length === 0 ? (
					<div className="flex items-center justify-center py-20">
						<LoaderIcon className="w-6 h-6 text-muted-foreground animate-spin" />
					</div>
				) : (
					<>
						{isClient && <SpendingTrend summaries={summaries} />}

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
					convexQuery(api.cashCreditSummaries.listByPeriod, { period: "month", pageSize: 12 }),
				),
			]);
		} catch {
			// Auth may not be available during SSR
		}
	},
});
