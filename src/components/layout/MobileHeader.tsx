import { useLocation } from "@tanstack/react-router";
import { UserAvatarCard } from "~/components/ui/UserAvatarCard";
import { MagicLivingLogo } from "~/components/ui/MagicLivingLogo";
import { useTheme } from "~/components/provider/ThemeProvider";
import { SwatchBookIcon } from "lucide-react";
import { useState } from "react";

const pageTitles: Record<string, string> = {
	"/": "Home",
	"/bills": "Bills",
	"/summaries": "Spending",
	"/bank": "Bank",
	"/bank/setup": "Link Bank",
};

export function MobileHeader() {
	const location = useLocation();
	const { theme, setTheme, lightThemes, darkThemes } = useTheme();
	const [themeOpen, setThemeOpen] = useState(false);

	const pageTitle =
		pageTitles[location.pathname] ??
		Object.entries(pageTitles).find(([path]) => path !== "/" && location.pathname.startsWith(path))?.[1] ??
		"Magic Living";

	return (
		<header className="md:hidden flex items-center justify-between bg-card/95 backdrop-blur-md shadow-sm px-5 h-14">
			<div className="flex items-center gap-2.5">
				<MagicLivingLogo size={24} className="text-primary shrink-0" />
				<span className="font-bold text-foreground text-base">{pageTitle}</span>
			</div>
			<div className="flex items-center gap-2">
				{/* Theme switcher */}
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
							<div style={{ backgroundColor: "hsl(var(--popover))" }} className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl p-1.5 shadow-xl max-h-[60vh] overflow-y-auto">
								<div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Light</div>
								{lightThemes.map(t => {
									const isSelected = t.id === theme.id;
									return (
										<button
											key={t.id}
											onClick={() => { setTheme(t.id); setThemeOpen(false); }}
											className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
												isSelected
													? "bg-primary/10 text-primary"
													: "text-popover-foreground hover:bg-muted"
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
											className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
												isSelected
													? "bg-primary/10 text-primary"
													: "text-popover-foreground hover:bg-muted"
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
				<UserAvatarCard />
			</div>
		</header>
	);
}
