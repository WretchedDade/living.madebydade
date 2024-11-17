import { v } from 'convex/values';
import { internalQuery, mutation, query } from './_generated/server';

export const list = query({
	args: {},
	handler: async ctx => {
		const user = await ctx.auth.getUserIdentity();

		if (!user) {
			throw new Error('Not authenticated');
		}

		return await ctx.db
			.query('bills')
			.filter(q => q.eq(q.field('ownerId'), user.subject))
			.collect();
	},
});

export const listWithPayments = internalQuery({
	args: {},
	handler: async ctx => {
		const bills = await ctx.db.query('bills').collect();

		return Promise.all(
			bills.map(async bill => {
				const billPayments = await ctx.db.query('billPayments').collect();

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
		const user = await ctx.auth.getUserIdentity();

		if (!user) {
			throw new Error('Not authenticated');
		}

		if (id == null) {
			const billId = await ctx.db.insert('bills', { ...values, ownerId: user.subject });
			return billId;
		}

		const bill = await ctx.db.get(id);

		if (!bill) {
			throw new Error('Bill not found');
		}

		if (bill.ownerId !== user.subject) {
			throw new Error('Unauthorized');
		}

		await ctx.db.replace(id, { ...values, ownerId: user.subject });

		return id;
	},
});

export const deleteBill = mutation({
	args: {
		id: v.id('bills'),
	},
	handler: async (ctx, { id }) => {
		const user = await ctx.auth.getUserIdentity();

		if (!user) {
			throw new Error('Not authenticated');
		}

		const bill = await ctx.db.get(id);

		if (!bill) {
			throw new Error('Bill not found');
		}

		if (bill.ownerId !== user.subject) {
			throw new Error('Unauthorized');
		}

		await ctx.db.delete(id);
	},
});
