import React from "react";
import { UserAvatarCard } from "~/components/ui/UserAvatarCard";
import { useAuth } from "@clerk/tanstack-react-start";
import { useTheme } from "~/components/provider/ThemeProvider";
import { SwatchBookIcon } from "lucide-react";

interface AppLayoutProps {
	children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
	return (
		<div className="h-screen bg-background text-foreground flex flex-col">
			<AppHeader />
			<div className="flex-1 min-h-0 flex flex-col">{children}</div>
		</div>
	);
}

function AppHeader() {
	const { isSignedIn } = useAuth();
	return (
		<header className="bg-card text-card-foreground py-4 px-4 sm:px-6 flex flex-col sm:flex-row items-center sm:justify-between shadow-lg border-b border-border gap-4">
			<div className="w-full flex flex-col sm:flex-row gap-4 sm:justify-between">
				<div className="flex flex-row items-center gap-3">
					<Logo />
					<AppTitle />
				</div>
				<div className="flex flex-row items-center gap-3 w-full justify-between sm:w-auto relative">
					<ThemeSwitcher />
					<UserAvatarCard />
				</div>
			</div>
		</header>
	);
}

function Logo() {
	return (
		<img
			src="/favicon.svg"
			alt="Magic Living"
			className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted object-cover shadow-md"
		/>
	);
}

function AppTitle() {
	return (
		<h1 className="text-xl sm:text-2xl font-bold tracking-wide text-left w-full sm:w-auto m-0">
			<a
				href="/"
				className="text-primary cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-ring hover:text-primary/80 transition-colors"
				aria-label="Go to Home"
				tabIndex={0}
			>
				Magic Living
			</a>
		</h1>
	);
}

function ThemeSwitcher() {
	const { theme, setTheme, availableThemes } = useTheme();
	const [open, setOpen] = React.useState(false);

	return (
		<div className="relative">
			<button
				onClick={() => setOpen(!open)}
				className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
				aria-label="Switch theme"
			>
				<SwatchBookIcon className="w-4 h-4" />
				<span className="hidden sm:inline">{theme.name}</span>
			</button>
			{open && (
				<>
					<div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
					<div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg">
						{availableThemes.map(t => (
							<button
								key={t.id}
								onClick={() => {
									setTheme(t.id);
									setOpen(false);
								}}
								className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer ${
									t.id === theme.id
										? "bg-primary/10 text-primary"
										: "text-popover-foreground hover:bg-muted"
								}`}
							>
								<span
									className="h-4 w-4 rounded-full border border-border"
									style={{ backgroundColor: `hsl(${t.colors.primary})` }}
								/>
								<div className="text-left">
									<div className="font-medium">{t.name}</div>
									<div className="text-xs text-muted-foreground">{t.description}</div>
								</div>
							</button>
						))}
					</div>
				</>
			)}
		</div>
	);
}
