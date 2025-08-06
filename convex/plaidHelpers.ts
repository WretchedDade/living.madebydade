import { GenericActionCtx } from 'convex/server';
import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products, RemovedTransaction, Transaction, TransactionsSyncResponse } from 'plaid';
import { internal } from './_generated/api';
import { PlaidTransaction } from './transactionSchema';

export function getPlaidConfig() {
    return {
        clientId: process.env.PLAID_CLIENT_ID,
        clientSecret: process.env.PLAID_SECRET,

        env: process.env.PLAID_ENV as keyof typeof PlaidEnvironments,
        redirectUri: process.env.PLAID_REDIRECT_URI,

        clientName: 'The Living Ledger | MadeByDade',

        language: 'en',
        countryCodes: [CountryCode.Us],
        products: [Products.Transactions],

        webhook: `${process.env.CONVEX_SITE_URL}/plaid`,

        transactions: {
            days_requested: 730
        },
    }
}

export function getPlaidApi() {
    const { clientId, clientSecret, env } = getPlaidConfig();

    return new PlaidApi(new Configuration({
        basePath: PlaidEnvironments[env],
        baseOptions: {
            headers: {
                'PLAID-CLIENT-ID': clientId,
                'PLAID-SECRET': clientSecret,
                'Plaid-Version': '2020-09-14',
            },
        },
    }));
}

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
                `New Totals | Added: ${transactions.added.length} Modified: ${transactions.modified.length} Removed: ${transactions.removed.length}`
            );
            console.log(`Has more: ${response.has_more}`);

        } while (response.has_more);

        return { transactions, cursor };
    } catch (error) {
        console.error("Error fetching transactions:", error);

        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait a second before retrying

        return fetchNewTransactionSyncData(accessToken, initialCursor, retriesLeft - 1);
    }
};

export function toTransactionSchema(transaction: Transaction): PlaidTransaction {

    const location: PlaidTransaction["location"] = {
        lat: transaction.location.lat ?? undefined,
        lon: transaction.location.lon ?? undefined,
        address: transaction.location.address ?? undefined,
        city: transaction.location.city ?? undefined,
        region: transaction.location.region ?? undefined,
        postalCode: transaction.location.postal_code ?? undefined,
        country: transaction.location.country ?? undefined,
    }

    const paymentMeta: PlaidTransaction["paymentMeta"] = {
        byOrderOf: transaction.payment_meta?.by_order_of ?? undefined,
        payee: transaction.payment_meta?.payee ?? undefined,
        payer: transaction.payment_meta?.payer ?? undefined,
        paymentMethod: transaction.payment_meta?.payment_method ?? undefined,
        referenceNumber: transaction.payment_meta?.reference_number ?? undefined,
        paymentProcessor: transaction.payment_meta?.payment_processor ?? undefined,
        ppdId: transaction.payment_meta?.ppd_id ?? undefined,
        reason: transaction.payment_meta?.reason ?? undefined,
    };

    const personalFinanceCategory: PlaidTransaction["personalFinanceCategory"] = transaction.personal_finance_category
        ? {
            primary: transaction.personal_finance_category.primary,
            detailed: transaction.personal_finance_category.detailed,
            confidenceLevel: transaction.personal_finance_category.confidence_level ?? undefined,
        } : undefined;

    const businessFinanceCategory: PlaidTransaction["businessFinanceCategory"] = transaction.business_finance_category
        ? {
            primary: transaction.business_finance_category.primary,
            detailed: transaction.business_finance_category.detailed,
        } : undefined;

    const counterparties: PlaidTransaction["counterparties"] = transaction.counterparties
        ? transaction.counterparties.map((counterparty) => ({
            name: counterparty.name ?? undefined,
            type: counterparty.type ?? undefined,
            logoUrl: counterparty.logo_url ?? undefined,
            website: counterparty.website ?? undefined,
            entityId: counterparty.entity_id ?? undefined,
        })) : [];

    return {
        transactionId: transaction.transaction_id,
        accountId: transaction.account_id,
        date: transaction.date,
        authorizedDate: transaction.authorized_date,
        amount: transaction.amount,
        isoCurrencyCode: transaction.iso_currency_code,
        checkNumber: transaction.check_number ?? null,
        accountOwner: transaction.account_owner ?? null,
        name: transaction.name,
        merchantName: transaction.merchant_name ?? null,
        authorizedDatetime: transaction.authorized_datetime ?? null,
        originalDescription: transaction.original_description ?? null,
        unofficialCurrencyCode: transaction.unofficial_currency_code ?? null,
        datetime: transaction.datetime ?? null,
        paymentChannel: transaction.payment_channel ?? null,
        pending: transaction.pending,
        pendingTransactionId: transaction.pending_transaction_id ?? null,
        logoUrl: transaction.logo_url ?? null,
        website: transaction.website ?? null,
        transactionCode: `${transaction.transaction_code}`,
        merchantEntityId: transaction.merchant_entity_id ?? null,
        personalFinanceCategoryIconUrl: transaction.personal_finance_category_icon_url ?? undefined,

        location,
        paymentMeta,
        personalFinanceCategory,
        businessFinanceCategory,
        counterparties,
    };
}