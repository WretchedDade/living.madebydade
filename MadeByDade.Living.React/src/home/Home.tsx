import { Card, Container, Grid, SimpleGrid, Title } from "@mantine/core";

import { BillsToPay } from "./BillsToPay";
import { Countdown } from "./Countdown";

export default function Home() {
	return (
		<Container fluid flex={1}>
			<Title order={1}>Home</Title>
			<SimpleGrid mt="xl" cols={{ base: 1, sm: 2 }} spacing="md">
				<Card shadow="md" mb={{ base: 0, md: "xl" }}>
					<Card.Section withBorder>
						<Title p="lg" order={2} fw="normal">
							Bills to Pay
						</Title>
					</Card.Section>
					<Card.Section px="xs" py="xs" h="100%">
						<BillsToPay />
					</Card.Section>
				</Card>
				<Grid gutter="md" pb="xl">
					{events
						.sort((a, b) => a.eventDate.localeCompare(b.eventDate))
						.map((event) => (
							<Grid.Col span={{ base: 12, md: 6, lg: 4 }} bg="transparent" key={event.title}>
								<Countdown title={event.title} eventDate={event.eventDate} />
							</Grid.Col>
						))}
				</Grid>
			</SimpleGrid>
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
