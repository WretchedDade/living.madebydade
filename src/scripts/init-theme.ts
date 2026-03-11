/**
 * Runs before React mounts to prevent a flash of unstyled content.
 * Reads the stored theme and applies the color-scheme class immediately.
 */
function initTheme() {
	const STORAGE_KEY = "living-madebydade-theme";
	const DEFAULT_SCHEME = "dark";

	// Theme id → color scheme mapping (duplicated to avoid importing modules in a raw script)
	const schemeMap: Record<string, string> = {
		"magic-kingdom": "light",
		"space-mountain": "dark",
		"haunted-mansion": "dark",
		"animal-kingdom": "light",
		"star-wars": "dark",
		"frozen": "light",
		"tron": "dark",
		"villains": "dark",
		"toy-story": "light",
		"tomorrowland": "light",
	};

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		const scheme = (stored && schemeMap[stored]) || DEFAULT_SCHEME;
		document.documentElement.classList.add(scheme);
	} catch {
		document.documentElement.classList.add(DEFAULT_SCHEME);
	}
}

initTheme();
