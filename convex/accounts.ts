import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import { components } from "./_generated/api";
import { ActionCache } from "@convex-dev/action-cache";
import { getPlaidApi } from "./plaidHelpers";
import { PlaidItem } from "./schema";
import { AccountBase, Item } from "plaid";

export type Account = AccountBase & {
	itemId: string;
	institution: {
		id: string | null | undefined;
		name: string | null | undefined;
	};
};

export const get = action({
	args: {},
	handler: async (ctx, _): Promise<Account[]> => {
		const userIdentity = await ctx.auth.getUserIdentity();

		if (userIdentity?.subject == null) throw new Error("User not authenticated");

		const items: PlaidItem[] = await ctx.runQuery(api.plaidItems.get, {});

		const allAccounts = await Promise.all(
			items.map(item => accountsCache.fetch(ctx, { access_token: item.accessToken })),
		);

		return allAccounts.flat();
	},
});

export const getById = action({
	args: { itemId: v.string() },
	handler: async (ctx, { itemId }): Promise<Account[]> => {
		const userIdentity = await ctx.auth.getUserIdentity();

		if (userIdentity?.subject == null) throw new Error("User not authenticated");

		const item = await ctx.runQuery(api.plaidItems.getById, { itemId });

		if (!item) {
			throw new Error(`Plaid item with ID ${itemId} not found`);
		}

		return await accountsCache.fetch(ctx, { access_token: item.accessToken });
	},
});

const accountsCache = new ActionCache(components.actionCache, {
	action: internal.accounts.getAccountsFromPlaid,
	ttl: 1000 * 60 * 60 * 4, // 4 hours
});

export const getAccountsFromPlaid = internalAction({
	args: { access_token: v.string() },
	handler: async (__dirname, { access_token }): Promise<Account[]> => {
		const response = await getPlaidApi().accountsGet({ access_token });
		return response.data.accounts.map((account: AccountBase) => ({
			...account,
			itemId: response.data.item.item_id,
			institution: {
				id: response.data.item.institution_id,
				name: response.data.item.institution_name,
			},
		}));
	},
});
