import { useState } from "react";
import type { Doc } from "convex/_generated/dataModel";
import { CurrencyInput } from "~/components/form/CurrencyInput";
import { dollarsToCents, formatCentsAsDollars } from "~/lib/currency";

type Frequency = "weekly" | "biweekly" | "monthly";

interface BudgetItemFormProps {
	initialValues?: {
		name: string;
		amount: number; // cents
		frequency: Frequency;
		icon: string;
	};
	onSubmit: (values: { name: string; amount: number; frequency: Frequency; icon: string }) => Promise<void>;
	onCancel: () => void;
	submitLabel?: string;
}

const EMOJI_SUGGESTIONS = ["🛒", "⛽", "🍔", "☕", "🎮", "👶", "🐕", "💊", "🏋️", "📦"];

export function BudgetItemForm({
	initialValues,
	onSubmit,
	onCancel,
	submitLabel = "Add Item",
}: BudgetItemFormProps) {
	const [name, setName] = useState(initialValues?.name ?? "");
	const [amount, setAmount] = useState(
		initialValues?.amount ? formatCentsAsDollars(initialValues.amount) : "",
	);
	const [frequency, setFrequency] = useState<Frequency>(initialValues?.frequency ?? "monthly");
	const [icon, setIcon] = useState(initialValues?.icon ?? "📦");
	const [submitting, setSubmitting] = useState(false);

	const canSubmit = name.trim() && amount && !submitting;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!canSubmit) return;
		setSubmitting(true);
		try {
			await onSubmit({
				name: name.trim(),
				amount: dollarsToCents(amount),
				frequency,
				icon,
			});
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-5 p-1">
			{/* Icon picker */}
			<div>
				<label className="block text-xs text-muted-foreground font-medium mb-2">Icon</label>
				<div className="flex flex-wrap gap-2">
					{EMOJI_SUGGESTIONS.map((emoji) => (
						<button
							key={emoji}
							type="button"
							onClick={() => setIcon(emoji)}
							className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-colors ${
								icon === emoji
									? "bg-primary/20 ring-2 ring-primary"
									: "bg-muted/30 hover:bg-muted/50"
							}`}
						>
							{emoji}
						</button>
					))}
				</div>
			</div>

			{/* Name */}
			<div>
				<label className="block text-xs text-muted-foreground font-medium mb-1.5">Name</label>
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g. Groceries"
					className="w-full rounded-lg border border-border bg-card text-foreground p-2 pl-3 text-sm"
					autoFocus
				/>
			</div>

			{/* Amount */}
			<div>
				<label className="block text-xs text-muted-foreground font-medium mb-1.5">Amount</label>
				<CurrencyInput value={amount} onChange={setAmount} />
			</div>

			{/* Frequency */}
			<div>
				<label className="block text-xs text-muted-foreground font-medium mb-2">Frequency</label>
				<div className="flex gap-2">
					{(["weekly", "biweekly", "monthly"] as const).map((f) => (
						<button
							key={f}
							type="button"
							onClick={() => setFrequency(f)}
							className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
								frequency === f
									? "bg-primary text-white"
									: "bg-muted/30 text-muted-foreground hover:text-foreground"
							}`}
						>
							{f === "weekly" ? "Weekly" : f === "biweekly" ? "Biweekly" : "Monthly"}
						</button>
					))}
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-3 pt-2">
				<button
					type="button"
					onClick={onCancel}
					className="flex-1 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground bg-muted/30 transition-colors"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={!canSubmit}
					className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white disabled:opacity-40 transition-opacity"
				>
					{submitting ? "Saving..." : submitLabel}
				</button>
			</div>
		</form>
	);
}

/** Inline income setup form */
export function IncomeSetupForm({
	initialAmount,
	onSubmit,
	onCancel,
}: {
	initialAmount?: number; // cents
	onSubmit: (amountCents: number) => Promise<void>;
	onCancel: () => void;
}) {
	const [amount, setAmount] = useState(
		initialAmount ? formatCentsAsDollars(initialAmount) : "",
	);
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!amount) return;
		setSubmitting(true);
		try {
			await onSubmit(dollarsToCents(amount));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4 p-1">
			<div>
				<label className="block text-xs text-muted-foreground font-medium mb-1.5">
					Paycheck Amount (before taxes if net, after taxes if gross)
				</label>
				<CurrencyInput value={amount} onChange={setAmount} placeholder="$0.00" />
				<p className="text-[11px] text-muted-foreground mt-1.5">
					Enter the amount you receive per paycheck. We'll calculate your monthly income from your pay schedule.
				</p>
			</div>
			<div className="flex gap-3">
				<button
					type="button"
					onClick={onCancel}
					className="flex-1 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground bg-muted/30 transition-colors"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={!amount || submitting}
					className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white disabled:opacity-40 transition-opacity"
				>
					{submitting ? "Saving..." : "Save"}
				</button>
			</div>
		</form>
	);
}
