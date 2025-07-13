import { BillForm, BillFormValues } from './BillForm';
import { api } from 'convex/_generated/api';
import { useConvexMutation } from '@convex-dev/react-query';
import { showToast } from './feedback/SciFiToast';
import { useUser } from '@clerk/tanstack-react-start';

export function EditBillForm({ bill, onSuccess }: { bill: any; onSuccess?: () => void }) {
    const updateBill = useConvexMutation(api.bills.upsertBill);
    const logActivity = useConvexMutation(api.activity.logActivity);
    const { user } = useUser();

    async function handleSubmit(value: BillFormValues) {
        await updateBill({
            id: bill._id,
            name: value.name,
            amount: parseFloat(value.amount),
            dueType: value.dueType,
            dayDue: value.dueType === 'Fixed' ? Number(value.dayDue) : undefined,
            isAutoPay: value.isAutoPay,
        });
        // Compute changes array
        const changes: Array<{ field: string; before: unknown; after: unknown }> = [];
        if (bill.name !== value.name) changes.push({ field: 'name', before: bill.name, after: value.name });
        if (bill.amount !== parseFloat(value.amount)) changes.push({ field: 'amount', before: bill.amount, after: parseFloat(value.amount) });
        if (bill.dueType !== value.dueType) changes.push({ field: 'dueType', before: bill.dueType, after: value.dueType });
        if ((bill.dayDue ?? undefined) !== (value.dueType === 'Fixed' ? Number(value.dayDue) : undefined)) changes.push({ field: 'dayDue', before: bill.dayDue, after: value.dueType === 'Fixed' ? Number(value.dayDue) : undefined });
        if (bill.isAutoPay !== value.isAutoPay) changes.push({ field: 'isAutoPay', before: bill.isAutoPay, after: value.isAutoPay });

        await logActivity({
            type: 'billUpdated',
            userId: user?.id ?? 'unknown',
            targetId: bill._id,
            details: {
                description: `Updated bill: ${value.name}`,
                billName: value.name,
                changes,
            },
        });
        showToast({
            title: 'Bill updated',
            description: `${value.name} was updated successfully.`,
            variant: 'success',
        });
        onSuccess?.();
    }

    return (
        <BillForm
            initialValues={{
                name: bill.name,
                amount: bill.amount?.toString() ?? '',
                dueType: bill.dueType,
                dayDue: bill.dayDue?.toString() ?? '',
                isAutoPay: bill.isAutoPay,
            }}
            onSubmit={handleSubmit}
            submitLabel="Update Bill"
            onCancel={onSuccess}
        />
    );
}
