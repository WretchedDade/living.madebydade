import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { DateTime } from 'luxon';
import { formatCurrency } from '~/utils/formatters';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Typography } from './ui/typography';

interface BillPaymentsListProps {
	includeAutoPay?: boolean;
}

export function BillPaymentsList({ includeAutoPay = false }: BillPaymentsListProps) {
	const billPayments = useSuspenseQuery(convexQuery(api.billPayments.listUnpaid, { includeAutoPay }));

	const mutation = useMutation({
		mutationFn: useConvexMutation(api.billPayments.markPaid),
	});

	return (
		<div className="flex flex-col gap-4 pr-2 overflow-y-auto">
			{billPayments.data.map(payment => (
				<Card key={payment._id}>
					<CardHeader className="p-3">
						<CardTitle className="flex items-center justify-between">
							<Typography variant="h3" className="text-base">
								{payment.bill.name}
							</Typography>
							{payment.bill.isAutoPay && <Badge variant="green">Auto pay</Badge>}
						</CardTitle>
					</CardHeader>
					<CardContent className="px-3 py-0">
						<Typography variant="p" className="text-sm">
							{formatCurrency(payment.bill.amount)} is due on{' '}
							{DateTime.fromISO(payment.dateDue, { zone: 'UTC' }).toFormat('EEEE, MMMM d')}
						</Typography>
					</CardContent>
					<CardFooter className="p-3">
						<Button
							type="button"
							size="sm"
							variant="outline"
							loading={mutation.isPending}
							onClick={() => {
								mutation.mutate({
									billPaymentId: payment._id,
									datePaid: DateTime.utc().toISO(),
								});
							}}
						>
							Mark as paid
						</Button>
					</CardFooter>
				</Card>
			))}
		</div>
	);
}
