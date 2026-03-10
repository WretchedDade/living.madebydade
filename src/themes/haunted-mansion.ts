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
	radius: "0.5rem",
	colors: {
		background: "160 18% 8%",
		foreground: "80 8% 82%",
		card: "160 14% 11%",
		"card-foreground": "80 8% 82%",
		popover: "160 14% 11%",
		"popover-foreground": "80 8% 82%",
		primary: "160 35% 42%",
		"primary-foreground": "0 0% 100%",
		secondary: "42 50% 48%",
		"secondary-foreground": "160 18% 8%",
		muted: "160 12% 15%",
		"muted-foreground": "80 6% 50%",
		accent: "42 50% 48%",
		"accent-foreground": "160 18% 8%",
		destructive: "0 55% 48%",
		"destructive-foreground": "0 0% 100%",
		success: "140 40% 40%",
		"success-foreground": "0 0% 100%",
		warning: "42 70% 50%",
		"warning-foreground": "160 18% 8%",
		info: "200 45% 48%",
		"info-foreground": "0 0% 100%",
		border: "160 10% 18%",
		input: "160 10% 18%",
		ring: "160 35% 42%",
	},
};
