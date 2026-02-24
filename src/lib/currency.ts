/** Strip commas and convert a dollar string to integer cents */
export function dollarsToCents(value: string): number {
	return Math.round(parseFloat(value.replace(/,/g, "")) * 100);
}

/** Convert integer cents to a dollar amount (number) */
export function centsToDollars(cents: number): number {
	return cents / 100;
}

/** Convert integer cents to a formatted dollar display string (e.g. "12.00") */
export function formatCentsAsDollars(cents: number): string {
	return (cents / 100).toFixed(2);
}
