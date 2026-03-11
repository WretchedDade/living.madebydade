import type { ThemeDefinition } from "./types";

/**
 * Star Wars — Dark theme
 * Deep space black, lightsaber blue primary, imperial red accents.
 * Cinematic and dramatic — like the opening crawl.
 */
export const starWars: ThemeDefinition = {
	id: "star-wars",
	name: "Star Wars",
	description: "A long time ago, in a galaxy far far away...",
	colorScheme: "dark",
	radius: "0.625rem",
	colors: {
		background: "220 15% 6%",
		foreground: "45 10% 88%",
		card: "220 12% 10%",
		"card-foreground": "45 10% 88%",
		popover: "220 12% 14%",
		"popover-foreground": "45 10% 88%",
		primary: "210 80% 55%",
		"primary-foreground": "0 0% 100%",
		secondary: "0 70% 50%",
		"secondary-foreground": "0 0% 100%",
		muted: "220 10% 14%",
		"muted-foreground": "220 8% 50%",
		accent: "45 70% 55%",
		"accent-foreground": "220 15% 6%",
		destructive: "0 70% 50%",
		"destructive-foreground": "0 0% 100%",
		success: "145 50% 42%",
		"success-foreground": "0 0% 100%",
		warning: "45 70% 55%",
		"warning-foreground": "220 15% 6%",
		info: "210 80% 55%",
		"info-foreground": "0 0% 100%",
		border: "220 10% 16%",
		input: "220 10% 16%",
		ring: "210 80% 55%",
	},
};
