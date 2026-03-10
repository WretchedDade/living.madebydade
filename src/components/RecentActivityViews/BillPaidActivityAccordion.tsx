import React from "react";
import { ActivityDoc, BillPaidActivity } from "~/types/activity";
import { RecentActivityAccordion } from "./RecentActivityAccordion";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { convexAction, convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatCurrency } from "../../utils/formatters";
import { convexQuery as convexUserQuery } from "@convex-dev/react-query";
import { useQuery as useUserQuery } from "@tanstack/react-query";

export function BillPaidActivityAccordion({ activity }: { activity: BillPaidActivity }) {
	// Helper to get display name for user
	function getUserDisplayName() {
		if (activity.userId === "") return "System";
		if (userQuery.isSuccess) return userQuery.data.fullName;
		return "Unknown";
	}

	const paymentQuery = useQuery(
		convexQuery(api.billPayments.getById, { id: activity.targetId as Id<"billPayments"> }),
	);

	const billQuery = useQuery({
		...convexQuery(api.bills.getBillById, { id: paymentQuery.data?.billId! }),
		enabled: !!paymentQuery.data?.billId,
	});

	// Fetch user info if activity.userId is present and not empty
	const userId = activity.userId;
	const userQuery = useUserQuery({
		...convexAction(api.users.getUserById, { userId }),
		enabled: !!userId && userId !== "",
	});

	let paymentDetails = null;
	let billDetails = null;
	if (paymentQuery.isSuccess && billQuery.isSuccess && paymentQuery.data && billQuery.data) {
		paymentDetails = (
			<div className="mb-4 p-4 bg-zinc-900 border border-green-700 rounded-lg shadow-lg flex flex-col gap-4">
				<div className="flex items-center gap-3 mb-2">
					<span className="inline-block px-3 py-1 rounded-full bg-green-600 text-white text-xs font-bold tracking-wide shadow">
						Paid{" "}
						{paymentQuery.data.datePaid
							? new Date(paymentQuery.data.datePaid).toLocaleString(undefined, {
									dateStyle: "medium",
									timeStyle: "short",
								})
							: "N/A"}
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<div className="text-3xl font-extrabold text-green-300 mb-2">
						{formatCurrency(billQuery.data.amount)}
					</div>
					<div className="flex gap-2">
						<span className="font-semibold text-zinc-400">Due Date:</span>
						<span className="text-zinc-200">
							{paymentQuery.data.dateDue
								? new Date(paymentQuery.data.dateDue).toLocaleDateString(undefined, {
										dateStyle: "medium",
									})
								: "N/A"}
						</span>
					</div>
					<div className="flex gap-2">
						<span className="font-semibold text-zinc-400">Auto-Pay:</span>
						<span className="text-zinc-200">{paymentQuery.data.isAutoPay ? "Yes" : "No"}</span>
					</div>
					<div className="flex gap-2">
						<span className="font-semibold text-zinc-400">Paid By:</span>
						<span className="text-zinc-200">{getUserDisplayName()}</span>
					</div>
				</div>
			</div>
		);
		billDetails = null;
	}
	return (
		<RecentActivityAccordion
			activity={activity as ActivityDoc}
			label={`${activity.details.billName} Paid`}
			borderClass="border-green-500"
		>
			<div>
				{(paymentQuery.isLoading || billQuery.isLoading) && (
					<div className="text-zinc-400 italic">Loading payment and bill details...</div>
				)}
				{!paymentQuery.isSuccess ||
					(paymentQuery.data == null && (
						<div className="text-zinc-400 italic">Payment details not found.</div>
					))}
				{!billQuery.isSuccess ||
					(billQuery.data == null && <div className="text-zinc-400 italic">Bill details not found.</div>)}
				{paymentDetails}
				{billDetails}
			</div>
		</RecentActivityAccordion>
	);
}
