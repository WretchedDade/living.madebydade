import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { Doc } from "convex/_generated/dataModel";
import { AppLayout } from "~/components/layout/AppLayout";
import { useUser } from "@clerk/tanstack-react-start";
import { useState } from "react";
import { AddBillForm } from "~/components/AddBillForm";
import { PencilSquareIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/solid";
import { formatOrdinal } from "~/utils/formatters";
import { Button } from "~/components/ui/Button";
import { Dialog } from "~/components/feedback/Dialog";
import { showToast } from "~/components/feedback/Toast";
import { EditBillForm } from "~/components/EditBillForm";
import { formatCentsAsDollars } from "~/lib/currency";

function BillsPage() {
	const bills = useQuery(convexQuery(api.bills.list, {}));
	const unpaidPayments = useQuery(convexQuery(api.billPayments.listUnpaid, { includeAutoPay: true }));
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [billToDelete, setBillToDelete] = useState<Doc<"bills"> | null>(null);
	const [billToEdit, setBillToEdit] = useState<Doc<"bills"> | null>(null);

	const deleteBillMutation = useConvexMutation(api.bills.deleteBill);
	const logActivity = useConvexMutation(api.activity.logActivity);
	const { user } = useUser();

	// Figure out which bills have unpaid payments
	const unpaidBillIds = new Set(
		(unpaidPayments.data ?? []).map(p => p.bill?._id).filter(Boolean),
	);

	const unpaidBills = (bills.data ?? []).filter(b => unpaidBillIds.has(b._id));
	const allBills = bills.data ?? [];

	// Compute summary stats
	const totalMonthly = allBills.reduce((sum, b) => sum + (b.amount ?? 0), 0);
	const autoPayCount = allBills.filter(b => b.isAutoPay).length;

	// Group bills by paycheck period (semimonthly: 1st–14th vs 15th–EOM)
	const firstPaycheck = allBills.filter(b =>
		b.dueType === "Fixed" && b.dayDue !== undefined && b.dayDue < 15,
	);
	const secondPaycheck = allBills.filter(b =>
		b.dueType === "EndOfMonth" || (b.dueType === "Fixed" && b.dayDue !== undefined && b.dayDue >= 15),
	);

	return (
		<AppLayout>
			<main className="flex-1 w-full relative overflow-hidden min-h-screen">
				<div className="relative px-5 md:px-10 lg:px-12 pt-16 md:pt-24 pb-10 md:pb-12 bg-gradient-to-br from-primary/8 via-card to-secondary/6 overflow-hidden">
					{/* Decorative blur */}
					<div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
					{/* Header */}
					<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
						<div>
							<p className="text-sm font-semibold text-muted-foreground mb-1">Monthly Bills</p>
							{allBills.length > 0 ? (
								<>
									<div className="text-2xl sm:text-4xl font-extrabold text-foreground tabular-nums tracking-tight">
										{(totalMonthly / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}
									</div>
									<div className="flex flex-wrap items-center gap-3 mt-2 text-xs sm:text-sm text-muted-foreground">
										<span>{allBills.length} bill{allBills.length !== 1 ? "s" : ""}</span>
										{autoPayCount > 0 && (
											<span className="flex items-center gap-1.5">
												<span className="w-2 h-2 rounded-full bg-success" />
												{autoPayCount} auto-pay
											</span>
										)}
										{allBills.length - autoPayCount > 0 && (
											<span className="flex items-center gap-1.5">
												<span className="w-2 h-2 rounded-full bg-warning" />
												{allBills.length - autoPayCount} manual
											</span>
										)}
									</div>
								</>
							) : (
								<div className="text-2xl font-bold text-foreground mt-1">No bills yet</div>
							)}
						</div>
					</div>
				</div>

				{/* Bill list */}
				<div className="relative px-5 md:px-10 lg:px-12 py-6 md:py-8 flex-1">
					{allBills.length === 0 ? (
						<div className="flex flex-col items-center justify-center text-center min-h-[40vh]">
							<div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
								<PlusIcon className="w-7 h-7 text-primary" />
							</div>
							<h2 className="text-lg font-bold text-foreground mb-3">No bills yet</h2>
							<p className="text-muted-foreground text-sm mb-8 max-w-xs">
								Add your recurring bills to track what's due and see how they affect your spending money.
							</p>
							<Button variant="primary" onClick={() => setShowAddDialog(true)}>
								Add Your First Bill
							</Button>
						</div>
					) : (
						<>
							<div className="space-y-8">
								{firstPaycheck.length > 0 && (
									<BillGroup
										label="1st Paycheck"
										sublabel="1st – 14th"
										bills={firstPaycheck}
										unpaidBillIds={unpaidBillIds}
										onEdit={setBillToEdit}
										onDelete={setBillToDelete}
									/>
								)}
								{firstPaycheck.length > 0 && secondPaycheck.length > 0 && (
									<div className="h-px bg-primary/15" />
								)}
								{secondPaycheck.length > 0 && (
									<BillGroup
										label="2nd Paycheck"
										sublabel="15th – End of Month"
										bills={secondPaycheck}
										unpaidBillIds={unpaidBillIds}
										onEdit={setBillToEdit}
										onDelete={setBillToDelete}
									/>
								)}
							</div>

							<div className="h-px bg-primary/15 mt-8" />
							<div className="flex items-center gap-3 mt-4">
								<Button variant="ghost" onClick={() => setShowAddDialog(true)}>
									<PlusIcon className="w-5 h-5" />
									Add Bill
								</Button>
							</div>
						</>
					)}

					{/* Add dialog */}
					<Dialog open={showAddDialog} onOpenChange={setShowAddDialog} title="Add Bill">
						<AddBillForm
							onSuccess={() => {
								setShowAddDialog(false);
								bills.refetch();
							}}
						/>
					</Dialog>

					{/* Edit dialog */}
					<Dialog
						open={!!billToEdit}
						onOpenChange={open => { if (!open) setBillToEdit(null); }}
						title="Edit Bill"
					>
						{billToEdit && (
							<EditBillForm
								bill={billToEdit}
								onSuccess={() => {
									setBillToEdit(null);
									bills.refetch();
								}}
							/>
						)}
					</Dialog>

					{/* Delete confirmation */}
					<Dialog
						open={!!billToDelete}
						onOpenChange={open => { if (!open) setBillToDelete(null); }}
						title="Delete Bill"
					>
						<p className="text-foreground text-sm mb-4">
							Are you sure you want to delete <span className="font-bold">{billToDelete?.name}</span>?
							This action cannot be undone.
						</p>
						<div className="flex gap-2 justify-end">
							<Button variant="ghost" size="sm" onClick={() => setBillToDelete(null)}>
								Cancel
							</Button>
							<Button
								variant="primary"
								size="sm"
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								onClick={async () => {
									if (billToDelete && deleteBillMutation) {
										try {
											await deleteBillMutation({ id: billToDelete._id });
											await logActivity({
												type: "billRemoved",
												userId: user?.id ?? "unknown",
												targetId: billToDelete._id,
												details: {
													description: `Removed bill: ${billToDelete.name}`,
													billName: billToDelete.name,
												},
											});
											setBillToDelete(null);
											bills.refetch();
											showToast({
												title: "Bill deleted",
												description: `${billToDelete.name} was deleted successfully.`,
												variant: "success",
											});
										} catch (err: unknown) {
											showToast({
												title: "Delete failed",
												description: err instanceof Error ? err.message : "Could not delete bill.",
												variant: "error",
											});
										}
									}
								}}
							>
								Delete
							</Button>
						</div>
					</Dialog>
				</div>
			</main>
		</AppLayout>
	);
}

function BillCard({
	bill,
	isUnpaid,
	onEdit,
	onDelete,
}: {
	bill: Doc<"bills">;
	isUnpaid?: boolean;
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<div
			className={`flex items-center justify-between gap-4 group py-4 px-4 rounded-xl transition-all ${
				isUnpaid ? "bg-warning/8" : "hover:bg-muted/40"
			}`}
		>
			<div className="flex-1 min-w-0">
				<span className="font-semibold text-foreground truncate block">{bill.name}</span>
				<div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
					<span className="font-semibold text-primary tabular-nums">
						${formatCentsAsDollars(bill.amount)}
					</span>
					<span>·</span>
					<span>
						{bill.dueType === "EndOfMonth"
							? "End of Month"
							: bill.dayDue !== undefined
								? `${formatOrdinal(bill.dayDue)} of month`
								: bill.dueType}
					</span>
					{bill.isAutoPay && (
						<span className="text-success bg-success/10 rounded-full px-2 py-0.5 text-[10px] font-medium">Auto-Pay</span>
					)}
					{isUnpaid && (
						<span className="text-warning bg-warning/10 rounded-full px-2 py-0.5 text-[10px] font-medium">Due</span>
					)}
				</div>
			</div>
			<div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
				<Button variant="ghost" size="sm" icon onClick={onEdit} aria-label="Edit">
					<PencilSquareIcon className="w-5 h-5" />
				</Button>
				<Button variant="ghost" size="sm" icon onClick={onDelete} aria-label="Delete">
					<TrashIcon className="w-5 h-5 text-destructive" />
				</Button>
			</div>
		</div>
	);
}

function BillGroup({
	label,
	sublabel,
	bills,
	unpaidBillIds,
	onEdit,
	onDelete,
}: {
	label: string;
	sublabel: string;
	bills: Doc<"bills">[];
	unpaidBillIds: Set<string>;
	onEdit: (bill: Doc<"bills">) => void;
	onDelete: (bill: Doc<"bills">) => void;
}) {
	const groupTotal = bills.reduce((sum, b) => sum + (b.amount ?? 0), 0);
	return (
		<section>
			<div className="flex items-baseline justify-between mb-3">
				<div className="flex items-baseline gap-2">
					<h2 className="text-sm font-bold text-foreground">{label}</h2>
					<span className="text-xs text-muted-foreground">{sublabel}</span>
				</div>
				<span className="text-sm font-semibold text-primary tabular-nums">
					{(groupTotal / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}
				</span>
			</div>
			<div className="space-y-1">
				{bills.map(bill => (
					<BillCard
						key={bill._id}
						bill={bill}
						isUnpaid={unpaidBillIds.has(bill._id)}
						onEdit={() => onEdit(bill)}
						onDelete={() => onDelete(bill)}
					/>
				))}
			</div>
		</section>
	);
}

export const Route = createFileRoute("/bills")({
	component: BillsPage,
	loader: async ({ context }) => {
		try {
			await Promise.all([
				context.queryClient.prefetchQuery(convexQuery(api.bills.list, {})),
				context.queryClient.prefetchQuery(convexQuery(api.billPayments.listUnpaid, { includeAutoPay: true })),
			]);
		} catch {
			// Auth may not be available during SSR — client will re-fetch
		}
	},
});
