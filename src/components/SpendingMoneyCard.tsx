import { useSpendingMoney } from "~/hooks/use-spending-money";
import { Skeleton } from "~/components/ui/Skeleton";
import { WalletIcon } from "lucide-react";

/**
 * Hero card showing available spending money.
 * Color-coded: red when negative, amber when low (<$100), otherwise uses primary.
 */
export function SpendingMoneyCard() {
	const {
		spendingMoney,
		totalCheckingAmount,
		totalUnpaidBillsAmount,
		nextPaycheckDate,
		isLoading,
	} = useSpendingMoney();

	if (isLoading) {
		return (
			<div className="bg-card rounded-xl card-border border-border p-6">
				<Skeleton className="w-32 h-4 mb-3" />
				<Skeleton className="w-48 h-10 mb-4" />
				<div className="space-y-2">
					<Skeleton className="w-full h-3" />
					<Skeleton className="w-3/4 h-3" />
				</div>
			</div>
		);
	}

	const spendingState = spendingMoney < 0 ? "negative" : spendingMoney < 100 ? "low" : "ok";

	const gradientClass =
		spendingState === "negative"
			? "from-destructive/15 to-destructive/5 card-border border-destructive/30"
			: spendingState === "low"
				? "from-warning/15 to-warning/5 card-border border-warning/30"
				: "from-primary/15 via-primary/8 to-accent/10 card-border border-primary/25";

	const valueColor =
		spendingState === "negative"
			? "text-destructive"
			: spendingState === "low"
				? "text-warning"
				: "text-primary";

	const formatMoney = (n: number) =>
		n.toLocaleString("en-US", { style: "currency", currency: "USD" });

	const paycheckLabel = nextPaycheckDate
		? new Date(nextPaycheckDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
		: "—";

	return (
		<div className={`rounded-xl bg-gradient-to-br ${gradientClass} p-5 sm:p-6`}>
			<div className="flex items-center gap-2 mb-2">
				<div className={`p-1.5 rounded-lg bg-background/50 ${valueColor}`}>
					<WalletIcon className="w-4 h-4" />
				</div>
				<span className="text-sm font-semibold text-muted-foreground">Spending Money</span>
			</div>
			<div className={`text-4xl sm:text-5xl font-extrabold tabular-nums ${valueColor} mb-5 tracking-tight`}>
				{formatMoney(spendingMoney)}
			</div>
			<div className="grid grid-cols-3 gap-4 text-sm">
				<div className="bg-background/40 rounded-lg px-3 py-2">
					<div className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">Checking</div>
					<div className="font-bold text-success tabular-nums mt-0.5">{formatMoney(totalCheckingAmount)}</div>
				</div>
				<div className="bg-background/40 rounded-lg px-3 py-2">
					<div className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">Bills Due</div>
					<div className="font-bold text-destructive tabular-nums mt-0.5">-{formatMoney(totalUnpaidBillsAmount)}</div>
				</div>
				<div className="bg-background/40 rounded-lg px-3 py-2">
					<div className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">Payday</div>
					<div className="font-bold text-secondary mt-0.5">{paycheckLabel}</div>
				</div>
			</div>
		</div>
	);
}
