import { api } from "@/convex/_generated/api";
import type { Account } from "@/convex/accounts";
import { convexAction } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AppLayout } from "~/components/layout/AppLayout";
import { Badge } from "~/components/ui/Badge";
import { Skeleton } from "~/components/ui/Skeleton";
import { Link } from "~/components/ui/Link";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

export const Route = createFileRoute("/bank/success/$itemId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { itemId } = Route.useParams();
	const query = useQuery(convexAction(api.accounts.getById, { itemId }));

	return (
		<AppLayout>
			<main className="flex-1 w-full px-5 md:px-10 lg:px-12 py-10 md:py-16">
				{query.isLoading ? (
					<div>
						<Skeleton className="h-8 w-60 mb-4" />
						<Skeleton className="h-5 w-40 mb-8" />
						<div className="space-y-3">
							{[...Array(3)].map((_, i) => (
								<div key={i} className="flex items-center justify-between py-4 px-4">
									<div>
										<Skeleton className="w-32 h-4 mb-1.5" />
										<Skeleton className="w-20 h-3" />
									</div>
									<Skeleton className="w-16 h-5" />
								</div>
							))}
						</div>
					</div>
				) : query.isError ? (
					<div className="flex flex-col items-center justify-center text-center min-h-[40vh]">
						<h1 className="text-xl font-bold text-destructive mb-3">Something went wrong</h1>
						<p className="text-muted-foreground text-sm mb-6">
							We couldn't load your linked accounts. Please try again.
						</p>
						{query.error && (
							<p className="text-destructive text-xs mb-6">{query.error.message}</p>
						)}
						<Link to="/bank" variant="primary">
							Go to Bank
						</Link>
					</div>
				) : (
					<div>
						<div className="flex items-center gap-3 mb-2">
							<CheckCircleIcon className="w-7 h-7 text-success" />
							<h1 className="text-2xl font-bold text-foreground">Bank Linked!</h1>
						</div>
						{query.data?.[0]?.institution?.name && (
							<p className="text-primary font-semibold mb-2">{query.data[0].institution.name}</p>
						)}
						<p className="text-muted-foreground text-sm mb-8">
							Here are the accounts we found:
						</p>

						<div className="space-y-1.5 mb-10">
							{(query.data ?? []).map(account => (
								<div
									key={account.account_id}
									className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-muted/30"
								>
									<div>
										<div className="font-medium text-foreground">
											{account.name}
											{account.mask && (
												<span className="text-muted-foreground font-mono ml-2">····{account.mask}</span>
											)}
										</div>
										<div className="text-xs text-muted-foreground capitalize">
											{account.type}
											{account.subtype ? ` · ${account.subtype}` : ""}
										</div>
									</div>
									<Badge variant="success">Linked</Badge>
								</div>
							))}
						</div>

						<Link to="/bank" variant="primary">
							Go to Bank Dashboard
						</Link>
					</div>
				)}
			</main>
		</AppLayout>
	);
}
