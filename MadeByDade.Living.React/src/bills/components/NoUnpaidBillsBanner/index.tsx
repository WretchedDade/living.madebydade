import { Button, Image, Text, Title } from "@mantine/core";

import { Link } from "@tanstack/react-router";
import image from "./NoUnpaidBills.svg";
import classes from "./NoUnpaidBillsBanner.module.css";

export default function NoUnpaidBillsBanner() {
	return (
		<div className={classes.wrapper}>
			<div className={classes.body}>
				<Title className={classes.title}>All done...</Title>
				<Text fw={500} fz="lg" mb={5}>
					You're all caught up!
				</Text>
				<Text fz="sm" c="dimmed">
					Check back later to see if you have any new bills to pay.
				</Text>

				<Button mt="xl" component={Link} to="/BillSetup">
					Go to Bill Setup
				</Button>
			</div>
			<Image src={image} className={classes.image} />
		</div>
	);
}
