import { Link } from "@tanstack/react-router";

import { Button, Container, Image, SimpleGrid, Text, Title } from "@mantine/core";

import image from "./NotFound.svg";
import classes from "./NotFoundBanner.module.css";

export default function NotFoundBanner() {
	return (
		<Container className={classes.root}>
			<SimpleGrid spacing={{ base: 40, sm: 80 }} cols={{ base: 1, sm: 2 }}>
				<Image src={image} className={classes.mobileImage} />
				<div>
					<Title className={classes.title}>Somethings not right...</Title>
					<Text c="dimmed" size="lg">
						The page you are trying to open does not exist. You may have mistyped the address, or the page has been moved to another URL. If you
						think this is an error, please contact support.
					</Text>
					<Button component={Link} to="/" variant="outline" size="md" mt="xl" className={classes.control}>
						Get back to home page
					</Button>
				</div>
				<Image src={image} className={classes.desktopImage} />
			</SimpleGrid>
		</Container>
	);
}
