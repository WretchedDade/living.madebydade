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
	ReferenceLine,
	type TooltipProps,
} from "recharts";
import type { Doc } from "convex/_generated/dataModel";
import { useTheme } from "~/components/provider/ThemeProvider";
import { formatCurrency, formatOrdinal } from "~/utils/formatters";
import { monthlyMultiplier } from "~/lib/budget";

interface BurndownChartProps {
	/** Per-paycheck amount in cents */
	payAmountCents: number;
	paySchedule: "semimonthly" | "biweekly" | "weekly" | "monthly";
	payDays: number[];
	bills: Doc<"bills">[];
	budgetItems: Doc<"budgetItems">[];
	/** Actual transactions for the period */
	transactions: Doc<"transactions">[];
	/** Year and month (1-indexed) */
	year: number;
	month: number;
	/** If set, show a rolling window: [daysBefore, daysAfter] from today */
	rollingWindow?: [number, number];
}

interface BurndownPoint {
	day: number;
	label: string;
	forecast: number;
	actual: number | null;
}

/** Figure out which days of the month paychecks land */
function getPayDaysInMonth(
	paySchedule: BurndownChartProps["paySchedule"],
	payDays: number[],
	year: number,
	month: number,
): number[] {
	const daysInMonth = new Date(year, month, 0).getDate();

	if (paySchedule === "semimonthly") {
		// payDays like [15, 0] where 0 = end of month
		// For the burndown, treat EOM paycheck as arriving on the 1st (money is available at start of month)
		return payDays.map((d) => (d === 0 ? 1 : Math.min(d, daysInMonth))).sort((a, b) => a - b);
	}
	if (paySchedule === "monthly") {
		const d = payDays[0] ?? 1;
		return [d === 0 ? daysInMonth : Math.min(d, daysInMonth)];
	}
	// Weekly or biweekly: compute from a reference date
	const interval = paySchedule === "weekly" ? 7 : 14;
	const dayOfWeek = payDays[0] ?? 1; // 0=Sun, 1=Mon, etc.
	const refMonday = new Date(2024, 0, 1); // known Monday
	const result: number[] = [];
	const firstOfMonth = new Date(year, month - 1, 1);
	// Find first occurrence of dayOfWeek in/before the month
	const startSearch = new Date(firstOfMonth);
	startSearch.setDate(startSearch.getDate() - interval);
	for (let d = new Date(startSearch); d.getMonth() + 1 <= month || d.getFullYear() < year; d.setDate(d.getDate() + 1)) {
		if (d.getDay() === dayOfWeek) {
			// Check if this aligns with the biweekly cadence
			const daysDiff = Math.round((d.getTime() - refMonday.getTime()) / (1000 * 60 * 60 * 24));
			if (daysDiff % interval === 0) {
				if (d.getFullYear() === year && d.getMonth() + 1 === month) {
					result.push(d.getDate());
				}
				if (d.getFullYear() === year && d.getMonth() + 1 > month) break;
			}
		}
	}
	return result.length > 0 ? result : [1]; // fallback
}

function buildBurndownData({
	payAmountCents,
	paySchedule,
	payDays,
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
	const monthName = new Date(year, month - 1).toLocaleDateString("en-US", { month: "short" });

	// Paycheck days
	const paycheckDays = new Set(getPayDaysInMonth(paySchedule, payDays, year, month));

	// Bill amounts by day
	const billsByDay = new Map<number, number>();
	for (const bill of bills) {
		const day =
			bill.dueType === "EndOfMonth"
				? daysInMonth
				: Math.min(bill.dayDue ?? 1, daysInMonth);
		billsByDay.set(day, (billsByDay.get(day) ?? 0) + (bill.amount ?? 0));
	}

	// Daily drain from budget items
	const totalBudgetMonthly = budgetItems.reduce((sum, item) => {
		return sum + Math.round(item.amount * monthlyMultiplier(item.frequency));
	}, 0);
	const dailyBudgetDrain = totalBudgetMonthly / daysInMonth;

	// Actual spending by day
	const actualByDay = new Map<number, number>();
	// Actual income by day
	const actualIncomeByDay = new Map<number, number>();
	for (const t of transactions) {
		if (t.isInternalTransfer || t.isCreditCardPayment) continue;

		const effectiveDate = t.authorizedDate ?? t.date;
		const txDate = new Date(effectiveDate + (effectiveDate.includes("T") ? "" : "T12:00:00"));
		if (txDate.getFullYear() === year && txDate.getMonth() + 1 === month) {
			const day = txDate.getDate();
			if (t.amount > 0) {
				// Outflow
				actualByDay.set(day, (actualByDay.get(day) ?? 0) + Math.abs(t.amount));
			} else if (t.amount < 0 && !t.isRefundOrReversal) {
				// Inflow (income)
				actualIncomeByDay.set(day, (actualIncomeByDay.get(day) ?? 0) + Math.abs(t.amount));
			}
		}
	}

	const points: BurndownPoint[] = [];
	let forecastBalance = 0;
	let actualBalance = 0;

	for (let day = 1; day <= daysInMonth; day++) {
		// Add paycheck on payday
		if (paycheckDays.has(day)) {
			forecastBalance += payAmountCents;
		}

		// Forecast: subtract bills + daily budget drain
		const billsToday = billsByDay.get(day) ?? 0;
		forecastBalance -= billsToday + dailyBudgetDrain;

		// Actual: add real income, subtract real spending
		const incomeToday = actualIncomeByDay.get(day) ?? 0;
		const spendingToday = actualByDay.get(day) ?? 0;
		actualBalance += incomeToday - spendingToday;

		const showActual = day <= currentDay;

		points.push({
			day,
			label: `${monthName} ${formatOrdinal(day)}`,
			forecast: Math.round(forecastBalance / 100),
			actual: showActual ? Math.round(actualBalance / 100) : null,
		});
	}

	return points;
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
	if (!active || !payload?.length) return null;
	const point = payload[0]?.payload as BurndownPoint | undefined;
	return (
		<div
			className="rounded-lg px-3 py-2 shadow-lg text-sm"
			style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
		>
			<div className="text-muted-foreground text-xs mb-1">{point?.label}</div>
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
	const fullData = useMemo(() => buildBurndownData(props), [
		props.payAmountCents,
		props.paySchedule,
		props.payDays,
		props.bills,
		props.budgetItems,
		props.transactions,
		props.year,
		props.month,
	]);

	// Apply rolling window if specified
	const data = useMemo(() => {
		if (!props.rollingWindow) return fullData;
		const [before, after] = props.rollingWindow;
		const today = new Date();
		if (today.getFullYear() !== props.year || today.getMonth() + 1 !== props.month) {
			return fullData; // not current month, show all
		}
		const currentDay = today.getDate();
		const startDay = Math.max(1, currentDay - before);
		const endDay = Math.min(fullData.length, currentDay + after);
		return fullData.filter((p) => p.day >= startDay && p.day <= endDay);
	}, [fullData, props.rollingWindow, props.year, props.month]);

	if (data.length === 0 || props.payAmountCents === 0) return null;

	const primary = `hsl(${theme.colors.primary})`;
	const secondary = `hsl(${theme.colors.secondary})`;
	const hasActual = data.some((d) => d.actual !== null);
	const today = new Date();
	const isCurrentMonth = today.getFullYear() === props.year && today.getMonth() + 1 === props.month;
	const currentDay = today.getDate();
	const tickDays = props.rollingWindow
		? data.filter((_, i) => i === 0 || i === data.length - 1 || (i + 1) % 5 === 0).map((p) => p.day)
		: [1, 5, 10, 15, 20, 25, data[data.length - 1]?.day ?? 30];

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
							ticks={tickDays}
							tickFormatter={(day: number) => formatOrdinal(day)}
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
						{isCurrentMonth && (
							<ReferenceLine
								x={currentDay}
								stroke="hsl(var(--foreground))"
								strokeOpacity={0.3}
								strokeDasharray="4 4"
								label={{
									value: "Today",
									position: "insideTopRight",
									fill: "hsl(var(--muted-foreground))",
									fontSize: 10,
									offset: 8,
								}}
							/>
						)}
						<Area
							type="monotone"
							dataKey="forecast"
							name="forecast"
							stroke={secondary}
							strokeWidth={2}
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
