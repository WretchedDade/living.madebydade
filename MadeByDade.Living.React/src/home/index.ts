import { Route } from "@tanstack/react-router";

import layout from "../layout";
import Home from "./Home";

export default new Route({
	getParentRoute: () => layout,
	path: "/",

	component: Home,
});
