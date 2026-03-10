import React from "react";

export function FormError({ error }: { error?: string }) {
	if (!error) return null;
	return <span className="text-warning text-sm font-normal mt-2 block">{error}</span>;
}
