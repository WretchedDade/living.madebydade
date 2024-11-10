import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { AppBody } from '~/components/app-body';

export const Route = createFileRoute('/')({
	wrapInSuspense: true,
	component: Home,
	loader: async ({ context }) => {
		context.queryClient.prefetchQuery(convexQuery(api.bills.list, {}));
	},
});

function Home() {
	const { data } = useSuspenseQuery(convexQuery(api.bills.list, {}));

	console.log('Index Render:', data);

	return (
		<AppBody>
			<h1>Welcome!</h1>
		</AppBody>
	);
}
