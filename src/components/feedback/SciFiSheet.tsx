import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "../ui/Button";
import { XMarkIcon } from "@heroicons/react/24/solid";
import React from "react";

interface SciFiSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	children: React.ReactNode;
	showClose?: boolean;
}

export const SciFiSheet: React.FC<SciFiSheetProps> = ({ open, onOpenChange, title, children, showClose = true }) => (
	<Dialog.Root open={open} onOpenChange={onOpenChange}>
		<Dialog.Portal>
			<Dialog.Overlay className="fixed inset-0 z-50 bg-gradient-to-br from-black/70 via-cyan-900/60 to-black/80 backdrop-blur-sm" />
			<Dialog.Content className="fixed right-0 top-0 bottom-0 z-50 w-[92vw] sm:w-[80vw] md:w-[70vw] lg:w-[900px] max-w-full bg-zinc-950 border-l border-cyan-700/40 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right">
				<div className="flex h-full flex-col">
					<div className="relative flex items-center justify-between border-b border-zinc-800 px-6 py-4">
						{title ? (
							<h2 className="text-xl sm:text-2xl font-extrabold text-cyan-300 drop-shadow-[0_0_4px_rgba(34,211,238,0.3)]">
								{title}
							</h2>
						) : (
							<span />
						)}
						{showClose && (
							<Dialog.Close asChild>
								<Button
									circular
									variant="ghost"
									icon
									className="text-cyan-300 hover:text-cyan-400 w-9 h-9 flex items-center justify-center"
									aria-label="Close"
								>
									<XMarkIcon className="w-6 h-6" />
								</Button>
							</Dialog.Close>
						)}
					</div>
					<div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
				</div>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
);
