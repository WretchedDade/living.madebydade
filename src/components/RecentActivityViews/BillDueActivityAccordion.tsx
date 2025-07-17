import { ActivityDoc, BillDueActivity } from '~/types/activity';
import { RecentActivityAccordion } from './RecentActivityAccordion';

export function BillDueActivityAccordion({ activity }: { activity: BillDueActivity }) {
    const billName = activity.details.billName;
    const dueDate = activity.details.dueDate;
    return (
        <RecentActivityAccordion
            activity={activity as ActivityDoc}
            label={`${billName} Due`}
            borderClass="border-cyan-400"
        >
            {dueDate && (
                <div>Due: {dueDate}</div>
            )}
            <div className="mt-2"><span className="font-semibold">Timestamp:</span> {new Date(activity.timestamp).toLocaleString()}</div>
        </RecentActivityAccordion>
    );
}
