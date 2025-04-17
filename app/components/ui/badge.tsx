import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '~/lib/utils';

const badgeVariants = cva(
	'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset gap-2 [&_svg]:dark:hidden',
	{
		variants: {
			variant: {
				gray: 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20 [&_svg]:fill-gray-500',
				red: 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20 [&_svg]:fill-red-500',
				yellow: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20 [&_svg]:fill-yellow-500',
				green: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-600 dark:ring-green-400/20 [&_svg]:fill-green-500',
				blue: 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30 [&_svg]:fill-blue-500',
				indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-700/10 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/30 [&_svg]:fill-indigo-500',
				purple: 'bg-purple-50 text-purple-700 ring-purple-700/10 dark:bg-purple-400/10 dark:text-purple-400 dark:ring-purple-400/30 [&_svg]:fill-purple-500',
				pink: 'bg-pink-50 text-pink-700 ring-pink-700/10 dark:bg-pink-400/10 dark:text-pink-400 dark:ring-pink-400/20 [&_svg]:fill-pink-500',
			},
		},
		defaultVariants: {
			variant: 'gray',
		},
	},
);

export interface BadgeProps extends React.ButtonHTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
	asChild?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
	({ className, variant, asChild = false, children, ...props }, ref) => {
		const Comp = asChild ? Slot : 'span';
		return (
			<Comp className={cn(badgeVariants({ variant, className }))} ref={ref} {...props}>
				<svg viewBox="0 0 6 6" aria-hidden="true" className="size-1.5">
					<circle r={3} cx={3} cy={3} />
				</svg>
				{children}
			</Comp>
		);
	},
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
