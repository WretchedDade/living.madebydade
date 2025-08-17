import React from "react";
import { IconInput } from "./IconInput";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
	value: string;
	onChange: (value: string) => void;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	placeholder?: string;
}

export function CurrencyInput({ value, onChange, onBlur, placeholder = "Amount (USD)", ...props }: CurrencyInputProps) {
	// Only allow numbers and dot
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value.replace(/[^\d.]/g, "");
		onChange(raw);
	};

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		if (onBlur) onBlur(e);
		const num = Number(value);
		if (!isNaN(num) && value !== "") {
			onChange(
				new Intl.NumberFormat("en-US", {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				}).format(num),
			);
		}
	};

	return (
		<IconInput
			icon={"$"}
			type="text"
			inputMode="decimal"
			step="0.01"
			value={value}
			onChange={handleChange}
			onBlur={handleBlur}
			placeholder={placeholder}
			{...props}
		/>
	);
}
