import React from "react";
import { toast } from "sonner";
import { CheckIcon, XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";

type ToastVariant = "success" | "error" | "warning";

type ShowToastProps = {
	title: string;
	description?: string;
	action?: React.ReactNode;
	variant?: ToastVariant;
};

const variantConfig: Record<ToastVariant, {
	icon: React.ReactElement;
	color: string;
}> = {
	success: {
		icon: <CheckIcon className="w-5 h-5" />,
		color: "var(--success)",
	},
	error: {
		icon: <XMarkIcon className="w-5 h-5" />,
		color: "var(--destructive)",
	},
	warning: {
		icon: <ExclamationTriangleIcon className="w-5 h-5" />,
		color: "var(--warning)",
	},
};

function CustomToast({ title, description, action, variant = "success", t }: ShowToastProps & { t?: string | number }) {
	const config = variantConfig[variant];
	return (
		<div
			style={{
				backgroundColor: "hsl(var(--card))",
				color: "hsl(var(--foreground))",
				boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
			}}
			className="rounded-xl px-4 py-3 flex items-start gap-3 min-w-[280px]"
		>
			<span style={{ color: `hsl(${config.color})` }} className="mt-0.5 shrink-0">{config.icon}</span>
			<div className="flex-1 min-w-0">
				<div style={{ color: `hsl(${config.color})` }} className="font-semibold text-sm">{title}</div>
				{description && (
					<div style={{ color: "hsl(var(--muted-foreground))" }} className="text-xs mt-0.5 leading-snug">{description}</div>
				)}
				{action && <div className="mt-2">{action}</div>}
			</div>
			<button
				type="button"
				aria-label="Dismiss"
				style={{ color: "hsl(var(--muted-foreground))" }}
				className="p-0.5 cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
				onClick={() => t && toast.dismiss(t)}
			>
				<XMarkIcon className="w-4 h-4" />
			</button>
		</div>
	);
}

export function showToast({ title, description, action, variant = "success" }: ShowToastProps) {
	toast.custom(t => <CustomToast t={t} title={title} description={description} action={action} variant={variant} />);
}
