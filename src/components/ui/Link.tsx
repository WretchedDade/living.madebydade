import React, { ReactNode } from "react";
import { Link as RouterLink } from "@tanstack/react-router";
import { getButtonStyles, ButtonStyleOptions } from "./buttonStyles";

export interface LinkProps extends React.ComponentProps<typeof RouterLink>, ButtonStyleOptions {
	children?: ReactNode;
}

export function Link({
	children,
	className,
	variant = "outline",
	size = "md",
	icon = false,
	circular = false,
	...rest
}: LinkProps) {
	const classes = getButtonStyles({
		variant,
		size,
		icon,
		circular,
		className,
	});
	return (
		<RouterLink {...rest} className={classes}>
			{children}
		</RouterLink>
	);
}
