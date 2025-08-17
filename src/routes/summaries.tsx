import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/convex/_generated/api";
import { AppLayout } from "~/components/layout/AppLayout";
import { SectionHeader } from "~/components/layout/SectionHeader";
import { Button } from "~/components/ui/Button";
import { SciFiBars } from "~/components/ui/SciFiBars";
import { Link } from "~/components/ui/Link";
import { formatCurrency } from "~/utils/formatters";
import { ChartBarIcon } from "@heroicons/react/24/solid";
import { SciFiSheet } from "~/components/feedback/SciFiSheet";
import * as Accordion from "@radix-ui/react-accordion";
import * as Tabs from "@radix-ui/react-tabs";
import { Doc } from "@/convex/_generated/dataModel";
import { PeriodTabs, type Period } from "~/components/ui/PeriodTabs";
import { NetPill } from "~/components/ui/NetPill";
import { StatTile } from "~/components/ui/StatTile";
import { TxnSection } from "~/components/ui/TxnSection";

function SummaryTable({ rows, period }: { rows: Array<Doc<"cashCreditSummaries">>; period: Period }) {
	const [openRowId, setOpenRowId] = useState<string | null>(null);
	const openRow = rows.find((r: Doc<"cashCreditSummaries">) => r._id === openRowId);
	const startDateISO = openRow?.startDate as string | undefined;
	const endDateISO = openRow?.endDate as string | undefined;
	const startDate = startDateISO ? startDateISO.slice(0, 10) : undefined;
	const endDate = endDateISO ? endDateISO.slice(0, 10) : undefined;

	const { data: txnsDataRaw, isLoading: txnsLoading } = useQuery(
		convexQuery(api.transactions.listByDateRange, { startDate, endDate }),
	);
	const txnsData = txnsDataRaw ?? { items: [] as Doc<"transactions">[] };

	if (!rows || rows.length === 0) {
		return <div className="text-zinc-400 italic">No summaries yet.</div>;
	}

	const fmtDate = (iso: string) =>
		new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full text-sm">
				<thead className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700">
					<tr className="text-left text-zinc-100">
						<th className="py-2 pl-4 pr-4 font-semibold text-xs uppercase tracking-wider">Period</th>
						<th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right">Cash In</th>
						<th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right">Cash Out</th>
						<th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right">Savings</th>
						<th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right">Cash Net</th>
						<th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right">CC Purchases</th>
						<th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right">CC Payments</th>
						<th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right">CC Principal Δ</th>
						<th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r, idx) => {
						const cashNet = (r.cashIncomeExternal ?? 0) - (r.cashSpending ?? 0) - (r.cashSavingsContributions ?? 0);
						return (
							<tr
								key={r._id}
								className={`border-t border-zinc-800 ${idx % 2 === 0 ? "bg-zinc-900" : "bg-zinc-900/60"} hover:bg-zinc-800/60 transition-colors`}
							>
								<td className="py-2 pl-4 pr-4 whitespace-nowrap text-zinc-200">
									{(() => {
										if (period === "month") {
											return new Date(r.startDate).toLocaleDateString(undefined, {
												year: "numeric",
												month: "long",
											});
										}
										const fromStr = fmtDate(r.startDate);
										const toStr = fmtDate(r.endDate);
										return fromStr === toStr ? fromStr : `${fromStr} – ${toStr}`;
									})()}
								</td>
								<td className="py-2 pr-4 text-right text-emerald-300">{formatCurrency(r.cashIncomeExternal ?? 0)}</td>
								<td className="py-2 pr-4 text-right text-rose-300">{formatCurrency(r.cashSpending ?? 0)}</td>
								<td className="py-2 pr-4 text-right text-cyan-300">{formatCurrency(r.cashSavingsContributions ?? 0)}</td>
								<td className="py-2 pr-2 text-right"><NetPill net={cashNet} /></td>
								<td className="py-2 pr-4 text-right text-rose-300">{formatCurrency(r.ccPurchases ?? 0)}</td>
								<td className="py-2 pr-4 text-right text-emerald-300">{formatCurrency(r.ccPayments ?? 0)}</td>
								<td className="py-2 pr-4 text-right font-mono">{formatCurrency(r.ccPrincipalDelta ?? 0)}</td>
								<td className="py-2 pr-4 text-right">
									<Button variant="ghost" size="sm" onClick={() => setOpenRowId(r._id)}>View</Button>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>

			<SciFiSheet
				open={!!openRowId}
				onOpenChange={o => !o && setOpenRowId(null)}
				title={(() => {
					if (!openRow) return "Period details";
					const fmt = (iso: string) =>
						new Date(iso).toLocaleDateString(undefined, {
							year: "numeric",
							month: period === "month" ? "long" : "short",
							day: period === "month" ? undefined : "numeric",
						});
					if (period === "month") return fmt(openRow.startDate);
					const fromStr = fmt(openRow.startDate);
					const toStr = fmt(openRow.endDate);
					return fromStr === toStr ? fromStr : `${fromStr} – ${toStr}`;
				})()}
			>
				{!openRow ? (
					<div className="text-zinc-400">No summary selected.</div>
				) : txnsLoading ? (
					<div className="text-zinc-400">Loading…</div>
				) : (
					(() => {
						const items = (txnsData?.items as Doc<"transactions">[]) ?? [];
						const cashTxs = items.filter(t => t.accountType !== "credit");
						const creditTxs = items.filter(t => t.accountType === "credit");

						const cashInflows = cashTxs.filter(t => t.amount < 0 && !t.isInternalTransfer);
						const cashOutflows = cashTxs.filter(t => t.amount > 0 && !t.isInternalTransfer && !t.isCreditCardPayment);
						const cashTransfers = cashTxs.filter(t => t.isInternalTransfer && !t.isCreditCardPayment);
						const ccPaymentsCashSide = cashTxs.filter(t => t.isCreditCardPayment);

						const ccPurchases = creditTxs.filter(t => t.amount > 0 && !t.isRefundOrReversal && !t.isInterestOrFee);
						const ccRefunds = creditTxs.filter(t => t.isRefundOrReversal);
						const ccInterestFees = creditTxs.filter(t => t.isInterestOrFee);
						const ccPaymentsCardSide = creditTxs.filter(
							t => t.amount < 0 && !t.isRefundOrReversal && !t.isInterestOrFee,
						);

						return (
							<Tabs.Root defaultValue="overview" orientation="vertical" className="min-h-0">
								<div className="mt-2 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
									<Tabs.List className="flex md:flex-col gap-2 border-b md:border-b-0 md:border-r border-zinc-800 md:pr-4 overflow-x-auto">
										<Tabs.Trigger className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-300" value="overview">Overview</Tabs.Trigger>
										<Tabs.Trigger className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-300" value="cashIn">Cash In ({cashInflows.length})</Tabs.Trigger>
										<Tabs.Trigger className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-300" value="cashOut">Cash Out ({cashOutflows.length})</Tabs.Trigger>
										<Tabs.Trigger className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-300" value="transfers">Transfers ({cashTransfers.length})</Tabs.Trigger>
										<Tabs.Trigger className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-300" value="ccPaymentsCash">CC Payments (cash) ({ccPaymentsCashSide.length})</Tabs.Trigger>
										<Tabs.Trigger className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-300" value="ccPurchases">CC Purchases ({ccPurchases.length})</Tabs.Trigger>
										<Tabs.Trigger className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-300" value="ccPaymentsCard">CC Payments (card) ({ccPaymentsCardSide.length})</Tabs.Trigger>
										<Tabs.Trigger className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-300" value="ccRefunds">CC Refunds ({ccRefunds.length})</Tabs.Trigger>
										<Tabs.Trigger className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-300" value="ccInterestFees">Interest & Fees ({ccInterestFees.length})</Tabs.Trigger>
									</Tabs.List>
									<div className="min-h-0">
										<Tabs.Content value="overview" className="space-y-4">
											<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
												<StatTile label="Cash In" value={formatCurrency(openRow.cashIncomeExternal ?? 0)} tone="emerald" />
												<StatTile label="Cash Out" value={formatCurrency(openRow.cashSpending ?? 0)} tone="rose" />
												<StatTile label="Savings" value={formatCurrency(openRow.cashSavingsContributions ?? 0)} tone="cyan" />
												<StatTile label="CC Purchases" value={formatCurrency(openRow.ccPurchases ?? 0)} tone="rose" />
												<StatTile label="CC Payments" value={formatCurrency(openRow.ccPayments ?? 0)} tone="emerald" />
												<StatTile label="CC Refunds" value={formatCurrency(openRow.ccRefunds ?? 0)} tone="emerald" />
												<StatTile label="CC Interest/Fees" value={formatCurrency(openRow.ccInterestFees ?? 0)} tone="rose" />
												<StatTile label="CC Principal Δ" value={formatCurrency(openRow.ccPrincipalDelta ?? 0)} extraClassName="col-span-2 sm:col-span-1" />
											</div>
										</Tabs.Content>

										<Tabs.Content value="cashIn" className="space-y-3">
											<TxnSection title="Cash In (external)" txs={cashInflows} />
										</Tabs.Content>
										<Tabs.Content value="cashOut" className="space-y-3">
											<TxnSection title="Cash Out (spending)" txs={cashOutflows} />
										</Tabs.Content>
										<Tabs.Content value="transfers" className="space-y-3">
											<TxnSection title="Internal Transfers (incl. savings)" txs={cashTransfers} />
										</Tabs.Content>
										<Tabs.Content value="ccPaymentsCash" className="space-y-3">
											<TxnSection title="Credit Card Payments (cash side)" txs={ccPaymentsCashSide} />
										</Tabs.Content>
										<Tabs.Content value="ccPurchases" className="space-y-3">
											<TxnSection title="CC Purchases" txs={ccPurchases} />
										</Tabs.Content>
										<Tabs.Content value="ccPaymentsCard" className="space-y-3">
											<TxnSection title="CC Payments (card side credits)" txs={ccPaymentsCardSide} />
										</Tabs.Content>
										<Tabs.Content value="ccRefunds" className="space-y-3">
											<TxnSection title="CC Refunds" txs={ccRefunds} />
										</Tabs.Content>
										<Tabs.Content value="ccInterestFees" className="space-y-3">
											<TxnSection title="CC Interest & Fees" txs={ccInterestFees} />
										</Tabs.Content>
									</div>
								</div>
							</Tabs.Root>
						);
					})()
				)}
			</SciFiSheet>
		</div>
	);
}

function RouteComponent() {
	const [period, setPeriod] = useState<Period>("month");
	const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
	const currentCursor = cursorStack[cursorStack.length - 1];

	const { data, isLoading } = useQuery(
		convexQuery(api.cashCreditSummaries.listByPeriod, {
			period,
			pageSize: 30,
			cursor: currentCursor,
		}),
	);

	const rows = (data?.page as Array<Doc<"cashCreditSummaries">>) ?? [];

	return (
		<AppLayout>
			<main className="flex-1 w-full min-h-0 overflow-y-auto p-4 sm:p-10 space-y-6">
				<div className="flex items-center justify-between">
					<SectionHeader icon={<ChartBarIcon className="w-4 h-4 sm:w-7 sm:h-7 text-yellow-400" />} title="Cash vs Credit Summaries" />
					<Link to="/" variant="ghost">Home</Link>
				</div>

				<SciFiBars count={8} />

				<div className="flex flex-wrap items-center gap-3">
					<span className="text-zinc-300">Period:</span>
					<PeriodTabs
						value={period}
						onChange={p => {
							setPeriod(p);
							setCursorStack([null]);
						}}
					/>

					<div className="ml-auto flex items-center gap-2">
						<Button
							variant="subtle"
							size="sm"
							disabled={cursorStack.length <= 1}
							onClick={() => setCursorStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev))}
						>
							Previous
						</Button>
						<Button
							variant="subtle"
							size="sm"
							disabled={data?.isDone ?? true}
							onClick={() => {
								if (data?.cursor) setCursorStack(prev => [...prev, data.cursor]);
							}}
						>
							Next
						</Button>
					</div>
				</div>

				<Accordion.Root type="single" collapsible defaultValue="howto" className="rounded-lg border border-zinc-800 bg-zinc-900/70">
					<Accordion.Item value="howto">
						<Accordion.Trigger className="group flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-zinc-100 cursor-pointer">
							<span>How to read this table</span>
							<svg className="h-4 w-4 text-zinc-400 transition-transform duration-200 group-data-[state=open]:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.147l3.71-3.916a.75.75 0 111.08 1.04l-4.24 4.47a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
							</svg>
						</Accordion.Trigger>
						<Accordion.Content className="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden border-t border-zinc-800">
							<div className="p-4 text-sm text-zinc-200 space-y-4">
								<div className="grid gap-2 sm:grid-cols-2">
									<div className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
										<div className="mb-2 text-xs uppercase tracking-wide text-zinc-400">Cash</div>
										<ul className="space-y-1 text-zinc-300">
											<li>
												<span className="rounded-full border border-emerald-600/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">Cash In</span>{" "}
												External inflows (paychecks, transfers in).
											</li>
											<li>
												<span className="rounded-full border border-rose-600/40 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300">Cash Out</span>{" "}
												Cash-basis spending from checking/savings.
											</li>
											<li>
												<span className="rounded-full border border-cyan-600/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-300">Savings</span>{" "}
												Net moved into savings accounts.
											</li>
										</ul>
									</div>
									<div className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
										<div className="mb-2 text-xs uppercase tracking-wide text-zinc-400">Credit Cards</div>
										<ul className="space-y-1 text-zinc-300">
											<li>
												<span className="rounded-full border border-rose-600/40 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300">CC Purchases</span>{" "}
												New charges on the card.
											</li>
											<li>
												<span className="rounded-full border border-emerald-600/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">CC Payments</span>{" "}
												Principal paid from cash.
											</li>
											<li>
												<span className="rounded-full border border-emerald-600/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">CC Refunds</span>{" "}
												Returns/credits back to the card.
											</li>
											<li>
												<span className="rounded-full border border-rose-600/40 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300">Interest/Fees</span>{" "}
												Cost of borrowing (not principal).
											</li>
										</ul>
									</div>
								</div>

								<div className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
									<div className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Formulas</div>
									<ul className="list-disc pl-5 space-y-1 text-zinc-300">
										<li>
											<span className="font-semibold">Cash Net (cash-only)</span> = Cash In − Cash Out − Savings
										</li>
										<li>
											<span className="font-semibold">Include CC Payments in cash movement</span>: Cash Net − CC Payments
										</li>
										<li>
											<span className="font-semibold">CC Principal Δ</span> = CC Purchases − CC Payments − CC Refunds
										</li>
									</ul>
								</div>

								<div className="rounded-md border border-zinc-800 bg-zinc-900 p-3 text-zinc-300">
									<div className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Tips</div>
									<ul className="list-disc pl-5 space-y-1">
										<li>Values are shown as positive magnitudes for readability.</li>
										<li>Cash Net is cash-basis. CC Payments reduce cash but also reduce card principal (shown separately).</li>
										<li>If available, compare observed balance delta with Cash Net to spot timing/classification gaps.</li>
									</ul>
								</div>
							</div>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion.Root>

				{isLoading ? <div className="text-zinc-400">Loading…</div> : <SummaryTable rows={rows} period={period} />}
			</main>
		</AppLayout>
	);
}

export const Route = createFileRoute("/summaries")({ component: RouteComponent });
