import { PropsWithChildren } from "react";

import { Stack, StackProps, useMantineColorScheme } from "@mantine/core";

export type LivingCardProps = StackProps;

export default function LivingCard({ children, ...stackProps }: PropsWithChildren<LivingCardProps>) {
	const { colorScheme } = useMantineColorScheme();

	return (
		<Stack
			gap={0}
			h="100%"
			p="md"
			pt="lg"
			pb="sm"
			bg={colorScheme === "light" ? "white" : "dark.6"}
			style={(theme) => ({
				justifyContent: "space-between",
				borderRadius: theme.radius.sm,
				boxShadow: theme.shadows.md,
			})}
			{...stackProps}
		>
			{children}
		</Stack>
	);
}
