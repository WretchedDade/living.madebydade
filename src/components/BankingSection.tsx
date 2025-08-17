import { SectionHeader } from "~/components/layout/SectionHeader";
import { IdCardIcon } from "@radix-ui/react-icons";
import { Link } from "~/components/ui/Link";
import { useQuery } from "@tanstack/react-query";
import { convexAction } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { Account } from "@/convex/accounts";

function formatBalance(amount: number | null | undefined, currency: string | undefined = "USD") {
	if (typeof amount !== "number") return "Balance unavailable";
	return amount.toLocaleString(undefined, {
		style: "currency",
		currency: currency || "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

function AccountCard({ account }: { account: Account }) {
	const primaryAmount =
		account.subtype === "checking" && typeof account.balances.available === "number"
			? account.balances.available
			: account.balances.current;

	const currency = account.balances.iso_currency_code || "USD";

	return (
		<div key={account.account_id} className="bg-zinc-800 rounded-xl shadow p-4">
			{account.institution != null ? (
				<div className="flex items-center gap-3 mb-2">
					<span className="font-bold text-cyan-300 text-lg">{account.institution.name}</span>
				</div>
			) : null}
			<div className="flex items-center justify-between mb-1">
				<span className="font-semibold text-cyan-200">{account.name}</span>
				<span className="font-mono text-cyan-100 text-base">{formatBalance(primaryAmount, currency)}</span>
			</div>
			<div className="flex flex-wrap gap-2 text-xs text-zinc-400">
				{account.subtype && <span className="capitalize">{account.subtype}</span>}
				{account.mask && <span>••••{account.mask}</span>}
			</div>
			{typeof account.balances.available === "number" &&
				account.balances.available !== account.balances.current &&
				account.subtype !== "checking" && (
					<div className="text-xs text-zinc-500 mt-1">
						Available: {formatBalance(account.balances.available, currency)}
					</div>
				)}
			{typeof account.balances.limit === "number" && (
				<div className="text-xs text-zinc-500 mt-1">
					Limit: {formatBalance(account.balances.limit, currency)}
				</div>
			)}
		</div>
	);
}

export function BankingSection() {
	const accountsQuery = useQuery(convexAction(api.accounts.get, {}));
	return (
		<div className="flex flex-col flex-1 bg-zinc-900 rounded-2xl p-6 shadow-lg">
			<SectionHeader
				icon={
					<IdCardIcon className="w-4 h-4 sm:w-7 sm:h-7 text-yellow-400 drop-shadow-[0_0_6px_rgba(253,224,71,0.7)]" />
				}
				title="Linked Accounts"
			/>
			{accountsQuery.isSuccess && accountsQuery.data.length === 0 && (
				<div className="items-center justify-center flex flex-col grow w-full">
					<div className="flex flex-col items-center justify-center my-auto py-8">
						<IdCardIcon className="w-8 h-8 text-cyan-400 mb-2" />
						<p className="text-zinc-300 text-center text-lg italic mb-2">No bank accounts linked yet</p>
						<Link href="/bank/setup">Link your bank account</Link>
					</div>
				</div>
			)}
			{accountsQuery.isSuccess && accountsQuery.data.length > 0 && (
				<div className="flex flex-col gap-4 w-full mt-4">
					{accountsQuery.data.map(account => (
						<AccountCard key={account.account_id} account={account} />
					))}
				</div>
			)}
		</div>
	);
}
