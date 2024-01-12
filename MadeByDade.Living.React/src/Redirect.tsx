import { useAuth } from "./auth";
import { RootRoute } from "./Router";

import { Route, redirect as TanstackRedirect } from "@tanstack/react-router";

export const RedirectRoute = new Route({
	getParentRoute: () => RootRoute,
	path: "/Redirect",
	component: Redirect,
});

function Redirect() {
	const auth = useAuth();

	return TanstackRedirect({
		to: auth.redirect ?? "/",
		params: {},
		search: {},
	});
}
