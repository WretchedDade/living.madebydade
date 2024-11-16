export function formatCurrency(value: number) {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',

		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
		currencySign: 'standard',
	});

	return formatter.format(value);
}

const suffixes: Record<Intl.LDMLPluralRule, string> = {
	one: 'st',
	two: 'nd',
	few: 'rd',
	other: 'th',
	many: 'th',
	zero: 'th',
};

export function formatOrdinal(value: number | null | undefined) {
	if (value == null) {
		return '';
	}

	const rules = new Intl.PluralRules('en', { type: 'ordinal' });

	const category = rules.select(value);
	const suffix = suffixes[category];

	return `${value}${suffix}`;
}
