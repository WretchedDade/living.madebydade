import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AppBody } from '~/components/app-body';
import { Button } from '~/components/ui/button';

export const Route = createFileRoute('/unauthorized')({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	return (
		<AppBody>
			<div className="px-6 sm:px-6 lg:px-8 flex-grow flex items-center justify-center">
				<div className="mx-auto max-w-2xl text-center">
					<h2 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
						Unauthorized!
					</h2>
					<p className="mx-auto mt-6 max-w-xl text-pretty text-lg/8 text-secondary-foreground">
						You tried to access a part of the application that you are not authorized to view.
					</p>
					<div className="mt-6">
						<Button variant="outline" onClick={() => navigate({ to: '/' })}>
							Go Home
						</Button>
					</div>
				</div>
			</div>
		</AppBody>
	);
}
