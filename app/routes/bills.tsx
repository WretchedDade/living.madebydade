import { convexQuery } from '@convex-dev/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';

import { AppBody } from '~/components/app-body';
import { BillGrid } from '~/components/bill-grid';
import { Separator } from '~/components/ui/separator';
import { Typography } from '~/components/ui/typography';

export const Route = createFileRoute('/bills')({
	component: RouteComponent,
	loader: async ({ context }) => {
		context.queryClient.prefetchQuery(convexQuery(api.bills.list, {}));
	},
});

function RouteComponent() {
	return (
		<AppBody>
			<Typography variant="h1">Bills</Typography>
			<Separator />
			<BillGrid />
		</AppBody>
	);
}
