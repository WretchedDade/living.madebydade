/** All CSS variable keys that a theme must define. */
export const themeColorKeys = [
	"background",
	"foreground",
	"card",
	"card-foreground",
	"popover",
	"popover-foreground",
	"primary",
	"primary-foreground",
	"secondary",
	"secondary-foreground",
	"muted",
	"muted-foreground",
	"accent",
	"accent-foreground",
	"destructive",
	"destructive-foreground",
	"success",
	"success-foreground",
	"warning",
	"warning-foreground",
	"info",
	"info-foreground",
	"border",
	"input",
	"ring",
] as const;

export type ThemeColorKey = (typeof themeColorKeys)[number];

/** HSL values without the `hsl()` wrapper, e.g. "220 14% 10%". */
export type ThemeColors = Record<ThemeColorKey, string>;

export interface ThemeDefinition {
	/** Unique slug used as localStorage value and CSS class. */
	id: string;
	/** Human-readable name shown in the theme picker. */
	name: string;
	/** Short tagline. */
	description: string;
	/** Controls the Tailwind dark-mode class on `<html>`. */
	colorScheme: "light" | "dark";
	/** HSL color values keyed by CSS variable name. */
	colors: ThemeColors;
	/** Border-radius base value (rem). */
	radius?: string;
}
