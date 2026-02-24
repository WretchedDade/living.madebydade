// Utility to format bill field values for display

import { formatCurrency, formatOrdinal } from "~/utils/formatters";

export function formatBillFieldValue(field: string, value: string | number | boolean | undefined | null) {
	if (field === "amount") {
		const num = typeof value === "number" ? value : Number(value?.toString().replace(/,/g, ""));
		return isNaN(num) ? String(value) : formatCurrency(num / 100);
	}
	if (field === "dayDue") {
		const num = typeof value === "number" ? value : Number(value);
		return isNaN(num) ? value : formatOrdinal(num);
	}
	if (field === "isAutoPay") {
		if (typeof value === "boolean") return value ? "Yes" : "No";
		if (value === "true" || value === "1") return "Yes";
		if (value === "false" || value === "0") return "No";
		return String(value);
	}
	return String(value);
}
