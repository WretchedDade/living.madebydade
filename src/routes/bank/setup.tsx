import { api } from "@/convex/_generated/api";
import { convexAction, useConvexAction, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { AppLayout } from "~/components/layout/AppLayout";
import { showToast } from "~/components/feedback/Toast";
import { Button } from "~/components/ui/Button";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { BuildingLibraryIcon } from "@heroicons/react/24/outline";
import { PlaidItem } from "@/convex/schema";

function BankSetup() {
	const navigate = useNavigate();

	const getLinkToken = useQuery({ ...convexAction(api.plaidItems.getLinkToken, {}), refetchOnWindowFocus: false });

	const createItemMutation = useMutation({
		mutationFn: useConvexAction(api.plaidItems.link),
		onSuccess: (item: PlaidItem) => {
			navigate({ to: "/bank/success/$itemId", params: { itemId: item.itemId } });
			showToast({
				title: `${item.institution?.name ?? "Bank Account"} Linked!`,
				description: `Your bank account with ${item.institution?.name ?? "the institution"} has been successfully linked.`,
				variant: "success",
			});
		},
		onError: error => {
			showToast({
				title: "Error Linking Bank",
				description: error.message || "An error occurred while linking your bank account.",
				variant: "error",
			});
		},
	});

	const { open, ready, error } = usePlaidLink({
		token: getLinkToken.data?.link_token ?? null,
		onSuccess: (publicToken, metadata) => {
			createItemMutation.mutate({
				publicToken,
				institution: metadata.institution
					? {
							id: metadata.institution?.institution_id ?? "",
							name: metadata.institution?.name ?? "",
						}
					: undefined,
				accounts: metadata.accounts.map(account => ({
					id: account.id,
					name: account.name,
					mask: account.mask,
					type: account.type,
					subtype: account.subtype,
					verification_status: account.verification_status,
				})),
			});
		},
		onEvent: (eventName, metadata) => {
			// Optionally handle Plaid events here
		},
		onExit: err => {
			if (err) {
				showToast({
					title: "Plaid Error",
					description: err.display_message || "An error occurred with Plaid.",
					variant: "error",
				});
			}
		},
	});

	useEffect(() => {
		if (getLinkToken.isSuccess && ready && !createItemMutation.isError) {
			open();
		}
	}, [getLinkToken, ready, open, createItemMutation.isError]);

	useEffect(() => {
		if (error) {
			showToast({
				title: "Plaid Error",
				description: error.message || "An error occurred while preparing Plaid Link.",
				variant: "error",
			});
		}
	}, [error]);

	return (
		<AppLayout>
			<main className="flex-1 w-full flex flex-col items-center justify-center p-6 md:p-10">
				{!ready ? (
					<div className="flex flex-col items-center justify-center">
						<ArrowPathIcon className="w-8 h-8 animate-spin text-primary mb-4" />
						<span className="text-muted-foreground">Preparing Plaid Link...</span>
					</div>
				) : (
					<div className="flex flex-col items-center text-center max-w-sm">
						<div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
							<BuildingLibraryIcon className="w-7 h-7 text-primary" />
						</div>
						<h1 className="text-xl font-bold text-foreground mb-3">
							Link Your Bank Account
						</h1>
						<p className="text-muted-foreground text-sm mb-8">
							Securely connect your bank account through Plaid. The connection window will open automatically.
						</p>
						<Button variant="primary" type="button" onClick={() => open()}>
							Launch Plaid Link
						</Button>
					</div>
				)}
			</main>
		</AppLayout>
	);
}

export const Route = createFileRoute("/bank/setup")({
	component: BankSetup,
	loader: async ({ context }) => {
		try {
			await Promise.all([context.queryClient.prefetchQuery(convexAction(api.plaidItems.getLinkToken, {}))]);
		} catch {
			// Auth may not be available during SSR
		}
	},
});
