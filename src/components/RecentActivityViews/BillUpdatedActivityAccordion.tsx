import React from 'react';
import { ActivityDoc, BillUpdatedActivity } from '~/types/activity';
import { formatCurrency, formatOrdinal } from '../../utils/formatters';
import { formatBillFieldValue } from '../../lib/billFieldFormatters';
import { RecentActivityAccordion } from './RecentActivityAccordion';
import { ResponsiveKeyValueTable, KeyValueTableRow } from './ResponsiveKeyValueTable';

export function BillUpdatedActivityAccordion({ activity }: { activity: BillUpdatedActivity }) {
    const billName = activity.details.billName;
    const changes = activity.details.changes ?? [];

    // Map technical field names to user-friendly labels
    const fieldLabels: Record<string, string> = {
        name: 'Bill Name',
        amount: 'Amount',
        dueDate: 'Due Date',
        dayDue: 'Day Due',
        isAutoPay: 'Auto-Pay',
    };

    // Prepare rows for the new component
    const rows: KeyValueTableRow[] = changes.map(({ field, before, after }) => ({
        label: fieldLabels[field] || field,
        value: before,
        value2: after,
    }));

    return (
        <RecentActivityAccordion
            activity={activity as ActivityDoc}
            label={`${billName} Updated`}
            borderClass="border-yellow-400"
        >
            {changes.length > 0 ? (
                <div className="mb-2">
                    <span className="font-semibold block mb-4 text-zinc-200 text-base">Changes</span>
                    <ResponsiveKeyValueTable
                        rows={rows}
                        columns={["Field", "Before", "After"]}
                        formatValue={(label, value) => formatBillFieldValue(label, value)}
                    />
                </div>
            ) : (
                <div className="mb-2 text-zinc-400 italic">No changes detected.</div>
            )}
        </RecentActivityAccordion>
    );
}

