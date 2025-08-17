import { convexAction, convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useUser } from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useState } from "react";
import { useUserPermissions } from "~/hooks/use-user-metadata";
import { AppLayout } from "~/components/layout/AppLayout";
import { SciFiBars } from "~/components/ui/SciFiBars";

import { UnpaidBillsSection } from "~/components/UnpaidBillsSection";

import { RecentActivitySection } from "~/components/RecentActivitySection";
import { ActivityDoc } from "~/types/activity";
import { BankingSection } from "~/components/BankingSection";
import { Link } from "~/components/ui/Link";
import { SpendingMoneyCard } from "~/components/SpendingMoneyCard";

function Home() {
	const permissions = useUserPermissions();
	const [showAutoPay, setShowAutoPay] = useState(false);
	// Query for UI display (toggle)
	const { data: payments, isLoading } = useQuery(
		convexQuery(api.billPayments.listUnpaid, { includeAutoPay: showAutoPay }),
	);

	// Query for calculation (always include auto-pay)
	const { data: allUnpaidPayments } = useQuery(convexQuery(api.billPayments.listUnpaid, { includeAutoPay: true }));

	const { data: activities = [], isLoading: isLoadingActivity } = useQuery(
		convexQuery(api.activity.listRecentActivity, {}),
	);
	const mutation = useMutation({
		mutationFn: useConvexMutation(api.billPayments.markPaid),
	});
	const logActivity = useConvexMutation(api.activity.logActivity);
	const { user } = useUser();

	// Spending money display moved into its own component

	return (
		<AppLayout>
			<main className="flex-1 w-full min-h-0 overflow-y-auto p-4 sm:p-10">
				<div className="flex justify-end mb-4">
					<Link to="/summaries" variant="outline">
						View Transaction Summaries
					</Link>
				</div>
				<SpendingMoneyCard />
				<SciFiBars count={7} className="mb-6" />
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
					{/* Row: Unpaid Bills & Daily Quests */}
					<div className="col-span-1 md:col-span-2 flex flex-col md:flex-row gap-8 w-full">
						<UnpaidBillsSection
							payments={payments || []}
							isLoading={isLoading}
							showAutoPay={showAutoPay}
							setShowAutoPay={setShowAutoPay}
							onMarkPaid={async payment => {
								await mutation.mutateAsync({
									billPaymentId: payment._id,
									datePaid: new Date().toISOString(),
								});
								await logActivity({
									type: "billPaid",
									userId: user?.id ?? "unknown",
									targetId: payment._id,
									details: {
										description: `Paid bill: ${payment.bill?.name}`,
										amount: payment.bill?.amount,
										billName: payment.bill?.name,
									},
								});
							}}
						/>
						<BankingSection />
					</div>
				</div>
				<SciFiBars count={12} className="mb-6" />
				<RecentActivitySection activities={activities as ActivityDoc[]} isLoading={isLoadingActivity} />
			</main>
		</AppLayout>
	);
}

export const Route = createFileRoute("/")({
	component: Home,
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.prefetchQuery(convexQuery(api.billPayments.listUnpaid, { includeAutoPay: false })),
			context.queryClient.prefetchQuery(convexQuery(api.billPayments.listUnpaid, { includeAutoPay: true })),
			context.queryClient.prefetchQuery(convexQuery(api.billPayments.listRecentlyPaid, {})),
			context.queryClient.prefetchQuery(convexQuery(api.activity.listRecentActivity, {})),
		]);
	},
});
