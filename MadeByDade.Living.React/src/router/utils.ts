import { DefaultError, QueryKey, UseQueryOptions } from "@tanstack/react-query";
import React from "react";
import { AuthContext } from "../auth/AuthProvider";
import { RouterContext } from "./root";

export function GetRouterDevTools() {
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

interface BuildQueryOptionsParams {
	acquireToken: AuthContext["acquireToken"];
}

export function GetQueryOptionsBuilder<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(
	builder: (params: BuildQueryOptionsParams) => UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
) {
	return builder;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function GetLoader(...queryOptionBuilders: ((params: BuildQueryOptionsParams) => UseQueryOptions<any, any, any, QueryKey>)[]) {
	return ({ context: { auth, queryClient } }: { context: RouterContext }) => {
		for (const builder of queryOptionBuilders) {
			const options = builder({ acquireToken: auth.acquireToken });
			queryClient.ensureQueryData(options);
		}
	};
}
