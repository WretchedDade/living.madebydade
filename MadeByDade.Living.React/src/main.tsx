import "@mantine/core/styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { MsalProvider } from "@azure/msal-react";
import { MantineProvider } from "@mantine/core";
import { QueryClientProvider } from "@tanstack/react-query";

import Router from "./router";

import { AuthProvider } from "./auth";
import { msalInstance, queryClient } from "./config";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MantineProvider>
			<MsalProvider instance={msalInstance}>
				<AuthProvider>
					<QueryClientProvider client={queryClient}>
						<Router />
					</QueryClientProvider>
				</AuthProvider>
			</MsalProvider>
		</MantineProvider>
	</StrictMode>
);
