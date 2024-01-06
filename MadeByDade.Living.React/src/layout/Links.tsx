import { Link } from "@tanstack/react-router";

import classes from "./Links.module.css";

export default function Links() {
	return (
		<>
			<Link to="/" className={classes.control}>
				Home
			</Link>
			<Link to="/BillSetup" className={classes.control}>
				Bill Setup
			</Link>
		</>
	);
}
