import { useQuery } from "@tanstack/react-query";
import { Route } from "@tanstack/react-router";

import { LayoutRoute } from "./Layout";

import { Center, Grid, GridColProps, Loader } from "@mantine/core";

import { useAuth } from "./auth";
import { BillQueryKeys, GetUnpaidBillPayments } from "./bills/api/Queries";
import { BillPaymentCard } from "./bills/components/BillPaymentCard";

import { Countdown } from "./shared/Countdown";

import { useDocumentTitle } from "@mantine/hooks";
import LivingCard from "./shared/LivingCard";
import LivingContainer from "./shared/LivingContainer";

export const HomeRoute = new Route({
	getParentRoute: () => LayoutRoute,
	path: "/",

	loader: ({ context }) => {
		return context.queryClient.ensureQueryData({
			queryKey: BillQueryKeys.UnpaidBillPayments,

			queryFn: ({ signal }) => GetUnpaidBillPayments(context.auth.acquireToken, signal),
		});
	},

	component: Home,
});

function Home() {
	useDocumentTitle("Living | Made by Dade");

	const auth = useAuth();

	const billPayments = useQuery({
		queryKey: BillQueryKeys.UnpaidBillPayments,

		queryFn: ({ signal }) => GetUnpaidBillPayments(auth.acquireToken, signal),

		select: (billPayments) => billPayments.filter((billPayment) => !billPayment.bill.isAutoPay),
	});

	const colSpan: GridColProps["span"] = { base: 12, xs: 6, sm: 4, md: 3, lg: 2 };

	return (
		<LivingContainer title="Home">
			<Grid gutter="md" pb="xl" mt="md">
				{billPayments.isLoading && (
					<Grid.Col span={colSpan} bg="transparent">
						<LivingCard>
							<Center flex={1}>
								<Loader size="xl" />
							</Center>
						</LivingCard>
					</Grid.Col>
				)}

				{billPayments.isSuccess &&
					billPayments.data.map((billPayment) => (
						<Grid.Col key={billPayment.id} span={colSpan} bg="transparent">
							<BillPaymentCard billPayment={billPayment} />
						</Grid.Col>
					))}

				{events
					.sort((a, b) => a.eventDate.localeCompare(b.eventDate))
					.map((event) => (
						<Grid.Col span={colSpan} bg="transparent" key={event.title}>
							<Countdown title={event.title} eventDate={event.eventDate} />
						</Grid.Col>
					))}
			</Grid>
		</LivingContainer>
	);
}

const events = [
	{ title: "Carla's Birthday", eventDate: "2024-01-29" },
	{ title: "H2 Offsite", eventDate: "2024-03-18" },
	{ title: "Disney World", eventDate: "2024-05-12" },
	{ title: "Dade's Birthday", eventDate: "2024-06-04" },
	{ title: "Paige's Birthday", eventDate: "2024-08-19" },
];
