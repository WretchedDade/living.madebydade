import { useState } from "react";
import { useSpendingMoney, type PayPeriod, type BudgetBreakdownItem } from "~/hooks/use-spending-money";
import { Skeleton } from "~/components/ui/Skeleton";
import { WalletIcon, CalendarIcon, CheckIcon, PlusIcon, XIcon } from "lucide-react";

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

interface Adjustment {
	id: string;
	description: string;
	/** Dollar amount — positive adds to spending money */
	amount: number;
}

export function SpendingMoneyBreakdown() {
	const {
		totalCheckingAmount,
		freeSpending,
		periods,
		totalDays,
		isLoading,
	} = useSpendingMoney();

	const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
	const [showAddForm, setShowAddForm] = useState(false);

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

	const netAdjustment = adjustments.reduce((sum, a) => sum + a.amount, 0);
	const adjustedFreeSpending = freeSpending + netAdjustment;

	// Track which budget items have been checked off (by name, since ephemeral)
	const checkedBudgetItems = new Set(
		adjustments
			.filter(a => a.id.startsWith("budget:"))
			.map(a => a.id),
	);

	const toggleBudgetItem = (item: BudgetBreakdownItem, periodIndex: number) => {
		const key = `budget:${periodIndex}:${item.name}`;
		if (checkedBudgetItems.has(key)) {
			setAdjustments(prev => prev.filter(a => a.id !== key));
		} else {
			setAdjustments(prev => [
				...prev,
				{ id: key, description: `${item.name} (done)`, amount: item.proratedAmount },
			]);
		}
	};

	const addAdjustment = (description: string, amount: number) => {
		setAdjustments(prev => [
			...prev,
			{ id: `custom:${Date.now()}`, description, amount },
		]);
		setShowAddForm(false);
	};

	const removeAdjustment = (id: string) => {
		setAdjustments(prev => prev.filter(a => a.id !== id));
	};

	const customAdjustments = adjustments.filter(a => a.id.startsWith("custom:"));

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
					periodIndex={0}
					startingBalance={totalCheckingAmount}
					checkedBudgetItems={checkedBudgetItems}
					onToggleBudget={toggleBudgetItem}
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
					periodIndex={1}
					startingBalance={period1.endBalance + period2.paycheckAmount}
					checkedBudgetItems={checkedBudgetItems}
					onToggleBudget={toggleBudgetItem}
				/>

				{/* Custom Adjustments */}
				{(customAdjustments.length > 0 || showAddForm) && (
					<section className="rounded-xl bg-muted/30 px-4 py-3">
						<h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
							Adjustments
						</h3>
						<div className="space-y-1.5">
							{customAdjustments.map(adj => (
								<div key={adj.id} className="flex items-center justify-between py-1 group">
									<span className="text-sm text-muted-foreground">{adj.description}</span>
									<div className="flex items-center gap-2">
										<span className={`text-sm tabular-nums font-medium ${adj.amount >= 0 ? "text-success" : "text-destructive"}`}>
											{adj.amount >= 0 ? "+" : "−"}{formatMoney(Math.abs(adj.amount))}
										</span>
										<button
											onClick={() => removeAdjustment(adj.id)}
											className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<XIcon className="w-3 h-3" />
										</button>
									</div>
								</div>
							))}
						</div>

						{showAddForm && (
							<AdjustmentForm
								onSubmit={addAdjustment}
								onCancel={() => setShowAddForm(false)}
							/>
						)}
					</section>
				)}

				{/* Add adjustment button */}
				{!showAddForm && (
					<button
						onClick={() => setShowAddForm(true)}
						className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-sm"
					>
						<PlusIcon className="w-3.5 h-3.5" />
						Adjustment
					</button>
				)}

				{/* Free Spending Result */}
				<section className={`rounded-xl ${amountBg(adjustedFreeSpending)} px-4 py-3`}>
					<div className="flex items-center justify-between">
						<span className="text-sm font-semibold text-foreground">Free Spending</span>
						<span className={`text-xl font-bold tabular-nums ${amountColor(adjustedFreeSpending)}`}>
							{formatMoney(adjustedFreeSpending)}
						</span>
					</div>
				</section>
			</div>
		</div>
	);
}

function PeriodSection({
	period,
	periodIndex,
	startingBalance,
	checkedBudgetItems,
	onToggleBudget,
	isFirst,
}: {
	period: PayPeriod;
	periodIndex: number;
	startingBalance: number;
	checkedBudgetItems: Set<string>;
	onToggleBudget: (item: BudgetBreakdownItem, periodIndex: number) => void;
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
						{period.budgetItems.map((item, i) => {
							const key = `budget:${periodIndex}:${item.name}`;
							const isDone = checkedBudgetItems.has(key);

							return (
								<div key={`budget-${item.name}-${i}`} className="flex items-center justify-between group">
									<div className="flex items-center gap-2">
										<button
											onClick={() => onToggleBudget(item, periodIndex)}
											className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
												isDone
													? "bg-success border-success text-white"
													: "border-border hover:border-primary/60"
											}`}
										>
											{isDone && <CheckIcon className="w-3 h-3" />}
										</button>
										<span className="text-sm">{item.icon}</span>
										<span className={`text-sm ${isDone ? "line-through text-muted-foreground/50" : "text-muted-foreground"}`}>
											{item.name}
										</span>
									</div>
									<span className={`text-sm tabular-nums font-medium ${isDone ? "line-through text-muted-foreground/50" : "text-muted-foreground"}`}>
										−{formatMoney(item.proratedAmount)}
									</span>
								</div>
							);
						})}
					</>
				)}

				<div className="h-px bg-border/60 my-1" />

				<div className="flex items-center justify-between">
					<span className="text-sm font-semibold text-foreground">Remaining</span>
					<span className={`text-sm tabular-nums font-semibold ${amountColor(period.endBalance)}`}>
						{formatMoney(period.endBalance)}
					</span>
				</div>
			</div>
		</section>
	);
}

function AdjustmentForm({
	onSubmit,
	onCancel,
}: {
	onSubmit: (description: string, amount: number) => void;
	onCancel: () => void;
}) {
	const [description, setDescription] = useState("");
	const [amountStr, setAmountStr] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const parsed = parseFloat(amountStr);
		if (!description.trim() || isNaN(parsed)) return;
		onSubmit(description.trim(), parsed);
	};

	return (
		<form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
			<input
				type="text"
				placeholder="Description"
				value={description}
				onChange={e => setDescription(e.target.value)}
				className="flex-1 text-sm bg-background/60 rounded-lg border border-border px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
				autoFocus
			/>
			<input
				type="number"
				placeholder="±$"
				value={amountStr}
				onChange={e => setAmountStr(e.target.value)}
				step="0.01"
				className="w-20 text-sm bg-background/60 rounded-lg border border-border px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 tabular-nums text-right"
			/>
			<button type="submit" className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
				<CheckIcon className="w-3.5 h-3.5" />
			</button>
			<button type="button" onClick={onCancel} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
				<XIcon className="w-3.5 h-3.5" />
			</button>
		</form>
	);
}
