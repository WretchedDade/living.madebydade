import { ClerkProvider } from "@clerk/tanstack-react-start";
import { dark } from "@clerk/themes";
import { PropsWithChildren } from "react";

export function AuthProvider({ children }: PropsWithChildren<{}>) {
	return (
		<ClerkProvider
			appearance={{
				baseTheme: dark,
			}}
		>
			{children}
		</ClerkProvider>
	);
}
