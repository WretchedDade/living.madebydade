import { Infer, ObjectType, v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getPlaidApi, getPlaidConfig } from "./plaidHelpers";
import { CountryCode, Products } from "plaid";
import { PlaidAccountSchema, PlaidInstitutionSchema, PlaidItem, PlaidItemSchema } from "./schema";
import { api, internal } from "./_generated/api";

export const getLinkToken = action({
    args: {},
    handler: async (ctx) => {

        const userIdentity = await ctx.auth.getUserIdentity();

        if (userIdentity?.subject == null)
            throw new Error("User not authenticated");

        const plaidApi = getPlaidApi();
        const { clientName, language, countryCodes, products, webhook, transactions } = getPlaidConfig();

        try {

            const response = await plaidApi.linkTokenCreate({
                user: {
                    client_user_id: userIdentity.subject,
                },

                client_name: clientName,
                language: language,
                country_codes: countryCodes,
                products: products,
                webhook,
                transactions,
            });

            return response.data;
        } catch (error) {
            console.error((error as any).response);
            throw new Error("Failed to create Plaid link token");
        }
    },
});

export const getPlaidItems = query({
    args: {},
    handler: async (ctx) => {
        const userIdentity = await ctx.auth.getUserIdentity();

        if (userIdentity?.subject == null)
            throw new Error("User not authenticated");

        return ctx.db.query('plaidItems').filter((q) =>
            q.eq(q.field('userId'), userIdentity.subject)
        ).collect();
    },
});

export const getPlaidItem = query({
    args: { itemId: v.string() },
    handler: async (ctx, { itemId }) => {
        const userIdentity = await ctx.auth.getUserIdentity();

        if (userIdentity?.subject == null)
            throw new Error("User not authenticated");

        const item = await ctx.db.query('plaidItems').filter((q) =>
            q.and(q.eq(q.field('itemId'), itemId), q.eq(q.field('userId'), userIdentity.subject))
        ).first();

        if (!item) {
            throw new Error("Item not found or does not belong to the user");
        }

        return item;
    },
});

export const getPlaidItem_internal = internalQuery({
    args: { itemId: v.string() },
    handler: async (ctx, { itemId }) => {
        const item = await ctx.db.query('plaidItems').filter((q) =>
            q.eq(q.field('itemId'), itemId)
        ).first();

        if (!item) {
            throw new Error("Item not found or does not belong to the user");
        }

        return item;
    },
});

export const createPlaidItem = mutation({
    args: PlaidItemSchema,
    handler: async (ctx, item) => {
        const userIdentity = await ctx.auth.getUserIdentity();

        if (userIdentity?.subject == null)
            throw new Error("User not authenticated");

        if (item.userId !== userIdentity.subject)
            throw new Error("User ID does not match authenticated user");

        ctx.db.insert('plaidItems', item);

        return item;
    }
})

export const linkPlaidItem = action({
    args: { publicToken: v.string(), institution: v.optional(PlaidInstitutionSchema), accounts: v.array(PlaidAccountSchema) },
    handler: async (ctx, { publicToken, institution, accounts }): Promise<PlaidItem> => {
        const userIdentity = await ctx.auth.getUserIdentity();

        if (userIdentity?.subject == null)
            throw new Error("User not authenticated");

        const plaidApi = getPlaidApi();

        const response = await plaidApi.itemPublicTokenExchange({ public_token: publicToken, });

        await ctx.scheduler.runAfter(0, internal.transactions.syncTransactionData, { itemId: response.data.item_id });

        return await ctx.runMutation(api.plaidItems.createPlaidItem, {
            userId: userIdentity.subject,
            itemId: response.data.item_id,
            accessToken: response.data.access_token,

            institution,
            accounts,
        });
    }
})

export const updateTransactionCursor = internalMutation({
    args: { itemId: v.string(), cursor: v.string() },
    handler: async (ctx, { itemId, cursor }) => {

        const item = await ctx.db.query('plaidItems').filter((q) => q.eq(q.field('itemId'), itemId)).first();

        if (!item) {
            throw new Error("Item not found or does not belong to the user");
        }

        return ctx.db.patch(item._id, { transactionCursor: cursor });
    }
})