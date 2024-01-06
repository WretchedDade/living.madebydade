import { Flex, Loader, Text } from "@mantine/core";

export function Authenticating() {
	return (
		<Flex h="100vh" justify="center" align="center" direction="column">
			<Loader color="blue" size={100} mb="xl" />
			<Text size="2rem" mt="xl">
				Redirecting
			</Text>
		</Flex>
	);
}
