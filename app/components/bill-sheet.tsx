import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Doc } from 'convex/_generated/dataModel';

import { useConvexMutation } from '@convex-dev/react-query';
import { useMutation } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { LoaderCircleIcon } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from './ui/sheet';

interface BillSheetProps {
	open: boolean;
	onClose: () => void;

	bill: Doc<'bills'> | null;
}

export function BillSheet({ open, onClose, bill }: BillSheetProps) {
	const isCreating = bill === null;

	const { mutate, isPending } = useMutation({
		mutationFn: useConvexMutation(api.bills.upsertBill),
		onSuccess: () => {
			close();
		},
	});

	const form = useForm<FormValues>({
		disabled: isPending,
		resolver: zodResolver(formSchema),
		defaultValues,
	});

	useEffect(() => {
		if (bill != null) {
			form.reset(
				bill.dueType === 'EndOfMonth'
					? { ...bill, dueAtEndOfMonth: true }
					: { ...bill, dueAtEndOfMonth: false },
			);
		} else {
			form.reset(defaultValues);
		}
	}, [bill]);

	function onSubmit(values: FormValues) {
		mutate({
			id: bill?._id,
			name: values.name,
			amount: values.amount,
			dueType: values.dueAtEndOfMonth ? 'EndOfMonth' : 'Fixed',
			dayDue: values.dayDue,
			isAutoPay: values.isAutoPay,
		});
	}

	function close() {
		form.reset();
		onClose();
	}

	return (
		<Sheet open={open} onOpenChange={open => !open && close()}>
			<SheetContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
						<SheetHeader>
							<SheetTitle>{isCreating ? 'Add new bill' : `Edit ${bill.name}`}</SheetTitle>
						</SheetHeader>

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Bill name</FormLabel>
									<FormControl>
										<Input placeholder="Mortgage" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="amount"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Bill amount</FormLabel>
									<FormControl>
										<Input type="number" placeholder="1000" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="dueAtEndOfMonth"
							render={({ field }) => (
								<FormItem>
									<div className="flex items-center gap-2">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
												disabled={isPending}
											/>
										</FormControl>
										<FormLabel>Due at end of month</FormLabel>
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="dayDue"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Day of month due</FormLabel>
									<FormControl>
										<Input
											type="number"
											disabled={form.getValues().dueAtEndOfMonth}
											placeholder="15"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="isAutoPay"
							render={({ field }) => (
								<FormItem>
									<div className="flex items-center gap-2">
										<FormControl>
											<Checkbox checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
										<FormLabel>Paid automatically</FormLabel>
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>

						<SheetFooter>
							<Button type="submit" disabled={isPending}>
								{isPending ? <LoaderCircleIcon className="animate-spin mr-1" /> : null}
								{isCreating ? 'Add' : 'Save Changes'}
							</Button>
							<Button type="button" variant="outline" onClick={close} disabled={isPending}>
								Cancel
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}

type FormValues = z.infer<typeof formSchema>;

const baseSchema = z.object({
	name: z.string().min(1, "Name can't be empty"),
	amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
	dueAtEndOfMonth: z.boolean(),
	isAutoPay: z.boolean(),
});

const endOfMonthSchema = z.object({
	dueAtEndOfMonth: z.literal(true),
	dayDue: z.coerce.number().optional(),
});

const dayOfMonthSchema = z.object({
	dueAtEndOfMonth: z.literal(false),
	dayDue: z.coerce
		.number()
		.min(1, 'Day due must be greater than 0')
		.max(31, 'Day due must be less than or equal to 31'),
});

const formSchema = z
	.discriminatedUnion('dueAtEndOfMonth', [baseSchema.merge(endOfMonthSchema), baseSchema.merge(dayOfMonthSchema)])
	.and(baseSchema);

const defaultValues: FormValues = {
	name: '',
	amount: 0,
	dayDue: 0,
	dueAtEndOfMonth: false,
	isAutoPay: false,
};
