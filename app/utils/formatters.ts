import { Duration, ToHumanDurationOptions } from 'luxon';
import { IsNotNull } from './guards';

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

type Unit = (typeof orderedUnits)[number];
const orderedUnits = [
	'years',
	'quarters',
	'months',
	'weeks',
	'days',
	'hours',
	'minutes',
	'seconds',
	'milliseconds',
] as const;

interface FormatDurationOptions extends ToHumanDurationOptions {
	/**
	 * The units to include in the formatted output. By default, all units are included. The order of units is
	 * determined by the order of this array.
	 */
	units: ReadonlyArray<Unit>;
}

export function formatDuration(
	duration: Duration,
	{ units, listStyle, ...opts }: FormatDurationOptions = { units: orderedUnits },
) {
	if (!duration.isValid) return '';

	const values = units
		.map(unit => {
			const value = duration[unit];
			if (value == null || value === 0) {
				return null;
			}

			return new Intl.NumberFormat('en-US', {
				style: 'unit',
				unitDisplay: 'long',

				minimumFractionDigits: 0,
				maximumFractionDigits: 0,

				...opts,
				unit: unit.slice(0, -1),
			}).format(value);
		})
		.filter(IsNotNull);

	if (values.length === 0) {
		return 'just now';
	}

	const list = new Intl.ListFormat('en-US', {
		type: 'conjunction',
		style: listStyle || 'narrow',
	}).format(values);

	return `${list} ago`;
}
