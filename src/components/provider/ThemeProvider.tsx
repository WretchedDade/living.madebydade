import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { themes, DEFAULT_THEME_ID, themeList } from "~/themes/registry";
import type { ThemeDefinition } from "~/themes/types";
import { themeColorKeys } from "~/themes/types";

const STORAGE_KEY = "living-madebydade-theme";

interface ThemeContextValue {
	/** Currently active theme definition. */
	theme: ThemeDefinition;
	/** Switch to a different theme by id. */
	setTheme: (id: string) => void;
	/** All available themes (for the picker UI). */
	availableThemes: ThemeDefinition[];
	/** Light themes. */
	lightThemes: ThemeDefinition[];
	/** Dark themes. */
	darkThemes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeDefinition) {
	const root = document.documentElement;

	// Apply color-scheme class
	root.classList.remove("light", "dark");
	root.classList.add(theme.colorScheme);

	// Apply CSS variables
	for (const key of themeColorKeys) {
		root.style.setProperty(`--${key}`, theme.colors[key]);
	}

	// Apply border radius
	if (theme.radius) {
		root.style.setProperty("--radius", theme.radius);
	}
}

function getStoredThemeId(): string {
	if (typeof window === "undefined") return DEFAULT_THEME_ID;
	try {
		return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME_ID;
	} catch {
		return DEFAULT_THEME_ID;
	}
}

function resolveTheme(id: string): ThemeDefinition {
	return themes[id] ?? themes[DEFAULT_THEME_ID];
}

const lightThemes = themeList.filter(t => t.colorScheme === "light");
const darkThemes = themeList.filter(t => t.colorScheme === "dark");

/** Callback registry for persistence — ThemeSyncer registers itself here */
let onThemeChangePersist: ((id: string) => void) | null = null;

export function registerThemePersist(cb: (id: string) => void) {
	onThemeChangePersist = cb;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [themeId, setThemeId] = useState(getStoredThemeId);
	const theme = useMemo(() => resolveTheme(themeId), [themeId]);

	useEffect(() => {
		applyTheme(theme);
	}, [theme]);

	const setTheme = useCallback((id: string) => {
		setThemeId(id);
		try {
			localStorage.setItem(STORAGE_KEY, id);
		} catch {
			// localStorage unavailable
		}
		// Persist to Convex if syncer is registered
		onThemeChangePersist?.(id);
	}, []);

	/** Allow external code (ThemeSyncer) to set the theme without triggering persistence */
	const setThemeFromServer = useCallback((id: string) => {
		setThemeId(id);
		try {
			localStorage.setItem(STORAGE_KEY, id);
		} catch {}
	}, []);

	const value = useMemo(
		() => ({ theme, setTheme, availableThemes: themeList, lightThemes, darkThemes }),
		[theme, setTheme],
	);

	return (
		<ThemeContext.Provider value={value}>
			<ThemeFromServerContext.Provider value={setThemeFromServer}>
				{children}
			</ThemeFromServerContext.Provider>
		</ThemeContext.Provider>
	);
}

/** Internal context for ThemeSyncer to set theme without re-persisting */
const ThemeFromServerContext = createContext<((id: string) => void) | null>(null);
export function useSetThemeFromServer() {
	return useContext(ThemeFromServerContext);
}

export function useTheme(): ThemeContextValue {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
	return ctx;
}
