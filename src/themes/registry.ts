import type { ThemeDefinition } from "./types";
import { magicKingdom } from "./magic-kingdom";
import { spaceMountain } from "./space-mountain";
import { hauntedMansion } from "./haunted-mansion";
import { animalKingdom } from "./animal-kingdom";
import { starWars } from "./star-wars";
import { frozen } from "./frozen";
import { tron } from "./tron";
import { villains } from "./villains";
import { toyStory } from "./toy-story";
import { tomorrowland } from "./tomorrowland";

/** All registered themes, keyed by id. */
export const themes: Record<string, ThemeDefinition> = {
	[magicKingdom.id]: magicKingdom,
	[spaceMountain.id]: spaceMountain,
	[hauntedMansion.id]: hauntedMansion,
	[animalKingdom.id]: animalKingdom,
	[starWars.id]: starWars,
	[frozen.id]: frozen,
	[tron.id]: tron,
	[villains.id]: villains,
	[toyStory.id]: toyStory,
	[tomorrowland.id]: tomorrowland,
};

/** Ordered list for the theme picker UI. */
export const themeList: ThemeDefinition[] = [
	magicKingdom, frozen, animalKingdom, toyStory, tomorrowland,
	spaceMountain, hauntedMansion, starWars, tron, villains,
];

/** Default theme when nothing is stored. */
export const DEFAULT_THEME_ID = "space-mountain";

export { magicKingdom, spaceMountain, hauntedMansion, animalKingdom, starWars, frozen, tron, villains, toyStory, tomorrowland };
export type { ThemeDefinition } from "./types";
