import type { ThemeDefinition } from "./types";

/**
 * Frozen — Light/icy theme
 * Crystal blues, frosty whites, soft lavender accents.
 * Ethereal and crisp — like Elsa's ice palace.
 */
export const frozen: ThemeDefinition = {
	id: "frozen",
	name: "Frozen",
	description: "Icy elegance from Arendelle.",
	colorScheme: "light",
	radius: "0.75rem",
	colors: {
		background: "210 30% 97%",
		foreground: "215 25% 18%",
		card: "210 25% 100%",
		"card-foreground": "215 25% 18%",
		popover: "210 20% 95%",
		"popover-foreground": "215 25% 18%",
		primary: "205 70% 50%",
		"primary-foreground": "0 0% 100%",
		secondary: "270 40% 65%",
		"secondary-foreground": "0 0% 100%",
		muted: "210 20% 93%",
		"muted-foreground": "215 15% 45%",
		accent: "270 40% 65%",
		"accent-foreground": "0 0% 100%",
		destructive: "350 65% 52%",
		"destructive-foreground": "0 0% 100%",
		success: "170 50% 40%",
		"success-foreground": "0 0% 100%",
		warning: "38 75% 52%",
		"warning-foreground": "215 25% 18%",
		info: "205 70% 50%",
		"info-foreground": "0 0% 100%",
		border: "210 18% 87%",
		input: "210 18% 87%",
		ring: "205 70% 50%",
	},
};
