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
	radius: "0.625rem",
	colors: {
		background: "40 33% 98%",
		foreground: "224 20% 16%",
		card: "40 20% 96%",
		"card-foreground": "224 20% 16%",
		popover: "0 0% 100%",
		"popover-foreground": "224 20% 16%",
		primary: "225 65% 36%",
		"primary-foreground": "0 0% 100%",
		secondary: "43 80% 52%",
		"secondary-foreground": "224 20% 16%",
		muted: "40 15% 92%",
		"muted-foreground": "220 10% 46%",
		accent: "43 80% 52%",
		"accent-foreground": "224 20% 16%",
		destructive: "0 72% 51%",
		"destructive-foreground": "0 0% 100%",
		success: "152 60% 36%",
		"success-foreground": "0 0% 100%",
		warning: "38 92% 50%",
		"warning-foreground": "224 20% 16%",
		info: "217 60% 50%",
		"info-foreground": "0 0% 100%",
		border: "40 12% 86%",
		input: "40 12% 86%",
		ring: "225 65% 36%",
	},
};
