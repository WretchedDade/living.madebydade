
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useSuspenseQuery, useMutation, useQuery } from '@tanstack/react-query';

// import removed, see below
import { BillAddedActivity, ActivityDoc } from '~/types/activity';
import { KeyValueTableRow, ResponsiveKeyValueTable } from './ResponsiveKeyValueTable';
import { RecentActivityAccordion } from './RecentActivityAccordion';
import { formatBillFieldValue } from '~/lib/billFieldFormatters';


export function BillAddedActivityAccordion({ activity }: { activity: BillAddedActivity }) {

    const billName = activity.details.billName;
    const billId = activity.targetId;
    const billQuery = useQuery({ ...convexQuery(api.bills.getBillById, { id: activity.targetId as Id<"bills"> }), enabled: activity.targetId != null });
    const bill = billQuery.isSuccess ? billQuery.data : undefined;

    // Prepare rows for the table
    const rows: KeyValueTableRow[] = bill
        ? [
            { label: 'Bill Name', value: bill.name },
            { label: 'Amount', value: bill.amount },
            { label: 'Day Due', value: bill.dayDue },
            { label: 'Due Type', value: bill.dueType },
            { label: 'Auto-Pay', value: bill.isAutoPay ? 'Yes' : 'No' },
        ]
        : [];

    return (
        <RecentActivityAccordion
            activity={activity as ActivityDoc}
            label={`${billName} Added`}
            borderClass="border-blue-500"
        >
            {bill === undefined ? (
                <div className="text-zinc-400 italic">Loading bill details...</div>
            ) : bill ? (
                <div className="mb-2">
                    <span className="font-semibold block mb-4 text-zinc-200 text-base">Bill Details</span>
                    <ResponsiveKeyValueTable
                        rows={rows}
                        columns={["Field", "Value"]}
                        formatValue={(label, value) => formatBillFieldValue(label, value)}
                    />
                </div>
            ) : (
                <div className="text-zinc-400 italic">Bill details not found.</div>
            )}
        </RecentActivityAccordion>
    );
}
