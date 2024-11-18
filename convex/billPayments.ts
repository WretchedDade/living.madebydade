import { GenericActionCtx, paginationOptsValidator, PaginationResult } from 'convex/server';
import { v } from 'convex/values';
import { DateTime } from 'luxon';

import { internal } from './_generated/api';
import { DataModel, Doc } from './_generated/dataModel';
import { internalAction, internalMutation, mutation, query } from './_generated/server';

export type BillWithPayments = Doc<'bills'> & { payments: Doc<'billPayments'>[] };
export type BillPaymentWithBill = Doc<'billPayments'> & { bill: Doc<'bills'> };

export const listUnpaid = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		const user = await ctx.auth.getUserIdentity();

		if (!user) {
			throw new Error('Not authenticated');
		}

		const payments = await ctx.db
			.query('billPayments')
			.filter(q => q.eq(q.field('datePaid'), undefined))
			.paginate(args.paginationOpts);

		payments.page.sort((a, b) => DateTime.fromISO(a.dateDue).toMillis() - DateTime.fromISO(b.dateDue).toMillis());

		payments.page = await Promise.all(
			payments.page.map(async payment => {
				const bill = await ctx.db.get(payment.billId);

				if (!bill) {
					throw new Error('Bill not found');
				}

				return { ...payment, bill };
			}),
		);

		return payments as PaginationResult<BillPaymentWithBill>;
	},
});

export const list = query({
	args: { take: v.optional(v.number()) },
	handler: async (ctx, { take = 50 }) => {
		const user = await ctx.auth.getUserIdentity();

		if (!user) {
			throw new Error('Not authenticated');
		}

		const payments = await ctx.db.query('billPayments').take(take);

		payments.sort((a, b) => {
			if (a.datePaid == null && b.datePaid == null) {
				return b._creationTime - a._creationTime;
			}

			if (a.datePaid == null) {
				return 1;
			}

			if (b.datePaid == null) {
				return -1;
			}

			return DateTime.fromISO(b.datePaid).toMillis() - DateTime.fromISO(a.datePaid).toMillis();
		});

		return Promise.all(
			payments.map(async payment => {
				const bill = await ctx.db.get(payment.billId);

				if (!bill) {
					throw new Error('Bill not found');
				}

				return { ...payment, bill };
			}),
		);
	},
});

export const listRecentlyPaid = query({
	args: {},
	handler: async ctx => {
		const user = await ctx.auth.getUserIdentity();

		if (!user) {
			throw new Error('Not authenticated');
		}

		const payments = await ctx.db
			.query('billPayments')
			.filter(q => q.neq(q.field('datePaid'), undefined))
			.take(50);

		payments.sort((a, b) => DateTime.fromISO(b.datePaid!).toMillis() - DateTime.fromISO(a.datePaid!).toMillis());

		return Promise.all(
			payments.map(async payment => {
				const bill = await ctx.db.get(payment.billId);

				if (!bill) {
					throw new Error('Bill not found');
				}

				return { ...payment, bill, datePaid: payment.datePaid! };
			}),
		);
	},
});

export const markPaid = mutation({
	args: {
		billPaymentId: v.id('billPayments'),
		datePaid: v.string(),
	},
	handler: async (ctx, { billPaymentId, datePaid }) => {
		const user = await ctx.auth.getUserIdentity();

		if (!user) {
			throw new Error('Not authenticated');
		}

		const payment = await ctx.db.get(billPaymentId);

		if (!payment) {
			throw new Error('Payment not found');
		}

		await ctx.db.patch(billPaymentId, { datePaid });
	},
});

export const markBillPaid = internalMutation({
	args: {
		billPaymentId: v.id('billPayments'),
		datePaid: v.string(),
	},
	handler: async (ctx, { billPaymentId, datePaid }) => {
		const payment = await ctx.db.get(billPaymentId);

		if (!payment) {
			throw new Error('Payment not found');
		}

		await ctx.db.patch(billPaymentId, { datePaid });
	},
});

export const insertBillPayment = internalMutation({
	args: {
		dateDue: v.string(),
		datePaid: v.optional(v.string()),
		billId: v.id('bills'),
	},
	handler: (ctx, payment) => ctx.db.insert('billPayments', payment),
});

export const createUpcomingPayments = internalAction({
	args: {},
	handler: async (ctx, args) => {
		const bills = await ctx.runQuery(internal.bills.listWithPayments, {});

		await createUpcomingPaymentsForBills(ctx, bills);
	},
});

const createUpcomingPaymentsForBills = async (ctx: GenericActionCtx<DataModel>, bills: BillWithPayments[]) => {
	console.log(`${bills.length} bills found`);
	const today = DateTime.utc().startOf('day');

	for (const bill of bills) {
		const nextPaymentDate = getNextPaymentDate(bill, today);

		// Continue if next payment date could not be determined
		if (nextPaymentDate == null) {
			console.log(`Skipping bill ${bill.name} because the next payment date could not be determined`);
			continue;
		}

		if (!nextPaymentDate.isValid) {
			console.log(
				`Skipping bill ${bill.name} because the next payment date is invalid. Reason: ${nextPaymentDate.invalidReason}. Explanation: ${nextPaymentDate.invalidExplanation}`,
			);
			continue;
		}

		if (nextPaymentDate.diff(today, 'days').days > 15) {
			console.log(`Skipping bill ${bill.name} because it is more than 15 days away`);
			continue;
		}

		// Check if Bill Payment already exists for this date
		const existingPayment = bill.payments.find(payment => payment.datePaid == null);

		if (existingPayment != null) {
			// Check if the bill is auto-pay and is due today
			if (bill.isAutoPay && nextPaymentDate.hasSame(today, 'day')) {
				console.log(`${bill.name} is due today and auto-pays. Marking as paid...`);
				await ctx.runMutation(internal.billPayments.markBillPaid, {
					billPaymentId: existingPayment._id,
					datePaid: today.toISO(),
				});
			} else {
				console.log(`Bill ${bill.name} already has a payment scheduled for ${existingPayment.dateDue}`);
				continue;
			}
		}

		console.log(`Creating payment for ${bill.name} due on ${nextPaymentDate.toISO()}`);
		await ctx.runMutation(internal.billPayments.insertBillPayment, {
			billId: bill._id,
			dateDue: nextPaymentDate.toISO()!,
		});
	}
};

const getNextPaymentDate = (bill: BillWithPayments, today: DateTime) => {
	if (bill.dueType === 'Fixed') {
		if (bill.dayDue == null) {
			console.error(
				`Bill ${bill.name} is configured incorrectly. It has a fixed due type but the day due is ${bill.dayDue}`,
			);

			return null;
		}

		if (bill.dayDue < 1 || bill.dayDue > 31) {
			console.error(
				`Bill ${bill.name} is configured incorrectly. It has a fixed due type but the day due is ${bill.dayDue}`,
			);

			return null;
		}

		const dayDue = Math.min(today.daysInMonth!, bill.dayDue);

		const dateDueThisMonth = today.set({ day: dayDue });

		if (today < dateDueThisMonth) {
			return dateDueThisMonth;
		} else {
			return dateDueThisMonth.plus({ months: 1 });
		}
	} else if (bill.dueType === 'EndOfMonth') {
		const endOfCurrentMonth = today.endOf('month').startOf('day');

		if (today < endOfCurrentMonth) {
			return endOfCurrentMonth;
		} else {
			return endOfCurrentMonth.plus({ months: 1 });
		}
	} else {
		console.error(`Bill ${bill.name} has an unknown due type ${bill.dueType}`);
		return null;
	}
};
