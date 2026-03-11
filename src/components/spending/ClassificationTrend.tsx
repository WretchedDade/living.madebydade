import {
	ResponsiveContainer,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	type TooltipProps,
} from "recharts";
import type { Doc } from "convex/_generated/dataModel";
import { useTheme } from "~/components/provider/ThemeProvider";
import { formatCurrency } from "~/utils/formatters";
import { getCategoryMeta } from "~/lib/categories";

type Period = "month" | "week";

interface ClassificationTrendProps {
	transactions: Doc<"transactions">[];
	period: Period;
}

interface ClassificationDataPoint {
	label: string;
	essential: number;
	nonEssential: number;
}

/** Bucket transactions by period and classify essential vs non-essential */
function buildClassificationData(
	transactions: Doc<"transactions">[],
	period: Period,
): ClassificationDataPoint[] {
	const buckets = new Map<string, { essential: number; nonEssential: number }>();

	for (const t of transactions) {
		if (t.amount <= 0) continue;
		if (t.isInternalTransfer || t.isCreditCardPayment || t.isRefundOrReversal || t.isInterestOrFee)
			continue;

		const meta = getCategoryMeta(t.categoryPrimary, t.categoryDetailed);
		if (meta.classification === "excluded") continue;

		const effectiveDate = t.authorizedDate ?? t.date;
		const date = new Date(effectiveDate + (effectiveDate.includes("T") ? "" : "T12:00:00"));
		const key =
			period === "month"
				? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
				: (() => {
						// ISO week bucket: floor to Monday
						const d = new Date(date);
						const day = d.getDay();
						const diff = day === 0 ? 6 : day - 1;
						d.setDate(d.getDate() - diff);
						return d.toISOString().slice(0, 10);
					})();

		const bucket = buckets.get(key) ?? { essential: 0, nonEssential: 0 };
		const cents = Math.abs(t.amount);
		if (meta.classification === "essential") {
			bucket.essential += cents;
		} else {
			bucket.nonEssential += cents;
		}
		buckets.set(key, bucket);
	}

	return Array.from(buckets.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([key, { essential, nonEssential }]) => {
			const label =
				period === "month"
					? new Date(key + "-15").toLocaleDateString("en-US", { month: "short" })
					: new Date(key + "T12:00:00").toLocaleDateString("en-US", {
							month: "short",
							day: "numeric",
						});
			return {
				label,
				essential: Math.round(essential / 100),
				nonEssential: Math.round(nonEssential / 100),
			};
		});
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
	if (!active || !payload?.length) return null;
	return (
		<div
			className="rounded-lg px-3 py-2 shadow-lg text-sm"
			style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
		>
			<div className="text-muted-foreground text-xs mb-1">{label}</div>
			{payload.map((entry) => (
				<div key={entry.dataKey} className="flex items-center gap-2">
					<span
						className="w-2 h-2 rounded-full"
						style={{ backgroundColor: entry.color }}
					/>
					<span className="text-muted-foreground text-xs capitalize">{entry.name}</span>
					<span className="text-foreground text-xs font-semibold tabular-nums ml-auto">
						{formatCurrency((entry.value ?? 0) * 100)}
					</span>
				</div>
			))}
		</div>
	);
}

export function ClassificationTrend({ transactions, period }: ClassificationTrendProps) {
	const { theme } = useTheme();

	const data = buildClassificationData(transactions, period);
	if (data.length < 2) return null;

	const primary = `hsl(${theme.colors.primary})`;
	const secondary = `hsl(${theme.colors.secondary})`;

	return (
		<div className="px-5 md:px-10 lg:px-12 py-6">
			<h2 className="text-sm font-semibold text-foreground mb-4">Essential vs Non-essential</h2>
			<div className="h-48 md:h-56">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
						<defs>
							<linearGradient id="essentialFill" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={primary} stopOpacity={0.35} />
								<stop offset="95%" stopColor={primary} stopOpacity={0.05} />
							</linearGradient>
							<linearGradient id="nonEssentialFill" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={secondary} stopOpacity={0.3} />
								<stop offset="95%" stopColor={secondary} stopOpacity={0.05} />
							</linearGradient>
						</defs>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="hsl(var(--border))"
							strokeOpacity={0.5}
							vertical={false}
						/>
						<XAxis
							dataKey="label"
							tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
							tickLine={false}
							axisLine={false}
						/>
						<YAxis
							tickFormatter={(v: number) =>
								v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
							}
							tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
							tickLine={false}
							axisLine={false}
							width={40}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Area
							type="monotone"
							dataKey="essential"
							name="essential"
							stackId="1"
							stroke={primary}
							strokeWidth={1.5}
							fill="url(#essentialFill)"
							dot={false}
						/>
						<Area
							type="monotone"
							dataKey="nonEssential"
							name="non-essential"
							stackId="1"
							stroke={secondary}
							strokeWidth={1.5}
							fill="url(#nonEssentialFill)"
							dot={false}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
			<div className="flex items-center justify-center gap-5 mt-3 text-xs text-muted-foreground">
				<span className="flex items-center gap-1.5">
					<span className="w-2 h-2 rounded-full" style={{ backgroundColor: primary }} />
					Essential
				</span>
				<span className="flex items-center gap-1.5">
					<span className="w-2 h-2 rounded-full" style={{ backgroundColor: secondary }} />
					Non-essential
				</span>
			</div>
		</div>
	);
}
