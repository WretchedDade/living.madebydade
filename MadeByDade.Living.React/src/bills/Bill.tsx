import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, Route } from "@tanstack/react-router";

import { Button, Loader } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconDeviceFloppy } from "@tabler/icons-react";

import { LayoutRoute } from "../Layout";

import { useAuth } from "../auth";
import type { Bill } from "./api/Bill";
import { useBillMutation } from "./api/Mutations";
import { BillQueryKeys, GetBill } from "./api/Queries";

import LivingCard from "../shared/LivingCard";
import LivingContainer from "../shared/LivingContainer";
import BillForm, { BillFormValues } from "./components/BillForm";

export const BillRoute = new Route({
	getParentRoute: () => LayoutRoute,
	path: "/Bills/$billId",

	loader: ({ params, context }) => {
		return context.queryClient.ensureQueryData({
			queryKey: BillQueryKeys.Bill(Number(params.billId)),

			queryFn: async ({ queryKey: [, billId], signal }) => {
				return await GetBill(billId, context.auth.acquireToken, signal);
			},
		});
	},

	wrapInSuspense: true,
	component: Bill,
});

function Bill() {
	const auth = useAuth();
	const params = BillRoute.useParams();

	const billQuery = useQuery({
		queryKey: BillQueryKeys.Bill(Number(params.billId)),

		queryFn: async ({ queryKey: [, billId], signal }) => {
			return await GetBill(billId, auth.acquireToken, signal);
		},
	});

	const form = useForm<BillFormValues>({
		validate: {
			name: (value) => (value == null || value.trim().length === 0 ? "Name is required" : null),
			amount: (value) => (value == null || value <= 0 ? "Amount is required" : null),
		},
	});

	useEffect(() => {
		if (billQuery.isSuccess) {
			console.log(billQuery.data);
			form.initialize(billQuery.data);
		}
	}, [billQuery.data, billQuery.isSuccess, form]);

	const mutation = useBillMutation({
		onSuccess: (_data, bill) => {
			notifications.show({
				color: "green",
				icon: <IconDeviceFloppy />,
				title: "Bill Updated",
				message: `${bill.name} has been updated`,
			});

			form.resetTouched();
			form.resetDirty();
		},
	});

	if (billQuery.isLoading)
		return (
			<LivingContainer>
				<Loader />
			</LivingContainer>
		);

	if (billQuery.isSuccess) {
		return (
			<LivingContainer title={billQuery.data.name}>
				<LivingCard h="auto" pt="xs">
					<Button leftSection={<IconArrowLeft />} href="/Bills" variant="subtle" component={Link} to="/Bills" mb="sm" style={{ alignSelf: "start" }}>
						Go Back
					</Button>
					<BillForm form={form} isSubmitting={mutation.isPending} onSubmit={mutation.mutate} type="Edit" />
				</LivingCard>
			</LivingContainer>
		);
	}

	return null;
}
