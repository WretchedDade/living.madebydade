import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "~/components/layout/AppLayout";
import { Link } from "~/components/ui/Link";
import { PlusIcon } from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { convexAction } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { Account } from "@/convex/accounts";
import { Button } from "~/components/ui/Button";
import { Skeleton } from "~/components/ui/Skeleton";
import { BuildingLibraryIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { CreditCardIcon, BanknoteIcon, WalletIcon } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/bank/")({
	component: BankPage,
});

function formatBalance(amount: number | null | undefined, currency: string = "USD") {
	if (typeof amount !== "number") return "—";
	return amount.toLocaleString("en-US", { style: "currency", currency, minimumFractionDigits: 2 });
}

function AccountIcon({ subtype }: { subtype: string | undefined }) {
	const cls = "w-5 h-5";
	switch (subtype) {
		case "checking": return <WalletIcon className={`${cls} text-success`} />;
		case "savings": return <BanknoteIcon className={`${cls} text-info`} />;
		case "credit card": return <CreditCardIcon className={`${cls} text-warning`} />;
		default: return <WalletIcon className={`${cls} text-muted-foreground`} />;
	}
}

function BankPage() {
	const [bypassCache, setBypassCache] = useState(false);
	const accountsQuery = useQuery(convexAction(api.accounts.get, { bypassCache }));
	const accounts = (accountsQuery.data as Account[] | undefined) ?? [];

	useEffect(() => { setBypassCache(false); }, [accountsQuery.dataUpdatedAt]);

	const totalBalance = accounts.reduce((sum, a) => {
		const bal = a.subtype === "checking" && typeof a.balances?.available === "number"
			? a.balances.available
			: a.balances?.current ?? 0;
		return sum + (a.type === "credit" ? -Math.abs(bal) : bal);
	}, 0);

	return (
		<AppLayout>
			<main className="flex-1 w-full relative overflow-hidden min-h-screen">
				{/* Hero */}
				<div className="relative px-5 md:px-10 lg:px-12 pt-16 md:pt-24 pb-10 md:pb-12 bg-gradient-to-br from-secondary/8 via-card to-primary/6 overflow-hidden">
					{/* Decorative blur */}
					<div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-secondary/10 blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
					<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
						<div>
							<p className="text-sm font-semibold text-muted-foreground mb-1">Connected Accounts</p>
							{accounts.length > 0 ? (
								<>
									<div className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
										{accounts.length} Account{accounts.length !== 1 ? "s" : ""}
									</div>
									<p className="text-xs sm:text-sm text-muted-foreground mt-2">
										Linked via Plaid
									</p>
								</>
							) : (
								<div className="text-2xl font-bold text-foreground mt-1">No accounts linked</div>
							)}
						</div>
					</div>
				</div>

				{/* Account list */}
				<div className="relative px-5 md:px-10 lg:px-12 py-6 md:py-8 flex-1">
					{accountsQuery.isLoading ? (
						<div className="space-y-3">
							{[...Array(3)].map((_, i) => (
								<div key={i} className="flex items-center justify-between py-4 px-4">
									<div className="flex items-center gap-3">
										<Skeleton className="w-5 h-5 rounded" />
										<div>
											<Skeleton className="w-32 h-4 mb-1.5" />
											<Skeleton className="w-20 h-3" />
										</div>
									</div>
									<Skeleton className="w-24 h-5" />
								</div>
							))}
						</div>
					) : accounts.length === 0 ? (
						<div className="flex flex-col items-center justify-center text-center min-h-[40vh]">
							<div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
								<BuildingLibraryIcon className="w-7 h-7 text-primary" />
							</div>
							<h2 className="text-lg font-bold text-foreground mb-3">Link your first account</h2>
							<p className="text-muted-foreground text-sm mb-8 max-w-xs">
								Connect your bank to see balances, track spending, and calculate your available money.
							</p>
							<Link to="/bank/setup" variant="primary">
								Get Started
							</Link>
						</div>
					) : (
						<>
							<div className="space-y-1.5">
								{accounts.map(account => {
								const primaryAmount =
									account.subtype === "checking" && typeof account.balances?.available === "number"
										? account.balances.available
										: account.balances?.current ?? null;
								const currency = account.balances?.iso_currency_code || "USD";
								const isCredit = account.type === "credit";

								return (
									<div
										key={account.account_id}
										className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-muted/40 transition-colors"
									>
										<div className="flex items-center gap-3 min-w-0">
											<AccountIcon subtype={account.subtype} />
											<div className="min-w-0">
												<div className="font-medium text-foreground truncate">
													{account.institution?.name ?? account.name}
												</div>
												<div className="text-xs text-muted-foreground">
													{account.subtype && <span className="capitalize">{account.subtype}</span>}
													{account.mask && <span> ····{account.mask}</span>}
												</div>
											</div>
										</div>
										<span
											style={{
												color: isCredit && (primaryAmount ?? 0) > 0
													? "hsl(var(--destructive))"
													: "hsl(var(--success))",
											}}
											className="font-semibold tabular-nums shrink-0"
										>
											{isCredit && (primaryAmount ?? 0) > 0 && "-"}
											{formatBalance(isCredit ? Math.abs(primaryAmount ?? 0) : primaryAmount, currency)}
										</span>
									</div>
								);
							})}
							</div>

							{/* Actions below the list */}
							<div className="h-px bg-primary/15 mt-8" />
							<div className="flex items-center gap-3 mt-4">
								<Link to="/bank/setup" variant="ghost">
									<PlusIcon className="w-5 h-5" />
									Link Another Account
								</Link>
								<Button
									variant="ghost"
									onClick={() => setBypassCache(true)}
									disabled={bypassCache}
								>
									<ArrowPathIcon className={`w-5 h-5 ${bypassCache ? "animate-spin" : ""}`} />
									Refresh
								</Button>
							</div>
						</>
					)}
				</div>
			</main>
		</AppLayout>
	);
}
