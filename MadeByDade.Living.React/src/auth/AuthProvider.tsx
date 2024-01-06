import { PropsWithChildren, createContext, useCallback, useEffect, useState } from "react";
import z from "zod";

import { InteractionStatus, InteractionType } from "@azure/msal-browser";
import { useMsal, useMsalAuthentication } from "@azure/msal-react";

import { acquireToken } from "./utils/acquireToken";

import { Authenticating } from "./components/Authenticating";
import { AuthenticationError } from "./components/AuthenticationError";

export interface AuthContext {
	redirect: string | undefined;

	isAuthenticated: boolean;

	hasRole: (role: string) => void;
	acquireToken: (scopes?: string[]) => Promise<string | undefined>;
}

export const AuthContext = createContext<AuthContext>({
	redirect: undefined,

	isAuthenticated: false,

	hasRole: () => false,
	acquireToken: () => Promise.resolve(undefined),
});

export const Roles = {
	Access: "Access",
} as const;

// eslint-disable-next-line react-refresh/only-export-components
export const Scopes = [`api://${import.meta.env.VITE_AAD_CLIENT_ID}/access_as_user`];

export function AuthProvider({ children }: PropsWithChildren<object>) {
	const [roles, setRoles] = useState<Array<string>>([]);

	const msal = useMsal();

	const { result, error } = useMsalAuthentication(InteractionType.Redirect, {
		scopes: Scopes,
		redirectUri: `${window.location.origin}/Redirect`,
		state: window.location.pathname,
	});

	useEffect(() => {
		if (msal.accounts.length > 0 && msal.accounts[0].idTokenClaims) {
			setRoles(IdTokenClaimsSchema.parse(msal.accounts[0].idTokenClaims).roles ?? []);
		}
	}, [setRoles, msal.accounts]);

	const hasRole = useCallback((role: string) => roles.includes(role), [roles]);

	const authContext: AuthContext = {
		redirect: result?.state,

		isAuthenticated: msal.accounts.length > 0,

		hasRole,
		acquireToken: useCallback((scopes: Array<string> = Scopes) => acquireToken(msal, scopes), [msal]),
	};

	if (msal.inProgress !== InteractionStatus.None) {
		return <Authenticating />;
	}

	if (error) {
		console.error(error);
		return <AuthenticationError />;
	}

	if (!roles.includes("Access")) return <div>Access Denied</div>;

	return <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>;
}

const IdTokenClaimsSchema = z.object({
	roles: z.array(z.string()).optional(),
});
