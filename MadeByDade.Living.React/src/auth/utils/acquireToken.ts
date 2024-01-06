import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { IMsalContext } from "@azure/msal-react";

export async function acquireToken(msal: IMsalContext, scopes: Array<string>): Promise<string | undefined> {
	try {
		const response = await msal.instance.acquireTokenSilent({ scopes, account: msal.accounts[0] });
		return response.accessToken;
	} catch (error) {
		if (error instanceof InteractionRequiredAuthError) {
			msal.instance.acquireTokenPopup({ scopes, account: msal.accounts[0] }).then((response) => {
				return response.accessToken;
			});
		} else {
			throw error;
		}
	}
}
