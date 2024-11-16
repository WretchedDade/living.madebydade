import { Separator } from '@radix-ui/react-separator';
import { ToPathOption } from '@tanstack/react-router';
import { Link } from 'lucide-react';
import { Fragment } from 'react/jsx-runtime';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from './ui/breadcrumb';
import { SidebarTrigger } from './ui/sidebar';

interface AppBodyProps {
	breadcrumbs?: {
		label: string;
		to: ToPathOption;
	}[];
	children: React.ReactNode;
}

export function AppBody({ breadcrumbs = [], children }: AppBodyProps) {
	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2">
				<div className="flex items-center gap-2 px-4">
					<SidebarTrigger className="-ml-1" />
					{breadcrumbs.length > 0 && (
						<>
							<Separator orientation="vertical" className="mr-2 h-4" />
							<Breadcrumb>
								<BreadcrumbList>
									{breadcrumbs.map(({ label, to }, index) => (
										<Fragment key={label}>
											{index !== 0 && <BreadcrumbSeparator className="hidden md:block" />}
											<BreadcrumbItem>
												<BreadcrumbLink asChild>
													<Link to={to}>{label}</Link>
												</BreadcrumbLink>
											</BreadcrumbItem>
										</Fragment>
									))}
								</BreadcrumbList>
							</Breadcrumb>
						</>
					)}
				</div>
			</header>
			<div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
		</>
	);
}