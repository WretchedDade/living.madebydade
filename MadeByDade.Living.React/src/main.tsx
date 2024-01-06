import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { MsalProvider } from "@azure/msal-react";
import { QueryClientProvider } from "@tanstack/react-query";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import LivingRouter from "./router";

import { AuthProvider } from "./auth";
import { msalInstance, queryClient } from "./config";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MantineProvider>
			<Notifications />
			<MsalProvider instance={msalInstance}>
				<AuthProvider>
					<QueryClientProvider client={queryClient}>
						<LivingRouter />
					</QueryClientProvider>
				</AuthProvider>
			</MsalProvider>
		</MantineProvider>
	</StrictMode>
);
