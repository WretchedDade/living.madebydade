import React, { Suspense } from "react";

import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NotFoundRoute, Outlet, RouterProvider, Router as TanstackRouter, rootRouteWithContext } from "@tanstack/react-router";

import { queryClient } from "./config";

import { useAuth } from "./auth";
import { AuthContext } from "./auth/AuthProvider";

import { HomeRoute } from "./Home";
import { LayoutRoute } from "./Layout";
import { BillRoute } from "./bills/Bill";
import { BillsRoute } from "./bills/Bills";
import { UnpaidBillsRoute } from "./bills/UnpaidBills";
import NotFoundBanner from "./shared/NotFoundBanner";

const TanStackRouterDevtools = GetRouterDevTools()!;

export interface RouterContext {
	auth: AuthContext;
	queryClient: QueryClient;
}

const buildRoot = rootRouteWithContext<RouterContext>();

export const RootRoute = buildRoot({
	component: function Root() {
		return (
			<>
				<Outlet />
				<Suspense fallback={null}>
					<ReactQueryDevtools buttonPosition="bottom-left" />
					{TanStackRouterDevtools && <TanStackRouterDevtools position="bottom-right" />}
				</Suspense>
			</>
		);
	},
});

function GetRouterDevTools() {
	if (import.meta.env.PROD) return null;

	if (import.meta.env.DEV) {
		return React.lazy(() =>
			// Lazy load in development
			import("@tanstack/router-devtools").then((res) => ({
				default: res.TanStackRouterDevtools,
				// For Embedded Mode
				// default: res.TanStackRouterDevtoolsPanel
			}))
		);
	}
}

const routeTree = RootRoute.addChildren([LayoutRoute.addChildren([HomeRoute, BillsRoute.addChildren([BillRoute]), UnpaidBillsRoute])]);

export default function Router() {
	const auth = useAuth();

	const router = new TanstackRouter({
		routeTree,

		notFoundRoute: new NotFoundRoute({
			getParentRoute: () => RootRoute,
			component: NotFoundBanner,
		}),

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
