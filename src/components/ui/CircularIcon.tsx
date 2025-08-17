import React from "react";

import { useTheme } from "../provider/ThemeProvider";

type IconType = React.ElementType<{ className?: string }>;

interface CircularIconProps {
	icon?: IconType;
	image?: React.ReactElement<{ className?: string }> | string;
	size?: number | string; // e.g. 32, '2rem', etc.
}

/**
 * Renders any icon (as a component) or image in a circular, styled container.
 * - `icon`: pass a Radix icon or similar React component
 * - `image`: pass an <img> or similar node
 * - `size`: sets width/height (default: 48px)
 */
export function CircularIcon({ icon: Icon, image, size = 48 }: CircularIconProps) {
	const { theme } = useTheme();
	return (
		<span
			className={`relative flex items-center justify-center rounded-full border-[var(--border-color)] border-2 ring-4 shadow-[var(--shadow-lg)]`}
			style={{ width: size, height: size }}
			data-theme={theme}
		>
			{/* Decorative radial gradient overlay for visual interest */}
			<span
				className="absolute inset-0 rounded-full pointer-events-none"
				style={{
					background: "radial-gradient(circle at 30% 30%, var(--color-primary) 0%, transparent 70%)",
					opacity: 0.25,
				}}
			/>
			<span className="w-full h-full flex items-center justify-center rounded-full overflow-hidden">
				{Icon ? <Icon className="w-2/3 h-2/3 text-inherit" /> : null}
				{image && React.isValidElement(image)
					? image.type === "img"
						? React.cloneElement(
								image as React.ReactElement<{
									className?: string;
									draggable?: boolean;
								}>,
								{
									className: `w-full h-full object-cover rounded-full${image.props.className ? " " + image.props.className : ""}`,
									draggable: false,
								},
							)
						: React.cloneElement(image as React.ReactElement<{ className?: string }>, {
								className: `w-full h-full object-cover rounded-full${image.props.className ? " " + image.props.className : ""}`,
							})
					: image}
			</span>
		</span>
	);
}

// Removed unused gradient and blurGradient
