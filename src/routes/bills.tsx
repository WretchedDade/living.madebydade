import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { AppLayout } from "~/components/layout/AppLayout";
import { useUser } from "@clerk/tanstack-react-start";
import { useState } from "react";
import { AddBillForm } from "~/components/AddBillForm";
import * as Dialog from "@radix-ui/react-dialog";
import { ListBulletIcon, PencilSquareIcon, TrashIcon, PlusIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/solid";
import { SectionHeader } from "~/components/layout/SectionHeader";
import { Badge } from "~/components/ui/Badge";
import { formatOrdinal } from "~/utils/formatters";
import { Button } from "~/components/ui/Button";
import { Link } from "~/components/ui/Link";
import { SciFiBars } from "~/components/ui/SciFiBars";
import { MissionBanner } from "~/components/ui/MissionBanner";
import { SciFiDialog } from "~/components/feedback/SciFiDialog";
import { showToast } from "~/components/feedback/SciFiToast";
import { EditBillForm } from "~/components/EditBillForm";

function BillsPage() {
	const bills = useSuspenseQuery(convexQuery(api.bills.list, {}));
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [billToDelete, setBillToDelete] = useState<any | null>(null);
	const [billToEdit, setBillToEdit] = useState<any | null>(null);

	const deleteBillMutation = useConvexMutation(api.bills.deleteBill);
	const logActivity = useConvexMutation(api.activity.logActivity);
	const { user } = useUser();

	return (
		<AppLayout>
			<main className="flex-1 w-full min-h-0 overflow-y-auto p-4 sm:p-10">
				<div className="w-full px-2 sm:px-4 text-left">
					<div className="mb-2">
						<Link
							href="/"
							title="Back to Home"
							size="sm"
							variant="subtle"
							className="text-zinc-300 hover:text-white bg-zinc-800 border border-zinc-700"
						>
							<ArrowUturnLeftIcon className="w-4 h-4" />
							Back to Home
						</Link>
						<hr className="my-4 border-zinc-500" />
					</div>
					<div className="mb-10 flex items-center justify-between">
						<SciFiBars count={9} />
						<Button variant="outline" onClick={() => setShowAddDialog(true)}>
							<PlusIcon className="w-5 h-5" aria-hidden="true" />
							Add Bill
						</Button>
					</div>
					<SectionHeader
						icon={
							<ListBulletIcon className="relative w-7 h-7 text-white drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]" />
						}
						title="Configured Bills"
					/>
					<MissionBanner>
						Mission: Manage your household bills and keep everything organized and up to date.
					</MissionBanner>
				</div>
				<div className="w-full px-2 sm:px-4">
					{bills.data?.length === 0 ? (
						<div className="text-zinc-400 text-center py-8 text-lg">No bills configured yet.</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{bills.data?.map((bill: any) => (
								<div
									key={bill._id}
									className="relative bg-zinc-900 rounded-xl shadow-lg p-4 flex flex-row border border-cyan-900/40 hover:border-cyan-400 hover:shadow-[0_0_16px_0_rgba(34,211,238,0.4)] transition-shadow duration-300 min-h-[120px] overflow-hidden"
								>
									<div className="flex flex-col flex-1 relative z-10 gap-3">
										<div className="flex items-center justify-between mb-1">
											<span className="font-bold text-neutral-100 text-lg">{bill.name}</span>
											<div className="flex gap-2">
												<Button
													variant="subtle"
													size="sm"
													icon
													title="Edit"
													onClick={() => setBillToEdit(bill)}
												>
													<PencilSquareIcon className="w-5 h-5" />
												</Button>
												<Button
													variant="subtle"
													size="sm"
													icon
													title="Delete"
													color="amber"
													onClick={() => setBillToDelete(bill)}
												>
													<TrashIcon className="w-5 h-5" />
												</Button>
											</div>
										</div>
										<span className="text-neutral-200 text-xl font-extrabold mb-2 tracking-wide">
											${bill.amount.toFixed(2)}
										</span>
										<div className="flex items-center gap-2 mb-1">
											<Badge variant="neutral">
												{bill.dueType === "EndOfMonth"
													? "End of Month"
													: bill.dueType === "Fixed" && bill.dayDue !== undefined
														? `Due: ${formatOrdinal(bill.dayDue)}`
														: bill.dueType}
											</Badge>
											{bill.isAutoPay && <Badge variant="success">Auto-Pay</Badge>}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
				<SciFiDialog open={showAddDialog} onOpenChange={setShowAddDialog} title="Add Bill">
					<AddBillForm
						onSuccess={() => {
							setShowAddDialog(false);
							bills.refetch();
						}}
					/>
				</SciFiDialog>
				{/* Delete Confirmation Dialog */}
				{/* Edit Bill Dialog */}
				<SciFiDialog
					open={!!billToEdit}
					onOpenChange={open => {
						if (!open) setBillToEdit(null);
					}}
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
				</SciFiDialog>
				<SciFiDialog
					open={!!billToDelete}
					onOpenChange={open => {
						if (!open) setBillToDelete(null);
					}}
					title="Delete Bill"
				>
					<div className="text-zinc-200 mb-4">
						Are you sure you want to delete <span className="font-bold">{billToDelete?.name}</span>?
						<br />
						This action cannot be undone.
					</div>
					<div className="flex gap-2 justify-end">
						<Button variant="subtle" onClick={() => setBillToDelete(null)}>
							Cancel
						</Button>
						<Button
							variant="primary"
							color="rose"
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
									} catch (err: any) {
										showToast({
											title: "Delete failed",
											description: err?.message || "Could not delete bill.",
											variant: "error",
										});
									}
								}
							}}
						>
							Delete
						</Button>
					</div>
				</SciFiDialog>
			</main>
		</AppLayout>
	);
}

export const Route = createFileRoute("/bills")({
	component: BillsPage,
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(convexQuery(api.bills.list, {}));
	},
});
