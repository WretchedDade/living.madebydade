import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, Route, useNavigate } from "@tanstack/react-router";

import { Button, Divider, Grid, Group, Loader, Pagination, Stack, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDocumentTitle } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconDeviceFloppy } from "@tabler/icons-react";

import { LayoutRoute } from "../Layout";

import { useAuth } from "../auth";
import type { Bill } from "./api/Bill";
import { useBillMutation } from "./api/Mutations";
import { BillQueryKeys, GetBill, GetBillPaymentsPage } from "./api/Queries";

import LivingCard from "../shared/LivingCard";
import LivingContainer from "../shared/LivingContainer";
import BillForm, { BillFormValues } from "./components/BillForm";
import { BillPaymentCard } from "./components/BillPaymentCard";

interface BillSearchParams {
	pageIndex: number;
	pageSize: number;
}

export const BillRoute = new Route({
	getParentRoute: () => LayoutRoute,
	path: "/Bills/$billId",

	validateSearch: (search: Record<string, unknown>): BillSearchParams => ({
		pageIndex: Number(search?.pageIndex ?? 0),
		pageSize: Number(search?.pageSize ?? 10),
	}),

	loaderDeps: ({ search: { pageIndex, pageSize } }) => ({ pageIndex, pageSize }),

	loader: ({ params, context, deps: { pageIndex, pageSize } }) => {
		context.queryClient.ensureQueryData({
			queryKey: BillQueryKeys.Bill(Number(params.billId)),

			queryFn: async ({ queryKey: [, billId], signal }) => {
				return await GetBill(billId, context.auth.acquireToken, signal);
			},
		});

		context.queryClient.ensureQueryData({
			queryKey: BillQueryKeys.BillPaymentsPage(Number(params.billId), pageIndex, pageSize),

			queryFn: async ({ queryKey: [, billId], signal }) => {
				return await GetBillPaymentsPage(Number(billId), pageIndex, pageSize, context.auth.acquireToken, signal);
			},
		});
	},

	wrapInSuspense: true,
	component: Bill,
});

function Bill() {
	const auth = useAuth();
	const params = BillRoute.useParams();
	const search = BillRoute.useSearch();

	const navigate = useNavigate();

	const billQuery = useQuery({
		queryKey: BillQueryKeys.Bill(Number(params.billId)),

		queryFn: async ({ queryKey: [, billId], signal }) => {
			return await GetBill(billId, auth.acquireToken, signal);
		},
	});

	const billPaymentsQuery = useQuery({
		queryKey: BillQueryKeys.BillPaymentsPage(Number(params.billId), search.pageIndex, search.pageSize),

		queryFn: async ({ queryKey: [, billId], signal }) => {
			return await GetBillPaymentsPage(Number(billId), search.pageIndex, search.pageSize, auth.acquireToken, signal);
		},
	});

	// const pagination = usePagination({ initialPage: 0, total: billPaymentsQuery.data?.total ?? 0, pageSize: 10 });

	const form = useForm<BillFormValues>({
		initialValues: {
			id: 0,
			name: "",
			amount: 0,
			isAutoPay: false,
			dueType: "Fixed",
			dayDue: 0,
		},

		validate: {
			name: (value) => (value == null || value.trim().length === 0 ? "Name is required" : null),
			amount: (value) => (value == null || value <= 0 ? "Amount is required" : null),
		},
	});

	useEffect(() => {
		if (billQuery.isSuccess) {
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

	useDocumentTitle(`Living | ${billQuery.data?.name ?? "Bill"}`);

	if (billQuery.isLoading || billPaymentsQuery.isLoading)
		return (
			<LivingContainer>
				<Loader />
			</LivingContainer>
		);

	if (billQuery.isSuccess && billPaymentsQuery.isSuccess) {
		const bill = billQuery.data;
		const paymentsPage = billPaymentsQuery.data;

		// console.log(params, search);

		const onPageChange = (newPageIndex: number) => {
			return navigate({
				params,
				search: {
					...search,
					pageIndex: newPageIndex - 1,
				},
			});
		};

		return (
			<LivingContainer title={bill.name} key={bill.id}>
				<Stack gap="xl">
					<LivingCard h="auto" pt="xs">
						<Button
							leftSection={<IconArrowLeft />}
							href="/Bills"
							variant="subtle"
							component={Link}
							to="/Bills"
							mb="sm"
							style={{ alignSelf: "start" }}
						>
							Go Back
						</Button>
						<BillForm form={form} isSubmitting={mutation.isPending} onSubmit={mutation.mutate} type="Edit" />
					</LivingCard>
					{paymentsPage.totalItems > 0 && (
						<div>
							<Group mb="sm" px="lg" align="center" justify="space-between">
								<Title order={2}>Payments</Title>
								{paymentsPage.totalPages > 1 && (
									<Pagination value={search.pageIndex + 1} onChange={onPageChange} total={paymentsPage.totalPages} />
								)}
							</Group>
							<Divider mb="md" />
							<Grid px="md">
								{paymentsPage.items.map((payment) => (
									<Grid.Col key={payment.id} span={{ base: 12, xs: 6, sm: 4, lg: 3, xl: 2 }}>
										<BillPaymentCard billPayment={{ ...payment, bill }} livingCard={{ p: "xs", pt: "xs" }} />
									</Grid.Col>
								))}
							</Grid>
						</div>
					)}
				</Stack>
			</LivingContainer>
		);
	}

	return null;
}
