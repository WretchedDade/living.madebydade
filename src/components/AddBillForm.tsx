import { BillForm, BillFormValues } from "./BillForm";
import { api } from "@/convex/_generated/api";
import { useConvexMutation } from "@convex-dev/react-query";
import { showToast } from "./feedback/Toast";
import { useUser } from "@clerk/tanstack-react-start";
import { dollarsToCents } from "~/lib/currency";

export function AddBillForm(props: { onSuccess?: () => void }) {
	const addBill = useConvexMutation(api.bills.upsertBill);
	const logActivity = useConvexMutation(api.activity.logActivity);
	const { user } = useUser();

	async function handleSubmit(value: BillFormValues) {
		const amountCents = dollarsToCents(value.amount);
		const billId = await addBill({
			name: value.name,
			amount: amountCents,
			dueType: value.dueType,
			dayDue: value.dueType === "Fixed" ? Number(value.dayDue) : undefined,
			isAutoPay: value.isAutoPay,
		});
		await logActivity({
			type: "billAdded",
			userId: user?.id ?? "unknown",
			targetId: billId,
			details: {
				description: `Added bill: ${value.name}`,
				billName: value.name,
			},
		});
		showToast({
			title: "Bill added successfully!",
			description: `${value.name} — $${parseFloat(value.amount.replace(/,/g, "")).toFixed(2)} (${value.dueType}${value.isAutoPay ? ", Auto-Pay" : ""})`,
		});
		if (typeof props.onSuccess === "function") props.onSuccess();
	}

	return <BillForm initialValues={{}} onSubmit={handleSubmit} submitLabel="Add Bill" onCancel={props.onSuccess} />;
}
