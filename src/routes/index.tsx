import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useUser } from '@clerk/tanstack-react-start';
import { useSuspenseQuery, useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useState } from 'react';
import { useUserPermissions } from '~/hooks/use-user-metadata';
import { AppLayout } from '~/components/layout/AppLayout';
import { Button } from '~/components/ui/Button';
import { ListBulletIcon } from '@radix-ui/react-icons';
import { Link } from '~/components/ui/Link';
import { SciFiBars } from '~/components/ui/SciFiBars';
import { MissionBanner } from '~/components/ui/MissionBanner';
import { SectionHeader } from '~/components/layout/SectionHeader';
import * as Switch from '@radix-ui/react-switch';

import { UnpaidBillsSection } from '~/components/UnpaidBillsSection';

import { RecentActivitySection } from '~/components/RecentActivitySection';
import { ActivityDoc } from '~/types/activity';

function Home() {
	const permissions = useUserPermissions();
	const [showAutoPay, setShowAutoPay] = useState(false);
	const { data: payments, isLoading } = useQuery(convexQuery(api.billPayments.listUnpaid, { includeAutoPay: showAutoPay }));
	const { data: activities = [], isLoading: isLoadingActivity } = useQuery(convexQuery(api.activity.listRecentActivity, {}));
	const mutation = useMutation({
		mutationFn: useConvexMutation(api.billPayments.markPaid),
	});
	const logActivity = useConvexMutation(api.activity.logActivity);
	const { user } = useUser();

	return (
		<AppLayout>
			<main className="flex-1 w-full min-h-0 overflow-y-auto p-4 sm:p-10">
				{/* <MissionBanner>
					Mission: Conquer bills, earn XP, and level up your financial game!
				</MissionBanner>
				<h2 className="text-3xl sm:text-4xl font-extrabold text-cyan-400 mb-2 sm:mb-4 tracking-wide drop-shadow-lg sci-fi-title-glow text-center">Welcome Back, Hero!</h2> */}
				<SciFiBars count={7} className="mb-6" />
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
					{/* Row: Unpaid Bills & Daily Quests */}
					<div className="col-span-1 md:col-span-2 flex flex-col md:flex-row gap-8 w-full">
						<UnpaidBillsSection
							payments={payments || []}
							isLoading={isLoading}
							showAutoPay={showAutoPay}
							setShowAutoPay={setShowAutoPay}
							onMarkPaid={async (payment: any) => {
								await mutation.mutateAsync({ billPaymentId: payment._id, datePaid: new Date().toISOString() });
								await logActivity({
									type: 'billPaid',
									userId: user?.id ?? 'unknown',
									targetId: payment._id,
									details: {
										description: `Paid bill: ${payment.bill?.name}`,
										amount: payment.amount,
										billName: payment.bill?.name,
									},
								});
							}}
						/>
						{/* Daily Quests Section (placeholder) */}
						<div className="flex-1 bg-zinc-900 rounded-2xl p-6 shadow-lg">
							<SectionHeader
								icon={<span className="w-7 h-7 inline-block bg-cyan-700 rounded-full" />} // Replace with quest icon
								title="Daily Quests"
							/>
							<div className="text-zinc-400 text-center py-6 text-lg italic">Coming soon: Your daily quests will appear here!</div>
						</div>
					</div>
				</div>
				<SciFiBars count={12} className="mb-6" />
				<RecentActivitySection activities={activities as ActivityDoc[]} isLoading={isLoadingActivity} />
			</main>
		</AppLayout>
	);
}

export const Route = createFileRoute('/')({
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
