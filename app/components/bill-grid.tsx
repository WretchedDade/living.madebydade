import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency, formatOrdinal } from '~/utils/formatters';
import { BillSheet } from './bill-sheet';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from './ui/dialog';
import { Typography } from './ui/typography';

interface BillGridState {
	drawerOpen: boolean;
	bill: Doc<'bills'> | null;
}

export function BillGrid() {
	const [state, setState] = useState<BillGridState>({ drawerOpen: false, bill: null });
	const billsQuery = useSuspenseQuery(convexQuery(api.bills.list, {}));

	const deleteMutation = useMutation({
		mutationFn: useConvexMutation(api.bills.deleteBill),
	});

	return (
		<>
			<div className="grid grid-cols-4 gap-5">
				<Button
					type="button"
					variant="outline"
					className="h-full border-dashed border-primary text-lg [&_svg]:size-6"
					onClick={() => setState({ drawerOpen: true, bill: null })}
				>
					<PlusIcon /> Add new bill
				</Button>

				{billsQuery.isSuccess &&
					billsQuery.data.map(bill => (
						<Card key={bill._id}>
							<CardHeader>
								<CardTitle className="flex items-end">
									<Typography variant="h4">{bill.name}</Typography>{' '}
									<Typography variant="p" className="ml-auto text-sm">
										{formatCurrency(bill.amount)}
									</Typography>
								</CardTitle>
								<CardDescription>
									<Typography variant="p" className="text-sm">
										{bill.dueType === 'EndOfMonth'
											? 'Due at the end of each month'
											: `Due on the ${formatOrdinal(bill.dayDue)} of each month`}
									</Typography>
								</CardDescription>
							</CardHeader>
							<CardFooter className="justify-between">
								<div className="flex items-center gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => setState({ drawerOpen: true, bill })}
									>
										Edit
									</Button>
									<Dialog>
										<DialogTrigger asChild>
											<Button
												size="sm"
												variant="outline"
												className="[&_svg]:text-destructive hover:bg-destructive hover:text-destructive-foreground [&_svg]:hover:text-destructive-foreground"
											>
												<Trash2Icon /> Delete
											</Button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>Are you absolutely sure?</DialogTitle>
												<DialogDescription>
													This action cannot be undone. This will permanently delete the{' '}
													{bill.name} bill.
												</DialogDescription>
											</DialogHeader>
											<DialogFooter>
												<Button
													onClick={() => {
														deleteMutation.mutate({ id: bill._id });
													}}
													variant="destructive"
												>
													Delete
												</Button>
												<DialogClose>
													<Button variant="secondary" onClick={() => {}}>
														Cancel
													</Button>
												</DialogClose>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								</div>
								<div>{bill.isAutoPay && <Badge variant="green">Auto-Pay</Badge>}</div>
							</CardFooter>
						</Card>
					))}
			</div>

			<BillSheet
				open={state.drawerOpen}
				onClose={() => setState({ drawerOpen: false, bill: null })}
				bill={state.bill}
			/>
		</>
	);
}
