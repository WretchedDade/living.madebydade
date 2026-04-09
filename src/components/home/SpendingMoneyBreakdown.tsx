import { useSpendingMoney, type PayPeriod } from "~/hooks/use-spending-money";
import { Skeleton } from "~/components/ui/Skeleton";
import { WalletIcon, CalendarIcon } from "lucide-react";

const formatMoney = (n: number) =>
	n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function amountColor(n: number) {
	if (n < 0) return "text-destructive";
	if (n < 100) return "text-warning";
	return "text-primary";
}

function amountBg(n: number) {
	if (n < 0) return "bg-destructive/10";
	if (n < 100) return "bg-warning/10";
	return "bg-primary/10";
}

export function SpendingMoneyBreakdown() {
	const {
		totalCheckingAmount,
		freeSpending,
		periods,
		totalDays,
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

	const [period1, period2] = periods;

	return (
		<div>
			<div className="flex items-baseline justify-between mb-5">
				<h2 className="text-sm font-semibold text-foreground">Spending Money</h2>
				<span className="text-xs text-muted-foreground">{totalDays}-day outlook</span>
			</div>

			<div className="space-y-4">
				{/* Period 1 */}
				<PeriodSection
					period={period1}
					startingBalance={totalCheckingAmount}
					isFirst
				/>

				{/* Paycheck */}
				{period2.paycheckAmount > 0 && (
					<section className="rounded-xl bg-success/10 px-4 py-2.5">
						<div className="flex items-center justify-between">
							<span className="text-sm text-foreground flex items-center gap-2">
								<CalendarIcon className="w-3.5 h-3.5 text-success" />
								Paycheck
							</span>
							<span className="text-sm tabular-nums text-success font-semibold">+{formatMoney(period2.paycheckAmount)}</span>
						</div>
					</section>
				)}

				{/* Period 2 */}
				<PeriodSection
					period={period2}
					startingBalance={period1.endBalance + period2.paycheckAmount}
				/>

				{/* Free Spending Result */}
				<section className={`rounded-xl ${amountBg(freeSpending)} px-4 py-3`}>
					<div className="flex items-center justify-between">
						<span className="text-sm font-semibold text-foreground">Free Spending</span>
						<span className={`text-xl font-bold tabular-nums ${amountColor(freeSpending)}`}>
							{formatMoney(freeSpending)}
						</span>
					</div>
				</section>
			</div>
		</div>
	);
}

function PeriodSection({
	period,
	startingBalance,
	isFirst,
}: {
	period: PayPeriod;
	startingBalance: number;
	isFirst?: boolean;
}) {
	const hasBills = period.bills.length > 0;
	const hasBudget = period.budgetItems.length > 0;

	return (
		<section className="rounded-xl bg-muted/30 px-4 py-3">
			<h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
				<WalletIcon className="w-3.5 h-3.5" />
				{period.label}
			</h3>

			<div className="space-y-2">
				{isFirst && (
					<div className="flex items-center justify-between">
						<span className="text-sm text-foreground">Checking Balance</span>
						<span className="text-sm tabular-nums text-success font-medium">{formatMoney(startingBalance)}</span>
					</div>
				)}

				{/* Bills */}
				{hasBills ? (
					period.bills.map((bill, i) => (
						<div key={`bill-${bill.name}-${i}`} className="flex items-center justify-between">
							<span className="text-sm text-muted-foreground">{bill.name}</span>
							<span className="text-sm tabular-nums text-destructive font-medium">−{formatMoney(bill.amount)}</span>
						</div>
					))
				) : (
					<div className="text-sm text-muted-foreground italic">No bills due</div>
				)}

				{/* Budget Items */}
				{hasBudget && (
					<>
						{(hasBills || isFirst) && <div className="h-px bg-border/40 my-1" />}
						{period.budgetItems.map((item, i) => (
							<div key={`budget-${item.name}-${i}`} className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className="text-sm">{item.icon}</span>
									<span className="text-sm text-muted-foreground">{item.name}</span>
								</div>
								<span className="text-sm tabular-nums text-muted-foreground font-medium">−{formatMoney(item.proratedAmount)}</span>
							</div>
						))}
					</>
				)}

				<div className="h-px bg-border/60 my-1" />

				<div className="flex items-center justify-between">
					<span className="text-sm font-semibold text-foreground">
						{isFirst ? "Remaining" : "Remaining"}
					</span>
					<span className={`text-sm tabular-nums font-semibold ${amountColor(period.endBalance)}`}>
						{formatMoney(period.endBalance)}
					</span>
				</div>
			</div>
		</section>
	);
}
