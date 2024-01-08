import { Grid, Skeleton, Text } from "@mantine/core";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useAuth } from "../auth";

import { BillCard } from "../bills/BillCard";
import { BuildUnpaidBillPaymentsQueryOptions } from "../bills/Queries";

export function BillsToPay() {
	const auth = useAuth();
	const unpaidBillsQuery = useSuspenseQuery(BuildUnpaidBillPaymentsQueryOptions(auth));

	if (unpaidBillsQuery.isLoading)
		return (
			<>
				<Skeleton height={16} mb="md" />
				<Skeleton height={16} mb="md" />
				<Skeleton height={16} />
			</>
		);

	if (unpaidBillsQuery.error)
		return (
			<Text ta="center" c="dimmed" my="xl">
				Something went wrong when fetching your bills.
			</Text>
		);

	if (unpaidBillsQuery.isSuccess) {
		const billPayments = unpaidBillsQuery.data.filter((billPayment) => !billPayment.bill.isAutoPay);

		if (billPayments.length === 0)
			return (
				<Text ta="center" c="dimmed" my="xl">
					There are no bills that require your attention.
				</Text>
			);

		return (
			<Grid gutter="md" pb="xl">
				{billPayments.map((billPayment) => (
					<Grid.Col key={billPayment.id} span={{ base: 12, md: 6, lg: 4 }} bg="transparent">
						<BillCard billPayment={billPayment} />
					</Grid.Col>
				))}
			</Grid>
		);
	}
}
