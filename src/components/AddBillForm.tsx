import { BillForm, BillFormValues } from './BillForm';
import { api } from '@/convex/_generated/api';
import { useConvexMutation } from '@convex-dev/react-query';
import { showToast } from './feedback/SciFiToast';
import { useUser } from '@clerk/tanstack-react-start';

export function AddBillForm(props: { onSuccess?: () => void }) {
    const addBill = useConvexMutation(api.bills.upsertBill);
    const logActivity = useConvexMutation(api.activity.logActivity);
    const { user } = useUser();

    async function handleSubmit(value: BillFormValues) {
        const billId = await addBill({
            name: value.name,
            amount: parseFloat(value.amount),
            dueType: value.dueType,
            dayDue: value.dueType === 'Fixed' ? Number(value.dayDue) : undefined,
            isAutoPay: value.isAutoPay,
        });
        await logActivity({
            type: 'billAdded',
            userId: user?.id ?? 'unknown',
            targetId: billId,
            details: {
                description: `Added bill: ${value.name}`,
                billName: value.name,
            },
        });
        showToast({
            title: 'Bill added successfully!',
            description: `${value.name} — $${parseFloat(value.amount).toFixed(2)} (${value.dueType}${value.isAutoPay ? ', Auto-Pay' : ''})`,
        });
        if (typeof props.onSuccess === 'function') props.onSuccess();
    }

    return (
        <BillForm
            initialValues={{}}
            onSubmit={handleSubmit}
            submitLabel="Add Bill"
            onCancel={props.onSuccess}
        />
    );
}