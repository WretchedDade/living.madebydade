import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { useState, useEffect, useMemo, useCallback } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { BudgetHero } from "~/components/budget/BudgetHero";
import { BudgetBreakdown } from "~/components/budget/BudgetBreakdown";
import { BurndownChart } from "~/components/budget/BurndownChart";
import { BudgetItemForm, IncomeSetupForm } from "~/components/budget/BudgetItemForm";
import { Sheet } from "~/components/feedback/Sheet";
import { calcMonthlyIncomeExact, calcMonthlyItemCost } from "~/lib/budget";
import { ChevronLeftIcon, ChevronRightIcon, LoaderIcon } from "lucide-react";

type SheetMode =
	| { type: "closed" }
	| { type: "add-item" }
	| { type: "edit-item"; item: Doc<"budgetItems"> }
	| { type: "income" };

function BudgetPage() {
	const [sheet, setSheet] = useState<SheetMode>({ type: "closed" });
	const [monthOffset, setMonthOffset] = useState(0);
	const [isClient, setIsClient] = useState(false);
	useEffect(() => setIsClient(true), []);

	// Burndown month
	const { year: burndownYear, month: burndownMonth } = useMemo(() => {
		const d = new Date();
		d.setMonth(d.getMonth() + monthOffset);
		return { year: d.getFullYear(), month: d.getMonth() + 1 };
	}, [monthOffset]);

	const burndownMonthLabel = new Date(burndownYear, burndownMonth - 1).toLocaleDateString("en-US", {
		month: "long",
		year: "numeric",
	});
	const burndownStartDate = `${burndownYear}-${String(burndownMonth).padStart(2, "0")}-01`;
	const burndownEndDate = new Date(burndownYear, burndownMonth, 0).toISOString().slice(0, 10);

	// Data queries
	const { data: settings, isLoading: settingsLoading } = useQuery(
		convexQuery(api.userSettings.get, {}),
	);
	const { data: bills, isLoading: billsLoading } = useQuery(
		convexQuery(api.bills.list, {}),
	);
	const { data: budgetItems, isLoading: itemsLoading } = useQuery(
		convexQuery(api.budgetItems.list, {}),
	);
	const { data: burndownTxns } = useQuery(
		convexQuery(api.transactions.listByDateRange, {
			startDate: burndownStartDate,
			endDate: burndownEndDate,
			limit: 1000,
		}),
	);

	// Mutations
	const createItem = useMutation({ mutationFn: useConvexMutation(api.budgetItems.create) });
	const updateItem = useMutation({ mutationFn: useConvexMutation(api.budgetItems.update) });
	const removeItem = useMutation({ mutationFn: useConvexMutation(api.budgetItems.remove) });
	const setPayAmount = useMutation({ mutationFn: useConvexMutation(api.userSettings.setPayAmount) });

	const isLoading = settingsLoading || billsLoading || itemsLoading;

	// Computed values
	const paySchedule = settings?.paySchedule ?? "semimonthly";
	const payAmountCents = settings?.payAmount ?? 0;
	const hasIncome = payAmountCents > 0;
	const monthlyIncome = hasIncome ? calcMonthlyIncomeExact(payAmountCents, paySchedule) : 0;

	const billsList = bills ?? [];
	const itemsList = budgetItems ?? [];
	const totalBills = billsList.reduce((sum, b) => sum + (b.amount ?? 0), 0);
	const totalBudgetItems = itemsList.reduce((sum, item) => sum + calcMonthlyItemCost(item), 0);

	return (
		<AppLayout>
			<main className="flex-1 w-full min-h-0">
				{isLoading ? (
					<div className="flex items-center justify-center py-20 min-h-[60vh]">
						<LoaderIcon className="w-6 h-6 text-muted-foreground animate-spin" />
					</div>
				) : (
					<>
						<BudgetHero
							monthlyIncome={monthlyIncome}
							totalBills={totalBills}
							totalBudgetItems={totalBudgetItems}
							hasIncome={hasIncome}
						/>

						{/* Burndown chart with month navigation */}
						{isClient && hasIncome && (
							<div className="px-5 md:px-10 lg:px-12 py-6">
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-sm font-semibold text-foreground">Monthly Burndown</h2>
									<div className="flex items-center gap-1">
										<button
											onClick={() => setMonthOffset(monthOffset - 1)}
											className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
										>
											<ChevronLeftIcon className="w-4 h-4" />
										</button>
										<span className="text-xs text-muted-foreground font-medium min-w-[100px] text-center">
											{burndownMonthLabel}
										</span>
										<button
											onClick={() => setMonthOffset(monthOffset + 1)}
											disabled={monthOffset >= 0}
											className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
										>
											<ChevronRightIcon className="w-4 h-4" />
										</button>
									</div>
								</div>
								<BurndownChart
									payAmountCents={payAmountCents}
									paySchedule={paySchedule}
									payDays={settings?.payDays ?? [15, 0]}
									bills={billsList}
									budgetItems={itemsList}
									transactions={burndownTxns?.items ?? []}
									year={burndownYear}
									month={burndownMonth}
								/>
							</div>
						)}

						{/* Divider */}
						<div className="mx-5 md:mx-10 lg:mx-12">
							<div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
						</div>

						<BudgetBreakdown
							bills={billsList}
							budgetItems={itemsList}
							monthlyIncome={monthlyIncome}
							hasIncome={hasIncome}
							paySchedule={paySchedule}
							payAmountCents={payAmountCents}
							onAddItem={() => setSheet({ type: "add-item" })}
							onEditItem={(item) => setSheet({ type: "edit-item", item })}
							onDeleteItem={async (id) => {
								await removeItem.mutateAsync({ id });
							}}
							onSetupIncome={() => setSheet({ type: "income" })}
						/>
					</>
				)}

				{/* Add/Edit Budget Item sheet */}
				<Sheet
					open={sheet.type === "add-item" || sheet.type === "edit-item"}
					onOpenChange={(open) => !open && setSheet({ type: "closed" })}
					title={sheet.type === "edit-item" ? "Edit Budget Item" : "Add Budget Item"}
				>
					<BudgetItemForm
						initialValues={
							sheet.type === "edit-item"
								? {
										name: sheet.item.name,
										amount: sheet.item.amount,
										frequency: sheet.item.frequency,
										icon: sheet.item.icon ?? "📦",
									}
								: undefined
						}
						submitLabel={sheet.type === "edit-item" ? "Save Changes" : "Add Item"}
						onCancel={() => setSheet({ type: "closed" })}
						onSubmit={async (values) => {
							if (sheet.type === "edit-item") {
								await updateItem.mutateAsync({ id: sheet.item._id, ...values });
							} else {
								await createItem.mutateAsync(values);
							}
							setSheet({ type: "closed" });
						}}
					/>
				</Sheet>

				{/* Income setup sheet */}
				<Sheet
					open={sheet.type === "income"}
					onOpenChange={(open) => !open && setSheet({ type: "closed" })}
					title="Set Paycheck Amount"
				>
					<IncomeSetupForm
						initialAmount={payAmountCents || undefined}
						onCancel={() => setSheet({ type: "closed" })}
						onSubmit={async (amountCents) => {
							await setPayAmount.mutateAsync({ payAmount: amountCents });
							setSheet({ type: "closed" });
						}}
					/>
				</Sheet>
			</main>
		</AppLayout>
	);
}

export const Route = createFileRoute("/budget")({
	component: BudgetPage,
	loader: async ({ context }) => {
		try {
			await Promise.all([
				context.queryClient.prefetchQuery(convexQuery(api.userSettings.get, {})),
				context.queryClient.prefetchQuery(convexQuery(api.bills.list, {})),
				context.queryClient.prefetchQuery(convexQuery(api.budgetItems.list, {})),
			]);
		} catch {
			// Auth may not be available during SSR
		}
	},
});
