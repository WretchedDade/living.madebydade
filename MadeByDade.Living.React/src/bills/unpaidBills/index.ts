import { Route } from "@tanstack/react-router";

import layout from "../../layout";
import UnpaidBills from "./UnpaidBills";

import { GetLoader } from "../../router/utils";
import { BuildUnpaidBillPaymentsQueryOptions } from "../Queries";

export default new Route({
	getParentRoute: () => layout,
	path: "/UnpaidBills",

	loader: GetLoader(BuildUnpaidBillPaymentsQueryOptions),

	wrapInSuspense: true,
	component: UnpaidBills,
});
