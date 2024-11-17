import { convexQuery } from '@convex-dev/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { AppBody } from '~/components/app-body';
import { BillPaymentsFeed } from '~/components/bill-payments-feed';
import { BillPaymentsList } from '~/components/bill-payments-list';
import { Separator } from '~/components/ui/separator';
import { Typography } from '~/components/ui/typography';
import { useUserPermissions } from '~/hooks/use-user-metadata';

export const Route = createFileRoute('/')({
	component: Home,
	loader: async ({ context }) => {
		context.queryClient.prefetchQuery(convexQuery(api.billPayments.listRecentlyPaid, {}));
	},
});

function Home() {
	const permissions = useUserPermissions();

	return (
		<AppBody>
			<Typography variant="h1">Dashboard</Typography>
			<div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-1 xl:grid-cols-3 gap-8 mt-4 lg:max-h-full lg:overflow-hidden">
				{permissions.bills ? (
					<div className="xl:col-span-2 flex flex-col gap-4">
						<Typography variant="h2">Bills due soon</Typography>
						<Separator />
						<BillPaymentsList />
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
