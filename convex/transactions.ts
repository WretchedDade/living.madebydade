import { RemovedTransaction, SyncUpdatesAvailableWebhook, Transaction, TransactionsSyncResponse } from "plaid";
import { getPlaidApi, toTransactionSchema } from "./plaidHelpers";
import { httpAction, internalAction, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { PlaidTransaction, PlaidTransactionSchema } from "./transactionSchema";
import { v } from "convex/values";

async function fetchNewTransactionSyncData(
    accessToken: string,
    initialCursor: string | undefined,
    retriesLeft = 3
) {
    const plaidApi = getPlaidApi();

    const transactions = {
        added: [] as Transaction[],
        modified: [] as Transaction[],
        removed: [] as RemovedTransaction[],
    };

    let cursor = initialCursor;

    if (retriesLeft <= 0) {
        console.error("No retries left, returning current transactions and cursor.");

        // We're just going to return no data and keep our original cursor. We can try again later.
        return { transactions, cursor };
    }

    let response: TransactionsSyncResponse;

    try {
        do {
            const results = await plaidApi.transactionsSync({
                cursor,
                access_token: accessToken,
                options: {
                    include_personal_finance_category: true,
                },
            });

            response = results.data;
            cursor = response.next_cursor;


            transactions.added = transactions.added.concat(response.added);
            transactions.modified = transactions.modified.concat(response.modified);
            transactions.removed = transactions.removed.concat(response.removed);

            console.log(`Fetched ${response.added.length} added, ${response.modified.length} modified, ${response.removed.length} removed transactions.`);
            console.log(
                `New Totals | Added: ${transactions.added.length} Modified: ${transactions.modified.length} Removed: ${transactions.removed.length} `
            );

        } while (response.has_more);

        return { transactions, cursor };
    } catch (error) {
        console.error("Error fetching transactions:", error);

        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait a second before retrying

        return fetchNewTransactionSyncData(accessToken, initialCursor, retriesLeft - 1);
    }
};

/**
 * Given an item ID, this will fetch all transactions for all accounts
 * associated with this item using the sync API. We can call this manually
 * using the /sync endpoint above, or we can call this in response
 * to a webhook
 */

// Want to try testing this on sandbox? Try adding code like this! You'll
// need to update these transaction IDs to what's in your database.
//
// allData.modified.push({
//   transaction_id: "EXISTING_TRANSACTION_ID_GOES_HERE",
//   account_id: "use_an_existing_account_id_if_you_can",
//   personal_finance_category: { primary: "TRANSPORTATION" },
//   date: "2022-12-31",
//   authorized_date: "2022-12-30",
//   merchant_name: "Fancy-shmancy Uber",
//   amount: 20.0,
//   iso_currency_code: "USD",
// });

// allData.removed.push({
//   transaction_id: "8Mr1leaRMVudPjV8G9XQcJ6AeEX4JecKQQEdJ",
// });

export const createTransaction = internalMutation({
    args: PlaidTransactionSchema,
    handler: async (ctx, transaction) => {
        return ctx.db.insert("transactions", {
            ...transaction,
            // Add any additional fields or transformations needed
        });
    }
});

export const updateTransaction = internalMutation({
    args: PlaidTransactionSchema,
    handler: async (ctx, updatedTransaction) => {
        const transaction = await ctx.db.query("transactions").filter(q => q.eq(q.field("transactionId"), updatedTransaction.transactionId)).first();

        if (!transaction) {
            throw new Error(`Transaction with ID ${updatedTransaction.transactionId} not found`);
        }

        return ctx.db.patch(transaction._id, updatedTransaction);
    }
});

export const deleteTransaction = internalMutation({
    args: { transactionId: v.string(), },
    handler: async (ctx, { transactionId }) => {
        const transaction = await ctx.db.query("transactions").filter(q => q.eq(q.field("transactionId"), transactionId)).first();

        if (!transaction) {
            throw new Error(`Transaction with ID ${transactionId} not found`);
        }

        return ctx.db.delete(transaction._id);
    }
});

export const syncTransactionData = internalAction({
    args: {
        itemId: v.string()
    },
    handler: async (ctx, { itemId }) => {
        // Step 1: Retrieve our access token and cursor from the database
        const item = await ctx.runQuery(internal.plaidItems.internalGetById, { itemId });

        if (!item) {
            throw new Error(`Item with ID ${itemId} not found`);
        }

        // Step 2: Fetch added, modified, and removed transactions from Plaid
        const summary = { added: 0, removed: 0, modified: 0 };
        const { transactions, cursor } = await fetchNewTransactionSyncData(item.accessToken, item.transactionCursor);

        // STEP 3: Save new transactions to the database
        await Promise.all(
            transactions.added.map(toTransactionSchema).map(async (transaction) => {
                await ctx.runMutation(internal.transactions.createTransaction, transaction);
                summary.added += 1;
            })
        )

        // Step 4: Update the modified transactions in the database
        await Promise.all(
            transactions.modified.map(toTransactionSchema).map(async (transaction) => {
                await ctx.runMutation(internal.transactions.updateTransaction, transaction);
                summary.modified += 1;
            })
        );

        // Step 5: Remove transactions from the database
        await Promise.all(
            transactions.removed.map(async (removedTransaction) => {
                await ctx.runMutation(internal.transactions.deleteTransaction, { transactionId: removedTransaction.transaction_id });
                summary.removed += 1;
            })
        );

        console.log(`Sync complete. Added: ${summary.added}, Modified: ${summary.modified}, Removed: ${summary.removed}`);
        console.log(`New cursor: ${cursor}`);

        // Step 6: Update the transaction cursor in the database
        if (cursor != null) {
            console.log(`Saving new cursor to database for item ID ${itemId}`);
            await ctx.runMutation(internal.plaidItems.updateTransactionCursor, { itemId, cursor });
        }

        console.log(summary);

        return summary;
    }
});