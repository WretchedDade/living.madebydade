import React from 'react';
import { ActivityDoc, BillDueActivity } from '~/types/activity';
import { RecentActivityAccordion } from './RecentActivityAccordion';

export function BillDueActivityAccordion({ activity }: { activity: BillDueActivity }) {
    const billName = activity.details.billName;
    const dueDate = activity.details.dueDate;
    const borderClass = 'border-cyan-400';
    return (
        <RecentActivityAccordion
            activity={activity as ActivityDoc}
            label={`${billName} Due`}
            borderClass={borderClass}
        >
            {dueDate && (
                <div>Due: {dueDate}</div>
            )}
            <div className="mt-2"><span className="font-semibold">Timestamp:</span> {new Date(activity.timestamp).toLocaleString()}</div>
        </RecentActivityAccordion>
    );
}
