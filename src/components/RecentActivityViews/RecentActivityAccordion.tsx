import React from "react";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import * as Accordion from "@radix-ui/react-accordion";
import { formatRelativeTime } from "../../utils/formatters";
import { ActivityDoc } from "~/types/activity";

interface RecentActivityAccordionProps {
	activity: ActivityDoc;
	label: string;
	borderClass: string;
	children?: React.ReactNode;
	staticRow?: boolean;
}

export function RecentActivityAccordion({
	activity,
	label,
	borderClass,
	children,
	staticRow,
}: RecentActivityAccordionProps) {
	if (staticRow) {
		return (
			<div className={`w-full flex items-center py-3 px-4 bg-transparent border-l-4 ${borderClass} mb-4`}>
				<span className="flex-1 min-w-0 text-left font-bold text-lg truncate drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]">
					{label}
				</span>
				<span className="text-zinc-500 mt-1 text-xs flex-shrink-0 min-w-0 break-words text-right ml-2">
					{formatRelativeTime(activity.timestamp)}
				</span>
			</div>
		);
	}
	return (
		<Accordion.Item value={activity._id} className="mb-4">
			<Accordion.Header>
				<Accordion.Trigger
					className={`w-full flex items-center justify-between py-3 px-4 bg-transparent hover:bg-zinc-800 transition cursor-pointer border-l-4 ${borderClass}`}
				>
					<span className="flex flex-col sm:flex-row flex-1 min-w-0 text-left sm:items-center sm:gap-4">
						<span className="text-cyan-300 font-bold text-lg truncate drop-shadow-[0_0_6px_rgba(34,211,238,0.5)] data-[state=open]:text-cyan-400 data-[state=open]:drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]">
							{label}
						</span>
					</span>
					<span className="flex flex-row items-center ml-2 flex-shrink-0">
						<span className="text-zinc-500 mt-1 sm:mt-0 text-xs flex-shrink-0 min-w-0 break-words text-right mr-2">
							{formatRelativeTime(activity.timestamp)}
						</span>
						<ChevronDownIcon className="w-5 h-5 text-zinc-400 transition-transform duration-200 data-[state=open]:rotate-180" />
					</span>
				</Accordion.Trigger>
			</Accordion.Header>
			<Accordion.Content className={`p-4 text-zinc-300 text-sm bg-zinc-900 border-l-4 ${borderClass}`}>
				<hr className="mb-3 border-zinc-700" />
				{children}
				<hr className="my-3 border-zinc-700" />
				<div className="mt-2">
					<span className="font-semibold">Timestamp:</span> {new Date(activity.timestamp).toLocaleString()}
				</div>
			</Accordion.Content>
		</Accordion.Item>
	);
}
