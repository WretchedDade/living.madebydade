import { RemovedTransaction, SyncUpdatesAvailableWebhook, Transaction, TransactionsSyncResponse } from 'plaid';
import { getPlaidApi, toTransactionSchema, toLeanTransaction } from './plaidHelpers';
import { httpAction, internalAction, internalMutation, internalQuery } from './_generated/server';
import { api, internal } from './_generated/api';
import { PlaidTransaction, PlaidTransactionSchema, LeanTransactionSchema } from './transactionSchema';
import { v } from 'convex/values';

async function fetchNewTransactionSyncData(accessToken: string, initialCursor: string | undefined, retriesLeft = 3) {
	const plaidApi = getPlaidApi();

	const transactions = {
		added: [] as Transaction[],
		modified: [] as Transaction[],
		removed: [] as RemovedTransaction[],
	};

	let cursor = initialCursor;

	if (retriesLeft <= 0) {
		console.error('No retries left, returning current transactions and cursor.');

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
		console.error('Error fetching transactions:', error);

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
		return ctx.db.insert('transactions', {
			...transaction,
			// Add any additional fields or transformations needed
		});
	},
});

export const updateTransaction = internalMutation({
	args: LeanTransactionSchema,
	handler: async (ctx, updatedTransaction) => {
		const transaction = await ctx.db
			.query('transactions')
			.filter(q => q.eq(q.field('transactionId'), updatedTransaction.transactionId))
			.first();

		if (!transaction) {
			throw new Error(`Transaction with ID ${updatedTransaction.transactionId} not found`);
		}

		return ctx.db.patch(transaction._id, updatedTransaction);
	},
});

export const deleteTransaction = internalMutation({
	args: { transactionId: v.string() },
	handler: async (ctx, { transactionId }) => {
		const transaction = await ctx.db
			.query('transactions')
			.filter(q => q.eq(q.field('transactionId'), transactionId))
			.first();

		if (!transaction) {
			throw new Error(`Transaction with ID ${transactionId} not found`);
		}

		return ctx.db.delete(transaction._id);
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

		// STEP 3: Save new transactions to the database
		await Promise.all(
			transactions.added.map(toLeanTransaction).map(async transaction => {
				await ctx.runMutation(internal.transactions.createTransaction, transaction);
				summary.added += 1;
			}),
		);

		// Step 4: Update the modified transactions in the database
		await Promise.all(
			transactions.modified.map(toLeanTransaction).map(async transaction => {
				await ctx.runMutation(internal.transactions.updateTransaction, transaction);
				summary.modified += 1;
			}),
		);

		// Step 5: Remove transactions from the database
		await Promise.all(
			transactions.removed.map(async removedTransaction => {
				await ctx.runMutation(internal.transactions.deleteTransaction, {
					transactionId: removedTransaction.transaction_id,
				});
				summary.removed += 1;
			}),
		);

		console.log(
			`Sync complete. Added: ${summary.added}, Modified: ${summary.modified}, Removed: ${summary.removed}`,
		);
		console.log(`New cursor: ${cursor}`);

		// Step 6: Update the transaction cursor in the database
		if (cursor != null) {
			console.log(`Saving new cursor to database for item ID ${itemId}`);
			await ctx.runMutation(internal.plaidItems.updateTransactionCursor, { itemId, cursor });
		}

		console.log(summary);

		return summary;
	},
});

// --- Migration helpers: one-off tools to shrink existing docs to the lean shape ---

export const listTransactionPage = internalQuery({
	args: { cursor: v.optional(v.string()), limit: v.number() },
	handler: async (ctx, { cursor, limit }) => {
		// Use Convex pagination in creation order for a stable migration scan
		const { page, isDone, continueCursor } = await ctx.db
			.query('transactions')
			.paginate({ cursor: cursor ?? null, numItems: limit });

		return { page, isDone, continueCursor };
	},
});

export const patchTransactionById = internalMutation({
	args: {
		id: v.id('transactions'),
		updates: v.object({
			categoryPrimary: v.optional(v.union(v.null(), v.string())),
			categoryDetailed: v.optional(v.union(v.null(), v.string())),
			transactionCode: v.optional(v.union(v.null(), v.string())),
		}),
		remove: v.array(v.string()),
	},
	handler: async (ctx, { id, updates, remove }) => {
		const patch: Record<string, any> = { ...updates };
		for (const key of remove) {
			// Setting to undefined inside the mutation ensures Convex deletes the field.
			patch[key] = undefined;
		}
		await ctx.db.patch(id, patch);
	},
});

export const migrateTransactionsToLean = internalAction({
	args: {
		batchSize: v.optional(v.number()),
		startCursor: v.optional(v.string()),
		concurrency: v.optional(v.number()),
		maxPages: v.optional(v.number()),
		logEveryPages: v.optional(v.number()),
		logEveryMs: v.optional(v.number()),
		verbose: v.optional(v.boolean()),
	},
	handler: async (
		ctx,
		{ batchSize, startCursor, concurrency, maxPages, logEveryPages, logEveryMs, verbose },
	) => {
		const limit = batchSize ?? 500;
		// Limit the number of simultaneous mutation calls to avoid overload/throttling.
		// Tweak as needed; 8-16 is typically safe. Can be overridden by arg.
		const parallelism = Math.max(1, Math.min(concurrency ?? 12, 32));
		const pageBudget = maxPages ?? Number.POSITIVE_INFINITY;
		const verboseLogs = !!verbose;
		const pagesInterval = Math.max(1, (logEveryPages ?? 10) | 0);
		const msInterval = Math.max(0, (logEveryMs ?? 5000) | 0);
		let cursor: string | undefined = startCursor ?? undefined;
		let migrated = 0;
		let pagesProcessed = 0;
		let lastCursor: string | null = null;
		let totalSkipped = 0;
		let lastPeriodicLogAt = Date.now();

		const startedAt = Date.now();
		console.log(
			`[migrateTransactionsToLean] START batchSize=${limit} concurrency=${parallelism} maxPages=${pageBudget === Infinity ? '∞' : pageBudget} startCursor=${startCursor ? 'present' : 'none'} logEveryPages=${pagesInterval} logEveryMs=${msInterval} verbose=${verboseLogs}`,
		);

		while (true) {
			const result: any = await ctx.runQuery(internal.transactions.listTransactionPage, { cursor, limit });
			const page: any[] = result.page ?? [];
			const isDone: boolean = !!result.isDone;
			const continueCursor: string | null = result.continueCursor ?? null;

			if (page.length === 0) {
				if (isDone) break;
			}

			// Build work items for this page
			const work: Array<() => Promise<void>> = [];
			let skipped = 0;
			for (const t of page) {
				const legacy: any = t as any;

				const hasLegacyFields =
					'personalFinanceCategory' in legacy ||
					'location' in legacy ||
					'paymentMeta' in legacy ||
					'businessFinanceCategory' in legacy ||
					'counterparties' in legacy ||
					'website' in legacy ||
					'logoUrl' in legacy ||
					'originalDescription' in legacy ||
					'unofficialCurrencyCode' in legacy ||
					'checkNumber' in legacy ||
					'accountOwner' in legacy ||
					'authorizedDatetime' in legacy ||
					'datetime' in legacy;

				// If it already appears lean and transactionCode is clean, skip.
				if (!hasLegacyFields && legacy.transactionCode !== 'undefined') {
					skipped += 1;
					continue;
				}

				const categoryPrimary = legacy.personalFinanceCategory?.primary ?? null;
				const categoryDetailed = legacy.personalFinanceCategory?.detailed ?? null;
				const transactionCodeSanitized =
					typeof t.transactionCode === 'string' && t.transactionCode !== 'undefined'
						? t.transactionCode
						: null;

				const updates = {
					categoryPrimary,
					categoryDetailed,
					transactionCode: transactionCodeSanitized,
				} as const;

				const remove = [
					'location',
					'paymentMeta',
					'businessFinanceCategory',
					'counterparties',
					'website',
					'logoUrl',
					'personalFinanceCategoryIconUrl',
					'originalDescription',
					'unofficialCurrencyCode',
					'checkNumber',
					'accountOwner',
					'authorizedDatetime',
					'datetime',
					'personalFinanceCategory',
				];

				work.push(async () => {
					await ctx.runMutation(internal.transactions.patchTransactionById, { id: t._id, updates, remove });
					migrated += 1;
				});
			}

			// Execute with bounded concurrency
			if (work.length > 0) {
				for (let i = 0; i < work.length; i += parallelism) {
					await Promise.all(work.slice(i, i + parallelism).map(fn => fn()));
				}
			}

			totalSkipped += skipped;

			pagesProcessed += 1;
			if (verboseLogs) {
				console.log(
					`Migration page processed: items=${page.length}, skipped=${skipped}, totalSkipped=${totalSkipped}, totalMigrated=${migrated}, isDone=${isDone}, nextCursor=${continueCursor ?? 'null'}`,
				);
			} else {
				const now = Date.now();
				const shouldLog = isDone || pagesProcessed % pagesInterval === 0 || now - lastPeriodicLogAt >= msInterval;
				if (shouldLog) {
					console.log(
						`[migrateTransactionsToLean] PROGRESS pages=${pagesProcessed} migrated=${migrated} totalSkipped=${totalSkipped} lastPageItems=${page.length} skippedLast=${skipped} nextCursor=${continueCursor ?? 'null'}`,
					);
					lastPeriodicLogAt = now;
				}
			}

			if (isDone) break;
			if (pagesProcessed >= pageBudget) {
				lastCursor = continueCursor;
				break;
			}
			cursor = continueCursor ?? undefined;
			lastCursor = continueCursor;
		}

		const ms = Date.now() - startedAt;
		console.log(
			`[migrateTransactionsToLean] END migrated=${migrated} totalSkipped=${totalSkipped} pages=${pagesProcessed} durationMs=${ms} lastCursor=${lastCursor ?? 'null'}`,
		);
		return { migrated, totalSkipped, pagesProcessed, lastCursor };
	},
});

// --- Cleanup helper: remove migratedToLean field from all transactions ---
export const removeMigratedFlagFromTransactions = internalAction({
	args: {
		batchSize: v.optional(v.number()),
		startCursor: v.optional(v.string()),
		concurrency: v.optional(v.number()),
		maxPages: v.optional(v.number()),
		logEveryPages: v.optional(v.number()),
		logEveryMs: v.optional(v.number()),
		verbose: v.optional(v.boolean()),
	},
	handler: async (
		ctx,
		{ batchSize, startCursor, concurrency, maxPages, logEveryPages, logEveryMs, verbose },
	) => {
		const limit = batchSize ?? 200;
		const parallelism = Math.max(1, Math.min(concurrency ?? 12, 32));
		const pageBudget = maxPages ?? Number.POSITIVE_INFINITY;
		const verboseLogs = !!verbose;
		const pagesInterval = Math.max(1, (logEveryPages ?? 10) | 0);
		const msInterval = Math.max(0, (logEveryMs ?? 5000) | 0);

		let cursor: string | undefined = startCursor ?? undefined;
		let pagesProcessed = 0;
		let removedCount = 0;
		let lastCursor: string | null = null;
		let lastPeriodicLogAt = Date.now();

		const startedAt = Date.now();
		console.log(
			`[removeMigratedFlagFromTransactions] START batchSize=${limit} concurrency=${parallelism} maxPages=${pageBudget === Infinity ? '∞' : pageBudget} startCursor=${startCursor ? 'present' : 'none'} logEveryPages=${pagesInterval} logEveryMs=${msInterval} verbose=${verboseLogs}`,
		);

		while (true) {
			const { page, isDone, continueCursor }: any = await ctx.runQuery(
				internal.transactions.listTransactionPage,
				{ cursor, limit },
			);

			if (!page || page.length === 0) {
				if (isDone) break;
			}

			const work: Array<() => Promise<void>> = [];
			let pageRemoved = 0;
			for (const t of page) {
				if ('migratedToLean' in t) {
					work.push(async () => {
						await ctx.runMutation(internal.transactions.patchTransactionById, {
							id: t._id,
							updates: {},
							remove: ['migratedToLean'],
						});
						pageRemoved += 1;
					});
				}
			}

			if (work.length > 0) {
				for (let i = 0; i < work.length; i += parallelism) {
					await Promise.all(work.slice(i, i + parallelism).map(fn => fn()));
				}
			}

			removedCount += pageRemoved;
			pagesProcessed += 1;

			if (verboseLogs) {
				console.log(
					`Cleanup page processed: items=${page.length}, removedThisPage=${pageRemoved}, totalRemoved=${removedCount}, isDone=${isDone}, nextCursor=${continueCursor ?? 'null'}`,
				);
			} else {
				const now = Date.now();
				const shouldLog = isDone || pagesProcessed % pagesInterval === 0 || now - lastPeriodicLogAt >= msInterval;
				if (shouldLog) {
					console.log(
						`[removeMigratedFlagFromTransactions] PROGRESS pages=${pagesProcessed} removedTotal=${removedCount} removedLast=${pageRemoved} nextCursor=${continueCursor ?? 'null'}`,
					);
					lastPeriodicLogAt = now;
				}
			}

			if (isDone) break;
			if (pagesProcessed >= pageBudget) {
				lastCursor = continueCursor;
				break;
			}
			cursor = continueCursor ?? undefined;
			lastCursor = continueCursor;
		}

		const ms = Date.now() - startedAt;
		console.log(
			`[removeMigratedFlagFromTransactions] END removedTotal=${removedCount} pages=${pagesProcessed} durationMs=${ms} lastCursor=${lastCursor ?? 'null'}`,
		);
		return { removedTotal: removedCount, pagesProcessed, lastCursor };
	},
});
