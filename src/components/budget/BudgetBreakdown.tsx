import { useState } from "react";
import { PencilIcon, TrashIcon, PlusIcon, DollarSignIcon } from "lucide-react";
import type { Doc } from "convex/_generated/dataModel";
import { formatCurrency } from "~/utils/formatters";
import { calcMonthlyItemCost, frequencyLabel, calcMonthlyIncomeExact } from "~/lib/budget";
import { formatCentsAsDollars } from "~/lib/currency";

interface BudgetBreakdownProps {
	bills: Doc<"bills">[];
	budgetItems: Doc<"budgetItems">[];
	monthlyIncome: number;
	hasIncome: boolean;
	paySchedule: string;
	payAmountCents: number;
	onEditItem: (item: Doc<"budgetItems">) => void;
	onDeleteItem: (id: Doc<"budgetItems">["_id"]) => void;
	onAddItem: () => void;
	onSetupIncome: () => void;
}

export function BudgetBreakdown({
	bills,
	budgetItems,
	monthlyIncome,
	hasIncome,
	paySchedule,
	payAmountCents,
	onEditItem,
	onDeleteItem,
	onAddItem,
	onSetupIncome,
}: BudgetBreakdownProps) {
	const totalBills = bills.reduce((sum, b) => sum + (b.amount ?? 0), 0);
	const totalBudgetMonthly = budgetItems.reduce(
		(sum, item) => sum + calcMonthlyItemCost(item),
		0,
	);
	const totalCommitted = totalBills + totalBudgetMonthly;
	const room = monthlyIncome - totalCommitted;

	return (
		<div className="px-5 md:px-10 lg:px-12 py-6 space-y-6">
			{/* Income section */}
			<section>
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-sm font-semibold text-foreground">Monthly Income</h2>
					<button
						onClick={onSetupIncome}
						className="text-xs text-primary hover:text-primary/80 transition-colors"
					>
						{hasIncome ? "Edit" : "Set Up"}
					</button>
				</div>
				{hasIncome ? (
					<div className="flex items-center justify-between py-2">
						<div className="flex items-center gap-2.5">
							<span className="text-lg">💰</span>
							<div>
								<div className="text-sm text-foreground">Paycheck</div>
								<div className="text-[11px] text-muted-foreground">
									{formatCurrency(payAmountCents)} × {paySchedule}
								</div>
							</div>
						</div>
						<span className="text-sm font-semibold text-success tabular-nums">
							+{formatCurrency(monthlyIncome)}/mo
						</span>
					</div>
				) : (
					<button
						onClick={onSetupIncome}
						className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
					>
						<DollarSignIcon className="w-4 h-4" />
						<span className="text-sm">Set your paycheck amount</span>
					</button>
				)}
			</section>

			{/* Divider */}
			<div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

			{/* Bills section */}
			<section>
				<BillsSection bills={bills} totalBills={totalBills} />
			</section>

			{/* Divider */}
			<div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

			{/* Budget items section */}
			<section>
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-sm font-semibold text-foreground">
						Budget Items
						<span className="text-muted-foreground font-normal ml-1.5">
							{formatCurrency(totalBudgetMonthly)}/mo
						</span>
					</h2>
				</div>
				{budgetItems.length > 0 ? (
					<div className="space-y-1">
						{budgetItems.map((item) => (
							<BudgetItemRow
								key={item._id}
								item={item}
								onEdit={() => onEditItem(item)}
								onDelete={() => onDeleteItem(item._id)}
							/>
						))}
					</div>
				) : (
					<p className="text-sm text-muted-foreground py-2">
						No budget items yet. Add recurring expenses like groceries, gas, dining out.
					</p>
				)}
				<button
					onClick={onAddItem}
					className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
				>
					<PlusIcon className="w-4 h-4" />
					<span className="text-sm">Add budget item</span>
				</button>
			</section>

			{/* Divider */}
			<div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

			{/* Bottom line */}
			<section className="flex items-center justify-between py-2">
				<div>
					<div className="text-sm font-semibold text-foreground">
						{hasIncome ? "Room to Breathe" : "Total Committed"}
					</div>
					<div className="text-[11px] text-muted-foreground">
						{hasIncome
							? `${formatCurrency(monthlyIncome)} income − ${formatCurrency(totalCommitted)} committed`
							: `${formatCurrency(totalBills)} bills + ${formatCurrency(totalBudgetMonthly)} budget items`}
					</div>
				</div>
				<span
					className={`text-lg font-bold tabular-nums ${
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
					<span className="text-xs font-normal text-muted-foreground">/mo</span>
				</span>
			</section>
		</div>
	);
}

function BillsSection({ bills, totalBills }: { bills: Doc<"bills">[]; totalBills: number }) {
	const [expanded, setExpanded] = useState(false);
	const sorted = [...bills].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
	const preview = sorted.slice(0, 3);
	const hasMore = sorted.length > 3;

	return (
		<>
			<div className="flex items-center justify-between mb-3">
				<h2 className="text-sm font-semibold text-foreground">
					Bills
					<span className="text-muted-foreground font-normal ml-1.5">
						{bills.length} · {formatCurrency(totalBills)}/mo
					</span>
				</h2>
				{hasMore && (
					<button
						onClick={() => setExpanded(!expanded)}
						className="text-xs text-primary hover:text-primary/80 transition-colors"
					>
						{expanded ? "Show less" : `Show all ${sorted.length}`}
					</button>
				)}
			</div>
			<div className="space-y-1">
				{(expanded ? sorted : preview).map((bill) => (
					<div
						key={bill._id}
						className="flex items-center justify-between py-2 px-1"
					>
						<div className="flex items-center gap-2.5">
							<span className="text-lg">📋</span>
							<span className="text-sm text-foreground">{bill.name}</span>
						</div>
						<span className="text-sm text-foreground tabular-nums">
							{formatCurrency(bill.amount ?? 0)}/mo
						</span>
					</div>
				))}
				{!expanded && hasMore && (
					<div className="text-xs text-muted-foreground px-1 py-1">
						+{sorted.length - 3} more bills
					</div>
				)}
			</div>
		</>
	);
}

function BudgetItemRow({
	item,
	onEdit,
	onDelete,
}: {
	item: Doc<"budgetItems">;
	onEdit: () => void;
	onDelete: () => void;
}) {
	const monthlyCost = calcMonthlyItemCost(item);
	return (
		<div className="flex items-center justify-between py-2 px-1 group">
			<div className="flex items-center gap-2.5">
				<span className="text-lg">{item.icon ?? "📦"}</span>
				<div>
					<div className="text-sm text-foreground">{item.name}</div>
					<div className="text-[11px] text-muted-foreground">
						{formatCurrency(item.amount)}{frequencyLabel(item.frequency)}
						{item.frequency !== "monthly" && (
							<span className="ml-1">· {formatCurrency(monthlyCost)}/mo</span>
						)}
					</div>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<span className="text-sm text-foreground tabular-nums">
					{formatCurrency(monthlyCost)}/mo
				</span>
				<button
					onClick={onEdit}
					className="p-1.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
				>
					<PencilIcon className="w-3.5 h-3.5" />
				</button>
				<button
					onClick={onDelete}
					className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
				>
					<TrashIcon className="w-3.5 h-3.5" />
				</button>
			</div>
		</div>
	);
}
