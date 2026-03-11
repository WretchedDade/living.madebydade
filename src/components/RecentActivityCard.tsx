import { BoltIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Accordion from "@radix-ui/react-accordion";
import { useState } from "react";
import { BillPaidActivityAccordion } from "./RecentActivityViews/BillPaidActivityAccordion";
import { QuestCompletedActivityAccordion } from "./RecentActivityViews/QuestCompletedActivityAccordion";
import { BillAddedActivityAccordion } from "./RecentActivityViews/BillAddedActivityAccordion";
import { BillUpdatedActivityAccordion } from "./RecentActivityViews/BillUpdatedActivityAccordion";
import { BillRemovedActivityAccordion } from "./RecentActivityViews/BillRemovedActivityAccordion";
import { BillDueActivityAccordion } from "./RecentActivityViews/BillDueActivityAccordion";
import { ActivityDoc } from "~/types/activity";

interface RecentActivityCardProps {
	activities: ActivityDoc[];
	isLoading: boolean;
}

export function RecentActivityCard({ activities, isLoading }: RecentActivityCardProps) {
	const [open, setOpen] = useState(false);

	return (
		<Collapsible.Root open={open} onOpenChange={setOpen}>
			<div>
				<Collapsible.Trigger asChild>
					<button className="flex items-center justify-between w-full py-3 cursor-pointer transition-colors">
						<h3 className="text-base font-bold text-foreground flex items-center gap-2.5">
							<BoltIcon className="w-[18px] h-[18px] text-secondary shrink-0" />
							<span>Recent Activity</span>
							{!isLoading && activities.length > 0 && (
								<span className="text-xs text-muted-foreground font-normal">{activities.length}</span>
							)}
						</h3>
						<ChevronDownIcon
							className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
								open ? "rotate-180" : ""
							}`}
						/>
					</button>
				</Collapsible.Trigger>

				<Collapsible.Content>
					<div className="pb-4">
						{isLoading ? (
							<div className="text-muted-foreground text-center py-6 text-sm animate-pulse">
								Loading...
							</div>
						) : activities.length === 0 ? (
							<div className="text-muted-foreground text-center py-6 text-sm">
								No recent activity
							</div>
						) : (
							<Accordion.Root type="multiple" className="mt-2">
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
				</Collapsible.Content>
			</div>
		</Collapsible.Root>
	);
}
