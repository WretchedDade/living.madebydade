import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useUser } from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useState } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { HeroSection } from "~/components/home/HeroSection";
import { UpcomingBillsCard } from "~/components/UpcomingBillsCard";
import { AccountsCard } from "~/components/AccountsCard";

function Home() {
	const [showAutoPay, setShowAutoPay] = useState(false);

	const { data: payments, isLoading } = useQuery(
		convexQuery(api.billPayments.listUnpaid, { includeAutoPay: showAutoPay }),
	);

	const { data: summaryData } = useQuery(
		convexQuery(api.cashCreditSummaries.listByPeriod, { period: "month", pageSize: 6 }),
	);

	const mutation = useMutation({
		mutationFn: useConvexMutation(api.billPayments.markPaid),
	});
	const logActivity = useConvexMutation(api.activity.logActivity);
	const { user } = useUser();

	return (
		<AppLayout>
			<main className="flex-1 w-full min-h-0">
				<HeroSection monthlySummaries={summaryData?.page ?? []} />

				<div className="relative flex-1 flex flex-col">
					<div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/8 to-transparent pointer-events-none" />

					<div className="relative px-6 md:px-10 lg:px-12 py-8 md:py-12 flex-1">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
							<UpcomingBillsCard
								payments={payments ?? []}
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
							<AccountsCard />
						</div>
					</div>
				</div>
			</main>
		</AppLayout>
	);
}

export const Route = createFileRoute("/")({
	component: Home,
	loader: async ({ context }) => {
		try {
			await Promise.all([
				context.queryClient.prefetchQuery(convexQuery(api.billPayments.listUnpaid, { includeAutoPay: false })),
				context.queryClient.prefetchQuery(convexQuery(api.billPayments.listUnpaid, { includeAutoPay: true })),
				context.queryClient.prefetchQuery(convexQuery(api.billPayments.listRecentlyPaid, {})),
				context.queryClient.prefetchQuery(convexQuery(api.cashCreditSummaries.listByPeriod, { period: "month", pageSize: 6 })),
			]);
		} catch {
			// Auth may not be available during SSR
		}
	},
});
