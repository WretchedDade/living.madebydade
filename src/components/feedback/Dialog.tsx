import * as RadixDialog from "@radix-ui/react-dialog";
import { Button } from "../ui/Button";
import { XMarkIcon } from "@heroicons/react/24/solid";
import React from "react";

interface DialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	children: React.ReactNode;
	showClose?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, title, children, showClose = true }) => (
	<RadixDialog.Root open={open} onOpenChange={onOpenChange}>
		<RadixDialog.Portal>
			<RadixDialog.Overlay className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm" />
			<RadixDialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-xl shadow-xl p-6 w-[calc(100vw-2rem)] max-w-lg">
				{showClose && (
					<RadixDialog.Close asChild>
						<Button
							circular
							variant="ghost"
							icon
							className="absolute top-3 right-3 text-muted-foreground hover:text-foreground w-8 h-8 flex items-center justify-center"
							aria-label="Close"
						>
							<XMarkIcon className="w-5 h-5" />
						</Button>
					</RadixDialog.Close>
				)}
				{title && (
					<h2 className="text-xl font-bold text-foreground mb-4">
						{title}
					</h2>
				)}
				<div>{children}</div>
			</RadixDialog.Content>
		</RadixDialog.Portal>
	</RadixDialog.Root>
);
