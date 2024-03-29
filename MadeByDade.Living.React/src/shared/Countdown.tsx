import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

import { Group, RingProgress, Text, useMantineColorScheme } from "@mantine/core";
import LivingCard from "./LivingCard";

interface CountdownProps {
	title: string;
	eventDate: string;
}

export function Countdown({ title, eventDate }: CountdownProps) {
	// Calculate between january 1st and the event using dayjs
	const january = dayjs("2024-01-01");
	const event = dayjs(eventDate);
	const daysBetween = event.diff(january, "day");
	const totalDays = daysBetween + 1;

	// Calculate the days between now and the event using dayjs
	const today = dayjs();
	const daysUntil = event.diff(today, "day");
	const daysPast = totalDays - daysUntil;

	// Calculate the percentage of days past
	const percentPast = (daysPast / totalDays) * 100;

	const duration = dayjs.duration(event.diff(today));
	const months = duration.months();
	const countdown = months > 0 ? `${months} months and ${duration.days()} days` : `${duration.days()} days`;

	const { colorScheme } = useMantineColorScheme();

	return (
		<LivingCard>
			<Text size="lg" fw={500} mb="md" c={colorScheme === "light" ? "blue.7" : "dark.0"} ta="center" px="sm">
				{title}
			</Text>
			<Group justify="center">
				<RingProgress
					roundCaps
					rootColor={colorScheme === "light" ? "gray.3" : "dark.4"}
					size={90}
					sections={[{ value: percentPast, color: "blue.9" }]}
					thickness={8}
					label={
						<Text c="blue.9" ta="center" size="lg" fw="bold">
							{percentPast.toFixed(1)}%
						</Text>
					}
				/>
			</Group>
			<Text mt="md" c="dimmed" ta="center" px="sm">
				{countdown} until
			</Text>
			<Text c="dimmed" ta="center" px="sm">
				{event.format("MMMM D, YYYY")}
			</Text>
		</LivingCard>
	);
}
