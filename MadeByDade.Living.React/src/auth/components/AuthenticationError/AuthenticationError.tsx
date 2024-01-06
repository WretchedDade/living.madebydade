import { Container, Title } from "@mantine/core";

import classes from "./AuthenticationError.module.css";

export function AuthenticationError() {
	return (
		<div className={classes.root}>
			<Container>
				<div className={classes.label}>Access Denied</div>
				<Title className={classes.title}>You are not authorized to access this site...</Title>
			</Container>
		</div>
	);
}
