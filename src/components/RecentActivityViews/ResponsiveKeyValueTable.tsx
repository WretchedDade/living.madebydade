import React from "react";

export interface KeyValueTableRow {
	label: string;
	value: unknown;
	value2?: unknown;
}

interface ResponsiveKeyValueTableProps {
	rows: KeyValueTableRow[];
	columns?: string[];
	formatValue?: (label: string, value: unknown) => React.ReactNode;
	cardClassName?: string;
	tableClassName?: string;
	fieldLabelClassName?: string;
}

export const ResponsiveKeyValueTable: React.FC<ResponsiveKeyValueTableProps> = ({
	rows,
	columns = ["Field", "Before", "After"],
	formatValue = (label, value) => String(value),
	cardClassName = "",
	tableClassName = "",
	fieldLabelClassName = "",
}) => {
	if (!rows || rows.length === 0) return null;
	const hasValue2 = rows.some(row => row.value2 !== undefined);
	return (
		<>
			{/* Mobile: grid of cards */}
			<div className="block md:hidden">
				{rows.map(({ label, value, value2 }, idx) => (
					<div
						key={label + idx}
						className={
							`p-3 mb-4 border border-border shadow-lg ` +
							(idx % 2 === 0 ? "bg-card" : "bg-muted") +
							` ${cardClassName}`
						}
					>
						<div className="flex flex-col gap-1">
							<div
								className={`text-xs text-muted-foreground font-semibold uppercase tracking-wide ${fieldLabelClassName}`}
							>
								{label}
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">{columns[1] || "Value"}:</span>
								<span className="text-foreground">{formatValue(label, value)}</span>
							</div>
							{hasValue2 && (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">{columns[2] || "Value2"}:</span>
									<span className="text-foreground">{formatValue(label, value2)}</span>
								</div>
							)}
						</div>
					</div>
				))}
			</div>
			{/* Desktop: table */}
			<div className={`hidden md:block overflow-x-auto ${tableClassName}`}>
				<table className="min-w-full text-sm border-2 border-border bg-card">
					<thead>
						<tr>
							<th className="px-4 py-2 text-left font-semibold text-muted-foreground bg-muted">
								{columns[0]}
							</th>
							<th className="px-4 py-2 text-left font-semibold text-muted-foreground bg-muted">
								{columns[1]}
							</th>
							{hasValue2 && (
								<th className="px-4 py-2 text-left font-semibold text-muted-foreground bg-muted">
									{columns[2]}
								</th>
							)}
						</tr>
					</thead>
					<tbody>
						{rows.map(({ label, value, value2 }, idx) => (
							<tr
								key={label + idx}
								className={
									"transition-colors " +
									(idx % 2 === 0 ? "bg-card" : "bg-muted") +
									" hover:bg-muted/40"
								}
							>
								<td className="px-4 py-2 font-medium text-foreground whitespace-nowrap">{label}</td>
								<td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
									{formatValue(label, value)}
								</td>
								{hasValue2 && (
									<td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
										{formatValue(label, value2)}
									</td>
								)}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</>
	);
};
