import { Container, Title } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { PropsWithChildren } from "react";

interface LivingContainerProps {
	title?: string;
}

export default function LivingContainer({ title, children }: PropsWithChildren<LivingContainerProps>) {
	const isMobile = useMediaQuery("(max-width: 768px)");

	return (
		<Container fluid flex={1} px={isMobile ? 0 : "md"}>
			{title && (
				<Title order={1} mb="lg">
					{title}
				</Title>
			)}

			{children}
		</Container>
	);
}
