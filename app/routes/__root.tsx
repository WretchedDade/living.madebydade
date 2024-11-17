import { ClerkLoaded, SignedIn, SignedOut, useAuth } from '@clerk/tanstack-start';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, ScrollRestoration, createRootRouteWithContext, useRouteContext } from '@tanstack/react-router';
import { Meta, Scripts } from '@tanstack/start';
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
	meta: () => [],
	links: () => [{ rel: 'stylesheet', href: appCss }],
	scripts: () => [
		{ src: initThemeScript },
		...(import.meta.env.DEV
			? [
					{
						type: 'module',
						children: `import RefreshRuntime from "/_build/@react-refresh";
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type`,
					},
				]
			: []),
	],
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

const TanStackRouterDevtools =
	process.env.NODE_ENV === 'production'
		? () => null // Render nothing in production
		: React.lazy(() =>
				// Lazy load in development
				import('@tanstack/router-devtools').then(res => ({
					default: res.TanStackRouterDevtools,
					// For Embedded Mode
					// default: res.TanStackRouterDevtoolsPanel
				})),
			);

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html>
			<head>
				<Meta />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<React.Suspense>
					<TanStackRouterDevtools position="bottom-right" />
				</React.Suspense>
				<ReactQueryDevtools buttonPosition="top-right" />
				<Scripts />
			</body>
		</html>
	);
}
