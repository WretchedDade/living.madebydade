import type { ThemeDefinition } from "./types";

/**
 * Magic Kingdom — Light theme
 * Warm whites, royal blue primary, gold accents.
 * Clean, magical, inviting — like a sunny day at the park.
 */
export const magicKingdom: ThemeDefinition = {
	id: "magic-kingdom",
	name: "Magic Kingdom",
	description: "Warm and inviting, just like Main Street U.S.A.",
	colorScheme: "light",
	radius: "0.75rem",
	colors: {
		background: "40 30% 98%",
		foreground: "224 20% 16%",
		card: "0 0% 100%",
		"card-foreground": "224 20% 16%",
		popover: "40 20% 96%",
		"popover-foreground": "224 20% 16%",
		primary: "225 60% 40%",
		"primary-foreground": "0 0% 100%",
		secondary: "43 75% 52%",
		"secondary-foreground": "224 20% 16%",
		muted: "40 15% 94%",
		"muted-foreground": "220 10% 46%",
		accent: "43 75% 52%",
		"accent-foreground": "224 20% 16%",
		destructive: "0 70% 50%",
		"destructive-foreground": "0 0% 100%",
		success: "152 55% 38%",
		"success-foreground": "0 0% 100%",
		warning: "38 90% 52%",
		"warning-foreground": "224 20% 16%",
		info: "217 55% 52%",
		"info-foreground": "0 0% 100%",
		border: "40 14% 84%",
		input: "40 14% 84%",
		ring: "225 60% 40%",
	},
};
