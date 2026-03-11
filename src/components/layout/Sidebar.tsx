import { useLocation } from "@tanstack/react-router";
import { Link as RouterLink } from "@tanstack/react-router";
import { HomeIcon, DocumentTextIcon, BanknotesIcon, BuildingLibraryIcon } from "@heroicons/react/24/outline";
import {
	HomeIcon as HomeIconSolid,
	DocumentTextIcon as DocumentTextIconSolid,
	BanknotesIcon as BanknotesIconSolid,
	BuildingLibraryIcon as BuildingLibraryIconSolid,
} from "@heroicons/react/24/solid";
import { useTheme } from "~/components/provider/ThemeProvider";
import { SwatchBookIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { UserAvatarCard } from "~/components/ui/UserAvatarCard";
import { MagicLivingLogo } from "~/components/ui/MagicLivingLogo";
import { useState } from "react";

const navItems = [
	{ to: "/", label: "Home", Icon: HomeIcon, ActiveIcon: HomeIconSolid },
	{ to: "/bills", label: "Bills", Icon: DocumentTextIcon, ActiveIcon: DocumentTextIconSolid },
	{ to: "/summaries", label: "Spending", Icon: BanknotesIcon, ActiveIcon: BanknotesIconSolid },
	{ to: "/bank", label: "Bank", Icon: BuildingLibraryIcon, ActiveIcon: BuildingLibraryIconSolid },
] as const;

export function Sidebar() {
	const location = useLocation();
	const [collapsed, setCollapsed] = useState(false);
	const { theme, setTheme, lightThemes, darkThemes } = useTheme();
	const [themeOpen, setThemeOpen] = useState(false);

	const isActive = (to: string) => {
		if (to === "/") return location.pathname === "/";
		return location.pathname.startsWith(to);
	};

	return (
		<aside
			className={`hidden md:flex flex-col h-full relative overflow-hidden bg-card shadow-lg transition-all duration-200 ${
				collapsed ? "w-16" : "w-56"
			}`}
		>
			{/* Logo area */}
			<div className={`relative flex items-center gap-3 px-4 h-16 ${collapsed ? "justify-center" : ""}`}>
				<MagicLivingLogo size={28} className="text-primary shrink-0" />
				{!collapsed && (
					<span className="text-lg truncate">
						<span className="font-extrabold text-primary">Magic</span>
						<span className="font-semibold text-foreground"> Living</span>
					</span>
				)}
			</div>

			{/* Nav */}
			<nav className="relative flex-1 py-4 px-2 flex flex-col gap-1.5">
				{navItems.map(({ to, label, Icon, ActiveIcon }) => {
					const active = isActive(to);
					const IconComponent = active ? ActiveIcon : Icon;
					return (
						<RouterLink
							key={to}
							to={to}
							style={active ? { color: "hsl(var(--primary))", backgroundColor: "hsl(var(--primary) / 0.12)" } : { color: "hsl(var(--muted-foreground))" }}
							onMouseEnter={e => { if (!active) { e.currentTarget.style.color = "hsl(var(--primary))"; e.currentTarget.style.backgroundColor = "hsl(var(--primary) / 0.08)"; }}}
							onMouseLeave={e => { if (!active) { e.currentTarget.style.color = "hsl(var(--muted-foreground))"; e.currentTarget.style.backgroundColor = ""; }}}
							className={[
								"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer",
								active ? "shadow-sm" : "",
								collapsed ? "justify-center px-0" : "",
							].join(" ")}
						>
							<IconComponent className={`w-5 h-5 shrink-0 ${active ? "drop-shadow-sm" : ""}`} />
							{!collapsed && <span>{label}</span>}
						</RouterLink>
					);
				})}
			</nav>

			{/* Bottom — compact row (expanded) / stacked (collapsed) */}
			<div className={`relative mt-auto px-3 py-3 ${collapsed ? "flex flex-col items-center gap-2" : "flex items-center justify-between"}`}>
				<div className={`flex items-center ${collapsed ? "flex-col gap-2" : "gap-1"}`}>
					<div className="relative">
						<button
							onClick={() => setThemeOpen(!themeOpen)}
							style={{ color: "hsl(var(--muted-foreground))" }}
							onMouseEnter={e => { e.currentTarget.style.color = "hsl(var(--primary))"; }}
							onMouseLeave={e => { e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}
							className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
							aria-label="Switch theme"
						>
							<SwatchBookIcon className="w-4 h-4" />
						</button>
						{themeOpen && (
							<>
								<div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />
								<div style={{ backgroundColor: "hsl(var(--popover))" }} className="absolute bottom-full left-0 mb-2 z-50 w-52 rounded-xl p-1.5 shadow-2xl ring-1 ring-white/10 max-h-[60vh] overflow-y-auto">
									<div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Light</div>
									{lightThemes.map(t => {
										const isSelected = t.id === theme.id;
										return (
											<button
												key={t.id}
												onClick={() => { setTheme(t.id); setThemeOpen(false); }}
												className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
													isSelected
														? "bg-primary/10 text-primary"
														: "text-popover-foreground hover:bg-muted/50"
												}`}
											>
												<span
													className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm"
													style={{ backgroundColor: `hsl(${t.colors.primary})` }}
												/>
												<span className="font-medium flex-1 text-left">{t.name}</span>
												{isSelected && <span className="text-primary text-xs">✓</span>}
											</button>
										);
									})}
									<div className="px-2 py-1.5 mt-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Dark</div>
									{darkThemes.map(t => {
										const isSelected = t.id === theme.id;
										return (
											<button
												key={t.id}
												onClick={() => { setTheme(t.id); setThemeOpen(false); }}
												className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
													isSelected
														? "bg-primary/10 text-primary"
														: "text-popover-foreground hover:bg-muted/50"
												}`}
											>
												<span
													className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm"
													style={{ backgroundColor: `hsl(${t.colors.primary})` }}
												/>
												<span className="font-medium flex-1 text-left">{t.name}</span>
												{isSelected && <span className="text-primary text-xs">✓</span>}
											</button>
										);
									})}
								</div>
							</>
						)}
					</div>
					<button
						onClick={() => setCollapsed(!collapsed)}
						style={{ color: "hsl(var(--muted-foreground))" }}
						onMouseEnter={e => { e.currentTarget.style.color = "hsl(var(--primary))"; }}
						onMouseLeave={e => { e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}
						className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
						aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
					>
						{collapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
					</button>
				</div>
				<UserAvatarCard />
			</div>
		</aside>
	);
}
