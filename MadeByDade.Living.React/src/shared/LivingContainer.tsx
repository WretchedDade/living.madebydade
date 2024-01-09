import { Container, Title } from "@mantine/core";
import { PropsWithChildren } from "react";

interface LivingContainerProps {
	title?: string;
}

export default function LivingContainer({ title, children }: PropsWithChildren<LivingContainerProps>) {
	return (
		<Container fluid flex={1}>
			{title && (
				<Title order={1} mb="lg">
					{title}
				</Title>
			)}

			{children}
		</Container>
	);
}
