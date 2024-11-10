import { ClerkLoaded, SignedIn, SignedOut, useAuth } from '@clerk/tanstack-start';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, ScrollRestoration, createRootRouteWithContext, useRouteContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Body, Head, Html, Meta, Scripts } from '@tanstack/start';
import { Authenticated, ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import * as React from 'react';
import { AppSidebar } from '~/components/app-sidebar';
import { AuthProvider } from '~/components/auth-provider';

import { DefaultCatchBoundary } from '~/components/default-catch-boundary';
import { NotFound } from '~/components/not-found';
import { ThemeProvider } from '~/components/theme-provider';
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar';

import initThemeScript from '~/scripts/init-theme?url';
import appCss from '~/styles/app.css?url';

type RouterContext = {
	queryClient: QueryClient;
	convexClient: ConvexReactClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
	meta: () => [
		{
			charSet: 'utf-8',
		},
		{
			name: 'viewport',
			content: 'width=device-width, initial-scale=1',
		},
	],
	links: () => [
		{ rel: 'stylesheet', href: appCss },
		{
			rel: 'apple-touch-icon',
			sizes: '180x180',
			href: '/apple-touch-icon.png',
		},
		{
			rel: 'icon',
			type: 'image/png',
			sizes: '32x32',
			href: '/favicon-32x32.png',
		},
		{
			rel: 'icon',
			type: 'image/png',
			sizes: '16x16',
			href: '/favicon-16x16.png',
		},
		{ rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
		{ rel: 'icon', href: '/favicon.ico' },
	],
	scripts: () => [{ src: initThemeScript }],
	errorComponent: props => {
		return (
			<RootDocument>
				<DefaultCatchBoundary {...props} />
			</RootDocument>
		);
	},
	notFoundComponent: () => <NotFound />,
	component: RootComponent,
});

function RootComponent() {
	const { convexClient } = useRouteContext({
		from: '__root__',
	});

	return (
		<ThemeProvider storageKey="living-madebydade-theme">
			<AuthProvider>
				<ConvexProviderWithClerk useAuth={useAuth} client={convexClient}>
					<RootDocument>
						<SidebarProvider>
							<AppSidebar />
							<SidebarInset>
								<ClerkLoaded>
									<SignedIn>
										<Authenticated>
											<Outlet />
										</Authenticated>
									</SignedIn>
								</ClerkLoaded>
								<SignedOut>You are not signed in</SignedOut>
							</SidebarInset>
						</SidebarProvider>
					</RootDocument>
				</ConvexProviderWithClerk>
			</AuthProvider>
		</ThemeProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<Html>
			<Head>
				<Meta />
			</Head>
			<Body>
				{children}
				<ScrollRestoration />
				<TanStackRouterDevtools position="bottom-right" />
				<ReactQueryDevtools buttonPosition="top-right" />
				<Scripts />
			</Body>
		</Html>
	);
}
