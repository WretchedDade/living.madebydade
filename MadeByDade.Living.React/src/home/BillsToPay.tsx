import { Button, Group, Skeleton, Table, Text } from "@mantine/core";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { useAuth } from "../auth";
import { format } from "../utils";

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
			<>
				<Table striped="even" highlightOnHover withColumnBorders>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Name</Table.Th>
							<Table.Th>Date Due</Table.Th>
							<Table.Th>Amount</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{billPayments.map((billPayment) => (
							<Table.Tr key={billPayment.id}>
								<Table.Td>{billPayment.bill.name}</Table.Td>
								<Table.Td>{format.asDateString(billPayment.dateDue, "medium")}</Table.Td>
								<Table.Td>{format.asCurrency(billPayment.bill.amount)}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>

				<Group pt="lg" justify="flex-end">
					<Button component={Link} to="/UnpaidBills" size="sm">
						Go to Unpaid Bills
					</Button>
				</Group>
			</>
		);
	}
}
