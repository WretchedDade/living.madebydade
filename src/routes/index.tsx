import { convexAction, convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useUser } from '@clerk/tanstack-react-start';
import { useSuspenseQuery, useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useState } from 'react';
import { useUserPermissions } from '~/hooks/use-user-metadata';
import { AppLayout } from '~/components/layout/AppLayout';
import { Button } from '~/components/ui/Button';
import { ListBulletIcon, CardStackIcon, IdCardIcon } from '@radix-ui/react-icons';
import { Link } from '~/components/ui/Link';
import { SciFiBars } from '~/components/ui/SciFiBars';
import { MissionBanner } from '~/components/ui/MissionBanner';
import { SectionHeader } from '~/components/layout/SectionHeader';
import * as Switch from '@radix-ui/react-switch';

import { UnpaidBillsSection } from '~/components/UnpaidBillsSection';

import { RecentActivitySection } from '~/components/RecentActivitySection';
import { ActivityDoc } from '~/types/activity';
import { PlaidAccount } from 'react-plaid-link';
import { PlaidItem } from '@/convex/schema';

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

	const plaidItemsQuery = useQuery(convexAction(api.accounts.getAllAccounts, {}));

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
						<div className="flex flex-col flex-1 bg-zinc-900 rounded-2xl p-6 shadow-lg">
							<SectionHeader
								icon={<span className="w-7 h-7 inline-block bg-cyan-700 rounded-full" />} // Replace with quest icon
								title="Banking"
							/>
							{plaidItemsQuery.isSuccess && plaidItemsQuery.data.length === 0 && (
								<div className='items-center justify-center flex flex-col grow w-full'>
									<div className="flex flex-col items-center justify-center my-auto py-8">
										<IdCardIcon className="w-8 h-8 text-cyan-400 mb-2" />
										<p className="text-zinc-300 text-center text-lg italic mb-2">No bank accounts linked yet</p>
										<Link href="/bank/setup">Link your bank account</Link>
									</div>
								</div>
							)}
							{plaidItemsQuery.isSuccess && plaidItemsQuery.data.length > 0 && (
								<div className="flex flex-col gap-4 w-full mt-4">
									<div className="flex flex-col gap-4 w-full">
										{plaidItemsQuery.data.map((accountsOverview: any) => (
											<div key={accountsOverview.institution.id} className="bg-zinc-800 rounded-xl shadow p-4">
												<div className="flex items-center gap-3 mb-2">
													<span className="font-bold text-cyan-300 text-lg">{accountsOverview.institution.name}</span>
													{accountsOverview.institution.logo && (
														<img src={accountsOverview.institution.logo} alt={accountsOverview.institution.name + ' logo'} className="w-6 h-6 rounded bg-white p-1" />
													)}
													<span className="text-xs text-zinc-400">{accountsOverview.institution.type}</span>
												</div>
												<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
													{accountsOverview.accounts.map((account: any) => (
														<div key={account.account_id} className="flex flex-col bg-zinc-900 rounded-lg p-3 border border-zinc-700">
															<div className="flex items-center justify-between mb-1">
																<span className="font-semibold text-cyan-200">{account.name}</span>
																<span className="font-mono text-cyan-100 text-base">
																	{typeof account.balances.current === 'number'
																		? account.balances.current.toLocaleString(undefined, {
																			style: 'currency',
																			currency: account.balances.iso_currency_code || 'USD',
																			minimumFractionDigits: 2,
																			maximumFractionDigits: 2
																		})
																		: 'Balance unavailable'}
																</span>
															</div>
															<div className="flex flex-wrap gap-2 text-xs text-zinc-400">
																<span>Type: {account.type}{account.subtype ? `/${account.subtype}` : ''}</span>
																{account.mask && <span>••••{account.mask}</span>}
																{account.official_name && <span>{account.official_name}</span>}
															</div>
															{typeof account.balances.available === 'number' && account.balances.available !== account.balances.current && (
																<div className="text-xs text-zinc-500 mt-1">
																	Available: {account.balances.available.toLocaleString(undefined, {
																		style: 'currency',
																		currency: account.balances.iso_currency_code || 'USD',
																		minimumFractionDigits: 2,
																		maximumFractionDigits: 2
																	})}
																</div>
															)}
															{typeof account.balances.limit === 'number' && (
																<div className="text-xs text-zinc-500 mt-1">
																	Limit: {account.balances.limit.toLocaleString(undefined, {
																		style: 'currency',
																		currency: account.balances.iso_currency_code || 'USD',
																		minimumFractionDigits: 2,
																		maximumFractionDigits: 2
																	})}
																</div>
															)}
														</div>
													))}
												</div>
											</div>
										))}
									</div>
								</div>
							)}
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
			context.queryClient.prefetchQuery(convexQuery(api.plaidItems.getPlaidItems, {})),
		]);
	},
});
