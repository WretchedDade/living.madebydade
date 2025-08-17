import { useMemo, useState } from "react";

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
import { ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/solid";
import { SciFiDialog } from "~/components/feedback/SciFiDialog";
import * as Accordion from "@radix-ui/react-accordion";
import { Doc } from "@/convex/_generated/dataModel";

type Period = "day" | "week" | "month";

function PeriodTabs({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
	const tabs: Period[] = ["day", "week", "month"];
	return (
		<div className="inline-flex rounded-lg overflow-hidden border border-zinc-700">
			{tabs.map(p => (
				<button
					key={p}
					className={`px-3 py-1 text-sm capitalize ${value === p ? "bg-cyan-600 text-white" : "bg-zinc-800 text-zinc-200"}`}
					onClick={() => onChange(p)}
				>
					{p}
				</button>
			))}
		</div>
	);
}

function SummaryTable({ rows, period }: { rows: Array<Doc<"cashCreditSummaries">>; period: Period }) {
	const [openRowId, setOpenRowId] = useState<string | null>(null);
	const openRow = rows.find((r: Doc<"cashCreditSummaries">) => r._id === openRowId);
	const startDateISO = openRow?.startDate as string | undefined;
	const endDateISO = openRow?.endDate as string | undefined;
	const startDate = startDateISO ? startDateISO.slice(0, 10) : undefined;
	const endDate = endDateISO ? endDateISO.slice(0, 10) : undefined;

	const { data: txnsDataRaw, isLoading: txnsLoading } = useQuery({
		...convexQuery(api.transactions.listByDateRange, { startDate, endDate }),
		enabled: startDate != null && endDate != null,
	});
	const txnsData = txnsDataRaw ?? { items: [] as Doc<"transactions">[] };
	if (!rows || rows.length === 0) {
		return <div className="text-zinc-400 italic">No summaries yet.</div>;
	}
	const fmtDate = (iso: string) =>
		new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

	const NetPill = ({ net }: { net: number }) => {
		const positive = net >= 0;
		const Icon = positive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
		const tone = positive
			? "text-emerald-300 bg-emerald-500/10 border-emerald-600/40"
			: "text-rose-300 bg-rose-500/10 border-rose-600/40";
		return (
			<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${tone} font-mono`}>
				<Icon className="w-4 h-4" />
				{formatCurrency(net)}
			</span>
		);
	};
	return (
		<div className="overflow-x-auto">
			<table className="min-w-full text-sm">
				<thead className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700">
					<tr className="text-left text-zinc-100">
						<th className="py-2 pl-4 pr-4 font-semibold text-xs uppercase tracking-wider">Period</th>
						<th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right">Cash In</th>
						<th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right">
							Cash Out
						</th>
						<th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right">Savings</th>
						<th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right">
							Cash Net
						</th>
						<th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right">
							CC Purchases
						</th>
						<th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right">
							CC Payments
						</th>
						<th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right">
							CC Principal Δ
						</th>
						<th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r, idx) => {
						const cashNet =
							(r.cashIncomeExternal ?? 0) - (r.cashSpending ?? 0) - (r.cashSavingsContributions ?? 0);
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
								<td className="py-2 pr-4 text-right text-emerald-300">
									{formatCurrency(r.cashIncomeExternal ?? 0)}
								</td>
								<td className="py-2 pr-4 text-right text-rose-300">
									{formatCurrency(r.cashSpending ?? 0)}
								</td>
								<td className="py-2 pr-4 text-right text-cyan-300">
									{formatCurrency(r.cashSavingsContributions ?? 0)}
								</td>
								<td className="py-2 pr-2 text-right">
									<NetPill net={cashNet} />
								</td>
								<td className="py-2 pr-4 text-right text-rose-300">
									{formatCurrency(r.ccPurchases ?? 0)}
								</td>
								<td className="py-2 pr-4 text-right text-emerald-300">
									{formatCurrency(r.ccPayments ?? 0)}
								</td>
								<td className="py-2 pr-4 text-right font-mono">
									{formatCurrency(r.ccPrincipalDelta ?? 0)}
								</td>
								<td className="py-2 pr-4 text-right">
									<Button variant="ghost" size="sm" onClick={() => setOpenRowId(r._id)}>
										View
									</Button>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			<SciFiDialog open={!!openRowId} onOpenChange={o => !o && setOpenRowId(null)} title="Period details">
				{!openRow ? (
					<div className="text-zinc-400">No summary selected.</div>
				) : txnsLoading ? (
					<div className="text-zinc-400">Loading…</div>
				) : (
					<div className="space-y-4">
						{/* Top-level period summary aligned with cashCreditSummaries */}
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
							<div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
								<div className="text-zinc-400">Cash In</div>
								<div className="text-emerald-300 font-mono">
									{formatCurrency(openRow.cashIncomeExternal ?? 0)}
								</div>
							</div>
							<div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
								<div className="text-zinc-400">Cash Out</div>
								<div className="text-rose-300 font-mono">
									{formatCurrency(openRow.cashSpending ?? 0)}
								</div>
							</div>
							<div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
								<div className="text-zinc-400">Savings</div>
								<div className="text-cyan-300 font-mono">
									{formatCurrency(openRow.cashSavingsContributions ?? 0)}
								</div>
							</div>
							<div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
								<div className="text-zinc-400">CC Purchases</div>
								<div className="text-rose-300 font-mono">
									{formatCurrency(openRow.ccPurchases ?? 0)}
								</div>
							</div>
							<div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
								<div className="text-zinc-400">CC Payments</div>
								<div className="text-emerald-300 font-mono">
									{formatCurrency(openRow.ccPayments ?? 0)}
								</div>
							</div>
							<div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
								<div className="text-zinc-400">CC Refunds</div>
								<div className="text-emerald-300 font-mono">
									{formatCurrency(openRow.ccRefunds ?? 0)}
								</div>
							</div>
							<div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
								<div className="text-zinc-400">CC Interest/Fees</div>
								<div className="text-rose-300 font-mono">
									{formatCurrency(openRow.ccInterestFees ?? 0)}
								</div>
							</div>
							<div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2 col-span-2 sm:col-span-1">
								<div className="text-zinc-400">CC Principal Δ</div>
								<div className="text-zinc-100 font-mono">
									{formatCurrency(openRow.ccPrincipalDelta ?? 0)}
								</div>
							</div>
						</div>

						{(txnsData?.items?.length ?? 0) === 0 ? (
							<div className="text-zinc-400">No transactions available for this period.</div>
						) : (
							<div className="space-y-3 max-h-80 overflow-y-auto pr-2">
								{(() => {
									const items = txnsData.items as Doc<"transactions">[];

									// Helpers
									const badge = (label: string, tone: "neutral" | "good" | "bad" = "neutral") => (
										<span
											className={
												`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ` +
												(tone === "good"
													? "border-emerald-600/40 bg-emerald-500/10 text-emerald-300"
													: tone === "bad"
														? "border-rose-600/40 bg-rose-500/10 text-rose-300"
														: "border-zinc-600/40 bg-zinc-700/20 text-zinc-300")
											}
										>
											{label}
										</span>
									);

									const section = (title: string, txs: Doc<"transactions">[]) => (
										<div className="rounded-md border border-zinc-800 bg-zinc-900/70">
											<div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
												<div className="text-zinc-200 text-sm font-medium">{title}</div>
												<div className="text-zinc-400 text-xs font-mono">
													{formatCurrency(txs.reduce((s, t) => s + t.amount, 0))}
												</div>
											</div>
											<div className="divide-y divide-zinc-800">
												{txs.map(t => (
													<div
														key={t._id}
														className="flex items-center justify-between px-3 py-2"
													>
														<div className="min-w-0 pr-2">
															<div className="truncate text-zinc-100 text-sm">
																{t.merchantName ?? t.name}
															</div>
															<div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-zinc-400">
																<span>
																	{new Date(
																		t.authorizedDate ?? t.date,
																	).toLocaleDateString()}
																</span>
																{t.accountType ? badge(t.accountType) : null}
																{t.isCreditCardPayment ? badge("cc payment") : null}
																{t.isRefundOrReversal ? badge("refund", "good") : null}
																{t.isInterestOrFee
																	? badge("interest/fee", "bad")
																	: null}
																{t.isInternalTransfer ? badge("transfer") : null}
															</div>
														</div>
														<div
															className={`shrink-0 font-mono ${t.amount < 0 ? "text-emerald-300" : "text-rose-300"}`}
														>
															{formatCurrency(t.amount)}
														</div>
													</div>
												))}
											</div>
										</div>
									);

									// Categorize
									const cashTxs = items.filter(t => t.accountType !== "credit");
									const creditTxs = items.filter(t => t.accountType === "credit");

									const cashInflows = cashTxs.filter(t => t.amount < 0 && !t.isInternalTransfer);
									const cashOutflows = cashTxs.filter(
										t => t.amount > 0 && !t.isInternalTransfer && !t.isCreditCardPayment,
									);
									const cashTransfers = cashTxs.filter(
										t => t.isInternalTransfer && !t.isCreditCardPayment,
									);
									const ccPaymentsCashSide = cashTxs.filter(t => t.isCreditCardPayment);

									const ccPurchases = creditTxs.filter(
										t => t.amount > 0 && !t.isRefundOrReversal && !t.isInterestOrFee,
									);
									const ccRefunds = creditTxs.filter(t => t.isRefundOrReversal);
									const ccInterestFees = creditTxs.filter(t => t.isInterestOrFee);
									// Payments as seen on card accounts (credits to the card balance)
									const ccPaymentsCardSide = creditTxs.filter(
										t => t.amount < 0 && !t.isRefundOrReversal && !t.isInterestOrFee,
									);

									return (
										<>
											{section("Cash In (external)", cashInflows)}
											{section("Cash Out (spending)", cashOutflows)}
											{section("Internal Transfers (incl. savings)", cashTransfers)}
											{section("Credit Card Payments (cash side)", ccPaymentsCashSide)}
											{section("CC Purchases", ccPurchases)}
											{section("CC Payments (card side credits)", ccPaymentsCardSide)}
											{section("CC Refunds", ccRefunds)}
											{section("CC Interest & Fees", ccInterestFees)}
										</>
									);
								})()}
							</div>
						)}
					</div>
				)}
			</SciFiDialog>
		</div>
	);
}

function RouteComponent() {
	const [period, setPeriod] = useState<Period>("week");
	const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
	const currentCursor = cursorStack[cursorStack.length - 1] ?? null;

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
					<SectionHeader
						icon={<ChartBarIcon className="w-4 h-4 sm:w-7 sm:h-7 text-yellow-400" />}
						title="Cash vs Credit Summaries"
					/>
					<Link to="/" variant="ghost">
						Home
					</Link>
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
				<Accordion.Root
					type="single"
					collapsible
					defaultValue="howto"
					className="rounded-lg border border-zinc-800 bg-zinc-900/70"
				>
					<Accordion.Item value="howto">
						<Accordion.Trigger className="group flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-zinc-100 cursor-pointer">
							<span>How to read this table</span>
							<svg
								className="h-4 w-4 text-zinc-400 transition-transform duration-200 group-data-[state=open]:rotate-180"
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									fillRule="evenodd"
									d="M5.23 7.21a.75.75 0 011.06.02L10 11.147l3.71-3.916a.75.75 0 111.08 1.04l-4.24 4.47a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
									clipRule="evenodd"
								/>
							</svg>
						</Accordion.Trigger>
						<Accordion.Content className="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden border-t border-zinc-800">
							<div className="p-4 text-sm text-zinc-200 space-y-4">
								<div className="grid gap-2 sm:grid-cols-2">
									<div className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
										<div className="mb-2 text-xs uppercase tracking-wide text-zinc-400">Cash</div>
										<ul className="space-y-1 text-zinc-300">
											<li>
												<span className="rounded-full border border-emerald-600/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
													Cash In
												</span>{" "}
												External inflows (paychecks, transfers in).
											</li>
											<li>
												<span className="rounded-full border border-rose-600/40 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300">
													Cash Out
												</span>{" "}
												Cash-basis spending from checking/savings.
											</li>
											<li>
												<span className="rounded-full border border-cyan-600/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-300">
													Savings
												</span>{" "}
												Net moved into savings accounts.
											</li>
										</ul>
									</div>
									<div className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
										<div className="mb-2 text-xs uppercase tracking-wide text-zinc-400">
											Credit Cards
										</div>
										<ul className="space-y-1 text-zinc-300">
											<li>
												<span className="rounded-full border border-rose-600/40 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300">
													CC Purchases
												</span>{" "}
												New charges on the card.
											</li>
											<li>
												<span className="rounded-full border border-emerald-600/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
													CC Payments
												</span>{" "}
												Principal paid from cash.
											</li>
											<li>
												<span className="rounded-full border border-emerald-600/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
													CC Refunds
												</span>{" "}
												Returns/credits back to the card.
											</li>
											<li>
												<span className="rounded-full border border-rose-600/40 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300">
													Interest/Fees
												</span>{" "}
												Cost of borrowing (not principal).
											</li>
										</ul>
									</div>
								</div>

								<div className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
									<div className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Formulas</div>
									<ul className="list-disc pl-5 space-y-1 text-zinc-300">
										<li>
											<span className="font-semibold">Cash Net (cash-only)</span> = Cash In − Cash
											Out − Savings
										</li>
										<li>
											<span className="font-semibold">Include CC Payments in cash movement</span>:
											Cash Net − CC Payments
										</li>
										<li>
											<span className="font-semibold">CC Principal Δ</span> = CC Purchases − CC
											Payments − CC Refunds
										</li>
									</ul>
								</div>

								<div className="rounded-md border border-zinc-800 bg-zinc-900 p-3 text-zinc-300">
									<div className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Tips</div>
									<ul className="list-disc pl-5 space-y-1">
										<li>Values are shown as positive magnitudes for readability.</li>
										<li>
											Cash Net is cash-basis. CC Payments reduce cash but also reduce card
											principal (shown separately).
										</li>
										<li>
											If available, compare observed balance delta with Cash Net to spot
											timing/classification gaps.
										</li>
									</ul>
								</div>
							</div>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion.Root>
				{isLoading ? (
					<div className="text-zinc-400">Loading…</div>
				) : (
					<SummaryTable rows={rows} period={period} />
				)}
			</main>
		</AppLayout>
	);
}

export const Route = createFileRoute("/summaries")({
	component: RouteComponent,
});
