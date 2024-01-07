import { Route, lazyRouteComponent } from "@tanstack/react-router";

import { BuildUnpaidBillPaymentsQueryOptions } from "../bills/Queries";
import layout from "../layout";
import { GetLoader } from "../router/utils";

export default new Route({
	getParentRoute: () => layout,
	path: "/",

	loader: GetLoader(BuildUnpaidBillPaymentsQueryOptions),

	wrapInSuspense: true,
	component: lazyRouteComponent(() => import("./Home")),
});
