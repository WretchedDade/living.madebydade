import { useSpendingMoney } from "~/hooks/use-spending-money";
import { Skeleton } from "~/components/ui/Skeleton";

const formatMoney = (n: number) =>
	n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export function SpendingMoneyBreakdown() {
	const {
		totalCheckingAmount,
		totalUnpaidBillsAmount,
		spendingMoney,
		freeSpending,
		budgetBreakdown,
		daysUntilPaycheck,
		nextPaycheckDate,
		isLoading,
	} = useSpendingMoney();

	if (isLoading) {
		return (
			<div className="space-y-3">
				<Skeleton className="w-56 h-5" />
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className="w-full h-7" />
				))}
			</div>
		);
	}

	const paycheckLabel = nextPaycheckDate
		? new Date(nextPaycheckDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
		: "—";

	const hasBudgetItems = budgetBreakdown.length > 0;
	const finalAmount = hasBudgetItems ? freeSpending : spendingMoney;
	const finalColor = finalAmount < 0 ? "text-destructive" : finalAmount < 100 ? "text-warning" : "text-primary";

	// Build running totals for the waterfall
	let runningTotal = spendingMoney;
	const waterfallSteps = budgetBreakdown.map(item => {
		runningTotal -= item.proratedAmount;
		return { ...item, runningTotal };
	});

	return (
		<div>
			<div className="flex items-baseline justify-between mb-4">
				<h2 className="text-sm font-semibold text-foreground">Spending Money</h2>
				<span className="text-xs text-muted-foreground">
					{daysUntilPaycheck} days until payday ({paycheckLabel})
				</span>
			</div>

			<div className="space-y-0">
				{/* Checking Balance */}
				<WaterfallRow
					label="Checking Balance"
					amount={totalCheckingAmount}
					amountColor="text-success"
				/>

				{/* Bills Due */}
				{totalUnpaidBillsAmount > 0 && (
					<WaterfallRow
						label="Bills Due"
						amount={-totalUnpaidBillsAmount}
						amountColor="text-destructive"
					/>
				)}

				<Divider />

				{hasBudgetItems ? (
					<>
						{/* After Bills subtotal */}
						<WaterfallRow
							label="After Bills"
							amount={spendingMoney}
							bold
						/>

						<div className="mt-1" />

						{/* Budget items with running total */}
						{waterfallSteps.map(step => {
							const runningColor =
								step.runningTotal < 0 ? "text-destructive"
									: step.runningTotal < 100 ? "text-warning"
										: "text-foreground";

							return (
								<div key={step.name} className="flex items-center justify-between py-1.5">
									<div className="flex items-center gap-2">
										<span className="text-sm">{step.icon}</span>
										<span className="text-sm text-muted-foreground">{step.name}</span>
									</div>
									<div className="flex items-center gap-4">
										<span className="text-xs tabular-nums text-muted-foreground">
											−{formatMoney(step.proratedAmount)}
										</span>
										<span className={`text-sm tabular-nums ${runningColor} w-24 text-right`}>
											{formatMoney(step.runningTotal)}
										</span>
									</div>
								</div>
							);
						})}

						<Divider />

						{/* Free Spending */}
						<WaterfallRow
							label="Free Spending"
							amount={freeSpending}
							amountColor={finalColor}
							bold
							large
						/>
					</>
				) : (
					<WaterfallRow
						label="Spending Money"
						amount={spendingMoney}
						amountColor={finalColor}
						bold
						large
					/>
				)}
			</div>
		</div>
	);
}

function WaterfallRow({
	label,
	amount,
	amountColor,
	bold,
	large,
}: {
	label: string;
	amount: number;
	amountColor?: string;
	bold?: boolean;
	large?: boolean;
}) {
	const isNegative = amount < 0;
	const formatted = formatMoney(Math.abs(amount));
	const sign = isNegative ? "−\u2009" : "";

	return (
		<div className="flex items-center justify-between py-1.5">
			<span className={`text-sm ${bold ? "font-semibold text-foreground" : "text-foreground"}`}>
				{label}
			</span>
			<span className={`${large ? "text-lg font-bold" : "text-sm"} ${bold && !large ? "font-semibold" : ""} tabular-nums ${amountColor ?? "text-foreground"}`}>
				{sign}{formatted}
			</span>
		</div>
	);
}

function Divider() {
	return <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-2" />;
}
