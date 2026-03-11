import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "~/components/layout/AppLayout";
import { AccountsCard } from "~/components/AccountsCard";
import { Link } from "~/components/ui/Link";
import { PlusIcon } from "@heroicons/react/24/solid";

export const Route = createFileRoute("/bank/")({
	component: BankPage,
});

function BankPage() {
	return (
		<AppLayout>
			<main className="flex-1 w-full min-h-0 p-4 md:p-6 lg:p-8">
				<div className="max-w-3xl mx-auto">
					<div className="flex items-center justify-between mb-6">
						<h1 className="text-xl font-bold text-foreground">Bank</h1>
						<Link to="/bank/setup" variant="primary" size="sm">
							<PlusIcon className="w-4 h-4" />
							Link Account
						</Link>
					</div>
					<AccountsCard />
				</div>
			</main>
		</AppLayout>
	);
}
