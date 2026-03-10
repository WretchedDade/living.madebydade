import type { ThemeDefinition } from "./types";
import { magicKingdom } from "./magic-kingdom";
import { spaceMountain } from "./space-mountain";
import { hauntedMansion } from "./haunted-mansion";

/** All registered themes, keyed by id. */
export const themes: Record<string, ThemeDefinition> = {
	[magicKingdom.id]: magicKingdom,
	[spaceMountain.id]: spaceMountain,
	[hauntedMansion.id]: hauntedMansion,
};

/** Ordered list for the theme picker UI. */
export const themeList: ThemeDefinition[] = [magicKingdom, spaceMountain, hauntedMansion];

/** Default theme when nothing is stored. */
export const DEFAULT_THEME_ID = "space-mountain";

export { magicKingdom, spaceMountain, hauntedMansion };
export type { ThemeDefinition } from "./types";
