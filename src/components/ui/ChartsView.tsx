import * as Tabs from "@radix-ui/react-tabs";
import { useEffect, useState, type ReactNode } from "react";
import { formatCurrency } from "~/utils/formatters";
import type { Doc } from "@/convex/_generated/dataModel";
import type { Period } from "~/components/ui/PeriodTabs";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import {
	ResponsiveContainer,
	LineChart,
	BarChart,
	PieChart,
	Tooltip,
	Legend,
	ReferenceLine,
	CartesianGrid,
	XAxis,
	YAxis,
	Line,
	Bar,
	Pie,
	Cell,
	type TooltipProps,
} from "recharts";
import { TxnSection } from "~/components/ui/TxnSection";

type Summary = Doc<"cashCreditSummaries">;

// --- Helpers ---
function getCashNet(r: Summary): number {
	return (r.cashIncomeExternal ?? 0) - (r.cashSpending ?? 0) - (r.cashSavingsContributions ?? 0);
}

function labelForRow(r: Summary, period: Period): string {
	const start = new Date(r.startDate);
	const end = new Date(r.endDate);
	if (period === "month") {
		return start.toLocaleDateString(undefined, { year: "numeric", month: "long" });
	}
	const fromStr = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
	const toStr = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
	return fromStr === toStr ? fromStr : `${fromStr} – ${toStr}`;
}

function getRangeFromRows(rows: Summary[]): { startDate: string; endDate: string } {
	const starts = rows.map(r => r.startDate);
	const ends = rows.map(r => r.endDate);
	const startDate = starts.reduce((min, d) => (d < min ? d : min));
	const endDate = ends.reduce((max, d) => (d > max ? d : max));
	return { startDate: startDate.slice(0, 10), endDate: endDate.slice(0, 10) };
}

const CATEGORY_NAME_MAP: Record<string, string> = {
	uncategorized: "Uncategorized",
	groceries: "Groceries",
	restaurants: "Restaurants",
	travel: "Travel",
	transportation: "Transportation",
	shopping: "Shopping",
	entertainment: "Entertainment",
	utilities: "Utilities",
	rent: "Rent",
	housing: "Housing",
	health: "Health",
};

function prettyCategoryName(raw: string): string {
	const key = raw.toLowerCase();
	if (CATEGORY_NAME_MAP[key]) return CATEGORY_NAME_MAP[key];
	const spaced = raw.replace(/[._-]+/g, " ");
	return spaced
		.split(" ")
		.filter(Boolean)
		.map(w => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}

// --- UI building blocks ---
function ChartCard({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
			<div className="mb-2 text-xs uppercase tracking-wide text-zinc-400">{title}</div>
			{children}
		</div>
	);
}

function ChartTooltip({ active, payload, displayLabel, formatValue }: TooltipProps<number, string> & { displayLabel?: string; formatValue?: (v: number) => string }) {
	if (!active || !payload || payload.length === 0) return null;
	return (
		<div className="rounded-md border border-zinc-700 bg-zinc-900/95 text-zinc-100 shadow-lg px-3 py-2">
			{displayLabel ? <div className="text-xs font-medium text-zinc-300 mb-1">{displayLabel}</div> : null}
			<div className="space-y-1">
				{payload.map(it => {
					const color = it.color ?? "#22d3ee";
					const name = String(it.name ?? "");
					const rawVal = Array.isArray(it.value) ? Number(it.value[0]) : Number(it.value);
					const valStr = Number.isFinite(rawVal) && formatValue ? formatValue(rawVal) : String(it.value ?? "");
					const key = `${name}-${String(it.dataKey ?? "")}`;
					return (
						<div key={key} className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
								<span className="text-xs text-zinc-300">{name}</span>
							</div>
							<span className="text-xs font-mono">{valStr}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

// --- Charts ---
export function NetFlowLineChart({ rows, period }: { rows: Summary[]; period: Period }) {
	if (rows.length === 0) return <div className="text-zinc-400">No data.</div>;
	type NetPoint = { label: string; net: number };
	const data: NetPoint[] = rows.map(r => ({ label: labelForRow(r, period), net: getCashNet(r) }));
	return (
		<div className="h-56">
			<ResponsiveContainer>
				<LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
					<CartesianGrid stroke="#3f3f46" strokeOpacity={0.5} vertical={false} />
					<XAxis
						dataKey="label"
						tick={{ fill: "#a1a1aa", fontSize: 12 }}
						tickLine={false}
						axisLine={{ stroke: "#52525b" }}
					/>
					<YAxis
						tickFormatter={(v: number) => formatCurrency(v)}
						tick={{ fill: "#a1a1aa", fontSize: 12 }}
						tickLine={false}
						axisLine={{ stroke: "#52525b" }}
						width={80}
					/>
					<Tooltip content={<ChartTooltip formatValue={(v: number) => formatCurrency(v)} />} />
					<ReferenceLine y={0} stroke="#71717a" strokeDasharray="3 3" />
					<Line
						type="monotone"
						dataKey="net"
						stroke="#22d3ee"
						strokeWidth={2}
						dot={{ r: 2, fill: "#22d3ee" }}
						activeDot={{ r: 4 }}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}

export function CashStackedBars({ rows, period }: { rows: Summary[]; period: Period }) {
	if (rows.length === 0) return <div className="text-zinc-400">No data.</div>;
	type CashPoint = { label: string; cashIn: number; cashOut: number; savings: number };
	const data: CashPoint[] = rows.map(r => ({
		label: labelForRow(r, period),
		cashIn: Math.max(0, r.cashIncomeExternal ?? 0),
		cashOut: Math.max(0, r.cashSpending ?? 0),
		savings: Math.max(0, r.cashSavingsContributions ?? 0),
	}));
	return (
		<div className="h-64">
			<ResponsiveContainer>
				<BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
					<CartesianGrid stroke="#3f3f46" strokeOpacity={0.5} vertical={false} />
					<XAxis
						dataKey="label"
						tick={{ fill: "#a1a1aa", fontSize: 12 }}
						tickLine={false}
						axisLine={{ stroke: "#52525b" }}
					/>
					<YAxis
						tickFormatter={(v: number) => formatCurrency(v)}
						tick={{ fill: "#a1a1aa", fontSize: 12 }}
						tickLine={false}
						axisLine={{ stroke: "#52525b" }}
						width={80}
					/>
					<Tooltip content={<ChartTooltip formatValue={(v: number) => formatCurrency(v)} />} />
					<Legend wrapperStyle={{ color: "#a1a1aa" }} />
					<Bar dataKey="cashIn" name="Cash In" stackId="a" fill="#34d399" />
					<Bar dataKey="cashOut" name="Cash Out" stackId="a" fill="#fb7185" />
					<Bar dataKey="savings" name="Savings" stackId="a" fill="#22d3ee" />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

export function CreditGroupedBars({ rows, period }: { rows: Summary[]; period: Period }) {
	if (rows.length === 0) return <div className="text-zinc-400">No data.</div>;
	type CreditPoint = { label: string; purchases: number; payments: number; refunds: number; fees: number };
	const data: CreditPoint[] = rows.map(r => ({
		label: labelForRow(r, period),
		purchases: Math.max(0, r.ccPurchases ?? 0),
		payments: Math.max(0, r.ccPayments ?? 0),
		refunds: Math.max(0, r.ccRefunds ?? 0),
		fees: Math.max(0, r.ccInterestFees ?? 0),
	}));
	return (
		<div className="h-64">
			<ResponsiveContainer>
				<BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
					<CartesianGrid stroke="#3f3f46" strokeOpacity={0.5} vertical={false} />
					<XAxis
						dataKey="label"
						tick={{ fill: "#a1a1aa", fontSize: 12 }}
						tickLine={false}
						axisLine={{ stroke: "#52525b" }}
					/>
					<YAxis
						tickFormatter={(v: number) => formatCurrency(v)}
						tick={{ fill: "#a1a1aa", fontSize: 12 }}
						tickLine={false}
						axisLine={{ stroke: "#52525b" }}
						width={80}
					/>
					<Tooltip content={<ChartTooltip formatValue={(v: number) => formatCurrency(v)} />} />
					<Legend wrapperStyle={{ color: "#a1a1aa" }} />
					<Bar dataKey="purchases" name="Purchases" fill="#fb7185" />
					<Bar dataKey="payments" name="Payments" fill="#34d399" />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

export function ChartsView({ rows, period }: { rows: Summary[]; period: Period }) {
	const [isClient, setIsClient] = useState(false);
	useEffect(() => setIsClient(true), []);
	const totalCashIn = rows.reduce((s, r) => s + Math.max(0, r.cashIncomeExternal ?? 0), 0);
	const totalCashOut = rows.reduce((s, r) => s + Math.max(0, r.cashSpending ?? 0), 0);
	const totalSavings = rows.reduce((s, r) => s + Math.max(0, r.cashSavingsContributions ?? 0), 0);
	const totalPurchases = rows.reduce((s, r) => s + Math.max(0, r.ccPurchases ?? 0), 0);
	const totalPayments = rows.reduce((s, r) => s + Math.max(0, r.ccPayments ?? 0), 0);
	const netSum = rows.reduce((s, r) => s + getCashNet(r), 0);

	return (
		<div className="space-y-4">
			{/* Totals strip */}
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
				<ChartCard title="Cash In">
					<div className="text-emerald-300 font-medium">{formatCurrency(totalCashIn)}</div>
				</ChartCard>
				<ChartCard title="Cash Out">
					<div className="text-rose-300 font-medium">{formatCurrency(totalCashOut)}</div>
				</ChartCard>
				<ChartCard title="Savings">
					<div className="text-cyan-300 font-medium">{formatCurrency(totalSavings)}</div>
				</ChartCard>
				<ChartCard title="CC Purchases">
					<div className="text-rose-300 font-medium">{formatCurrency(totalPurchases)}</div>
				</ChartCard>
				<ChartCard title="CC Payments">
					<div className="text-emerald-300 font-medium">{formatCurrency(totalPayments)}</div>
				</ChartCard>
				<ChartCard title="Net (cash-basis)">
					<div className={netSum >= 0 ? "text-emerald-300 font-medium" : "text-rose-300 font-medium"}>
						{formatCurrency(netSum)}
					</div>
				</ChartCard>
			</div>

			{/* Chart toggles */}
			<Tabs.Root defaultValue="net" className="space-y-3">
				<Tabs.List className="flex gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
					<Tabs.Trigger
						value="net"
						className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-300"
					>
						Net
					</Tabs.Trigger>
					<Tabs.Trigger
						value="cash"
						className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-300"
					>
						Cash
					</Tabs.Trigger>
					<Tabs.Trigger
						value="credit"
						className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-300"
					>
						Credit
					</Tabs.Trigger>
					<Tabs.Trigger
						value="categories"
						className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-zinc-300 data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-300"
					>
						Categories
					</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="net">
					<ChartCard title="Cash Net by Period">
						{isClient ? <NetFlowLineChart rows={rows} period={period} /> : <div className="h-56" />}
					</ChartCard>
				</Tabs.Content>
				<Tabs.Content value="cash">
					<ChartCard title="Cash In / Out / Savings (stacked)">
						{isClient ? <CashStackedBars rows={rows} period={period} /> : <div className="h-64" />}
					</ChartCard>
				</Tabs.Content>
				<Tabs.Content value="credit">
					<ChartCard title="CC Purchases vs Payments (grouped)">
						{isClient ? <CreditGroupedBars rows={rows} period={period} /> : <div className="h-64" />}
					</ChartCard>
				</Tabs.Content>
				<Tabs.Content value="categories">
					<ChartCard title="Spending by Category">
						{isClient ? <CategoriesPieChart rows={rows} /> : <div className="h-72" />}
					</ChartCard>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	);
}

export function CategoriesPieChart(
	{ rows, startDate: startInput, endDate: endInput, items: providedItems, height, showLegend }:
	{ rows?: Summary[]; startDate?: string; endDate?: string; items?: Doc<"transactions">[]; height?: number; showLegend?: boolean }
) {
	const range = rows && rows.length ? getRangeFromRows(rows) : { startDate: startInput, endDate: endInput };
	const { startDate, endDate } = range;
	const shouldQuery = !providedItems && Boolean(startDate && endDate);
	const baseQuery = convexQuery(api.transactions.listByDateRange, { startDate, endDate });
	const { data } = useQuery({ ...baseQuery, enabled: shouldQuery });
	const items = (providedItems ?? (data?.items as Doc<"transactions">[])) ?? [];

	type Slice = { key: string | null; name: string; value: number };
	const spending = items.filter(t => {
		if (t.accountType === "credit") {
			return t.amount > 0 && !t.isRefundOrReversal && !t.isInterestOrFee;
		}
		return t.amount > 0 && !t.isInternalTransfer && !t.isCreditCardPayment;
	});
	const byCat = new Map<string, number>();
	for (const t of spending) {
		const key = (t.categoryPrimary as string | null) ?? "Uncategorized";
		const prev = byCat.get(key) ?? 0;
		byCat.set(key, prev + Math.abs(t.amount));
	}
	const all: Slice[] = Array.from(byCat.entries()).map(([rawKey, value]) => ({ key: rawKey, name: prettyCategoryName(rawKey), value }));
	all.sort((a, b) => b.value - a.value);
	const TOP = 8;
	const top = all.slice(0, TOP);
	const restTotal = all.slice(TOP).reduce((s, x) => s + x.value, 0);
	const dataPoints: Slice[] = restTotal > 0 ? [...top, { key: null, name: "Other", value: restTotal }] : top;

	const [selectedKey, setSelectedKey] = useState<string | "OTHER" | null>(null);
	useEffect(() => { setSelectedKey(null); }, [startDate, endDate]);
	const total = dataPoints.reduce((s, x) => s + x.value, 0) || 1;
	const labelNames = new Set<string>(dataPoints.slice(0, Math.min(4, dataPoints.length)).map(d => d.name));

	const palette = ["#fb7185", "#34d399", "#22d3ee", "#f59e0b", "#a78bfa", "#60a5fa", "#f472b6", "#facc15", "#4ade80"];

	return (
		<div style={{ height: typeof height === "number" ? height : 288 }}>
			<ResponsiveContainer>
				<PieChart margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
					<Tooltip content={<ChartTooltip formatValue={(v: number) => formatCurrency(v)} />} />
					{showLegend ? <Legend wrapperStyle={{ color: "#a1a1aa" }} /> : null}
					<Pie
						data={dataPoints}
						dataKey="value"
						nameKey="name"
						outerRadius="80%"
						innerRadius="55%"
						stroke="#18181b"
						strokeWidth={1}
						labelLine={false}
						label={props => {
							const { name, percent, cx, cy, midAngle, outerRadius } = props as unknown as {
								name: string;
								percent: number;
								cx: number;
								cy: number;
								midAngle: number;
								outerRadius: number;
							};
							if (!labelNames.has(name) || name === "Other" || percent < 0.08) return null;
							const RAD = Math.PI / 180;
							const r = Math.max(outerRadius - 16, 20);
							const x = cx + r * Math.cos(-midAngle * RAD);
							const y = cy + r * Math.sin(-midAngle * RAD);
							return (
								<text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-zinc-200 text-[10px]">
									{Math.round(percent * 100)}%
								</text>
							);
						}}
					>
						{dataPoints.map((d, i) => (
							<Cell
								key={`cell-${i}`}
								fill={palette[i % palette.length]}
								onClick={() => setSelectedKey(d.key ?? "OTHER")}
								cursor="pointer"
							/>
						))}
					</Pie>
				</PieChart>
			</ResponsiveContainer>
			{selectedKey ? (
				<div className="mt-3">
					<div className="mb-2 flex items-center justify-between">
						<div className="text-sm text-zinc-200">
							{selectedKey === "OTHER" ? "Other" : prettyCategoryName(selectedKey)} • {(() => {
								const v = selectedKey === "OTHER"
									? (dataPoints.find(d => d.key === null)?.value ?? 0)
									: (dataPoints.find(d => d.key === selectedKey)?.value ?? 0);
								const pct = Math.round((v / total) * 100);
								return `${formatCurrency(v)} (${pct}%)`;
							})()}
						</div>
						<button onClick={() => setSelectedKey(null)} className="text-xs text-zinc-300 hover:text-zinc-100 rounded px-2 py-1 border border-zinc-700 bg-zinc-800">Clear</button>
					</div>
					{(() => {
						const topKeys = new Set(top.map(t => t.key));
						const filtered = selectedKey === "OTHER"
							? items.filter(t => {
								const k = (t.categoryPrimary as string | null) ?? "Uncategorized";
								return (
									!topKeys.has(k) &&
									(t.accountType === "credit"
										? t.amount > 0 && !t.isRefundOrReversal && !t.isInterestOrFee
										: t.amount > 0 && !t.isInternalTransfer && !t.isCreditCardPayment)
								);
							})
							: items.filter(t => {
								const k = (t.categoryPrimary as string | null) ?? "Uncategorized";
								return (
									k === selectedKey &&
									(t.accountType === "credit"
										? t.amount > 0 && !t.isRefundOrReversal && !t.isInterestOrFee
										: t.amount > 0 && !t.isInternalTransfer && !t.isCreditCardPayment)
								);
							});
						return <TxnSection title={`${selectedKey === "OTHER" ? "Other" : prettyCategoryName(selectedKey)} transactions`} txs={filtered} />;
					})()}
				</div>
			) : null}
		</div>
	);
}
