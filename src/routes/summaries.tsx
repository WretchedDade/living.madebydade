import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "~/components/layout/AppLayout";
import { WrenchIcon } from "lucide-react";
import { Link } from "~/components/ui/Link";

function SpendingPage() {
	return (
		<AppLayout>
			<main className="flex-1 w-full flex flex-col items-center justify-center p-6 md:p-10 min-h-[80vh]">
				<div className="flex flex-col items-center text-center max-w-sm">
					<div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
						<WrenchIcon className="w-7 h-7 text-primary" />
					</div>
					<h1 className="text-xl font-bold text-foreground mb-3">Spending Dashboard</h1>
					<p className="text-muted-foreground text-sm mb-3">
						We're rebuilding the spending view with category breakdowns, essential vs non-essential
						tracking, and month-over-month comparisons.
					</p>
					<p className="text-muted-foreground text-xs mb-8">Coming soon ✨</p>
					<Link to="/" variant="ghost">
						Back to Home
					</Link>
				</div>
			</main>
		</AppLayout>
	);
}

export const Route = createFileRoute("/summaries")({
	component: SpendingPage,
});
