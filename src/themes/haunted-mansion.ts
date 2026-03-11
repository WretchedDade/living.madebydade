import type { ThemeDefinition } from "./types";

/**
 * Haunted Mansion — Dark theme
 * Moody greens, dusty purple, aged gold accents.
 * Eerie elegance — dark but warm, like the stretching room.
 */
export const hauntedMansion: ThemeDefinition = {
	id: "haunted-mansion",
	name: "Haunted Mansion",
	description: "Eerie elegance from the other side.",
	colorScheme: "dark",
	radius: "0.625rem",
	colors: {
		background: "160 15% 9%",
		foreground: "80 8% 84%",
		card: "160 10% 14%",
		"card-foreground": "80 8% 84%",
		popover: "160 10% 18%",
		"popover-foreground": "80 8% 84%",
		primary: "160 30% 45%",
		"primary-foreground": "0 0% 100%",
		secondary: "42 45% 50%",
		"secondary-foreground": "160 15% 9%",
		muted: "160 10% 16%",
		"muted-foreground": "80 6% 50%",
		accent: "42 45% 50%",
		"accent-foreground": "160 15% 9%",
		destructive: "0 55% 50%",
		"destructive-foreground": "0 0% 100%",
		success: "140 40% 42%",
		"success-foreground": "0 0% 100%",
		warning: "42 65% 52%",
		"warning-foreground": "160 15% 9%",
		info: "200 42% 50%",
		"info-foreground": "0 0% 100%",
		border: "160 10% 22%",
		input: "160 10% 22%",
		ring: "160 30% 45%",
	},
};
