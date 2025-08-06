import { Infer, v } from "convex/values";
import { api } from "./_generated/api";
import { action } from "./_generated/server";
import { getPlaidApi } from "./plaidHelpers";
import { PlaidItem, PlaidItemSchema } from "./schema";

export const getAllAccounts = action({

    args: {},
    handler: async (ctx) => {
        const userIdentity = await ctx.auth.getUserIdentity();

        if (userIdentity?.subject == null)
            throw new Error("User not authenticated");

        const items: PlaidItem[] = await ctx.runQuery(api.plaidItems.getPlaidItems, {});

        const plaidApi = getPlaidApi();

        const accountPromises = items.map(item =>
            plaidApi.accountsGet({
                access_token: item.accessToken,
            })
        );

        var accountResponses = await Promise.all(accountPromises);

        return accountResponses.map(response => ({
            accounts: response.data.accounts,
            itemId: response.data.item.item_id,
            institution: {
                id: response.data.item.institution_id,
                name: response.data.item.institution_name,
            }
        }));
    }

})

export const getAccounts = action({
    args: { itemId: v.string() },
    handler: async (ctx, { itemId }) => {
        const userIdentity = await ctx.auth.getUserIdentity();

        if (userIdentity?.subject == null)
            throw new Error("User not authenticated");

        const plaidItem = await ctx.runQuery(api.plaidItems.getPlaidItem, { itemId });

        if (!plaidItem) {
            throw new Error(`Plaid item with ID ${itemId} not found`);
        }

        const plaidApi = getPlaidApi();

        const response = await plaidApi.accountsGet({
            access_token: plaidItem.accessToken,
        });

        return {
            accounts: response.data.accounts,
            itemId: response.data.item.item_id,
            institution: {
                id: response.data.item.institution_id,
                name: response.data.item.institution_name,
            }
        };
    }
})