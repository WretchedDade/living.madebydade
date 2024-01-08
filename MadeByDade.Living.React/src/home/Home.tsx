import { Container, Grid, GridColProps, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../auth";
import { BuildUnpaidBillPaymentsQueryOptions } from "../bills/Queries";

import { BillCard } from "../bills/BillCard";
import { Countdown } from "./Countdown";

export default function Home() {
	const auth = useAuth();
	const unpaidBillsQuery = useQuery(BuildUnpaidBillPaymentsQueryOptions(auth));

	const colSpan: GridColProps["span"] = { base: 12, xs: 6, sm: 4, md: 3, lg: 2 };

	return (
		<Container fluid flex={1}>
			<Title order={1}>Home</Title>
			<Grid gutter="md" pb="xl" mt="md">
				{unpaidBillsQuery.isSuccess &&
					unpaidBillsQuery.data.map((billPayment) => (
						<Grid.Col key={billPayment.id} span={colSpan} bg="transparent">
							<BillCard billPayment={billPayment} />
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
		</Container>
	);
}

const events = [
	{ title: "Carla's Birthday", eventDate: "2024-01-29" },
	{ title: "H2 Offsite", eventDate: "2024-03-18" },
	{ title: "Disney World", eventDate: "2024-05-12" },
	{ title: "Dade's Birthday", eventDate: "2024-06-04" },
	{ title: "Paige's Birthday", eventDate: "2024-08-19" },
];
