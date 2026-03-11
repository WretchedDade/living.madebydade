import type { ThemeDefinition } from "./types";

/**
 * Tron — Dark theme
 * Pure black with electric cyan neon glow.
 * Digital and immersive — like the Grid.
 */
export const tron: ThemeDefinition = {
	id: "tron",
	name: "Tron",
	description: "Electric neon from the Grid.",
	colorScheme: "dark",
	radius: "0.5rem",
	colors: {
		background: "200 10% 4%",
		foreground: "185 60% 85%",
		card: "200 8% 8%",
		"card-foreground": "185 60% 85%",
		popover: "200 8% 12%",
		"popover-foreground": "185 60% 85%",
		primary: "185 100% 50%",
		"primary-foreground": "200 10% 4%",
		secondary: "35 90% 55%",
		"secondary-foreground": "200 10% 4%",
		muted: "200 8% 12%",
		"muted-foreground": "185 20% 45%",
		accent: "35 90% 55%",
		"accent-foreground": "200 10% 4%",
		destructive: "0 80% 55%",
		"destructive-foreground": "0 0% 100%",
		success: "160 80% 45%",
		"success-foreground": "200 10% 4%",
		warning: "35 90% 55%",
		"warning-foreground": "200 10% 4%",
		info: "185 100% 50%",
		"info-foreground": "200 10% 4%",
		border: "185 30% 15%",
		input: "185 30% 15%",
		ring: "185 100% 50%",
	},
};
