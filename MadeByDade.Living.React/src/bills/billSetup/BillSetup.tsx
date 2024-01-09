import { useState } from "react";

import { Button, Center, Container, Group, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { notifications } from "@mantine/notifications";
import { useAuth } from "../../auth";
import Card from "../../shared/Card";
import { Bill } from "../Bill";
import { BillQueryKeys, BuildBillsQueryOptions } from "../Queries";
import BillModal from "./BillModal";
import BillsTable from "./BillsTable";

export default function BillSetup() {
	const auth = useAuth();
	const billsQuery = useSuspenseQuery(BuildBillsQueryOptions(auth));

	const [bill, setBill] = useState<Bill | null>(null);
	const [opened, { open, close }] = useDisclosure(false);

	function openBillModal(bill: Bill | null) {
		setBill(bill);
		open();
	}

	function closeBillModal() {
		setBill(null);
		close();
	}

	const queryClient = useQueryClient();
	const deleteMutation = useMutation({
		mutationFn: async (bill: Bill) => {
			const token = await auth.acquireToken();

			const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bills/${bill.id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error("Failed to delete bill");
			}
		},

		onMutate: (bill: Bill) => {
			queryClient.cancelQueries({ queryKey: BillQueryKeys.Bills });

			queryClient.setQueryData(BillQueryKeys.Bills, (old: Bill[] | undefined) => {
				return old?.filter((b) => b.id !== bill.id) ?? [];
			});
		},

		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: BillQueryKeys.Bills });
		},

		onSuccess: (_data, bill) => {
			notifications.show({
				title: "Bill Deleted",
				message: `${bill.name} has been deleted`,
				color: "red",
				icon: <IconTrash />,
			});
		},
	});

	return (
		<Container fluid flex={1}>
			<Title order={1}>Bill Setup</Title>

			{billsQuery.isSuccess && billsQuery.data.length > 0 && (
				<>
					<Group justify="flex-end" mb="md">
						<Button mt="sm" size="xs" color="blue" onClick={() => openBillModal(null)} leftSection={<IconPlus size={16} />}>
							Add a bill
						</Button>
					</Group>
					<Card h="auto">
						<BillsTable bills={billsQuery.data} onEdit={openBillModal} onDelete={deleteMutation.mutate} />
					</Card>
				</>
			)}

			{billsQuery.isSuccess && billsQuery.data.length === 0 && (
				<Center
					mt="xl"
					p="xl"
					style={(theme) => ({
						backgroundColor: "white",
						borderRadius: theme.radius.xl,
						boxShadow: theme.shadows.sm,
					})}
				>
					<Stack align="center">
						<Title order={2}>No bills found</Title>
						<Text c="dimmed" ta="center" maw={300}>
							No bills have been configured yet, use the button below to add one.
						</Text>
						<Button leftSection={<IconPlus />} color="blue" mt="sm" onClick={() => openBillModal(null)}>
							Add a bill
						</Button>
					</Stack>
				</Center>
			)}

			{opened && <BillModal id={bill?.id} bill={bill} onClose={closeBillModal} />}
		</Container>
	);
}
