import React from "react";

interface FormFieldProps {
	label: string;
	error?: string;
	children: React.ReactNode;
	className?: string;
}

export function FormField({ label, error, children, className }: FormFieldProps) {
	return (
		<div className={className}>
			<label className="block text-primary font-bold mb-1">{label}</label>
			{children}
			{error && <span className="text-warning text-sm font-normal mt-2 block">{error}</span>}
		</div>
	);
}
