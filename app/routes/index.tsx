import { convexQuery } from '@convex-dev/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { AppBody } from '~/components/app-body';
import { BillPaymentsList } from '~/components/bill-payments-list';
import { Separator } from '~/components/ui/separator';
import { Typography } from '~/components/ui/typography';

export const Route = createFileRoute('/')({
	component: Home,
	loader: async ({ context }) => {
		context.queryClient.prefetchQuery(convexQuery(api.billPayments.listUnpaid, {}));
	},
});

function Home() {
	return (
		<AppBody>
			<Typography variant="h1">Dashboard</Typography>
			<div className="grid grid-cols-3 gap-8 mt-4">
				<div className="col-span-2 flex flex-col gap-4">
					<Typography variant="h2">Bills due soon</Typography>
					<Separator />
					<BillPaymentsList />
				</div>
				<div className="flex flex-col gap-4">
					<Typography variant="h2">Recent payments</Typography>
					<Separator />
				</div>
			</div>
		</AppBody>
	);
}
