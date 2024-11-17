import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { BillPaymentWithBill } from 'convex/billPayments';
import { format, formatDistance } from 'date-fns';
import { ReceiptIcon } from 'lucide-react';
import { cn } from '~/lib/utils';

export function BillPaymentsFeed() {
	const recentPayments = useSuspenseQuery(convexQuery(api.billPayments.list, {}));

	return (
		<ul role="list" className="space-y-6 pr-4">
			{recentPayments.data.map((payment, index) => (
				<li key={payment._id} className="relative flex gap-x-4">
					<div
						className={cn(
							index === recentPayments.data.length - 1 ? 'h-6' : '-bottom-6',
							'absolute left-0 top-0 flex w-6 justify-center',
						)}
					>
						<div className="w-px bg-gray-200" />
					</div>
					<div className="relative flex size-6 flex-none items-center justify-center bg-white">
						{payment.datePaid != null ? (
							<ReceiptIcon aria-hidden="true" className="size-4 text-green-600" />
						) : (
							<div className="size-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300" />
						)}
					</div>
					<p className="flex-auto py-0.5 text-xs/5 text-gray-500">
						<span className="font-medium text-gray-900">{payment.bill.name}</span> was{' '}
						{payment.datePaid ? 'paid' : 'created'}.
					</p>
					<time
						dateTime={payment.datePaid ?? new Date(payment._creationTime).toISOString()}
						className="flex-none py-0.5 text-xs/5 text-gray-500"
					>
						{formatDistance(new Date(), getDate(payment))}
					</time>
				</li>
			))}
		</ul>
	);
}

function getDate(payment: BillPaymentWithBill) {
	if (payment.datePaid != null) {
		return new Date(payment.datePaid);
	}

	return new Date(payment._creationTime);
}

function getActivityMessage(payment: BillPaymentWithBill) {
	if (payment.datePaid != null) {
		return `paid at ${format(payment.datePaid, 'h:mm a')} on ${format(payment.datePaid, 'EEE, MMM do')}`;
	}

	return `created`;
}
