import { httpRouter } from "convex/server";
import { SandboxItemFireWebhookRequestWebhookCodeEnum, SyncUpdatesAvailableWebhook, WebhookType } from "plaid";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { verifyPlaidWebhook } from "./plaidHelpers";

const http = httpRouter();

http.route({
	path: "/plaid",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const body = await request.text();

		const plaidVerification = request.headers.get("Plaid-Verification");
		if (!plaidVerification) {
			return new Response("Missing Plaid-Verification header", { status: 400 });
		}

		const isValid = await verifyPlaidWebhook(body, plaidVerification);
		if (!isValid) {
			return new Response("Invalid webhook signature", { status: 400 });
		}

		const json: SyncUpdatesAvailableWebhook = JSON.parse(body);

		switch (json.webhook_code) {
			case SandboxItemFireWebhookRequestWebhookCodeEnum.SyncUpdatesAvailable:
				await ctx.runAction(internal.transactions.syncTransactionData, { itemId: json.item_id });
				break;
			default:
				console.warn(`Unhandled webhook code: ${json.webhook_code}`);
		}

		return new Response();
	}),
});

// Convex expects the router to be the default export of `convex/http.js`.
export default http;
