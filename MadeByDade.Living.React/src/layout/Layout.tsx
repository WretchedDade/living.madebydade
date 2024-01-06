import { Burger, Container, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link } from "@tanstack/react-router";

import classes from "./Layout.module.css";

export default function Layout() {
	const [opened, { toggle }] = useDisclosure(false);

	return (
		<header className={classes.header}>
			<Container size="md" className={classes.inner}>
				Living
				{/* <MantineLogo size={28} /> */}
				<Group gap={5} visibleFrom="xs">
					<Link to="/" className={classes.link} activeProps={{ className: classes.linkActive }}>
						Home
					</Link>
				</Group>
				<Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />
			</Container>
		</header>
	);
}
