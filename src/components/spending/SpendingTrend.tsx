import {
	ResponsiveContainer,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	type TooltipProps,
} from "recharts";
import type { Doc } from "convex/_generated/dataModel";
import { useTheme } from "~/components/provider/ThemeProvider";
import { formatCurrency } from "~/utils/formatters";

interface SpendingTrendProps {
	summaries: Doc<"cashCreditSummaries">[];
	/** Transaction-based spending total (cents) for the currently selected period.
	 *  Overrides the summary-based calculation for that period so chart matches hero. */
	currentPeriodSpending?: number;
	/** The startDate of the currently selected period, to identify which summary to override */
	currentPeriodStart?: string;
}

interface TrendDataPoint {
	label: string;
	spending: number;
	income: number;
}

function buildTrendData(
	summaries: Doc<"cashCreditSummaries">[],
	currentPeriodSpending?: number,
	currentPeriodStart?: string,
): TrendDataPoint[] {
	return [...summaries]
		.reverse()
		.map((s) => {
			const start = new Date(s.startDate);
			const label =
				s.period === "month"
					? start.toLocaleDateString("en-US", { month: "short" })
					: start.toLocaleDateString("en-US", { month: "short", day: "numeric" });

			// Use transaction-based total for the selected period (matches hero exactly)
			const isSelectedPeriod =
				currentPeriodStart && s.startDate.slice(0, 10) === currentPeriodStart;
			const spending =
				isSelectedPeriod && currentPeriodSpending != null
					? Math.round(currentPeriodSpending / 100)
					: Math.round(((s.cashSpending ?? 0) + (s.ccPurchases ?? 0)) / 100);

			return {
				label,
				spending,
				income: Math.round((s.cashIncomeExternal ?? 0) / 100),
			};
		});
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
	if (!active || !payload?.length) return null;
	return (
		<div
			className="rounded-lg px-3 py-2 shadow-lg text-sm"
			style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
		>
			<div className="text-muted-foreground text-xs mb-1">{label}</div>
			{payload.map((entry) => (
				<div key={entry.dataKey} className="flex items-center gap-2">
					<span
						className="w-2 h-2 rounded-full"
						style={{ backgroundColor: entry.color }}
					/>
					<span className="text-muted-foreground text-xs capitalize">{entry.name}</span>
					<span className="text-foreground text-xs font-semibold tabular-nums ml-auto">
						{formatCurrency((entry.value ?? 0) * 100)}
					</span>
				</div>
			))}
		</div>
	);
}

export function SpendingTrend({ summaries, currentPeriodSpending, currentPeriodStart }: SpendingTrendProps) {
	const { theme } = useTheme();

	if (summaries.length < 2) return null;

	const data = buildTrendData(summaries, currentPeriodSpending, currentPeriodStart);
	const primary = `hsl(${theme.colors.primary})`;
	const secondary = `hsl(${theme.colors.secondary})`;

	return (
		<div className="px-5 md:px-10 lg:px-12 py-6">
			<h2 className="text-sm font-semibold text-foreground mb-4">Spending vs Income</h2>
			<div className="h-48 md:h-56">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
						<defs>
							<linearGradient id="trendSpendFill" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={primary} stopOpacity={0.3} />
								<stop offset="95%" stopColor={primary} stopOpacity={0.02} />
							</linearGradient>
							<linearGradient id="trendIncomeFill" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={secondary} stopOpacity={0.2} />
								<stop offset="95%" stopColor={secondary} stopOpacity={0.02} />
							</linearGradient>
						</defs>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="hsl(var(--border))"
							strokeOpacity={0.5}
							vertical={false}
						/>
						<XAxis
							dataKey="label"
							tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
							tickLine={false}
							axisLine={false}
						/>
						<YAxis
							tickFormatter={(v: number) =>
								v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
							}
							tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
							tickLine={false}
							axisLine={false}
							width={36}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Area
							type="monotone"
							dataKey="income"
							name="income"
							stroke={secondary}
							strokeWidth={1.5}
							fill="url(#trendIncomeFill)"
							dot={false}
						/>
						<Area
							type="monotone"
							dataKey="spending"
							name="spending"
							stroke={primary}
							strokeWidth={2}
							fill="url(#trendSpendFill)"
							dot={false}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
			<div className="flex items-center justify-center gap-5 mt-3 text-xs text-muted-foreground">
				<span className="flex items-center gap-1.5">
					<span className="w-2 h-2 rounded-full" style={{ backgroundColor: primary }} />
					Spending
				</span>
				<span className="flex items-center gap-1.5">
					<span className="w-2 h-2 rounded-full" style={{ backgroundColor: secondary }} />
					Income
				</span>
			</div>
		</div>
	);
}
