import type { ThemeDefinition } from "./types";

/**
 * Space Mountain — Dark theme
 * Deep navy backgrounds, cool purple primary, teal accents.
 * Modern, bold, immersive — like hurtling through the cosmos.
 */
export const spaceMountain: ThemeDefinition = {
	id: "space-mountain",
	name: "Space Mountain",
	description: "Bold and futuristic, straight from Tomorrowland.",
	colorScheme: "dark",
	radius: "0.75rem",
	colors: {
		background: "230 20% 10%",
		foreground: "220 15% 92%",
		card: "230 16% 15%",
		"card-foreground": "220 15% 92%",
		popover: "230 16% 19%",
		"popover-foreground": "220 15% 92%",
		primary: "265 55% 62%",
		"primary-foreground": "0 0% 100%",
		secondary: "178 55% 50%",
		"secondary-foreground": "0 0% 100%",
		muted: "230 15% 17%",
		"muted-foreground": "220 10% 55%",
		accent: "178 55% 50%",
		"accent-foreground": "0 0% 100%",
		destructive: "0 70% 55%",
		"destructive-foreground": "0 0% 100%",
		success: "160 55% 45%",
		"success-foreground": "0 0% 100%",
		warning: "38 90% 52%",
		"warning-foreground": "230 20% 10%",
		info: "210 65% 58%",
		"info-foreground": "0 0% 100%",
		border: "230 15% 23%",
		input: "230 15% 23%",
		ring: "265 55% 62%",
	},
};
