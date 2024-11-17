'use client';

import { Link } from '@tanstack/react-router';
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '~/components/ui/sidebar';
import { useUserPermissions } from '~/hooks/use-user-metadata';

export function NavMain() {
	const permissions = useUserPermissions();

	return (
		<SidebarGroup>
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton asChild tooltip="Dashboard">
						<Link to="/">Dashboard</Link>
					</SidebarMenuButton>
					{permissions.bills && (
						<SidebarMenuButton asChild tooltip="Bills">
							<Link to="/bills">Bills</Link>
						</SidebarMenuButton>
					)}
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}
