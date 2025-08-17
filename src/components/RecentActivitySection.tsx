type ActivityDetails = {
	description?: string;
	[key: string]: any;
};

import { SectionHeader } from "~/components/layout/SectionHeader";
import { BillPaidActivityAccordion } from "./RecentActivityViews/BillPaidActivityAccordion";
import { QuestCompletedActivityAccordion } from "./RecentActivityViews/QuestCompletedActivityAccordion";
import { BillAddedActivityAccordion } from "./RecentActivityViews/BillAddedActivityAccordion";
import { BillUpdatedActivityAccordion } from "./RecentActivityViews/BillUpdatedActivityAccordion";
import { BillRemovedActivityAccordion } from "./RecentActivityViews/BillRemovedActivityAccordion";
import { BillDueActivityAccordion } from "./RecentActivityViews/BillDueActivityAccordion";
import { BoltIcon } from "@heroicons/react/24/solid";
import * as Accordion from "@radix-ui/react-accordion";
import React from "react";
import { ActivityDoc } from "~/types/activity";

interface RecentActivitySectionProps {
	activities?: ActivityDoc[];
	isLoading?: boolean;
}

export function RecentActivitySection({ activities = [], isLoading = false }: RecentActivitySectionProps) {
	return (
		<div className="bg-zinc-900 rounded-2xl p-4 md:p-6 shadow-lg">
			<SectionHeader
				icon={
					<BoltIcon className="w-4 h-4 sm:w-7 sm:h-7 text-yellow-300 drop-shadow-[0_0_6px_rgba(253,224,71,0.7)]" />
				}
				title="Recent Activity"
			/>
			{isLoading ? (
				<div className="text-cyan-400 text-center py-6 animate-pulse text-lg">Loading activity...</div>
			) : activities.length === 0 ? (
				<div className="text-zinc-400 text-center py-6 text-lg italic">
					Coming soon: Your recent activity will appear here!
				</div>
			) : (
				<Accordion.Root type="multiple" className="overflow-y-auto mt-6">
					{activities.map(activity => {
						switch (activity.type) {
							case "billPaid":
								return <BillPaidActivityAccordion key={activity._id} activity={activity} />;
							case "questCompleted":
								return <QuestCompletedActivityAccordion key={activity._id} activity={activity} />;
							case "billAdded":
								return <BillAddedActivityAccordion key={activity._id} activity={activity} />;
							case "billUpdated":
								return <BillUpdatedActivityAccordion key={activity._id} activity={activity} />;
							case "billRemoved":
								return <BillRemovedActivityAccordion key={activity._id} activity={activity} />;
							case "billDue":
								return <BillDueActivityAccordion key={activity._id} activity={activity} />;
							default:
								return null;
						}
					})}
				</Accordion.Root>
			)}
		</div>
	);
}
