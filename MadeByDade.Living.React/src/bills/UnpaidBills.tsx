import { useQuery } from "@tanstack/react-query";
import { Route } from "@tanstack/react-router";

import { Center } from "@mantine/core";

import { BillQueryKeys, GetUnpaidBillPayments } from "./api/Queries";

import { useAuth } from "../auth";

import { LayoutRoute } from "../Layout";

import { useDocumentTitle } from "@mantine/hooks";
import LivingContainer from "../shared/LivingContainer";
import { BillPaymentsGrid } from "./components/BillPaymentsGrid";
import NoUnpaidBillsBanner from "./components/NoUnpaidBillsBanner";

export const UnpaidBillsRoute = new Route({
	getParentRoute: () => LayoutRoute,
	path: "/UnpaidBills",

	loader: ({ context }) =>
		context.queryClient.ensureQueryData({
			queryKey: BillQueryKeys.UnpaidBillPayments,

			queryFn: ({ signal }) => GetUnpaidBillPayments(context.auth.acquireToken, signal),
		}),

	component: UnpaidBills,
});

function UnpaidBills() {
	useDocumentTitle("Living | Unpaid Bills");

	const auth = useAuth();

	const unpaidBillsQuery = useQuery({
		queryKey: BillQueryKeys.UnpaidBillPayments,

		queryFn: ({ signal }) => GetUnpaidBillPayments(auth.acquireToken, signal),
	});

	if (unpaidBillsQuery.isSuccess && unpaidBillsQuery.data.length === 0)
		return (
			<LivingContainer>
				<Center h="75%">
					<NoUnpaidBillsBanner />
				</Center>
			</LivingContainer>
		);

	return (
		<LivingContainer title="Unpaid Bills">
			{unpaidBillsQuery.isLoading && <BillPaymentsGrid skeleton numberOfSkeletons={3} />}
			{unpaidBillsQuery.isSuccess && <>{unpaidBillsQuery.data.length > 0 && <BillPaymentsGrid billPayments={unpaidBillsQuery.data} />}</>}
		</LivingContainer>
	);
}
