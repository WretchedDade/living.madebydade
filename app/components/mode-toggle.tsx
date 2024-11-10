import { ChevronsUpDownIcon, MoonIcon, SunIcon } from 'lucide-react';

import { useTheme } from '@/components/theme-provider';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '~/hooks/use-mobile';
import { SidebarMenuButton } from './ui/sidebar';

export function ModeToggle() {
	const isMobile = useIsMobile();
	const { theme, setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuButton
					size="lg"
					className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
				>
					<div className="flex flex-1 gap-4 text-left text-sm leading-tight">
						<SunIcon className="h-[1.2rem] w-[1.2rem] block dark:hidden" />
						<MoonIcon className="h-[1.2rem] w-[1.2rem] hidden dark:block" />
						<span>Theme Preference</span>
					</div>

					<ChevronsUpDownIcon className="ml-auto size-4" />
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
				side={isMobile ? 'bottom' : 'right'}
				align="end"
				sideOffset={4}
			>
				<DropdownMenuGroup>
					<DropdownMenuLabel>Theme Preferences</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
