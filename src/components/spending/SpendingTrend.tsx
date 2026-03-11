import {
	ResponsiveContainer,
	AreaChart,
	Area,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ReferenceLine,
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
	/** Transaction-based income total (cents) for the currently selected period. */
	currentPeriodIncome?: number;
	/** The startDate of the currently selected period, to identify which summary to override */
	currentPeriodStart?: string;
}

interface TrendDataPoint {
	label: string;
	spending: number;
	income: number;
	net: number;
}

function buildTrendData(
	summaries: Doc<"cashCreditSummaries">[],
	currentPeriodSpending?: number,
	currentPeriodIncome?: number,
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

			const isSelectedPeriod =
				currentPeriodStart && s.startDate.slice(0, 10) === currentPeriodStart;

			const spending =
				isSelectedPeriod && currentPeriodSpending != null
					? Math.round(currentPeriodSpending / 100)
					: Math.round(((s.cashSpending ?? 0) + (s.ccPurchases ?? 0)) / 100);

			const income =
				isSelectedPeriod && currentPeriodIncome != null
					? Math.round(currentPeriodIncome / 100)
					: Math.round((s.cashIncomeExternal ?? 0) / 100);

			return {
				label,
				spending,
				income,
				net: income - spending,
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

export function SpendingTrend({ summaries, currentPeriodSpending, currentPeriodIncome, currentPeriodStart }: SpendingTrendProps) {
	const { theme } = useTheme();

	if (summaries.length < 2) return null;

	const data = buildTrendData(summaries, currentPeriodSpending, currentPeriodIncome, currentPeriodStart);
	const primary = `hsl(${theme.colors.primary})`;
	const secondary = `hsl(${theme.colors.secondary})`;

	const hasNegativeNet = data.some((d) => d.net < 0);
	const successColor = "hsl(var(--success))";
	const destructiveColor = "hsl(var(--destructive))";

	return (
		<div className="px-5 md:px-10 lg:px-12 py-6">
			<h2 className="text-sm font-semibold text-foreground mb-4">Spending vs Income</h2>
			<div className="h-48 md:h-56">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
							tickFormatter={(v: number) => {
								const abs = Math.abs(v);
								const prefix = v < 0 ? "-" : "";
								return abs >= 1000 ? `${prefix}$${(abs / 1000).toFixed(0)}k` : `${prefix}$${abs}`;
							}}
							tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
							tickLine={false}
							axisLine={false}
							width={40}
						/>
						<Tooltip content={<CustomTooltip />} />
						{hasNegativeNet && (
							<ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.5} />
						)}
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
						<Line
							type="monotone"
							dataKey="net"
							name="net"
							stroke="url(#netLineGradient)"
							strokeWidth={2}
							strokeDasharray="6 3"
							dot={(props: Record<string, unknown>) => {
								const { cx, cy, payload } = props as { cx: number; cy: number; payload: TrendDataPoint };
								const color = payload.net >= 0 ? successColor : destructiveColor;
								return <circle cx={cx} cy={cy} r={3} fill={color} stroke="none" />;
							}}
							activeDot={false}
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
				<span className="flex items-center gap-1.5">
					<span className="w-3 h-0.5 border-t-2 border-dashed" style={{ borderColor: successColor }} />
					Net
				</span>
			</div>
		</div>
	);
}
