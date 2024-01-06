import { Route } from "@tanstack/react-router";

import root from "../router/root";
import Layout from "./Layout";

export default new Route({
	getParentRoute: () => root,
	id: "layout",

	component: Layout,
});
