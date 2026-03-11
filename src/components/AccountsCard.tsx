import { useQuery, useQueryClient } from "@tanstack/react-query";
import { convexAction } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { Account } from "@/convex/accounts";
import { Link } from "~/components/ui/Link";
import { Button } from "~/components/ui/Button";
import { Skeleton } from "~/components/ui/Skeleton";
import { BuildingLibraryIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { CreditCardIcon, BanknoteIcon, WalletIcon } from "lucide-react";
import { useState, useEffect } from "react";

function formatBalance(amount: number | null | undefined, currency: string = "USD") {
	if (typeof amount !== "number") return "—";
	return amount.toLocaleString("en-US", {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
	});
}

function AccountIcon({ subtype }: { subtype: string | undefined }) {
	const cls = "w-5 h-5";
	switch (subtype) {
		case "checking":
			return <WalletIcon className={`${cls} text-success`} />;
		case "savings":
			return <BanknoteIcon className={`${cls} text-info`} />;
		case "credit card":
			return <CreditCardIcon className={`${cls} text-warning`} />;
		default:
			return <WalletIcon className={`${cls} text-muted-foreground`} />;
	}
}

function formatSubtype(subtype: string | undefined) {
	if (!subtype) return "";
	return subtype.charAt(0).toUpperCase() + subtype.slice(1);
}

export function AccountsCard() {
	const [bypassCache, setBypassCache] = useState(false);
	const accountsQuery = useQuery(convexAction(api.accounts.get, { bypassCache }));

	useEffect(() => {
		setBypassCache(false);
	}, [accountsQuery.dataUpdatedAt]);

	const accounts = (accountsQuery.data as Account[] | undefined) ?? [];

	return (
		<div className="bg-card rounded-xl card-elevated overflow-hidden">
			<div className="h-1 bg-gradient-to-r from-info/60 to-info/20" />
			<div className="p-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-base font-bold text-foreground flex items-center gap-2.5">
						<BuildingLibraryIcon className="w-[18px] h-[18px] text-info shrink-0" />
						<span>Accounts</span>
					</h3>
					<Button
						variant="ghost"
						size="sm"
						icon
						className="text-muted-foreground"
						onClick={() => setBypassCache(true)}
						disabled={bypassCache}
						aria-label="Refresh"
					>
						<ArrowPathIcon className={`w-3.5 h-3.5 ${bypassCache ? "animate-spin" : ""}`} />
					</Button>
				</div>

			{accountsQuery.isLoading ? (
				<div className="space-y-3">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="flex items-center justify-between">
							<Skeleton className="w-24 h-4" />
							<Skeleton className="w-20 h-4" />
						</div>
					))}
				</div>
			) : accounts.length === 0 ? (
				<div className="text-center py-8">
					<BuildingLibraryIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
					<p className="text-muted-foreground text-sm mb-3">No accounts linked yet</p>
					<Link to="/bank/setup" variant="primary" size="sm">
						Link Account
					</Link>
				</div>
			) : (
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
								className="flex items-center justify-between py-3 px-3.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
							>
								<div className="flex items-center gap-3 min-w-0">
									<AccountIcon subtype={account.subtype} />
									<div className="min-w-0">
										<div className="text-sm font-medium text-foreground truncate">
											{account.institution?.name ?? formatSubtype(account.subtype)}
										</div>
										<div className="text-xs text-muted-foreground">
											{formatSubtype(account.subtype)}
											{account.mask && <span> ····{account.mask}</span>}
										</div>
									</div>
								</div>
								<span
									className={`font-semibold text-sm tabular-nums shrink-0 ${
										isCredit && (primaryAmount ?? 0) > 0
											? "text-destructive"
											: "text-success"
									}`}
								>
									{isCredit && (primaryAmount ?? 0) > 0 && "-"}
									{formatBalance(
										isCredit ? Math.abs(primaryAmount ?? 0) : primaryAmount,
										currency,
									)}
								</span>
							</div>
						);
					})}
				</div>
			)}
			</div>
		</div>
	);
}
