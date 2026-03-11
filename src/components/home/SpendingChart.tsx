import {
	ResponsiveContainer,
	AreaChart,
	Area,
} from "recharts";
import type { Doc } from "convex/_generated/dataModel";
import { useTheme } from "~/components/provider/ThemeProvider";

interface SpendingChartProps {
	summaries: Doc<"cashCreditSummaries">[];
	/** When true, renders as a subtle background — no axes, no labels, no interactivity */
	background?: boolean;
}

interface ChartDataPoint {
	month: string;
	spending: number;
	income: number;
}

function buildChartData(summaries: Doc<"cashCreditSummaries">[]): ChartDataPoint[] {
	return [...summaries]
		.reverse()
		.map(s => ({
			month: new Date(s.startDate).toLocaleDateString("en-US", { month: "short" }),
			spending: Math.round(((s.cashSpending ?? 0) + (s.ccPurchases ?? 0)) / 100),
			income: Math.round((s.cashIncomeExternal ?? 0) / 100),
		}));
}

export function SpendingChart({ summaries, background = false }: SpendingChartProps) {
	const { theme } = useTheme();

	if (summaries.length === 0) return null;

	const chartData = buildChartData(summaries);
	const primaryHsl = theme.colors.primary;
	const secondaryHsl = theme.colors.secondary;
	const gradientId = background ? "bg" : "fg";

	return (
		<ResponsiveContainer width="100%" height="100%">
			<AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
				<defs>
					<linearGradient id={`${gradientId}SpendingFill`} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={`hsl(${primaryHsl})`} stopOpacity={background ? 0.4 : 0.35} />
						<stop offset="90%" stopColor={`hsl(${primaryHsl})`} stopOpacity={0.02} />
					</linearGradient>
					<linearGradient id={`${gradientId}IncomeFill`} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={`hsl(${secondaryHsl})`} stopOpacity={background ? 0.25 : 0.2} />
						<stop offset="90%" stopColor={`hsl(${secondaryHsl})`} stopOpacity={0.02} />
					</linearGradient>
				</defs>
				<Area
					type="monotone"
					dataKey="income"
					stroke={background ? "none" : `hsl(${secondaryHsl} / 0.5)`}
					strokeWidth={1.5}
					fill={`url(#${gradientId}IncomeFill)`}
					dot={false}
					isAnimationActive={!background}
				/>
				<Area
					type="monotone"
					dataKey="spending"
					stroke={`hsl(${primaryHsl} / ${background ? "0.25" : "0.6"})`}
					strokeWidth={background ? 1.5 : 2}
					fill={`url(#${gradientId}SpendingFill)`}
					dot={false}
					isAnimationActive={!background}
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
}
