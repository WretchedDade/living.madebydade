import React from "react";
import { ActivityDoc, BillRemovedActivity } from "~/types/activity";
import { RecentActivityAccordion } from "./RecentActivityAccordion";

export function BillRemovedActivityAccordion({ activity }: { activity: BillRemovedActivity }) {
	const billName = activity.details.billName;
	return (
		<RecentActivityAccordion
			activity={activity as ActivityDoc}
			label={`${billName} Removed`}
			borderClass="border-red-500"
			staticRow
		/>
	);
}
