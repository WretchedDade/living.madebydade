export function validateName({ value }: { value: string }) {
	return !value ? "Please enter a name." : undefined;
}

export function validateAmount({ value }: { value: string }) {
	if (!value) return "Please enter an amount.";
	const numericValue = Number(value.replace(/,/g, ""));
	if (isNaN(numericValue) || numericValue <= 0) return "Amount should be a positive number.";
	return undefined;
}

export function validateDueType({ value }: { value: string }) {
	return !value ? "Please select a due type." : undefined;
}

export function validateDayDue({ value }: { value: string }) {
	const day = Number(value);
	if (!value || isNaN(day) || day < 1 || day > 31) {
		return "Enter a day between 1 and 31.";
	}
	return undefined;
}
