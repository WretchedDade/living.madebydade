import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { getButtonStyles, ButtonStyleOptions } from "./buttonStyles";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleOptions {
	children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ children, variant = "primary", size = "md", icon = false, className = "", circular = false, ...props },
		ref,
	) => {
		const classes = getButtonStyles({ variant, size, icon, circular, className });

		return (
			<button ref={ref} className={classes} {...props}>
				{children}
			</button>
		);
	},
);
