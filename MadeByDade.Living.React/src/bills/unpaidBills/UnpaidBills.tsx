import { Center, Container, Title } from "@mantine/core";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useAuth } from "../../auth";

import { BuildUnpaidBillPaymentsQueryOptions } from "../Queries";
import { BillsGrid } from "./BillsGrid";
import NoUnpaidBillsBanner from "./NoUnpaidBillsBanner";

export default function UnpaidBills() {
	const auth = useAuth();
	const unpaidBillsQuery = useSuspenseQuery(BuildUnpaidBillPaymentsQueryOptions(auth));

	if (unpaidBillsQuery.isSuccess && unpaidBillsQuery.data.length === 0)
		return (
			<Container fluid flex={1}>
				<Center h="75%">
					<NoUnpaidBillsBanner />
				</Center>
			</Container>
		);

	return (
		<Container fluid flex={1}>
			<Title order={1} mb="lg">
				Unpaid Bills
			</Title>

			{unpaidBillsQuery.isLoading || (unpaidBillsQuery.isFetching && <BillsGrid skeleton numberOfSkeletons={3} />)}
			{unpaidBillsQuery.isSuccess && <>{unpaidBillsQuery.data.length > 0 && <BillsGrid bills={unpaidBillsQuery.data} />}</>}
		</Container>
	);
}
