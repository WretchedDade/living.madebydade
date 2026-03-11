import type { ThemeDefinition } from "./types";

/**
 * Animal Kingdom — Light/warm theme
 * Earthy tones, safari greens, terracotta accents.
 * Grounded and organic — like a walk through the savanna.
 */
export const animalKingdom: ThemeDefinition = {
	id: "animal-kingdom",
	name: "Animal Kingdom",
	description: "Earthy and warm, straight from the savanna.",
	colorScheme: "light",
	radius: "0.75rem",
	colors: {
		background: "35 25% 96%",
		foreground: "25 20% 15%",
		card: "35 20% 100%",
		"card-foreground": "25 20% 15%",
		popover: "30 15% 94%",
		"popover-foreground": "25 20% 15%",
		primary: "145 35% 35%",
		"primary-foreground": "0 0% 100%",
		secondary: "18 60% 55%",
		"secondary-foreground": "0 0% 100%",
		muted: "35 15% 91%",
		"muted-foreground": "25 12% 45%",
		accent: "18 60% 55%",
		"accent-foreground": "0 0% 100%",
		destructive: "0 65% 50%",
		"destructive-foreground": "0 0% 100%",
		success: "145 45% 38%",
		"success-foreground": "0 0% 100%",
		warning: "38 80% 50%",
		"warning-foreground": "25 20% 15%",
		info: "200 45% 48%",
		"info-foreground": "0 0% 100%",
		border: "35 12% 85%",
		input: "35 12% 85%",
		ring: "145 35% 35%",
	},
};
