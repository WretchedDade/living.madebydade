import { PublicClientApplication } from "@azure/msal-browser";
import { QueryClient } from "@tanstack/react-query";

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
