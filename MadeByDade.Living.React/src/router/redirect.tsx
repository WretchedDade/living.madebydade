import { useAuth } from "../auth";
import root from "./root";

import { Route, redirect } from "@tanstack/react-router";

export default new Route({
	getParentRoute: () => root,
	path: "/Redirect",
	component: function Home() {
		const auth = useAuth();

		return redirect({
			to: auth.redirect ?? "/",
		});
	},
});
