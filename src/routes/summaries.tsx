import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/convex/_generated/api";
import { AppLayout } from "~/components/layout/AppLayout";
import { SectionHeader } from "~/components/layout/SectionHeader";
import { Button } from "~/components/ui/Button";
import { Link } from "~/components/ui/Link";
import { formatCurrency } from "~/utils/formatters";
import { ChartBarIcon } from "@heroicons/react/24/solid";
import { Sheet } from "~/components/feedback/Sheet";
import * as Accordion from "@radix-ui/react-accordion";
import * as Tabs from "@radix-ui/react-tabs";
import { Doc } from "@/convex/_generated/dataModel";
import { PeriodTabs, type Period } from "~/components/ui/PeriodTabs";
import { NetPill } from "~/components/ui/NetPill";
import { StatTile } from "~/components/ui/StatTile";
import { TxnSection } from "~/components/ui/TxnSection";
import { ChartsView, CategoriesPieChart } from "~/components/ui/ChartsView";

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
		return <div className="text-muted-foreground italic">No summaries yet.</div>;
	}

	const fmtDate = (iso: string) =>
		new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full text-sm">
				<thead className="sticky top-0 z-10 bg-card border-b border-border">
					<tr className="text-left text-foreground">
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
								className={`border-t border-border ${idx % 2 === 0 ? "bg-card" : "bg-card/60"} hover:bg-muted transition-colors`}
							>
								<td className="py-2 pl-4 pr-4 whitespace-nowrap text-foreground">
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
								<td className="py-2 pr-4 text-right text-success">
									{formatCurrency(r.cashIncomeExternal ?? 0)}
								</td>
								<td className="py-2 pr-4 text-right text-destructive">
									{formatCurrency(r.cashSpending ?? 0)}
								</td>
								<td className="py-2 pr-4 text-right text-primary">
									{formatCurrency(r.cashSavingsContributions ?? 0)}
								</td>
								<td className="py-2 pr-2 text-right">
									<NetPill net={cashNet} />
								</td>
								<td className="py-2 pr-4 text-right text-destructive">
									{formatCurrency(r.ccPurchases ?? 0)}
								</td>
								<td className="py-2 pr-4 text-right text-success">
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

			<Sheet
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
					<div className="text-muted-foreground">No summary selected.</div>
				) : txnsLoading ? (
					<div className="text-muted-foreground">Loading…</div>
				) : (
					(() => {
						const items = (txnsData?.items as Doc<"transactions">[]) ?? [];
						const cashTxs = items.filter(t => t.accountType !== "credit");
						const creditTxs = items.filter(t => t.accountType === "credit");

						const cashInflows = cashTxs.filter(t => t.amount < 0 && !t.isInternalTransfer);
						const cashOutflows = cashTxs.filter(
							t => t.amount > 0 && !t.isInternalTransfer && !t.isCreditCardPayment,
						);
						const cashTransfers = cashTxs.filter(t => t.isInternalTransfer && !t.isCreditCardPayment);
						const ccPaymentsCashSide = cashTxs.filter(t => t.isCreditCardPayment);

						const ccPurchases = creditTxs.filter(
							t => t.amount > 0 && !t.isRefundOrReversal && !t.isInterestOrFee,
						);
						const ccRefunds = creditTxs.filter(t => t.isRefundOrReversal);
						const ccInterestFees = creditTxs.filter(t => t.isInterestOrFee);
						const ccPaymentsCardSide = creditTxs.filter(
							t => t.amount < 0 && !t.isRefundOrReversal && !t.isInterestOrFee,
						);

						return (
							<Tabs.Root defaultValue="overview" orientation="vertical" className="min-h-0">
								<div className="mt-2 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
									<Tabs.List className="flex md:flex-col gap-2 border-b md:border-b-0 md:border-r border-border md:pr-4 overflow-x-auto">
										<Tabs.Trigger
											className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-primary"
											value="overview"
										>
											Overview
										</Tabs.Trigger>
										<Tabs.Trigger
											className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-primary"
											value="cashIn"
										>
											Cash In ({cashInflows.length})
										</Tabs.Trigger>
										<Tabs.Trigger
											className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-primary"
											value="cashOut"
										>
											Cash Out ({cashOutflows.length})
										</Tabs.Trigger>
										<Tabs.Trigger
											className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-primary"
											value="transfers"
										>
											Transfers ({cashTransfers.length})
										</Tabs.Trigger>
										<Tabs.Trigger
											className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-primary"
											value="ccPaymentsCash"
										>
											CC Payments (cash) ({ccPaymentsCashSide.length})
										</Tabs.Trigger>
										<Tabs.Trigger
											className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-primary"
											value="ccPurchases"
										>
											CC Purchases ({ccPurchases.length})
										</Tabs.Trigger>
										<Tabs.Trigger
											className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-primary"
											value="ccPaymentsCard"
										>
											CC Payments (card) ({ccPaymentsCardSide.length})
										</Tabs.Trigger>
										<Tabs.Trigger
											className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-primary"
											value="ccRefunds"
										>
											CC Refunds ({ccRefunds.length})
										</Tabs.Trigger>
										<Tabs.Trigger
											className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-primary"
											value="ccInterestFees"
										>
											Interest & Fees ({ccInterestFees.length})
										</Tabs.Trigger>
									</Tabs.List>
									<div className="min-h-0">
										<Tabs.Content value="overview" className="space-y-4">
											<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
												<StatTile
													label="Cash In"
													value={formatCurrency(openRow.cashIncomeExternal ?? 0)}
													tone="success"
												/>
												<StatTile
													label="Cash Out"
													value={formatCurrency(openRow.cashSpending ?? 0)}
													tone="destructive"
												/>
												<StatTile
													label="Savings"
													value={formatCurrency(openRow.cashSavingsContributions ?? 0)}
													tone="primary"
												/>
												<StatTile
													label="CC Purchases"
													value={formatCurrency(openRow.ccPurchases ?? 0)}
													tone="destructive"
												/>
												<StatTile
													label="CC Payments"
													value={formatCurrency(openRow.ccPayments ?? 0)}
													tone="success"
												/>
												<StatTile
													label="CC Refunds"
													value={formatCurrency(openRow.ccRefunds ?? 0)}
													tone="success"
												/>
												<StatTile
													label="CC Interest/Fees"
													value={formatCurrency(openRow.ccInterestFees ?? 0)}
													tone="destructive"
												/>
												<StatTile
													label="CC Principal Δ"
													value={formatCurrency(openRow.ccPrincipalDelta ?? 0)}
													extraClassName="col-span-2 sm:col-span-1"
												/>
											</div>
											<div className="pt-2">
												<div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
													Spending by Category
												</div>
												<CategoriesPieChart
													startDate={startDate}
													endDate={endDate}
													height={256}
												/>
											</div>
										</Tabs.Content>

										<Tabs.Content value="cashIn" className="space-y-3">
											<TxnSection title="Cash In (external)" txs={cashInflows} />
										</Tabs.Content>
										<Tabs.Content value="cashOut" className="space-y-3">
											<TxnSection title="Cash Out (spending)" txs={cashOutflows} />
										</Tabs.Content>
										<Tabs.Content value="transfers" className="space-y-3">
											<TxnSection
												title="Internal Transfers (incl. savings)"
												txs={cashTransfers}
											/>
										</Tabs.Content>
										<Tabs.Content value="ccPaymentsCash" className="space-y-3">
											<TxnSection
												title="Credit Card Payments (cash side)"
												txs={ccPaymentsCashSide}
											/>
										</Tabs.Content>
										<Tabs.Content value="ccPurchases" className="space-y-3">
											<TxnSection title="CC Purchases" txs={ccPurchases} />
										</Tabs.Content>
										<Tabs.Content value="ccPaymentsCard" className="space-y-3">
											<TxnSection
												title="CC Payments (card side credits)"
												txs={ccPaymentsCardSide}
											/>
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
			</Sheet>
		</div>
	);
}

function RouteComponent() {
	const [period, setPeriod] = useState<Period>("month");
	const [view, setView] = useState<"table" | "charts">("table");
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
					<SectionHeader
						icon={<ChartBarIcon className="w-5 h-5" />}
						title="Cash vs Credit Summaries"
					/>
					<div className="flex items-center gap-2">
						<Button
							variant={view === "table" ? "primary" : "subtle"}
							size="sm"
							onClick={() => setView("table")}
						>
							Table
						</Button>
						<Button
							variant={view === "charts" ? "primary" : "subtle"}
							size="sm"
							onClick={() => setView("charts")}
						>
							Charts
						</Button>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<span className="text-muted-foreground">Period:</span>
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

				{view === "table" && (
					<Accordion.Root
						type="single"
						collapsible
						className="rounded-lg border border-border bg-card/70"
					>
						<Accordion.Item value="howto">
							<Accordion.Trigger className="group flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground cursor-pointer">
								<span>How to read this table</span>
								<svg
									className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
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
							<Accordion.Content className="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden border-t border-border">
								<div className="p-4 text-sm text-foreground space-y-4">
									<div className="grid gap-2 sm:grid-cols-2">
										<div className="rounded-md border border-border bg-card p-3">
											<div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
												Cash
											</div>
											<ul className="space-y-1 text-muted-foreground">
												<li>
													<span className="rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] text-success">
														Cash In
													</span>{" "}
													External inflows (paychecks, transfers in).
												</li>
												<li>
													<span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">
														Cash Out
													</span>{" "}
													Cash-basis spending from checking/savings.
												</li>
												<li>
													<span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
														Savings
													</span>{" "}
													Net moved into savings accounts.
												</li>
											</ul>
										</div>
										<div className="rounded-md border border-border bg-card p-3">
											<div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
												Credit Cards
											</div>
											<ul className="space-y-1 text-muted-foreground">
												<li>
													<span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">
														CC Purchases
													</span>{" "}
													New charges on the card.
												</li>
												<li>
													<span className="rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] text-success">
														CC Payments
													</span>{" "}
													Principal paid from cash.
												</li>
												<li>
													<span className="rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] text-success">
														CC Refunds
													</span>{" "}
													Returns/credits back to the card.
												</li>
												<li>
													<span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">
														Interest/Fees
													</span>{" "}
													Cost of borrowing (not principal).
												</li>
											</ul>
										</div>
									</div>

									<div className="rounded-md border border-border bg-card p-3">
										<div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
											Formulas
										</div>
										<ul className="list-disc pl-5 space-y-1 text-muted-foreground">
											<li>
												<span className="font-semibold">Cash Net (cash-only)</span> = Cash In −
												Cash Out − Savings
											</li>
											<li>
												<span className="font-semibold">
													Include CC Payments in cash movement
												</span>
												: Cash Net − CC Payments
											</li>
											<li>
												<span className="font-semibold">CC Principal Δ</span> = CC Purchases −
												CC Payments − CC Refunds
											</li>
										</ul>
									</div>

									<div className="rounded-md border border-border bg-card p-3 text-muted-foreground">
										<div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Tips</div>
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
				)}

				{isLoading ? (
					<div className="text-muted-foreground">Loading…</div>
				) : view === "charts" ? (
					<ChartsView rows={rows} period={period} />
				) : (
					<SummaryTable rows={rows} period={period} />
				)}
			</main>
		</AppLayout>
	);
}

export const Route = createFileRoute("/summaries")({ component: RouteComponent });
