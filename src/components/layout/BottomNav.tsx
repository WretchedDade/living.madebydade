import { useLocation } from "@tanstack/react-router";
import { Link as RouterLink } from "@tanstack/react-router";
import { HomeIcon, DocumentTextIcon, BanknotesIcon, BuildingLibraryIcon, CalculatorIcon } from "@heroicons/react/24/outline";
import {
	HomeIcon as HomeIconSolid,
	DocumentTextIcon as DocumentTextIconSolid,
	BanknotesIcon as BanknotesIconSolid,
	BuildingLibraryIcon as BuildingLibraryIconSolid,
	CalculatorIcon as CalculatorIconSolid,
} from "@heroicons/react/24/solid";

const navItems = [
	{ to: "/", label: "Home", Icon: HomeIcon, ActiveIcon: HomeIconSolid },
	{ to: "/bills", label: "Bills", Icon: DocumentTextIcon, ActiveIcon: DocumentTextIconSolid },
	{ to: "/summaries", label: "Spending", Icon: BanknotesIcon, ActiveIcon: BanknotesIconSolid },
	{ to: "/budget", label: "Budget", Icon: CalculatorIcon, ActiveIcon: CalculatorIconSolid },
	{ to: "/bank", label: "Bank", Icon: BuildingLibraryIcon, ActiveIcon: BuildingLibraryIconSolid },
] as const;

export function BottomNav() {
	const location = useLocation();

	const isActive = (to: string) => {
		if (to === "/") return location.pathname === "/";
		return location.pathname.startsWith(to);
	};

	return (
		<nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md shadow-[0_-2px_12px_rgba(0,0,0,0.12)] safe-area-bottom">
			<div className="flex items-center justify-around h-16">
				{navItems.map(({ to, label, Icon, ActiveIcon }) => {
					const active = isActive(to);
					const IconComponent = active ? ActiveIcon : Icon;
					return (
						<RouterLink
							key={to}
							to={to}
							style={{ color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
							onMouseEnter={e => { if (!active) e.currentTarget.style.color = "hsl(var(--primary))"; }}
							onMouseLeave={e => { if (!active) e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }}
							className="flex flex-col items-center justify-center gap-1 min-w-[64px] h-full px-1 py-1 transition-colors"
						>
							<IconComponent className={`w-5 h-5 ${active ? "drop-shadow-sm" : ""}`} />
							<span className={`text-[10px] leading-tight ${active ? "font-bold" : "font-medium"}`}>{label}</span>
						</RouterLink>
					);
				})}
			</div>
		</nav>
	);
}
