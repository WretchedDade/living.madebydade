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

const variantStyles: Record<ToastVariant, {
	borderColor: string;
	icon: React.ReactElement;
	iconColor: string;
	titleColor: string;
	descColor: string;
}> = {
	success: {
		borderColor: "border-success",
		icon: <CheckIcon className="w-5 h-5 text-success" />,
		iconColor: "text-success",
		titleColor: "text-success",
		descColor: "text-muted-foreground",
	},
	error: {
		borderColor: "border-destructive",
		icon: <XMarkIcon className="w-5 h-5 text-destructive" />,
		iconColor: "text-destructive",
		titleColor: "text-destructive",
		descColor: "text-muted-foreground",
	},
	warning: {
		borderColor: "border-warning",
		icon: <ExclamationTriangleIcon className="w-5 h-5 text-warning" />,
		iconColor: "text-warning",
		titleColor: "text-warning",
		descColor: "text-muted-foreground",
	},
};

function CustomToast({ title, description, action, variant = "success", t }: ShowToastProps & { t?: string | number }) {
	const styles = variantStyles[variant];
	return (
		<div className={`bg-card border ${styles.borderColor} shadow-md rounded-xl text-foreground px-4 py-3 flex items-start gap-3 min-w-[280px]`}>
			<span className={`${styles.iconColor} mt-0.5 shrink-0`}>{styles.icon}</span>
			<div className="flex-1 min-w-0">
				<div className={`${styles.titleColor} font-semibold text-sm`}>{title}</div>
				{description && (
					<div className={`${styles.descColor} text-xs mt-0.5 leading-snug`}>{description}</div>
				)}
				{action && <div className="mt-2">{action}</div>}
			</div>
			<button
				type="button"
				aria-label="Dismiss"
				className="text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer shrink-0"
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
