import { convexQuery } from '@convex-dev/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useState } from 'react';
import { AppBody } from '~/components/app-body';
import { BillPaymentsFeed } from '~/components/bill-payments-feed';
import { BillPaymentsList } from '~/components/bill-payments-list';
import { Separator } from '~/components/ui/separator';
import { Switch } from '~/components/ui/switch';
import { Typography } from '~/components/ui/typography';
import { useUserPermissions } from '~/hooks/use-user-metadata';

export const Route = createFileRoute('/')({
	component: Home,
	loader: async ({ context }) => {
		context.queryClient.prefetchQuery(convexQuery(api.billPayments.listUnpaid, { includeAutoPay: false }));
		context.queryClient.prefetchQuery(convexQuery(api.billPayments.listRecentlyPaid, {}));
	},
});

function Home() {
	const permissions = useUserPermissions();

	const [showAutoPay, setShowAutoPay] = useState(false);

	return (
		<AppBody>
			<Typography variant="h1">Dashboard</Typography>
			<div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-1 xl:grid-cols-3 gap-8 mt-4 lg:max-h-full lg:overflow-hidden">
				{permissions.bills ? (
					<div className="xl:col-span-2 flex flex-col gap-4">
						<div className="flex items-end justify-between">
							<Typography variant="h2">Bills due soon</Typography>

							<div className="flex items-center gap-2">
								<label htmlFor="auto-pay" className="font-medium text-foreground text-sm">
									Include Auto-pay
								</label>
								<Switch
									id="auto-pay"
									name="auto-pay"
									checked={showAutoPay}
									onCheckedChange={setShowAutoPay}
								/>
							</div>
						</div>
						<Separator />
						<BillPaymentsList includeAutoPay={showAutoPay} />
					</div>
				) : (
					<div className="xl:col-span-2 flex flex-col gap-4">
						<Typography variant="h2">&nbsp;</Typography>
						<Separator />
					</div>
				)}
				{permissions.bills ? (
					<div className="flex flex-col gap-4 lg:overflow-auto">
						<Typography variant="h2">Recent payments</Typography>
						<Separator />
						<BillPaymentsFeed />
					</div>
				) : (
					<div className="flex flex-col gap-4 lg:overflow-auto">
						<Typography variant="h2">Activity</Typography>
						<Separator />
					</div>
				)}
			</div>
		</AppBody>
	);
}
