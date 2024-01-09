import { PropsWithChildren } from "react";

import { Stack, StyleProp, useMantineColorScheme } from "@mantine/core";

interface CardProps {
	h?: StyleProp<React.CSSProperties["height"]>;
}

export default function Card({ h = "100%", children }: PropsWithChildren<CardProps>) {
	const { colorScheme } = useMantineColorScheme();

	return (
		<Stack
			gap={0}
			h={h}
			p="md"
			pt="lg"
			pb="sm"
			bg={colorScheme === "light" ? "white" : "dark.6"}
			style={(theme) => ({
				justifyContent: "space-between",
				borderRadius: theme.radius.sm,
				boxShadow: theme.shadows.md,
			})}
		>
			{children}
		</Stack>
	);
}
