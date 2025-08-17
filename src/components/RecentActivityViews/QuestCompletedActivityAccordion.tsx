import React from "react";
import { ActivityDoc, QuestCompletedActivity } from "~/types/activity";
import { RecentActivityAccordion } from "./RecentActivityAccordion";

export function QuestCompletedActivityAccordion({ activity }: { activity: QuestCompletedActivity }) {
	const questName = activity.details.questName;
	const xpEarned = activity.details.xpEarned;
	return (
		<RecentActivityAccordion
			activity={activity as ActivityDoc}
			label={`${questName} Completed`}
			borderClass="border-purple-500"
		>
			{xpEarned && <div>XP Earned: {xpEarned}</div>}
		</RecentActivityAccordion>
	);
}
