import React from "react";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
	value: string;
	onChange: (value: string) => void;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	placeholder?: string;
}

/**
 * Currency input that auto-inserts the decimal place.
 * User types digits only — "1576" displays as "$15.76".
 * Value is stored as a formatted dollar string (e.g. "15.76") for form compatibility.
 */
export function CurrencyInput({ value, onChange, onBlur, placeholder = "$0.00", ...props }: CurrencyInputProps) {
	// Convert stored dollar string to raw cents integer
	const toCents = (val: string): number => {
		const digits = val.replace(/[^\d]/g, "");
		return parseInt(digits, 10) || 0;
	};

	// Format cents integer to display string
	const formatDisplay = (cents: number): string => {
		return (cents / 100).toLocaleString("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 2,
		});
	};

	// Format cents to the stored value (plain number string like "15.76")
	const formatStored = (cents: number): string => {
		if (cents === 0) return "";
		return (cents / 100).toFixed(2);
	};

	const cents = toCents(value);
	const displayValue = cents === 0 ? "" : formatDisplay(cents);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value.replace(/[^\d]/g, "");
		const newCents = parseInt(raw, 10) || 0;
		onChange(formatStored(newCents));
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		const pasted = e.clipboardData.getData("text").replace(/[^\d.]/g, "");
		const asFloat = parseFloat(pasted);
		if (!isNaN(asFloat)) {
			const pastedCents = Math.round(asFloat * 100);
			onChange(formatStored(pastedCents));
		}
	};

	return (
		<div className="relative w-full">
			<input
				{...props}
				type="text"
				inputMode="numeric"
				value={displayValue}
				onChange={handleChange}
				onBlur={onBlur}
				onPaste={handlePaste}
				placeholder={placeholder}
				className="w-full rounded-lg border border-border bg-card text-foreground p-2 pl-3 text-lg tabular-nums"
			/>
		</div>
	);
}
