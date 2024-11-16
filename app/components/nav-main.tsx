'use client';

import { Link } from '@tanstack/react-router';
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '~/components/ui/sidebar';

export function NavMain() {
	return (
		<SidebarGroup>
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton asChild tooltip="Dashboard">
						<Link to="/">Dashboard</Link>
					</SidebarMenuButton>
					<SidebarMenuButton asChild tooltip="Bills">
						<Link to="/bills">Bills</Link>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}
