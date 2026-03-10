import { ClerkLoaded, SignedIn, SignedOut, useAuth } from "@clerk/tanstack-react-start";
import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet, createRootRouteWithContext, useRouteContext } from "@tanstack/react-router";
import { HeadContent, Scripts } from "@tanstack/react-router";
import { Authenticated, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import * as React from "react";
import { AuthProvider } from "~/components/provider/AuthProvider";

import { DefaultCatchBoundary } from "~/components/feedback/DefaultCatchBoundary";
import { NotFound } from "~/components/feedback/NotFound";
import { NotSignedIn } from "~/components/feedback/NotSignedIn";
import { ThemeProvider } from "~/components/provider/ThemeProvider";
import { ToastProvider } from "~/components/provider/ToastProvider";

import initThemeScript from "~/scripts/init-theme?url";
import appCss from "~/styles/app.css?url";

type RouterContext = {
	queryClient: QueryClient;
	convexClient: ConvexReactClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "icon", href: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
			{ rel: "shortcut icon", href: "/favicon.ico" },
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
			{ rel: "manifest", href: "/site.webmanifest" },
		],
		scripts: [
			{ src: initThemeScript },
			...(import.meta.env.DEV
				? [
						{
							type: "module",
							children: `import RefreshRuntime from "/_build/@react-refresh";
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type`,
						},
					]
				: []),
		],
	}),
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
		from: "__root__",
	});

	return (
		<ThemeProvider>
			<AuthProvider>
				<ConvexProviderWithClerk useAuth={useAuth} client={convexClient}>
					<RootDocument>
						<ClerkLoaded>
							<SignedIn>
								<Authenticated>
									<Outlet />
									<ToastProvider />
								</Authenticated>
							</SignedIn>
						</ClerkLoaded>
						<SignedOut>
							<NotSignedIn />
						</SignedOut>
					</RootDocument>
				</ConvexProviderWithClerk>
			</AuthProvider>
		</ThemeProvider>
	);
}

const TanStackRouterDevtools =
	process.env.NODE_ENV === "production"
		? () => null // Render nothing in production
		: React.lazy(() =>
				// Lazy load in development
				import("@tanstack/react-router-devtools").then(res => ({
					default: res.TanStackRouterDevtools,
					// For Embedded Mode
					// default: res.TanStackRouterDevtoolsPanel
				})),
			);

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html className="bg-background text-foreground">
			<head>
				<HeadContent />
			</head>
			<body className="lg:max-h-svh lg:overflow-hidden">
				{children}
				<React.Suspense>
					{/* <TanStackRouterDevtools position="bottom-right" /> */}
					<ReactQueryDevtools buttonPosition="bottom-right" />
				</React.Suspense>
				<Scripts />
			</body>
		</html>
	);
}
