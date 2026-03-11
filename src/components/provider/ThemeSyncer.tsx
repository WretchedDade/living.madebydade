import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";
import { useSetThemeFromServer, registerThemePersist } from "./ThemeProvider";

/**
 * Syncs theme selection to/from Convex userSettings.
 * Must be rendered inside both ThemeProvider and ConvexProvider.
 * - On mount: reads server theme and applies if different from localStorage
 * - On theme change: writes to Convex via registerThemePersist callback
 */
export function ThemeSyncer() {
	const setThemeFromServer = useSetThemeFromServer();
	const settingsQuery = useQuery(convexQuery(api.userSettings.get, {}));
	const setThemeMutation = useConvexMutation(api.userSettings.setTheme);
	const hasSyncedRef = useRef(false);

	// On mount, apply server theme if it exists and differs from local
	useEffect(() => {
		if (settingsQuery.data?.themeId && setThemeFromServer && !hasSyncedRef.current) {
			setThemeFromServer(settingsQuery.data.themeId);
			hasSyncedRef.current = true;
		}
	}, [settingsQuery.data?.themeId, setThemeFromServer]);

	// Register the persist callback so ThemeProvider can write to Convex on change
	useEffect(() => {
		registerThemePersist((id: string) => {
			setThemeMutation({ themeId: id });
		});
		return () => registerThemePersist(() => {});
	}, [setThemeMutation]);

	return null;
}
