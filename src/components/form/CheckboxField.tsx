import React from "react";
import { Checkbox } from "@radix-ui/react-checkbox";

interface CheckboxFieldProps {
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	id?: string;
	className?: string;
}

export function CheckboxField({ label, checked, onChange, id = "checkbox", className }: CheckboxFieldProps) {
	return (
		<div className={`flex items-center gap-2 align-middle ${className || ""}`}>
			<Checkbox
				checked={checked}
				onCheckedChange={onChange}
				className="w-5 h-5 border border-border bg-card data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded"
				id={id}
			/>
			<label htmlFor={id} className="text-primary font-bold">
				{label}
			</label>
		</div>
	);
}
