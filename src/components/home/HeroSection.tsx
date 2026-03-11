import { useSpendingMoney } from "~/hooks/use-spending-money";
import { SpendingChart } from "./SpendingChart";
import { WalletIcon, TrendingUpIcon, CalendarIcon, CreditCardIcon } from "lucide-react";
import { Skeleton } from "~/components/ui/Skeleton";
import type { Doc } from "convex/_generated/dataModel";

interface HeroSectionProps {
	monthlySummaries: Doc<"cashCreditSummaries">[];
}

export function HeroSection({ monthlySummaries }: HeroSectionProps) {
	const {
		spendingMoney,
		totalCheckingAmount,
		totalUnpaidBillsAmount,
		nextPaycheckDate,
		isLoading,
	} = useSpendingMoney();

	const spendingState = spendingMoney < 0 ? "negative" : spendingMoney < 100 ? "low" : "ok";
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
		<div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/6 min-h-[40vh]">
			{/* Decorative blurs */}
			<div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
			<div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

			{/* Chart as background — fills entire hero, sits behind content */}
			<div className="absolute inset-0 opacity-70 pointer-events-none">
				<SpendingChart summaries={monthlySummaries} background />
			</div>

			{/* Chart legend — pinned bottom right */}
			<div className="absolute bottom-3 right-6 md:right-10 lg:right-12 z-10 flex items-center gap-3 text-[11px] text-muted-foreground opacity-60">
				<span className="flex items-center gap-1.5">
					<span className="w-2 h-2 rounded-full bg-primary" />
					Spending
				</span>
				<span className="flex items-center gap-1.5">
					<span className="w-2 h-2 rounded-full bg-secondary" />
					Income
				</span>
			</div>

			{/* Foreground content */}
			<div className="relative z-10 px-6 md:px-10 lg:px-12 py-12 md:py-16">
				{isLoading ? (
					<div>
						<Skeleton className="w-40 h-5 mb-3" />
						<Skeleton className="w-56 h-14 mb-6" />
						<div className="flex gap-3">
							<Skeleton className="w-32 h-16 rounded-lg" />
							<Skeleton className="w-32 h-16 rounded-lg" />
							<Skeleton className="w-32 h-16 rounded-lg" />
						</div>
					</div>
				) : (
					<>
						<div className="flex items-center gap-2 mb-1">
							<WalletIcon className={`w-5 h-5 ${valueColor}`} />
							<span className="text-sm font-semibold text-muted-foreground">Spending Money</span>
						</div>
						<div className={`text-5xl sm:text-6xl font-extrabold tabular-nums ${valueColor} tracking-tight leading-none mb-8`}>
							{formatMoney(spendingMoney)}
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<StatPill
								icon={<TrendingUpIcon className="w-3.5 h-3.5" />}
								label="Checking"
								value={formatMoney(totalCheckingAmount)}
								color="text-success"
							/>
							<StatPill
								icon={<CreditCardIcon className="w-3.5 h-3.5" />}
								label="Bills Due"
								value={totalUnpaidBillsAmount === 0 ? "$0" : formatMoney(totalUnpaidBillsAmount)}
								color={totalUnpaidBillsAmount === 0 ? "text-success" : "text-destructive"}
							/>
							<StatPill
								icon={<CalendarIcon className="w-3.5 h-3.5" />}
								label="Payday"
								value={paycheckLabel}
								color="text-secondary"
							/>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

function StatPill({
	icon,
	label,
	value,
	color,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	color: string;
}) {
	return (
		<div className="flex items-center gap-2.5 bg-background/50 backdrop-blur-md rounded-lg px-3.5 py-2 shadow-sm">
			<span className={`${color} opacity-70`}>{icon}</span>
			<div>
				<div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none">{label}</div>
				<div className={`text-sm font-bold tabular-nums ${color} leading-snug`}>{value}</div>
			</div>
		</div>
	);
}
