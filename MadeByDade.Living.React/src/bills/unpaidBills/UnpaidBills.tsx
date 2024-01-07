import { Container, Title } from "@mantine/core";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useAuth } from "../../auth";

import { BuildUnpaidBillPaymentsQueryOptions } from "../Queries";
import { BillsGrid } from "./BillsGrid";

export default function UnpaidBills() {
	const auth = useAuth();
	const unpaidBillsQuery = useSuspenseQuery(BuildUnpaidBillPaymentsQueryOptions(auth));

	return (
		<Container fluid>
			<Title order={1}>Unpaid Bills</Title>

			{unpaidBillsQuery.isLoading && <BillsGrid skeleton numberOfSkeletons={3} />}
			{unpaidBillsQuery.isSuccess && <BillsGrid bills={unpaidBillsQuery.data} />}
		</Container>
	);
}
