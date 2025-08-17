import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "../ui/Button";
import { XMarkIcon } from "@heroicons/react/24/solid";
import React from "react";

interface SciFiDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	children: React.ReactNode;
	showClose?: boolean;
}

export const SciFiDialog: React.FC<SciFiDialogProps> = ({ open, onOpenChange, title, children, showClose = true }) => (
	<Dialog.Root open={open} onOpenChange={onOpenChange}>
		<Dialog.Portal>
			<Dialog.Overlay className="fixed inset-0 z-50 bg-gradient-to-br from-black/70 via-cyan-900/60 to-black/80 backdrop-blur-sm" />
			<Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-cyan-700/40">
				{showClose && (
					<Dialog.Close asChild>
						<Button
							circular
							variant="ghost"
							icon
							className="absolute top-3 right-3 text-cyan-300 hover:text-cyan-400 w-9 h-9 flex items-center justify-center"
							aria-label="Close"
						>
							<XMarkIcon className="w-6 h-6" />
						</Button>
					</Dialog.Close>
				)}
				{title && (
					<h2 className="text-2xl font-extrabold text-cyan-300 mb-6 drop-shadow-[0_0_4px_rgba(34,211,238,0.3)]">
						{title}
					</h2>
				)}
				<div className="mb-2">{children}</div>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
);
