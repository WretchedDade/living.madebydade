import * as RadixDialog from "@radix-ui/react-dialog";
import { Button } from "../ui/Button";
import { XMarkIcon } from "@heroicons/react/24/solid";
import React from "react";

interface SheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	children: React.ReactNode;
	showClose?: boolean;
}

export const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, title, children, showClose = true }) => (
	<RadixDialog.Root open={open} onOpenChange={onOpenChange}>
		<RadixDialog.Portal>
			<RadixDialog.Overlay className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm" />
			<RadixDialog.Content className="fixed right-0 top-0 bottom-0 z-50 w-[92vw] sm:w-[80vw] md:w-[70vw] lg:w-[900px] max-w-full bg-card shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right">
				<div className="flex h-full flex-col">
					<div className="relative flex items-center justify-between px-6 py-4">
						{title ? (
							<h2 className="text-xl font-bold text-foreground">
								{title}
							</h2>
						) : (
							<span />
						)}
						{showClose && (
							<RadixDialog.Close asChild>
								<Button
									circular
									variant="ghost"
									icon
									className="text-muted-foreground hover:text-foreground w-8 h-8 flex items-center justify-center"
									aria-label="Close"
								>
									<XMarkIcon className="w-5 h-5" />
								</Button>
							</RadixDialog.Close>
						)}
					</div>
					<div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
				</div>
			</RadixDialog.Content>
		</RadixDialog.Portal>
	</RadixDialog.Root>
);
