import { RedirectToSignIn } from "@clerk/tanstack-react-start";
import { AppLayout } from "~/components/layout/AppLayout";
import { Button } from "~/components/ui/Button";
import { useState } from "react";

export function NotSignedIn() {
	const [signIn, setSignIn] = useState(false);

	return (
		<AppLayout>
			<main className="flex-1 p-4 sm:p-10 flex flex-col items-center justify-center">
				<div className="bg-card rounded-xl shadow-lg p-4 sm:p-8 w-full max-w-2xl text-center border border-border">
					<h2 className="text-2xl sm:text-3xl font-bold text-primary mb-2 sm:mb-4">You are not signed in</h2>
					<p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
						To use the app, please sign in. Only previously invited users can sign in.
					</p>
					<div className="mt-4 sm:mt-8">
						<Button variant="outline" onClick={() => setSignIn(true)}>
							Sign In
						</Button>
					</div>
				</div>
			</main>
			{signIn && <RedirectToSignIn />}
		</AppLayout>
	);
}
