import { DollarSignIcon, ReceiptTextIcon } from "lucide-react";
import { formatCurrency } from "~/utils/formatters";

interface BudgetHeroProps {
	monthlyIncome: number; // cents
	totalBills: number; // cents
	totalBudgetItems: number; // cents
	hasIncome: boolean;
}

export function BudgetHero({
	monthlyIncome,
	totalBills,
	totalBudgetItems,
	hasIncome,
}: BudgetHeroProps) {
	const totalCommitted = totalBills + totalBudgetItems;
	const room = monthlyIncome - totalCommitted;

	return (
		<div className="relative px-5 md:px-10 lg:px-12 pt-16 md:pt-24 pb-8 md:pb-10 bg-gradient-to-br from-primary/8 via-card to-secondary/6 overflow-hidden">
			<div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
			<div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-secondary/8 blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

			<div className="relative z-10">
				<div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">
					{hasIncome ? "Room to Breathe" : "Total Committed"}
				</div>
				<div className="flex items-baseline gap-3 mb-4">
					<span
						className={`text-3xl sm:text-5xl font-extrabold tabular-nums tracking-tight leading-none ${
							hasIncome
								? room >= 0
									? "text-success"
									: "text-destructive"
								: "text-foreground"
						}`}
					>
						{hasIncome
							? `${room >= 0 ? "+" : ""}${formatCurrency(room)}`
							: formatCurrency(totalCommitted)}
					</span>
					{hasIncome && (
						<span className="text-muted-foreground text-xs font-medium">/mo</span>
					)}
				</div>

				<div className="flex flex-wrap gap-2.5">
					{hasIncome && (
						<StatPill
							icon={<DollarSignIcon className="w-3.5 h-3.5" />}
							label="Income"
							value={`${formatCurrency(monthlyIncome)}/mo`}
							colorClass="text-secondary"
						/>
					)}
					<StatPill
						icon={<ReceiptTextIcon className="w-3.5 h-3.5" />}
						label="Committed"
						value={`${formatCurrency(totalCommitted)}/mo`}
						colorClass="text-primary"
					/>
				</div>
			</div>
		</div>
	);
}

function StatPill({
	icon,
	label,
	value,
	colorClass,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	colorClass: string;
}) {
	return (
		<div className="flex items-center gap-2 bg-background/50 backdrop-blur-md rounded-lg px-3 py-2 shadow-sm">
			<span className={`${colorClass} opacity-70`}>{icon}</span>
			<div>
				<div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none">
					{label}
				</div>
				<div className={`text-sm font-bold tabular-nums ${colorClass} leading-snug`}>
					{value}
				</div>
			</div>
		</div>
	);
}
