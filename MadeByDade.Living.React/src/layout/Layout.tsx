import { AppShell, Burger, Group, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet } from "@tanstack/react-router";

import { useEffect } from "react";
import Links from "./Links";

export default function Layout() {
	const [opened, { close, toggle }] = useDisclosure();

	useEffect(() => {
		close();
	}, [window.location.href]);

	return (
		<AppShell header={{ height: 60 }} navbar={{ width: 300, breakpoint: "sm", collapsed: { desktop: true, mobile: !opened } }} padding="md">
			<AppShell.Header>
				<Group h="100%" px="md">
					<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
					<Group justify="space-between" style={{ flex: 1 }}>
						Living | Made by Dade
						<Group ml="xl" visibleFrom="sm">
							<Links />
						</Group>
					</Group>
				</Group>
			</AppShell.Header>

			<AppShell.Navbar py="md" px="md">
				<Stack>
					<Links />
				</Stack>
			</AppShell.Navbar>

			<AppShell.Main display="flex">
				<Outlet />
			</AppShell.Main>
		</AppShell>
	);
}
