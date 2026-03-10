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
	radius: "0.625rem",
	colors: {
		background: "230 25% 9%",
		foreground: "220 15% 90%",
		card: "230 22% 12%",
		"card-foreground": "220 15% 90%",
		popover: "230 22% 12%",
		"popover-foreground": "220 15% 90%",
		primary: "265 60% 60%",
		"primary-foreground": "0 0% 100%",
		secondary: "178 60% 48%",
		"secondary-foreground": "0 0% 100%",
		muted: "230 18% 16%",
		"muted-foreground": "220 10% 55%",
		accent: "178 60% 48%",
		"accent-foreground": "0 0% 100%",
		destructive: "0 72% 56%",
		"destructive-foreground": "0 0% 100%",
		success: "160 60% 45%",
		"success-foreground": "0 0% 100%",
		warning: "38 92% 50%",
		"warning-foreground": "230 25% 9%",
		info: "210 70% 58%",
		"info-foreground": "0 0% 100%",
		border: "230 18% 20%",
		input: "230 18% 20%",
		ring: "265 60% 60%",
	},
};
