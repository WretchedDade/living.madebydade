import classes from "./BillForm.module.css";

import { Button, Checkbox, Fieldset, Group, NumberInput, Radio, TextInput } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconCalendarDue, IconCurrencyDollar } from "@tabler/icons-react";

import { Bill } from "../../api/Bill";

export type BillFormValues = Omit<Bill, "id"> & { id: number | undefined };

interface BillFormProps {
	type: "Add" | "Edit";
	form: UseFormReturnType<BillFormValues>;

	isSubmitting: boolean;
	onSubmit: (values: BillFormValues) => void;
}

export default function BillForm({ type, form, isSubmitting, onSubmit }: BillFormProps) {
	return (
		<form className={classes.form} onSubmit={form.onSubmit(onSubmit)}>
			<Fieldset className={classes.fieldset}>
				<input type="hidden" {...form.getInputProps("id")} />
				<TextInput withAsterisk label="Bill Name" placeholder="Electric Bill" {...form.getInputProps("name", { withError: true })} />
				<NumberInput
					hideControls
					withAsterisk
					mt="sm"
					label="Amount"
					placeholder="0.00"
					thousandSeparator=","
					decimalScale={2}
					fixedDecimalScale
					leftSection={<IconCurrencyDollar />}
					{...form.getInputProps("amount", { withError: true })}
				/>
				<Group justify="flex-end">
					<Checkbox mt="lg" label="Is Auto-Pay?" {...form.getInputProps("isAutoPay", { type: "checkbox" })} />
				</Group>
			</Fieldset>

			<Fieldset className={classes.fieldset}>
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

			<Group justify="flex-end" w="100%">
				<Button disabled={!form.isDirty() || !form.isTouched()} loading={isSubmitting} type="submit">
					{type == "Edit" ? "Save Changes" : "Add Bill"}
				</Button>
			</Group>
		</form>
	);
}
