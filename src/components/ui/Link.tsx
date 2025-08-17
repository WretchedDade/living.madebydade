import React, { ReactNode } from "react";
import { Link as RouterLink } from "@tanstack/react-router";
import { getButtonStyles, ButtonStyleOptions } from "./buttonStyles";

export interface LinkProps extends React.ComponentProps<typeof RouterLink>, ButtonStyleOptions {
	children?: ReactNode;
	color?: ButtonStyleOptions["color"];
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
		color: rest.color,
	});
	// Remove color from rest so it doesn't get passed to RouterLink
	const { color, ...routerProps } = rest;
	return (
		<RouterLink {...routerProps} className={classes}>
			{children}
		</RouterLink>
	);
}
