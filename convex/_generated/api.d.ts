/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as accounts from "../accounts.js";
import type * as activity from "../activity.js";
import type * as activitySchema from "../activitySchema.js";
import type * as billPayments from "../billPayments.js";
import type * as bills from "../bills.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as plaidHelpers from "../plaidHelpers.js";
import type * as plaidItems from "../plaidItems.js";
import type * as transactionSchema from "../transactionSchema.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  activity: typeof activity;
  activitySchema: typeof activitySchema;
  billPayments: typeof billPayments;
  bills: typeof bills;
  crons: typeof crons;
  http: typeof http;
  plaidHelpers: typeof plaidHelpers;
  plaidItems: typeof plaidItems;
  transactionSchema: typeof transactionSchema;
  transactions: typeof transactions;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
