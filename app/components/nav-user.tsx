'use client';

import { ClerkLoading, RedirectToSignIn, SignedIn, SignedOut, UserButton } from '@clerk/tanstack-start';
import { AvatarIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { SidebarMenu, SidebarMenuButton, sidebarMenuButtonVariants, SidebarMenuItem } from '~/components/ui/sidebar';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Skeleton } from './ui/skeleton';

export function NavUser() {
	const [signIn, setSignIn] = useState(false);

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					<SignedIn>
						<UserButton
							showName
							appearance={{
								elements: {
									rootBox: 'w-full',
									userButtonTrigger: sidebarMenuButtonVariants({
										size: 'lg',
										className:
											'data-[open=true]:bg-sidebar-accent data-[open=true]:text-sidebar-accent-foreground justify-start',
									}),
									userButtonBox: 'flex-row-reverse',
									avatarBox: 'h-8 w-8 rounded-md',
								},
							}}
						/>
					</SignedIn>
					<SignedOut>
						<SidebarMenuButton size="lg" onClick={() => setSignIn(true)}>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarFallback className="rounded-lg">
									<AvatarIcon className="size-6" />
								</AvatarFallback>
							</Avatar>
							<span>Sign In</span>
						</SidebarMenuButton>
					</SignedOut>
					<ClerkLoading>
						<Skeleton className="h-10 w-full" />
					</ClerkLoading>
				</SidebarMenuItem>
			</SidebarMenu>
			{signIn && <RedirectToSignIn />}
		</>
	);
}
