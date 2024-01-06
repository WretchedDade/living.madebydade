import { RouterProvider, Router as TanstackRouter } from "@tanstack/react-router";

import { useAuth } from "../auth";
import { AuthContext } from "../auth/AuthProvider";
import { queryClient } from "../config";

import bills from "../bills/BillSetup";
import home from "../home";
import layout from "../layout";
import redirect from "./redirect";
import root from "./root";

const routeTree = root.addChildren([layout.addChildren([home, bills]), redirect]);

export default function Router() {
	const auth = useAuth();

	const router = new TanstackRouter({
		routeTree,

		defaultPreload: "intent",
		// Since we're using React Query, we don't want loader calls to ever be stale
		// This will ensure that the loader is always called when the route is preloaded or visited
		defaultPreloadStaleTime: 0,

		context: {
			auth,
			queryClient,
		},
	});

	return <RouterProvider router={router} />;
}

const routerForTypeScript = new TanstackRouter({ routeTree, context: { auth: {} as AuthContext, queryClient } });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof routerForTypeScript;
	}
}
