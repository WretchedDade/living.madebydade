import { ReactElement } from "react";
import { formatCurrency } from "~/utils/formatters";
import type { Doc } from "@/convex/_generated/dataModel";
import { PillBadge } from "./PillBadge";

export function TxnSection({ title, txs }: { title: string; txs: Doc<"transactions">[] }): ReactElement {
	return (
		<div className="rounded-md border border-zinc-800 bg-zinc-900/70 overflow-x-hidden">
			<div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
				<div className="text-zinc-200 text-sm font-medium">{title}</div>
				<div className="text-zinc-400 text-xs font-mono">
					{formatCurrency(txs.reduce((s, t) => s + t.amount, 0))}
				</div>
			</div>
			<div className="divide-y divide-zinc-800 overflow-x-hidden">
				{txs.map(t => (
					<div key={t._id} className="flex w-full items-center justify-between gap-3 px-3 py-2">
						<div className="flex-1 min-w-0 pr-2">
							<div
								className="truncate text-zinc-100 text-sm w-full max-w-[40ch] md:max-w-[56ch]"
								title={t.merchantName ?? t.name}
							>
								{t.merchantName ?? t.name}
							</div>
							<div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-zinc-400">
								<span>{new Date(t.authorizedDate ?? t.date).toLocaleDateString()}</span>
								{t.accountType ? <PillBadge label={t.accountType} /> : null}
								{t.isCreditCardPayment ? <PillBadge label="cc payment" /> : null}
								{t.isRefundOrReversal ? <PillBadge label="refund" tone="good" /> : null}
								{t.isInterestOrFee ? <PillBadge label="interest/fee" tone="bad" /> : null}
								{t.isInternalTransfer ? <PillBadge label="transfer" /> : null}
							</div>
						</div>
						<div
							className={`shrink-0 text-right font-mono ${t.amount < 0 ? "text-emerald-300" : "text-rose-300"}`}
						>
							{formatCurrency(t.amount)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
