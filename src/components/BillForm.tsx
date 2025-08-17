import { useForm } from "@tanstack/react-form";
import { FormField } from "./form/FormField";
import { RadioGroupField } from "./form/RadioGroupField";
import { CheckboxField } from "./form/CheckboxField";
import { FormError } from "./form/FormError";
import { FormButtonGroup } from "./form/FormButtonGroup";
import { CurrencyInput } from "./form/CurrencyInput";
import { validateName, validateAmount, validateDueType, validateDayDue } from "./form/validation";

export type BillFormValues = {
	name: string;
	amount: string;
	dueType: "Fixed" | "EndOfMonth";
	dayDue: string;
	isAutoPay: boolean;
};

export interface BillFormProps {
	initialValues?: Partial<BillFormValues>;
	onSubmit: (values: BillFormValues) => Promise<void>;
	submitLabel?: string;
	onCancel?: () => void;
}

export function BillForm({ initialValues, onSubmit, submitLabel = "Save", onCancel }: BillFormProps) {
	const form = useForm({
		defaultValues: {
			name: initialValues?.name ?? "",
			amount: initialValues?.amount ?? "",
			dueType: initialValues?.dueType ?? "EndOfMonth",
			dayDue: initialValues?.dayDue ?? "",
			isAutoPay: initialValues?.isAutoPay ?? false,
		},
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
	});

	return (
		<form
			onSubmit={e => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit(e);
			}}
			className="flex flex-col gap-6"
		>
			<form.Field
				name="name"
				validators={{
					onChange: validateName,
					onBlur: validateName,
				}}
				children={field => (
					<FormField label="Name" error={field.state.meta.errors?.[0]}>
						<input
							type="text"
							value={field.state.value}
							onChange={e => field.handleChange(e.target.value)}
							onBlur={() => {
								field.handleBlur();
								field.validate("blur");
							}}
							placeholder="Enter bill name"
							className="w-full rounded border border-cyan-400 bg-zinc-800 text-white p-2"
						/>
					</FormField>
				)}
			/>
			<form.Field
				name="amount"
				validators={{
					onChange: validateAmount,
					onBlur: validateAmount,
				}}
				children={field => (
					<FormField label="Amount" error={field.state.meta.errors?.[0]}>
						<CurrencyInput
							value={field.state.value}
							onChange={field.handleChange}
							onBlur={e => {
								field.handleBlur();
								field.validate("blur");
							}}
						/>
					</FormField>
				)}
			/>
			<hr className="my-1 border-zinc-700" />
			<form.Field
				name="dueType"
				validators={{
					onChange: validateDueType,
					onBlur: validateDueType,
				}}
				children={field => (
					<RadioGroupField
						label="Due Type"
						value={field.state.value}
						options={[
							{ value: "EndOfMonth", label: "End of Month" },
							{ value: "Fixed", label: "Fixed Day" },
						]}
						onChange={val => field.handleChange(val as "Fixed" | "EndOfMonth")}
						error={field.state.meta.errors?.[0]}
					/>
				)}
			/>
			<form.Subscribe
				selector={state => state.values.dueType}
				children={dueType =>
					dueType !== "Fixed" ? null : (
						<form.Field
							name="dayDue"
							validators={{
								onChange: validateDayDue,
								onBlur: validateDayDue,
							}}
							children={field => (
								<FormField label="Day Due" error={field.state.meta.errors?.[0]}>
									<input
										type="number"
										min="1"
										max="31"
										value={field.state.value}
										onChange={e => field.handleChange(e.target.value)}
										onBlur={() => {
											field.handleBlur();
											field.validate("blur");
										}}
										placeholder="Day of month (1-31)"
										className="w-full rounded border border-cyan-400 bg-zinc-800 text-white p-2"
									/>
								</FormField>
							)}
						/>
					)
				}
			></form.Subscribe>
			<form.Field
				name="isAutoPay"
				children={field => (
					<CheckboxField
						label="Auto-Pay"
						checked={field.state.value}
						onChange={checked => field.handleChange(!!checked)}
						id="autopay-checkbox"
					/>
				)}
			/>
			<FormButtonGroup onCancel={onCancel} submitLabel={submitLabel} />
		</form>
	);
}
