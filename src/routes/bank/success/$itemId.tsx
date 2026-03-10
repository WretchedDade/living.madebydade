import { api } from "@/convex/_generated/api";
import type { Account } from "@/convex/accounts";
import { convexAction } from "@convex-dev/react-query";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";

import { AppLayout } from "~/components/layout/AppLayout";
import { SciFiBars } from "~/components/ui/SciFiBars";
import { Badge } from "~/components/ui/Badge";
import { Skeleton } from "~/components/ui/Skeleton";
import { Button } from "~/components/ui/Button";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "~/components/ui/Link";

export const Route = createFileRoute("/bank/success/$itemId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { itemId } = Route.useParams();
	const query = useQuery(convexAction(api.accounts.getById, { itemId }));

	if (query.isLoading) return <BankAccountsSkeleton />;
	if (query.isError) return <BankAccountsError error={query.error} />;
	if (query.isSuccess) return <BankAccountsList data={query.data} />;
	return null;
}

interface BankAccountsLayoutProps {
	children: React.ReactNode;
	sectionClassName?: string;
}
function BankAccountsLayout({ children, sectionClassName }: BankAccountsLayoutProps) {
	const navigate = useNavigate();
	return (
		<AppLayout>
			<main className="w-full max-w-2xl mx-auto p-4 flex flex-col justify-center grow">
				<SciFiBars count={7} className="mb-6" />
				<section
					className={`bg-card rounded-2xl shadow-lg p-0 w-full overflow-hidden ${sectionClassName ?? ""}`}
				>
					<div className="p-8">{children}</div>
					<div className="border-t border-border bg-card/70 px-8 py-4 flex flex-col sm:flex-row sm:justify-end items-stretch gap-2">
						<Link to="/bank" variant="primary" color="emerald" className="w-full sm:w-auto">
							Go to Bank Dashboard
						</Link>
					</div>
				</section>
				<SciFiBars count={12} className="mt-8" />
			</main>
		</AppLayout>
	);
}

function BankAccountsSkeleton() {
	return (
		<BankAccountsLayout>
			<Skeleton className="h-7 w-60 mb-4" />
			<Skeleton className="h-5 w-40 mb-6" />
			<div className="w-full flex flex-col gap-4">
				{[...Array(3)].map((_, i) => (
					<div
						key={i}
						className="bg-muted rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-2 border border-border"
					>
						<div className="flex-1">
							<Skeleton className="h-5 w-40 mb-2" />
							<Skeleton className="h-4 w-24" />
						</div>
						<Skeleton className="h-6 w-16 ml-auto mt-2 sm:mt-0" />
					</div>
				))}
			</div>
		</BankAccountsLayout>
	);
}

function BankAccountsError({ error }: { error: Error }) {
	return (
		<BankAccountsLayout sectionClassName="flex flex-col items-center">
			<h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
			<p className="text-muted-foreground mb-4 text-center">
				We couldn't load your linked accounts. Please try again or contact support if the problem persists.
			</p>
			{error && (
				<div className="text-red-400 text-sm bg-red-950/60 rounded p-2 w-full text-center">{error.message}</div>
			)}
		</BankAccountsLayout>
	);
}

function BankAccountsList({ data }: { data: Account[] }) {
	const institutionName = data[0]?.institution?.name;

	return (
		<BankAccountsLayout>
			<h1 className="text-2xl font-bold text-primary mb-2">Bank Linked Successfully!</h1>
			{institutionName && (
				<div className="text-primary mb-2 text-lg font-semibold">{institutionName}</div>
			)}
			<p className="text-muted-foreground mb-6">Your bank account has been linked. Here are the accounts we found:</p>
			<div className="w-full flex flex-col gap-4">
				{data.length > 0 ? (
					data.map((account) => (
						<div
							key={account.account_id}
							className="bg-muted rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-2 border border-border"
						>
							<div className="flex-1">
								<div className="font-semibold text-primary text-lg">
									{account.name} <span className="text-muted-foreground font-mono">•••{account.mask}</span>
								</div>
								<div className="text-muted-foreground text-sm capitalize">
									{account.type}
									{account.subtype ? ` • ${account.subtype}` : ""}
								</div>
							</div>
							<span style={{ marginLeft: "auto", marginTop: "0.5rem" }}>
								<Badge variant="success">Linked</Badge>
							</span>
						</div>
					))
				) : (
					<div className="text-muted-foreground">No accounts found.</div>
				)}
			</div>
		</BankAccountsLayout>
	);
}
