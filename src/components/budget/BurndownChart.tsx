import { useMemo } from "react";
import {
	ResponsiveContainer,
	ComposedChart,
	Area,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	type TooltipProps,
} from "recharts";
import type { Doc } from "convex/_generated/dataModel";
import { useTheme } from "~/components/provider/ThemeProvider";
import { formatCurrency } from "~/utils/formatters";
import { monthlyMultiplier } from "~/lib/budget";

interface BurndownChartProps {
	/** Monthly income in cents */
	monthlyIncome: number;
	bills: Doc<"bills">[];
	budgetItems: Doc<"budgetItems">[];
	/** Actual transactions for the period */
	transactions: Doc<"transactions">[];
	/** Year and month (1-indexed) */
	year: number;
	month: number;
}

interface BurndownPoint {
	day: number;
	label: string;
	forecast: number;
	actual: number | null;
}

function buildBurndownData({
	monthlyIncome,
	bills,
	budgetItems,
	transactions,
	year,
	month,
}: BurndownChartProps): BurndownPoint[] {
	const daysInMonth = new Date(year, month, 0).getDate();
	const today = new Date();
	const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
	const currentDay = isCurrentMonth ? today.getDate() : daysInMonth;

	// Build a map of bill amounts hitting on specific days
	const billsByDay = new Map<number, number>();
	for (const bill of bills) {
		const day =
			bill.dueType === "EndOfMonth"
				? daysInMonth
				: Math.min(bill.dayDue ?? 1, daysInMonth);
		billsByDay.set(day, (billsByDay.get(day) ?? 0) + (bill.amount ?? 0));
	}

	// Daily drain from budget items (spread evenly across the month)
	const totalBudgetMonthly = budgetItems.reduce((sum, item) => {
		return sum + Math.round(item.amount * monthlyMultiplier(item.frequency));
	}, 0);
	const dailyBudgetDrain = totalBudgetMonthly / daysInMonth;

	// Build forecast: start at income, subtract bills on their days, drain budget items daily
	const points: BurndownPoint[] = [];
	let forecastRemaining = monthlyIncome;

	// Build actual spending by day
	const actualByDay = new Map<number, number>();
	for (const t of transactions) {
		if (t.amount <= 0) continue;
		if (t.isInternalTransfer || t.isCreditCardPayment) continue;

		const effectiveDate = t.authorizedDate ?? t.date;
		const txDate = new Date(effectiveDate + (effectiveDate.includes("T") ? "" : "T12:00:00"));
		if (txDate.getFullYear() === year && txDate.getMonth() + 1 === month) {
			const day = txDate.getDate();
			actualByDay.set(day, (actualByDay.get(day) ?? 0) + Math.abs(t.amount));
		}
	}

	let actualRemaining = monthlyIncome;

	for (let day = 1; day <= daysInMonth; day++) {
		// Forecast: subtract bills on their due day + daily budget drain
		const billsToday = billsByDay.get(day) ?? 0;
		forecastRemaining -= billsToday + dailyBudgetDrain;

		// Actual: subtract real spending
		const actualToday = actualByDay.get(day) ?? 0;
		actualRemaining -= actualToday;

		const showActual = day <= currentDay;

		points.push({
			day,
			label: `${month}/${day}`,
			forecast: Math.round(forecastRemaining / 100),
			actual: showActual ? Math.round(actualRemaining / 100) : null,
		});
	}

	return points;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
	if (!active || !payload?.length) return null;
	return (
		<div
			className="rounded-lg px-3 py-2 shadow-lg text-sm"
			style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
		>
			<div className="text-muted-foreground text-xs mb-1">{label}</div>
			{payload
				.filter((entry) => entry.value != null)
				.map((entry) => (
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

export function BurndownChart(props: BurndownChartProps) {
	const { theme } = useTheme();
	const data = useMemo(() => buildBurndownData(props), [
		props.monthlyIncome,
		props.bills,
		props.budgetItems,
		props.transactions,
		props.year,
		props.month,
	]);

	if (data.length === 0 || props.monthlyIncome === 0) return null;

	const primary = `hsl(${theme.colors.primary})`;
	const secondary = `hsl(${theme.colors.secondary})`;
	const hasActual = data.some((d) => d.actual !== null);

	return (
		<div>
			<div className="h-52 md:h-64">
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
						<defs>
							<linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={secondary} stopOpacity={0.15} />
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
							dataKey="day"
							tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
							tickLine={false}
							axisLine={false}
							interval="preserveStartEnd"
							tickFormatter={(day: number) => `${day}`}
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
						<Area
							type="stepAfter"
							dataKey="forecast"
							name="forecast"
							stroke={secondary}
							strokeWidth={1.5}
							strokeDasharray="6 3"
							fill="url(#forecastFill)"
							dot={false}
							connectNulls
						/>
						{hasActual && (
							<Line
								type="monotone"
								dataKey="actual"
								name="actual"
								stroke={primary}
								strokeWidth={2.5}
								dot={false}
								connectNulls
							/>
						)}
					</ComposedChart>
				</ResponsiveContainer>
			</div>
			<div className="flex items-center justify-center gap-5 mt-3 text-xs text-muted-foreground">
				<span className="flex items-center gap-1.5">
					<span className="w-3 h-0.5 border-t-2 border-dashed" style={{ borderColor: secondary }} />
					Forecast
				</span>
				{hasActual && (
					<span className="flex items-center gap-1.5">
						<span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: primary, height: 2.5 }} />
						Actual
					</span>
				)}
			</div>
		</div>
	);
}
