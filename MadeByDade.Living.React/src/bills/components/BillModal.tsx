import { useEffect } from "react";

import { Modal } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconDeviceFloppy } from "@tabler/icons-react";

import { notifications } from "@mantine/notifications";
import { Bill } from "../api/Bill";
import { useBillMutation } from "../api/Mutations";
import BillForm from "./BillForm";

interface BillModalProps {
	id: number | undefined;
	bill: Omit<Bill, "id"> | null;

	onClose: () => void;
}

export default function BillModal({ id, bill, onClose }: BillModalProps) {
	const initialValues = {
		...(bill ?? {
			name: "",
			amount: 0,
			dueType: "Fixed",
			dayDue: 1,
			isAutoPay: false,
		}),
		id,
	};

	const form = useForm({
		initialValues,

		validate: {
			name: (value) => (value == null || value.trim().length === 0 ? "Name is required" : null),
			amount: (value) => (value == null || value <= 0 ? "Amount is required" : null),
		},
	});

	useEffect(() => {
		form.setInitialValues(initialValues);
	});

	const mutation = useBillMutation({
		onSuccess: (_data, bill) => {
			if (bill.id == null)
				notifications.show({
					color: "green",
					icon: <IconDeviceFloppy />,
					title: "Bill Added",
					message: `${bill.name} has been added`,
				});
			else
				notifications.show({
					color: "green",
					icon: <IconDeviceFloppy />,
					title: "Bill Updated",
					message: `${bill.name} has been updated`,
				});

			onClose();
		},
	});

	return (
		<Modal opened onClose={onClose} title={bill ? `Edit ${bill.name}` : "Add a new bill"} size="md">
			<BillForm form={form} isSubmitting={mutation.isPending} onSubmit={mutation.mutate} type={bill ? "Edit" : "Add"} />
		</Modal>
	);
}
