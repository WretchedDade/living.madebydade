import { Toaster } from "sonner";
import React from "react";
// To use custom themed toasts, import { showCustomToast } from './SciFiToast';
// Example: showCustomToast({ title: 'Mission Complete', description: 'Your bill was paid!', action: <button>Undo</button> })

export function ToastProvider() {
	return <Toaster position="top-right" theme="dark" closeButton richColors />;
}
