import { Toaster } from "sonner";
import React from "react";

export function ToastProvider() {
	return <Toaster position="top-right" theme="dark" closeButton richColors />;
}
