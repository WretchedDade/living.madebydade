import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { Doc } from "convex/_generated/dataModel";
import { AppLayout } from "~/components/layout/AppLayout";
import { useUser } from "@clerk/tanstack-react-start";
import { useState } from "react";
import { AddBillForm } from "~/components/AddBillForm";
import { PencilSquareIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/solid";
import { Badge } from "~/components/ui/Badge";
import { formatOrdinal } from "~/utils/formatters";
import { Button } from "~/components/ui/Button";
import { Dialog } from "~/components/feedback/Dialog";
import { showToast } from "~/components/feedback/Toast";
import { EditBillForm } from "~/components/EditBillForm";
import { formatCentsAsDollars } from "~/lib/currency";
import { useQuery } from "@tanstack/react-query";
import { convexQuery as cq } from "@convex-dev/react-query";

function BillsPage() {
	const bills = useSuspenseQuery(convexQuery(api.bills.list, {}));
	const unpaidPayments = useQuery(cq(api.billPayments.listUnpaid, { includeAutoPay: true }));
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

	return (
		<AppLayout>
			<main className="flex-1 w-full min-h-0 p-6 md:p-10 lg:p-12">
				<div>
					{/* Header */}
					<div className="flex items-center justify-between mb-6">
						<h1 className="text-xl font-bold text-foreground">Bills</h1>
						<Button variant="primary" size="sm" onClick={() => setShowAddDialog(true)}>
							<PlusIcon className="w-4 h-4" />
							Add Bill
						</Button>
					</div>

					{/* Unpaid section */}
					{unpaidBills.length > 0 && (
						<section className="mb-6">
							<h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
								Unpaid This Period
							</h2>
							<div className="space-y-2">
								{unpaidBills.map(bill => (
									<BillCard
										key={`unpaid-${bill._id}`}
										bill={bill}
										isUnpaid
										onEdit={() => setBillToEdit(bill)}
										onDelete={() => setBillToDelete(bill)}
									/>
								))}
							</div>
						</section>
					)}

					{/* All bills */}
					<section>
						<h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
							All Bills
						</h2>
						{allBills.length === 0 ? (
							<div className="bg-card rounded-xl card-elevated p-8 text-center">
								<p className="text-muted-foreground mb-3">No bills configured yet.</p>
								<Button variant="primary" size="sm" onClick={() => setShowAddDialog(true)}>
									Add Your First Bill
								</Button>
							</div>
						) : (
							<div className="space-y-2">
								{allBills.map(bill => (
									<BillCard
										key={bill._id}
										bill={bill}
										onEdit={() => setBillToEdit(bill)}
										onDelete={() => setBillToDelete(bill)}
									/>
								))}
							</div>
						)}
					</section>

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
			className={`bg-card rounded-xl p-4 flex items-center justify-between gap-3 group transition-all ${
				isUnpaid ? "card-elevated ring-1 ring-warning/20 bg-warning/5" : "card-elevated hover:shadow-md"
			}`}
		>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-1">
					<span className="font-semibold text-foreground text-sm truncate">{bill.name}</span>
					{bill.isAutoPay && <Badge variant="success">Auto</Badge>}
					{isUnpaid && <Badge variant="warning">Due</Badge>}
				</div>
				<div className="flex items-center gap-3 text-xs text-muted-foreground">
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
				</div>
			</div>
			<div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
				<Button variant="ghost" size="sm" icon onClick={onEdit} aria-label="Edit">
					<PencilSquareIcon className="w-4 h-4" />
				</Button>
				<Button variant="ghost" size="sm" icon onClick={onDelete} aria-label="Delete">
					<TrashIcon className="w-4 h-4 text-destructive" />
				</Button>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/bills")({
	component: BillsPage,
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.prefetchQuery(convexQuery(api.bills.list, {})),
			context.queryClient.prefetchQuery(convexQuery(api.billPayments.listUnpaid, { includeAutoPay: true })),
		]);
	},
});
