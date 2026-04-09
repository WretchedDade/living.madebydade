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
import type { Account } from "convex/accounts";

interface SpendingMoneyChartProps {
	/** Current checking balance in dollars */
	checkingBalance: number;
	bills: Doc<"bills">[];
	budgetItems: Doc<"budgetItems">[];
	/** Actual transactions for the period */
	transactions: Doc<"transactions">[];
	/** Unpaid bill payments (to know which bills are already paid this month) */
	unpaidPayments: { billId: string; dateDue: string }[];
	year: number;
	month: number;
}

interface ChartPoint {
	day: number;
	label: string;
	forecast: number;
	actual: number | null;
}

function buildChartData({
	checkingBalance,
	bills,
	budgetItems,
	transactions,
	unpaidPayments,
	year,
	month,
}: SpendingMoneyChartProps): ChartPoint[] {
	const daysInMonth = new Date(year, month, 0).getDate();
	const today = new Date();
	const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
	const currentDay = isCurrentMonth ? today.getDate() : daysInMonth;
	const monthName = new Date(year, month - 1).toLocaleDateString("en-US", { month: "short" });

	// Unpaid bill IDs — only these should be subtracted in the forecast
	const unpaidBillIds = new Set(unpaidPayments.map((p) => p.billId));

	// Map unpaid bills to their due days
	const billsByDay = new Map<number, number>();
	for (const bill of bills) {
		if (!unpaidBillIds.has(bill._id)) continue; // already paid, skip
		const day =
			bill.dueType === "EndOfMonth"
				? daysInMonth
				: Math.min(bill.dayDue ?? 1, daysInMonth);
		// Only future bills affect the forecast (past unpaid ones are already reflected in balance)
		if (day >= currentDay) {
			billsByDay.set(day, (billsByDay.get(day) ?? 0) + (bill.amount ?? 0));
		}
	}

	// Daily drain from budget items (remaining days only)
	const totalBudgetMonthly = budgetItems.reduce((sum, item) => {
		return sum + Math.round(item.amount * monthlyMultiplier(item.frequency));
	}, 0);
	const remainingDays = daysInMonth - currentDay + 1;
	const dailyBudgetDrain = remainingDays > 0 ? (totalBudgetMonthly / daysInMonth) : 0;

	// Actual spending by day (for historical portion)
	const actualSpendByDay = new Map<number, number>();
	const actualIncomeByDay = new Map<number, number>();
	for (const t of transactions) {
		if (t.isInternalTransfer || t.isCreditCardPayment) continue;
		// Only include checking account transactions for balance reconstruction
		if (t.accountType != null && t.accountType !== "checking") continue;
		const effectiveDate = t.authorizedDate ?? t.date;
		const txDate = new Date(effectiveDate + (effectiveDate.includes("T") ? "" : "T12:00:00"));
		if (txDate.getFullYear() === year && txDate.getMonth() + 1 === month) {
			const day = txDate.getDate();
			if (t.amount > 0) {
				actualSpendByDay.set(day, (actualSpendByDay.get(day) ?? 0) + Math.abs(t.amount));
			} else if (t.amount < 0 && !t.isRefundOrReversal) {
				actualIncomeByDay.set(day, (actualIncomeByDay.get(day) ?? 0) + Math.abs(t.amount));
			}
		}
	}

	// Reconstruct what the actual balance was on past days by working backwards from today
	// We know today's balance = checkingBalance (dollars). Convert to cents for consistency.
	const balanceCents = Math.round(checkingBalance * 100);

	// Build actual balance history: walk backwards from today
	const actualBalanceByDay = new Map<number, number>();
	let runningBalance = balanceCents;
	actualBalanceByDay.set(currentDay, runningBalance);
	for (let day = currentDay - 1; day >= 1; day--) {
		// Reverse: add back spending, subtract income that came in that day+1
		// Actually we need to undo the *next* day's transactions to get the prior day's balance
		const nextDay = day + 1;
		const spentNextDay = actualSpendByDay.get(nextDay) ?? 0;
		const incomeNextDay = actualIncomeByDay.get(nextDay) ?? 0;
		runningBalance = runningBalance + spentNextDay - incomeNextDay;
		actualBalanceByDay.set(day, runningBalance);
	}

	// Build forecast: start at today's balance, subtract future bills + daily budget drain
	let forecastBalance = balanceCents;

	// Rolling window: 10 days back, 20 days forward
	const windowStart = Math.max(1, currentDay - 10);
	const windowEnd = Math.min(daysInMonth, currentDay + 20);

	const points: ChartPoint[] = [];
	for (let day = windowStart; day <= windowEnd; day++) {
		let forecastValue: number;
		let actualValue: number | null;

		if (day <= currentDay) {
			// Historical: show actual balance
			actualValue = Math.round((actualBalanceByDay.get(day) ?? balanceCents) / 100);
			forecastValue = actualValue; // forecast matches actual for past
		} else {
			// Future: project from today's balance
			const billsToday = billsByDay.get(day) ?? 0;
			forecastBalance -= billsToday + dailyBudgetDrain;
			forecastValue = Math.round(forecastBalance / 100);
			actualValue = null;
		}

		points.push({
			day,
			label: `${monthName} ${formatOrdinal(day)}`,
			forecast: forecastValue,
			actual: day <= currentDay ? actualValue : null,
		});
	}

	return points;
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
	if (!active || !payload?.length) return null;
	const point = payload[0]?.payload as ChartPoint | undefined;
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
						<span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
						<span className="text-muted-foreground text-xs capitalize">
							{entry.name === "forecast" ? "projected" : "balance"}
						</span>
						<span className="text-foreground text-xs font-semibold tabular-nums ml-auto">
							{formatCurrency((entry.value ?? 0) * 100)}
						</span>
					</div>
				))}
		</div>
	);
}

export function SpendingMoneyChart(props: SpendingMoneyChartProps) {
	const { theme } = useTheme();
	const data = useMemo(() => buildChartData(props), [
		props.checkingBalance,
		props.bills,
		props.budgetItems,
		props.transactions,
		props.unpaidPayments,
		props.year,
		props.month,
	]);

	if (data.length === 0) return null;

	const primary = `hsl(${theme.colors.primary})`;
	const secondary = `hsl(${theme.colors.secondary})`;
	const today = new Date();
	const isCurrentMonth = today.getFullYear() === props.year && today.getMonth() + 1 === props.month;
	const currentDay = today.getDate();
	const hasProjection = data.some((d) => d.actual === null);
	const tickDays = data
		.filter((_, i) => i === 0 || i === data.length - 1 || (i + 1) % 5 === 0)
		.map((p) => p.day);

	return (
		<div>
			<div className="h-52 md:h-64">
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
						<defs>
							<linearGradient id="smForecastFill" x1="0" y1="0" x2="0" y2="1">
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
								return abs >= 1000 ? `${prefix}$${(abs / 1000).toFixed(1)}k` : `${prefix}$${abs}`;
							}}
							tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
							tickLine={false}
							axisLine={false}
							width={44}
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
						{/* Actual balance (past) */}
						<Line
							type="monotone"
							dataKey="actual"
							name="actual"
							stroke={primary}
							strokeWidth={2.5}
							dot={false}
							connectNulls
						/>
						{/* Forecast (future projection) */}
						{hasProjection && (
							<Area
								type="monotone"
								dataKey="forecast"
								name="forecast"
								stroke={secondary}
								strokeWidth={2}
								strokeDasharray="6 3"
								fill="url(#smForecastFill)"
								dot={false}
								connectNulls
							/>
						)}
					</ComposedChart>
				</ResponsiveContainer>
			</div>
			<div className="flex items-center justify-center gap-5 mt-3 text-xs text-muted-foreground">
				<span className="flex items-center gap-1.5">
					<span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: primary, height: 2.5 }} />
					Balance
				</span>
				{hasProjection && (
					<span className="flex items-center gap-1.5">
						<span className="w-3 h-0.5 border-t-2 border-dashed" style={{ borderColor: secondary }} />
						Projected
					</span>
				)}
			</div>
		</div>
	);
}
