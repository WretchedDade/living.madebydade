import { RedirectToSignIn } from '@clerk/tanstack-start';
import { useState } from 'react';
import { AppBody } from './app-body';
import { Button } from './ui/button';

export function NotSignedIn() {
	const [signIn, setSignIn] = useState(false);

	return (
		<AppBody>
			<div className="px-6 sm:px-6 lg:px-8 flex-grow flex items-center justify-center">
				<div className="mx-auto max-w-2xl text-center">
					<h2 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
						You are not signed in
					</h2>
					<p className="mx-auto mt-6 max-w-xl text-pretty text-lg/8 text-secondary-foreground">
						To use the app, please sign in. Only previously invited users can sign in.
					</p>
					<div className="mt-6">
						<Button variant="outline" onClick={() => setSignIn(true)}>
							Sign In
						</Button>
					</div>
				</div>
			</div>
			{signIn && <RedirectToSignIn />}
		</AppBody>
	);
}
