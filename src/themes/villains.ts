import type { ThemeDefinition } from "./types";

/**
 * Villains — Dark theme
 * Deep purple-black with poison green and eerie accents.
 * Dramatic and bold — Maleficent's castle at midnight.
 */
export const villains: ThemeDefinition = {
	id: "villains",
	name: "Villains",
	description: "Deliciously dark, darling.",
	colorScheme: "dark",
	radius: "0.625rem",
	colors: {
		background: "280 20% 6%",
		foreground: "270 10% 85%",
		card: "280 18% 10%",
		"card-foreground": "270 10% 85%",
		popover: "280 16% 14%",
		"popover-foreground": "270 10% 85%",
		primary: "120 70% 45%",
		"primary-foreground": "280 20% 6%",
		secondary: "280 50% 55%",
		"secondary-foreground": "0 0% 100%",
		muted: "280 15% 14%",
		"muted-foreground": "270 8% 48%",
		accent: "280 50% 55%",
		"accent-foreground": "0 0% 100%",
		destructive: "0 70% 52%",
		"destructive-foreground": "0 0% 100%",
		success: "120 70% 45%",
		"success-foreground": "280 20% 6%",
		warning: "45 80% 55%",
		"warning-foreground": "280 20% 6%",
		info: "260 50% 60%",
		"info-foreground": "0 0% 100%",
		border: "280 12% 18%",
		input: "280 12% 18%",
		ring: "120 70% 45%",
	},
};
