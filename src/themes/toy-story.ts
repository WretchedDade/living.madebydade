import type { ThemeDefinition } from "./types";

/**
 * Toy Story — Light theme
 * Bold primary colors, playful and cheerful.
 * Fun and nostalgic — like Andy's room.
 */
export const toyStory: ThemeDefinition = {
	id: "toy-story",
	name: "Toy Story",
	description: "To infinity and beyond!",
	colorScheme: "light",
	radius: "1rem",
	colors: {
		background: "45 30% 97%",
		foreground: "220 30% 18%",
		card: "45 20% 100%",
		"card-foreground": "220 30% 18%",
		popover: "45 15% 95%",
		"popover-foreground": "220 30% 18%",
		primary: "220 75% 50%",
		"primary-foreground": "0 0% 100%",
		secondary: "0 75% 52%",
		"secondary-foreground": "0 0% 100%",
		muted: "45 15% 92%",
		"muted-foreground": "220 15% 45%",
		accent: "45 85% 52%",
		"accent-foreground": "220 30% 18%",
		destructive: "0 75% 52%",
		"destructive-foreground": "0 0% 100%",
		success: "145 55% 38%",
		"success-foreground": "0 0% 100%",
		warning: "45 85% 52%",
		"warning-foreground": "220 30% 18%",
		info: "220 75% 50%",
		"info-foreground": "0 0% 100%",
		border: "45 15% 85%",
		input: "45 15% 85%",
		ring: "220 75% 50%",
	},
};
