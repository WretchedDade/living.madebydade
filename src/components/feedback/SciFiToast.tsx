import React from "react";
import { toast } from "sonner";
import { CheckIcon, XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { SciFiBars } from "../ui/SciFiBars";
import { TailwindColor } from "~/utils/tailwind-types";

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
		borderColor: "border-emerald-500",
		shadowColor: "shadow-emerald-500/20",
		icon: <CheckIcon className="w-6 h-6 text-emerald-400" />,
		iconColor: "text-emerald-400",
		titleColor: "text-emerald-300",
		descColor: "text-emerald-200",
		barsColor: "emerald",
	},
	error: {
		borderColor: "border-rose-500",
		shadowColor: "shadow-rose-500/20",
		icon: <XMarkIcon className="w-6 h-6 text-rose-400" />,
		iconColor: "text-rose-400",
		titleColor: "text-rose-300",
		descColor: "text-rose-200",
		barsColor: "rose",
	},
	warning: {
		borderColor: "border-amber-500",
		shadowColor: "shadow-amber-500/20",
		icon: <ExclamationTriangleIcon className="w-6 h-6 text-amber-400" />,
		iconColor: "text-amber-400",
		titleColor: "text-amber-300",
		descColor: "text-amber-200",
		barsColor: "amber",
	},
};

export function CustomToast({ title, description, action, variant = "success", t }: CustomToastProps & { t?: any }) {
	const styles = variantStyles[variant ?? "success"];

	return (
		<div
			className={`bg-zinc-900 border ${styles.borderColor} ${styles.shadowColor} shadow-md rounded-lg text-cyan-200 font-mono px-4 py-2 flex flex-col gap-2 sci-fi-glow relative`}
		>
			<button
				type="button"
				aria-label="Dismiss"
				className={`absolute -top-3 -right-3 p-1 rounded-full shadow-md border-2 ${styles.borderColor} bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 ${styles.shadowColor} cursor-pointer`}
				onClick={() => t && toast.dismiss(t)}
			>
				<XMarkIcon width={18} height={18} className={`${styles.iconColor} hover:opacity-80`} />
			</button>
			<div className="flex justify-center mb-2">
				<SciFiBars count={7} className="max-w-xs" color={styles.barsColor as TailwindColor} />
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
