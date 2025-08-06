import { api } from "@/convex/_generated/api";
import { convexAction, useConvexAction, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { AppLayout } from "~/components/layout/AppLayout";
import { showToast } from "~/components/feedback/SciFiToast";
import { Button } from "~/components/ui/Button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { MissionBanner } from "~/components/ui/MissionBanner";
import { SciFiBars } from "~/components/ui/SciFiBars";
import { PlaidItem } from "@/convex/schema";

function BankSetup() {
    const navigate = useNavigate();

    const getLinkToken = useQuery({ ...convexAction(api.plaidItems.getLinkToken, {}), refetchOnWindowFocus: false });

    const createItemMutation = useMutation({
        mutationFn: useConvexAction(api.plaidItems.linkPlaidItem),
        onSuccess: (item: PlaidItem) => {
            navigate({ to: '/bank/success/$itemId', params: { itemId: item.itemId } });
            showToast({
                title: `${item.institution?.name ?? "Bank Account"} Linked!`,
                description: `Your bank account with ${item.institution?.name ?? "the institution"} has been successfully linked.`,
                variant: "success",
            });
        },
        onError: (error) => {
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
                institution: metadata.institution ? {
                    id: metadata.institution?.institution_id ?? "",
                    name: metadata.institution?.name ?? "",
                } : undefined,
                accounts: metadata.accounts.map((account) => ({
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
        onExit: (err) => {
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
            <main className="flex flex-col items-center justify-center min-h-[60vh] p-4 w-full">
                <div className="bg-zinc-900 rounded-2xl shadow-lg p-8 max-w-md w-full flex flex-col items-center">
                    <SciFiBars count={7} className="mb-8" />
                    {!ready ? (
                        <div className="flex flex-col items-center justify-center h-48">
                            <ReloadIcon className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
                            <span className="text-cyan-300 text-base">Preparing Plaid Link...</span>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold text-cyan-400 mb-4 text-center">Link Your Bank Account</h1>
                            <p className="text-zinc-300 text-center mb-6">Securely connect your bank account to get started. The Plaid window will open automatically. If it doesn't, please check your popup blocker.</p>
                            <Button
                                variant="subtle"
                                type="button"
                                onClick={() => open()}
                                className="mb-4"
                            >
                                Launch Plaid Link
                            </Button>
                        </>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}

export const Route = createFileRoute("/bank/setup")({
    component: BankSetup,
    loader: async ({ context }) => {
        await Promise.all([
            context.queryClient.prefetchQuery(convexAction(api.plaidItems.getLinkToken, {})),
        ]);
    },
});
