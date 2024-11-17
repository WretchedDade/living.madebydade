import { GenericActionCtx, paginationOptsValidator, PaginationResult } from 'convex/server';
import { v } from 'convex/values';
import { addMonths, compareAsc, endOfMonth, getDaysInMonth, isBefore, isToday, setDate } from 'date-fns';
import { internal } from './_generated/api';
import { DataModel, Doc } from './_generated/dataModel';
import { internalAction, internalMutation, mutation, query } from './_generated/server';

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
			.filter(q => q.and(q.eq(q.field('ownerId'), user.subject), q.eq(q.field('datePaid'), undefined)))
			.paginate(args.paginationOpts);

		payments.page.sort((a, b) => compareAsc(new Date(a.dateDue), new Date(b.dateDue)));

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

		const payments = await ctx.db
			.query('billPayments')
			.filter(q => q.and(q.eq(q.field('ownerId'), user.subject)))
			.take(take);

		payments.sort((a, b) => {
			if (a.datePaid == null && b.datePaid == null) {
				return compareAsc(new Date(b._creationTime), new Date(a._creationTime));
			}

			if (a.datePaid == null) {
				return 1;
			}

			if (b.datePaid == null) {
				return -1;
			}

			return compareAsc(new Date(b.datePaid), new Date(a.datePaid));
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
			.filter(q => q.and(q.eq(q.field('ownerId'), user.subject), q.neq(q.field('datePaid'), undefined)))
			.take(50);

		payments.sort((a, b) => compareAsc(new Date(b.datePaid!), new Date(a.datePaid!)));

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

		if (payment.ownerId !== user.subject) {
			throw new Error('Not authorized');
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
		ownerId: v.string(),
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

type BillWithPayments = Doc<'bills'> & { payments: Doc<'billPayments'>[] };
const createUpcomingPaymentsForBills = async (ctx: GenericActionCtx<DataModel>, bills: BillWithPayments[]) => {
	console.log(`${bills.length} bills found`);

	for (const bill of bills) {
		const nextPaymentDate = getNextPaymentDate(bill);

		// Continue if next payment date could not be determined
		if (nextPaymentDate == null) {
			console.log(`Skipping bill ${bill.name} because the next payment date could not be determined`);
			continue;
		}

		// Continue if the next payment date is more than 15 days away
		if (nextPaymentDate.getTime() - new Date().getTime() > 15 * 24 * 60 * 60 * 1000) {
			console.log(`Skipping bill ${bill.name} because it is more than 15 days away`);
			continue;
		}

		// Check if Bill Payment already exists for this date
		const existingPayment = bill.payments.find(payment => payment.dateDue === nextPaymentDate.toISOString());

		if (existingPayment != null) {
			// Check if the bill is auto-pay and is due today
			if (bill.isAutoPay && isToday(nextPaymentDate)) {
				console.log(`${bill.name} is due today and auto-pays. Marking as paid...`);
				await ctx.runMutation(internal.billPayments.markBillPaid, {
					billPaymentId: existingPayment._id,
					datePaid: new Date().toISOString(),
				});
			} else {
				console.log(`Bill ${bill.name} already has a payment scheduled for ${nextPaymentDate.toISOString()}`);
				continue;
			}
		}

		console.log(`Creating payment for ${bill.name} due on ${nextPaymentDate.toISOString()}`);
		await ctx.runMutation(internal.billPayments.insertBillPayment, {
			billId: bill._id,
			ownerId: bill.ownerId,
			dateDue: nextPaymentDate.toISOString(),
		});
	}
};

const getNextPaymentDate = (bill: Doc<'bills'> & { payments: Doc<'billPayments'>[] }) => {
	const today = new Date();

	console.log(`Calculating next payment date for ${bill.name}`);

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

		const year = today.getFullYear();
		const month = today.getMonth();
		const dayDue = Math.min(getDaysInMonth(new Date(year, month)), bill.dayDue);

		const dateDueThisMonth = setDate(today, dayDue);

		if (today.getDate() <= bill.dayDue) {
			return dateDueThisMonth;
		} else {
			return addMonths(dateDueThisMonth, 1);
		}
	} else if (bill.dueType === 'EndOfMonth') {
		const endOfCurrentMonth = endOfMonth(today);

		if (isBefore(today, endOfCurrentMonth)) {
			return endOfCurrentMonth;
		} else {
			return addMonths(endOfCurrentMonth, 1);
		}
	} else {
		console.error(`Bill ${bill.name} has an unknown due type ${bill.dueType}`);
		return null;
	}
};

const incrementByOneMonth = (date: Date) => {
	const newDate = new Date(date);
	newDate.setMonth(newDate.getMonth() + 1);
	return newDate;
};
