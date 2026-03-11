import React from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";

interface AppLayoutProps {
	children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
	return (
		<div className="h-screen bg-background text-foreground flex">
			{/* Desktop sidebar */}
			<Sidebar />

			{/* Main content area */}
			<div className="flex-1 min-w-0 flex flex-col">
				{/* Mobile header */}
				<MobileHeader />

				{/* Page content — bottom padding for mobile nav */}
				<div className="flex-1 min-h-0 overflow-y-auto pb-16 md:pb-0">
					{children}
				</div>
			</div>

			{/* Mobile bottom nav */}
			<BottomNav />
		</div>
	);
}
