import { Button, Checkbox, Fieldset, Group, Modal, NumberInput, Radio, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";

import { IconCalendarDue, IconCurrencyDollar } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "../../auth";
import { Bill } from "../Bill";
import { BillQueryKeys } from "../Queries";

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

	const { acquireToken } = useAuth();
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: async (bill: typeof form.values) => {
			const token = await acquireToken();

			const endpoint = bill.id == null ? "api/bills" : `api/bills/${bill.id}`;
			const method = bill.id == null ? "POST" : "PUT";

			const response = await fetch(`${import.meta.env.VITE_API_URL}/${endpoint}`, {
				method,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(bill),
			});

			if (!response.ok) {
				throw new Error("Something went wrong");
			}
		},

		onMutate: (bill: typeof form.values) => {
			queryClient.setQueryData([BillQueryKeys.Bills], (old: Bill[] | undefined) => {
				if (old == null) {
					return;
				}

				if (bill.id == null) {
					return [...old, bill];
				}

				return old.map((b) => (b.id === bill.id ? bill : b));
			});
		},

		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: BillQueryKeys.Bills });
		},

		onSuccess: () => {
			onClose();
		},
	});

	return (
		<Modal opened onClose={onClose} title={bill ? `Edit ${bill.name}` : "Add a new bill"} size="md">
			<form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
				<Fieldset>
					<input type="hidden" {...form.getInputProps("id")} />
					<TextInput withAsterisk label="Bill Name" placeholder="Electric Bill" {...form.getInputProps("name", { withError: true })} />
					<NumberInput
						hideControls
						withAsterisk
						mt="sm"
						label="Amount"
						placeholder="0.00"
						thousandSeparator=","
						leftSection={<IconCurrencyDollar />}
						{...form.getInputProps("amount", { withError: true })}
					/>
					<Group justify="flex-end">
						<Checkbox mt="lg" label="Is Auto-Pay?" {...form.getInputProps("isAutoPay", { type: "checkbox" })} />
					</Group>
				</Fieldset>

				<Fieldset mt="xl">
					<Radio.Group label="Due Date Type" withAsterisk {...form.getInputProps("dueType")} mt="lg">
						<Group mt="xs">
							<Radio value="Fixed" label="Fixed" description="The bill is due on the same day every month" />
							<Radio value="EndOfMonth" label="End of the Month" description="The bill is due at the end of every month" />
						</Group>
					</Radio.Group>

					{form.values.dueType === "Fixed" && (
						<NumberInput
							hideControls
							withAsterisk
							mt="lg"
							min={1}
							max={31}
							label="Day Due"
							leftSection={<IconCalendarDue />}
							{...form.getInputProps("dayDue")}
						/>
					)}
				</Fieldset>

				<Group justify="flex-end" mt="lg">
					<Button type="submit">{bill ? "Save Changes" : "Add Bill"}</Button>
				</Group>
			</form>
		</Modal>
	);
}
