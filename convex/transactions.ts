import { RemovedTransaction, SyncUpdatesAvailableWebhook, Transaction, TransactionsSyncResponse } from "plaid";
import { getPlaidApi, toTransactionSchema, toLeanTransaction } from "./plaidHelpers";
import { httpAction, internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { PlaidTransaction, PlaidTransactionSchema, LeanTransactionSchema, TAccountType } from "./transactionSchema";
import { v } from "convex/values";
import { internal as internalApi } from "./_generated/api";
import { DateTime } from "luxon";
import { EST_TIMEZONE } from "../constants";
import type { Doc, Id } from "./_generated/dataModel";

async function fetchNewTransactionSyncData(accessToken: string, initialCursor: string | undefined, retriesLeft = 3) {
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

			console.log(
				`Fetched ${response.added.length} added, ${response.modified.length} modified, ${response.removed.length} removed transactions.`,
			);
			console.log(
				`New Totals | Added: ${transactions.added.length} Modified: ${transactions.modified.length} Removed: ${transactions.removed.length} `,
			);
		} while (response.has_more);

		return { transactions, cursor };
	} catch (error) {
		console.error("Error fetching transactions:", error);

		await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a second before retrying

		return fetchNewTransactionSyncData(accessToken, initialCursor, retriesLeft - 1);
	}
}

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
	args: LeanTransactionSchema,
	handler: async (ctx, transaction) => {
		// Idempotency guard: if this transactionId already exists, update it instead of inserting a duplicate
		const existing = await ctx.db
			.query("transactions")
			.withIndex("byTransactionId", q => q.eq("transactionId", transaction.transactionId))
			.first();
		if (existing) {
			// Delegate to update path for proper summary deltas
			await ctx.runMutation(internal.transactions.updateTransaction, transaction);
			return existing._id;
		}

		// Guard: skip inserting transactions older than 1 year
		const effectiveDateStr = transaction.authorizedDate ?? transaction.date;
		const cutoff = DateTime.now().setZone(EST_TIMEZONE).minus({ months: 6 }).startOf("day");
		const effective = DateTime.fromISO(effectiveDateStr, { zone: EST_TIMEZONE }).startOf("day");
		if (effective.isValid && effective < cutoff) {
			console.log(
				`[transactions] Skipping txn ${transaction.transactionId} dated ${effectiveDateStr} (older than 6 months)`,
			);
			return null;
		}

		// Lookup owning user and accountType
		const acct = await ctx.db
			.query("plaidAccounts")
			.withIndex("byAccountId", q => q.eq("accountId", transaction.accountId))
			.first();
		const userId = acct?.userId as string | undefined;
		const accountType = (acct?.accountType as TAccountType | undefined) ?? undefined;

		const id = await ctx.db.insert("transactions", {
			...transaction,
			userId,
			accountType,
		});
		// Update summaries
		if (userId) {
			const dateIso = transaction.authorizedDate ?? transaction.date;

			// Also apply to cash vs credit summaries
			await ctx.runMutation(internal.cashCreditSummaries.applyTxn, {
				userId,
				amount: transaction.amount,
				dateIso,
				currency: transaction.isoCurrencyCode ?? undefined,
				accountType: accountType ?? undefined,
				name: transaction.name,
				categoryPrimary: transaction.categoryPrimary,
				categoryDetailed: transaction.categoryDetailed,
				paymentChannel: transaction.paymentChannel,
			});
			console.log(`[summary] create txn ${transaction.transactionId} applied to ${userId} ${dateIso}`);
		}
		return id;
	},
});

export const updateTransaction = internalMutation({
	args: LeanTransactionSchema,
	handler: async (ctx, updatedTransaction) => {
		const transaction = await ctx.db
			.query("transactions")
			.withIndex("byTransactionId", q => q.eq("transactionId", updatedTransaction.transactionId))
			.first();

		if (!transaction) {
			// If we don't have the transaction locally (e.g., pruned or missed), no-op to avoid breaking sync.
			console.warn(`[transactions] update skipped; transaction ${updatedTransaction.transactionId} not found`);
			return null;
		}

		// Calculate deltas for summaries
		const oldAmount = transaction.amount;
		const oldDate = transaction.authorizedDate ?? transaction.date;
		const newAmount = updatedTransaction.amount;
		const newDate = updatedTransaction.authorizedDate ?? updatedTransaction.date;

		const userId =
			transaction.userId ??
			(await ctx.runQuery(internal.plaidItems.getUserIdByAccountId, { accountId: transaction.accountId }));

		// Persist update
		await ctx.db.patch(transaction._id, { ...updatedTransaction });

		if (userId) {
			if (oldDate === newDate) {
				// Same bucket: apply amount delta only
				await ctx.runMutation(internal.cashCreditSummaries.applyTxn, {
					userId,
					amount: newAmount - oldAmount,
					dateIso: newDate,
					currency: updatedTransaction.isoCurrencyCode ?? undefined,
					accountType: (transaction.accountType as TAccountType | undefined) ?? undefined,
					name: updatedTransaction.name,
					categoryPrimary: updatedTransaction.categoryPrimary,
					categoryDetailed: updatedTransaction.categoryDetailed,
					paymentChannel: updatedTransaction.paymentChannel,
				});
				console.log(
					`[summary] update txn ${updatedTransaction.transactionId} adjusted amount in-place on ${newDate}`,
				);
			} else {
				// cash/credit summaries: remove old, add new
				await ctx.runMutation(internal.cashCreditSummaries.applyTxn, {
					userId,
					amount: -oldAmount,
					dateIso: oldDate,
					currency: transaction.isoCurrencyCode ?? undefined,
					accountType: (transaction.accountType as TAccountType | undefined) ?? undefined,
					name: transaction.name,
					categoryPrimary: transaction.categoryPrimary,
					categoryDetailed: transaction.categoryDetailed,
					paymentChannel: transaction.paymentChannel,
				});
				await ctx.runMutation(internal.cashCreditSummaries.applyTxn, {
					userId,
					amount: newAmount,
					dateIso: newDate,
					currency: updatedTransaction.isoCurrencyCode ?? undefined,
					accountType: (transaction.accountType as TAccountType | undefined) ?? undefined,
					name: updatedTransaction.name,
					categoryPrimary: updatedTransaction.categoryPrimary,
					categoryDetailed: updatedTransaction.categoryDetailed,
					paymentChannel: updatedTransaction.paymentChannel,
				});
				console.log(
					`[summary] update txn ${updatedTransaction.transactionId} moved from ${oldDate} to ${newDate}`,
				);
			}
		}

		return;
	},
});

export const deleteTransaction = internalMutation({
	args: { transactionId: v.string() },
	handler: async (ctx, { transactionId }) => {
		const transaction = await ctx.db
			.query("transactions")
			.withIndex("byTransactionId", q => q.eq("transactionId", transactionId))
			.first();

		if (!transaction) {
			// It's okay if we never had this locally (e.g., pending never stored). No-op for idempotency.
			console.warn(`[transactions] delete skipped; transaction ${transactionId} not found`);
			return null;
		}
		const userId = await ctx.runQuery(internal.plaidItems.getUserIdByAccountId, {
			accountId: transaction.accountId,
		});

		await ctx.db.delete(transaction._id);

		if (userId) {
			const dateIso = transaction.authorizedDate ?? transaction.date;
			await ctx.runMutation(internal.cashCreditSummaries.applyTxn, {
				userId,
				amount: -transaction.amount,
				dateIso,
				currency: transaction.isoCurrencyCode ?? undefined,
				accountType: (transaction.accountType as TAccountType | undefined) ?? undefined,
				name: transaction.name,
				categoryPrimary: transaction.categoryPrimary,
				categoryDetailed: transaction.categoryDetailed,
				paymentChannel: transaction.paymentChannel,
			});
			console.log(`[summary] delete txn ${transaction.transactionId} removed from ${dateIso}`);
		}

		return;
	},
});

// Delete by document id while adjusting summaries (used by maintenance tasks like dedupe)
export const deleteTransactionById = internalMutation({
	args: { id: v.id("transactions") },
	handler: async (ctx, { id }) => {
		const transaction = await ctx.db.get(id);
		if (!transaction) {
			console.warn(`[transactions] deleteById skipped; id ${id} not found`);
			return null;
		}

		const userId = await ctx.runQuery(internal.plaidItems.getUserIdByAccountId, {
			accountId: transaction.accountId,
		});

		await ctx.db.delete(id);

		if (userId) {
			const dateIso = transaction.authorizedDate ?? transaction.date;
			await ctx.runMutation(internal.cashCreditSummaries.applyTxn, {
				userId,
				amount: -transaction.amount,
				dateIso,
				currency: transaction.isoCurrencyCode ?? undefined,
				accountType: (transaction.accountType as TAccountType | undefined) ?? undefined,
				name: transaction.name,
				categoryPrimary: transaction.categoryPrimary,
				categoryDetailed: transaction.categoryDetailed,
				paymentChannel: transaction.paymentChannel,
			});
			console.log(`[summary] deleteById txn ${transaction.transactionId} removed from ${dateIso}`);
		}

		return null;
	},
});

// Internal utility queries for jobs/backfills
export const internalListAll = internalQuery({
	args: {},
	handler: async ctx => {
		return ctx.db.query("transactions").collect();
	},
});

export const internalGetByTransactionId = internalQuery({
	args: { transactionId: v.string() },
	handler: async (ctx, { transactionId }) => {
		return ctx.db
			.query("transactions")
			.withIndex("byTransactionId", q => q.eq("transactionId", transactionId))
			.first();
	},
});

export const internalPaginateAll = internalQuery({
	args: { cursor: v.optional(v.union(v.string(), v.null())), pageSize: v.optional(v.number()) },
	handler: async (ctx, { cursor = null, pageSize = 2000 }) => {
		return await ctx.db.query("transactions").order("asc").paginate({ cursor, numItems: pageSize });
	},
});

// Prune any transactions older than 6 months (authorizedDate if present, else date)
export const pruneOldTransactions = internalMutation({
	args: {},
	handler: async ctx => {
		const thresholdISO = DateTime.now().setZone(EST_TIMEZONE).minus({ months: 6 }).startOf("day").toISODate()!;

		// First: delete by authorizedDate using index
		let cursor: string | null = null;
		do {
			const page = await ctx.db
				.query("transactions")
				.withIndex("authorizedDate", q => q.lt("authorizedDate", thresholdISO))
				.order("asc")
				.paginate({ cursor, numItems: 500 });

			for (const txn of page.page) {
				await ctx.db.delete(txn._id);
			}
			cursor = page.isDone ? null : page.continueCursor;
		} while (cursor);

		// Second: delete where authorizedDate is null and date < threshold (use date index)
		cursor = null;
		do {
			const page = await ctx.db
				.query("transactions")
				.withIndex("date", q => q.lt("date", thresholdISO))
				.order("asc")
				.paginate({ cursor, numItems: 500 });

			for (const txn of page.page) {
				// Skip ones that had authorizedDate (already pruned above)
				if (txn.authorizedDate != null) continue;
				await ctx.db.delete(txn._id);
			}
			cursor = page.isDone ? null : page.continueCursor;
		} while (cursor);

		return null;
	},
});

export const syncTransactionData = internalAction({
	args: {
		itemId: v.string(),
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

		// Process in safer order and strictly sequentially to avoid high-contention writes
		// to summary documents which cause persistent Convex retries.
		// 1) Removed first (clear pending when posting replaces it)
		const removedResults: Array<{ status: "fulfilled" } | { status: "rejected"; reason: unknown }> = [];
		for (const removedTransaction of transactions.removed) {
			try {
				await ctx.runMutation(internal.transactions.deleteTransaction, {
					transactionId: removedTransaction.transaction_id,
				});
				summary.removed += 1;
				removedResults.push({ status: "fulfilled" });
			} catch (err) {
				console.error("[sync] remove failed:", err);
				removedResults.push({ status: "rejected", reason: err });
			}
		}

		// 2) Added
		const addedResults: Array<{ status: "fulfilled" } | { status: "rejected"; reason: unknown }> = [];
		for (const transaction of transactions.added.map(toLeanTransaction)) {
			try {
				await ctx.runMutation(internal.transactions.createTransaction, transaction);
				summary.added += 1;
				addedResults.push({ status: "fulfilled" });
			} catch (err) {
				console.error("[sync] add failed:", err);
				addedResults.push({ status: "rejected", reason: err });
			}
		}

		// 3) Modified
		const modifiedResults: Array<{ status: "fulfilled" } | { status: "rejected"; reason: unknown }> = [];
		for (const transaction of transactions.modified.map(toLeanTransaction)) {
			try {
				await ctx.runMutation(internal.transactions.updateTransaction, transaction);
				summary.modified += 1;
				modifiedResults.push({ status: "fulfilled" });
			} catch (err) {
				console.error("[sync] modify failed:", err);
				modifiedResults.push({ status: "rejected", reason: err });
			}
		}

		console.log(
			`Sync complete. Added: ${summary.added}, Modified: ${summary.modified}, Removed: ${summary.removed}`,
		);
		console.log(`New cursor: ${cursor}`);

		// Step 4: Update the transaction cursor only if no failures occurred
		const hadFailures =
			removedResults.some(r => r.status === "rejected") ||
			addedResults.some(r => r.status === "rejected") ||
			modifiedResults.some(r => r.status === "rejected");
		if (cursor != null && !hadFailures) {
			console.log(`Saving new cursor to database for item ID ${itemId}`);
			await ctx.runMutation(internal.plaidItems.updateTransactionCursor, { itemId, cursor });
		}

		console.log(summary);

		return summary;
	},
});

// Public query: list transactions for the current user by effective date range (authorizedDate || date)
export const listByDateRange = query({
	args: {
		startDate: v.optional(v.string()), // inclusive ISO date (YYYY-MM-DD)
		endDate: v.optional(v.string()), // inclusive ISO date (YYYY-MM-DD)
		limit: v.optional(v.number()),
	},
	handler: async (ctx, { startDate, endDate, limit = 500 }) => {
		const user = await ctx.auth.getUserIdentity();
		if (!user) throw new Error("User not authenticated");

		// Failfast if startDate or endDate was not provided
		if (!startDate || !endDate) {
			return { items: [] };
		}

		// Fetch account IDs for this user
		const accounts = await ctx.db
			.query("plaidAccounts")
			.withIndex("byUserId", q => q.eq("userId", user.subject))
			.collect();
		const accountIds = new Set(accounts.map(a => a.accountId));

		if (accountIds.size === 0) return { items: [] };

		// Use end date exclusive bound by adding 1 day
		const endExclusive = DateTime.fromISO(endDate, { zone: EST_TIMEZONE }).plus({ days: 1 }).toISODate()!;

		// 1) Get transactions whose authorizedDate is in range
		const authTxns = await ctx.db
			.query("transactions")
			.withIndex("authorizedDate", q => q.gte("authorizedDate", startDate).lt("authorizedDate", endExclusive))
			.order("asc")
			.collect();

		// 2) Get transactions with no authorizedDate and date in range
		const dateTxnsRaw = await ctx.db
			.query("transactions")
			.withIndex("date", q => q.gte("date", startDate).lt("date", endExclusive))
			.order("asc")
			.collect();
		const dateTxns = dateTxnsRaw.filter(t => t.authorizedDate == null);

		// Merge, filter to user's accounts, and sort by effective date desc
		const merged = [...authTxns, ...dateTxns].filter(t => accountIds.has(t.accountId));
		merged.sort((a, b) => {
			const aEff = a.authorizedDate ?? a.date;
			const bEff = b.authorizedDate ?? b.date;
			return aEff < bEff ? 1 : aEff > bEff ? -1 : 0;
		});

		return { items: merged.slice(0, limit) };
	},
});
