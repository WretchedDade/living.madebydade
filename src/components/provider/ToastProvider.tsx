import { Toaster } from "sonner";
import React from "react";
import { useTheme } from "./ThemeProvider";

export function ToastProvider() {
	const { theme } = useTheme();
	return <Toaster position="top-right" theme={theme.colorScheme} />;
}
