import { convexAction, convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useUser } from '@clerk/tanstack-react-start';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useState } from 'react';
import { useUserPermissions } from '~/hooks/use-user-metadata';
import { AppLayout } from '~/components/layout/AppLayout';
import { SciFiBars } from '~/components/ui/SciFiBars';

import { UnpaidBillsSection } from '~/components/UnpaidBillsSection';

import { RecentActivitySection } from '~/components/RecentActivitySection';
import { ActivityDoc } from '~/types/activity';
import { BankingSection } from '~/components/BankingSection';

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

	const accountsQuery = useQuery(convexAction(api.accounts.get, {}));


	// Calculate total checking amount
	const totalCheckingAmount = accountsQuery.data?.reduce((total, account) => {
		if (account.subtype === "checking") {
			if (account.balances.available) {
				return total + account.balances.available;
			} else if (account.balances.current) {
				return total + account.balances.current;
			} else {
				console.warn(`Encountered checking account (${account.name} ${account.mask}) with no balance information when calculating total checking amount.`);
				return total;
			}
		}
		return total;
	}, 0) ?? 0;

	// Calculate total unpaid bills amount
	const totalUnpaidBillsAmount = (payments || []).reduce((sum, payment) => sum + (payment.bill?.amount || 0), 0);

	// Calculate spending money
	const spendingMoney = totalCheckingAmount - totalUnpaidBillsAmount;


	return (
		<AppLayout>
			<main className="flex-1 w-full min-h-0 overflow-y-auto p-4 sm:p-10">
				{/* Spending Money Card */}
				<div className="mb-6">
					<div className="bg-cyan-900/80 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center">
						<span className="text-lg font-semibold text-cyan-300 mb-1">Spending Money</span>
						<span className="text-4xl font-extrabold text-cyan-400 tracking-wide drop-shadow sci-fi-title-glow">
							{spendingMoney.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
						</span>
						<span className="text-xs text-cyan-200 mt-2">(Checking balance minus unpaid bills)</span>
					</div>
				</div>
				<SciFiBars count={7} className="mb-6" />
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
					{/* Row: Unpaid Bills & Daily Quests */}
					<div className="col-span-1 md:col-span-2 flex flex-col md:flex-row gap-8 w-full">
						<UnpaidBillsSection
							payments={payments || []}
							isLoading={isLoading}
							showAutoPay={showAutoPay}
							setShowAutoPay={setShowAutoPay}
							onMarkPaid={async (payment) => {
								await mutation.mutateAsync({ billPaymentId: payment._id, datePaid: new Date().toISOString() });
								await logActivity({
									type: 'billPaid',
									userId: user?.id ?? 'unknown',
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
