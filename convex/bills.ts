import { query } from './_generated/server';

export const list = query({
	args: {},
	handler: async ctx => {
		const user = await ctx.auth.getUserIdentity();
		console.log(user);
		if (!user) {
			throw new Error('Not authenticated');
		}
		return await ctx.db.query('bills').collect();
	},
});
