import React from "react";

export function Skeleton({ className = "", style = {}, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={`animate-pulse bg-zinc-800 rounded ${className}`}
			style={{ minHeight: 16, ...style }}
			{...props}
		/>
	);
}
