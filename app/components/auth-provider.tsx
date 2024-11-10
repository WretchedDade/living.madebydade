import { ClerkProvider } from '@clerk/tanstack-start';
import { dark } from '@clerk/themes';
import { PropsWithChildren } from 'react';
import { useTheme } from './theme-provider';

export function AuthProvider({ children }: PropsWithChildren<{}>) {
	const { appliedTheme } = useTheme();

	return (
		<ClerkProvider
			appearance={{
				baseTheme: appliedTheme === 'dark' ? dark : undefined,
			}}
		>
			{children}
		</ClerkProvider>
	);
}
