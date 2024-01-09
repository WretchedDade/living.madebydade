import { PublicClientApplication } from "@azure/msal-browser";
import { createTheme } from "@mantine/core";
import { QueryClient } from "@tanstack/react-query";

import { DEFAULT_THEME, Notification } from "@mantine/core";

export const queryClient = new QueryClient();
export const msalInstance = new PublicClientApplication({
	auth: {
		clientId: import.meta.env.VITE_AAD_CLIENT_ID,
		authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AAD_TENANT_ID}/`,
	},
	system: {
		loggerOptions: {},
	},
});

export const theme = createTheme({
	components: {
		Notification: Notification.extend({
			defaultProps: {
				radius: "sm",
			},
			styles: {
				icon: {
					borderRadius: DEFAULT_THEME.radius.sm,
				},
			},
		}),
	},
});
