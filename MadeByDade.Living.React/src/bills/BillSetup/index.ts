import { Route } from "@tanstack/react-router";

import layout from "../../layout";
import BillSetup from "./BillSetup";

import { GetLoader } from "../../router/utils";
import { BuildBillsQueryOptions } from "../Queries";

export default new Route({
	getParentRoute: () => layout,
	path: "/BillSetup",

	loader: GetLoader(BuildBillsQueryOptions),

	wrapInSuspense: true,
	component: BillSetup,
});
