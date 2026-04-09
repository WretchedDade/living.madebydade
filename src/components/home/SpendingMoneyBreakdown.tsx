import { useSpendingMoney } from "~/hooks/use-spending-money";
import { Skeleton } from "~/components/ui/Skeleton";
import { WalletIcon, ShoppingCartIcon } from "lucide-react";

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
	const finalBg = finalAmount < 0 ? "bg-destructive/10" : finalAmount < 100 ? "bg-warning/10" : "bg-primary/10";

	// Build running totals for the waterfall
	let runningTotal = spendingMoney;
	const waterfallSteps = budgetBreakdown.map(item => {
		runningTotal -= item.proratedAmount;
		return { ...item, runningTotal };
	});

	return (
		<div>
			<div className="flex items-baseline justify-between mb-5">
				<h2 className="text-sm font-semibold text-foreground">Spending Money</h2>
				<span className="text-xs text-muted-foreground">
					{daysUntilPaycheck} days until payday ({paycheckLabel})
				</span>
			</div>

			<div className="space-y-4">
				{/* Bills Section */}
				<section className="rounded-xl bg-muted/30 px-4 py-3">
					<h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
						<WalletIcon className="w-3.5 h-3.5" />
						Bills
					</h3>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm text-foreground">Checking Balance</span>
							<span className="text-sm tabular-nums text-success font-medium">{formatMoney(totalCheckingAmount)}</span>
						</div>

						{totalUnpaidBillsAmount > 0 && (
							<div className="flex items-center justify-between">
								<span className="text-sm text-foreground">Bills Due</span>
								<span className="text-sm tabular-nums text-destructive font-medium">−{formatMoney(totalUnpaidBillsAmount)}</span>
							</div>
						)}

						<div className="h-px bg-border/60 my-1" />

						<div className="flex items-center justify-between">
							<span className="text-sm font-semibold text-foreground">After Bills</span>
							<span className="text-sm tabular-nums font-semibold text-foreground">{formatMoney(spendingMoney)}</span>
						</div>
					</div>
				</section>

				{/* Budget Items Section */}
				{hasBudgetItems && (
					<section className="rounded-xl bg-muted/30 px-4 py-3">
						<h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
							<ShoppingCartIcon className="w-3.5 h-3.5" />
							Budget Items
						</h3>

						<div className="space-y-1.5">
							{waterfallSteps.map(step => {
								const runningColor =
									step.runningTotal < 0 ? "text-destructive"
										: step.runningTotal < 100 ? "text-warning"
											: "text-foreground";

								return (
									<div key={step.name} className="flex items-center justify-between py-1">
										<div className="flex items-center gap-2">
											<span className="text-sm">{step.icon}</span>
											<span className="text-sm text-muted-foreground">{step.name}</span>
										</div>
										<div className="flex items-center gap-4">
											<span className="text-xs tabular-nums text-muted-foreground/70">
												−{formatMoney(step.proratedAmount)}
											</span>
											<span className={`text-sm tabular-nums font-medium ${runningColor} w-24 text-right`}>
												{formatMoney(step.runningTotal)}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					</section>
				)}

				{/* Free Spending Result */}
				<section className={`rounded-xl ${finalBg} px-4 py-3`}>
					<div className="flex items-center justify-between">
						<span className="text-sm font-semibold text-foreground">
							{hasBudgetItems ? "Free Spending" : "Spending Money"}
						</span>
						<span className={`text-xl font-bold tabular-nums ${finalColor}`}>
							{formatMoney(finalAmount)}
						</span>
					</div>
				</section>
			</div>
		</div>
	);
}
