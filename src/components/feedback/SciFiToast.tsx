import React from "react";
import { toast } from "sonner";
import { CheckIcon, XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { SciFiBars } from "../ui/SciFiBars";

type CustomToastProps = {
	title: string;
	description?: string;
	action?: React.ReactNode;
	variant?: "success" | "error" | "warning";
};

type ShowToastProps = {
	title: string;
	description?: string;
	action?: React.ReactNode;
	variant?: "success" | "error" | "warning";
};

const variantStyles = {
	success: {
		borderColor: "border-success",
		shadowColor: "shadow-md",
		icon: <CheckIcon className="w-6 h-6 text-success" />,
		iconColor: "text-success",
		titleColor: "text-success",
		descColor: "text-success",
		barsColor: "success",
	},
	error: {
		borderColor: "border-destructive",
		shadowColor: "shadow-md",
		icon: <XMarkIcon className="w-6 h-6 text-destructive" />,
		iconColor: "text-destructive",
		titleColor: "text-destructive",
		descColor: "text-destructive",
		barsColor: "destructive",
	},
	warning: {
		borderColor: "border-warning",
		shadowColor: "shadow-md",
		icon: <ExclamationTriangleIcon className="w-6 h-6 text-warning" />,
		iconColor: "text-warning",
		titleColor: "text-warning",
		descColor: "text-warning",
		barsColor: "warning",
	},
};

export function CustomToast({ title, description, action, variant = "success", t }: CustomToastProps & { t?: string | number }) {
	const styles = variantStyles[variant ?? "success"];

	return (
		<div
			className={`bg-card border ${styles.borderColor} ${styles.shadowColor} rounded-lg text-foreground font-mono px-4 py-2 flex flex-col gap-2 relative`}
		>
			<button
				type="button"
				aria-label="Dismiss"
				className={`absolute -top-3 -right-3 p-1 rounded-full shadow-md border-2 ${styles.borderColor} bg-card hover:bg-muted focus:outline-none focus:ring-2 cursor-pointer`}
				onClick={() => t && toast.dismiss(t)}
			>
				<XMarkIcon width={18} height={18} className={`${styles.iconColor} hover:opacity-80`} />
			</button>
			<div className="flex justify-center mb-2">
				<SciFiBars count={7} className="max-w-xs" />
			</div>
			<div className="flex items-center gap-3">
				<span className={`${styles.iconColor} mr-2 flex items-center justify-center self-center`}>
					{styles.icon}
				</span>
				<div className="flex flex-col gap-1">
					<div className={`${styles.titleColor} font-bold tracking-wide text-base sci-fi-title-glow`}>
						{title}
					</div>
					{description && (
						<div className={`${styles.descColor} font-mono text-xs leading-tight`}>{description}</div>
					)}
					{action && <div className="mt-1">{action}</div>}
				</div>
			</div>
		</div>
	);
}

export function showToast({ title, description, action, variant = "success" }: ShowToastProps) {
	toast.custom(t => <CustomToast t={t} title={title} description={description} action={action} variant={variant} />);
}
