import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Route } from "@tanstack/react-router";

import { Button, Card, Center, Group, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconTrash } from "@tabler/icons-react";

import { LayoutRoute } from "../Layout";

import { useAuth } from "../auth";

import type { Bill } from "./api/Bill";
import { useDeleteBillMutation } from "./api/Mutations";
import { BillQueryKeys, GetBills } from "./api/Queries";

import LivingContainer from "../shared/LivingContainer";
import BillModal from "./components/BillModal";
import BillsTable from "./components/BillsTable";

export const BillsRoute = new Route({
	getParentRoute: () => LayoutRoute,
	path: "/Bills",

	loader: ({ context }) => {
		return context.queryClient.ensureQueryData({
			queryKey: BillQueryKeys.Bills,

			queryFn: ({ signal }) => GetBills(context.auth.acquireToken, signal),
		});
	},

	wrapInSuspense: true,
	component: Bills,
});

function Bills() {
	const auth = useAuth();
	const billsQuery = useQuery({
		queryKey: BillQueryKeys.Bills,

		queryFn: ({ signal }) => GetBills(auth.acquireToken, signal),
	});

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

	const deleteMutation = useDeleteBillMutation({
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
		<LivingContainer title="Bills">
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
		</LivingContainer>
	);
}
