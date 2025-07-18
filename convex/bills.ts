import { v } from 'convex/values';
import { internalQuery, mutation, query } from './_generated/server';

export const list = query({
	args: {},
	handler: async ctx => {
		return await ctx.db.query('bills').collect();
	},
});

export const listWithPayments = internalQuery({
	args: {},
	handler: async ctx => {
		const bills = await ctx.db.query('bills').collect();

		return Promise.all(
			bills.map(async bill => {
				const billPayments = await ctx.db
					.query('billPayments')
					.filter(q => q.eq(q.field('billId'), bill._id))
					.collect();

				return { ...bill, payments: billPayments };
			}),
		);
	},
});

export const upsertBill = mutation({
	args: {
		id: v.optional(v.id('bills')),
		amount: v.float64(),
		dayDue: v.optional(v.float64()),
		dueType: v.union(v.literal('Fixed'), v.literal('EndOfMonth')),
		isAutoPay: v.boolean(),
		name: v.string(),
	},
	handler: async (ctx, { id, ...values }) => {
		if (id == null) {
			const billId = await ctx.db.insert('bills', { ...values });
			return billId;
		}

		const bill = await ctx.db.get(id);

		if (!bill) {
			throw new Error('Bill not found');
		}

		await ctx.db.replace(id, { ...values });

		return id;
	},
});

export const deleteBill = mutation({
	args: {
		id: v.id('bills'),
	},
	handler: async (ctx, { id }) => {
		const bill = await ctx.db.get(id);

		if (!bill) {
			throw new Error('Bill not found');
		}

		await ctx.db.delete(id);
	},
});


// Query to get a bill by its id
export const getBillById = query({
	args: { id: v.optional(v.id('bills')) },
	handler: async (ctx, { id }) => {
		if (id == null) return undefined;

		// Replace with your actual data access logic
		const bill = await ctx.db.get(id);
		return bill;
	},
});