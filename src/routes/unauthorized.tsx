import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "~/components/layout/AppLayout";
import { Button } from "~/components/ui/Button";

export const Route = createFileRoute("/unauthorized")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	return (
		<AppLayout>
			<main className="flex-1 p-4 sm:p-10 flex flex-col items-center justify-center">
				<div className="bg-zinc-900 rounded-xl shadow-lg p-4 sm:p-8 w-full max-w-2xl text-center border border-zinc-700">
					<h2 className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-2 sm:mb-4">Unauthorized!</h2>
					<p className="text-zinc-300 mb-4 sm:mb-6 text-sm sm:text-base">
						You tried to access a part of the application that you are not authorized to view.
					</p>
					<div className="mt-4 sm:mt-8">
						<Button variant="outline" onClick={() => navigate({ to: "/" })}>
							Go Home
						</Button>
					</div>
				</div>
			</main>
		</AppLayout>
	);
}
