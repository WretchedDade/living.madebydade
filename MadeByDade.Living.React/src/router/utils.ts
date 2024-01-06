import { DefaultError, QueryKey, UseQueryOptions } from "@tanstack/react-query";
import React from "react";
import { AuthContext } from "../auth/AuthProvider";

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
