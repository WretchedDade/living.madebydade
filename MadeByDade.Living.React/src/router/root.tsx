import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet, rootRouteWithContext } from "@tanstack/react-router";

import { Suspense } from "react";
import { AuthContext } from "../auth/AuthProvider";
import { GetRouterDevTools } from "./utils";

// eslint-disable-next-line react-refresh/only-export-components
const TanStackRouterDevtools = GetRouterDevTools()!;

const buildRoot = rootRouteWithContext<{
	auth: AuthContext;
	queryClient: QueryClient;
}>();

const root = buildRoot({
	component: function Root() {
		return (
			<>
				<Outlet />
				<Suspense fallback={null}>
					<ReactQueryDevtools buttonPosition="bottom-left" />
					<TanStackRouterDevtools position="bottom-right" />
				</Suspense>
			</>
		);
	},
});

export default root;
