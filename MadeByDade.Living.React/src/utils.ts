import { z } from "zod";
import { AcquireToken } from "./auth/AuthProvider";

function asCurrency(value: number | undefined) {
	if (value === undefined) {
		return "";
	}

	return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function asOrdinal(value: number | undefined) {
	if (value === undefined) {
		return "";
	}

	if (value <= 0) return value.toString();

	switch (value % 100) {
		case 11:
		case 12:
		case 13:
			return `${value}th`;
	}

	switch (value % 10) {
		case 1:
			return `${value}st`;
		case 2:
			return `${value}nd`;
		case 3:
			return `${value}rd`;
		default:
			return `${value}th`;
	}
}

function asFullDate(value: string | undefined | Date) {
	return asDateString(value, "full", undefined);
}

function asDateString(
	value: string | undefined | Date,
	dateStyle: Intl.DateTimeFormatOptions["dateStyle"],
	timeStyle: Intl.DateTimeFormatOptions["timeStyle"] = undefined
) {
	if (value === undefined) {
		return "";
	}

	const date = value instanceof Date ? value : new Date(value);

	return new Intl.DateTimeFormat("en-US", { dateStyle, timeStyle }).format(date);
}

function asMonthName(value: number) {
	const date = new Date();
	date.setMonth(value);

	return new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
}

function asTruncated(value: string, length: number) {
	if (value.length <= length) {
		return value;
	}

	return `${value.slice(0, length).trim()}...`;
}

export const format = {
	asCurrency,
	asOrdinal,
	asFullDate,
	asDateString,
	asMonthName,
	asTruncated,
};

interface FetchOptions {
	url: string;
	method?: "GET" | "POST" | "PUT" | "DELETE";
	payload?: unknown;

	signal?: AbortSignal;
	acquireToken: AcquireToken;
}

interface FetchAndParseOptions<TSchema extends z.ZodTypeAny> extends FetchOptions {
	schema: TSchema;
}

export async function safeFetchAndParse<TSchema extends z.ZodTypeAny>(options: FetchAndParseOptions<TSchema>): Promise<z.infer<TSchema>> {
	const response = await safeFetch(options);

	const json = await response.json();
	const parseResult = options.schema.safeParse(json);

	if (parseResult.success) return parseResult.data;
	else throw new Error("Unable to parse the API response. Has the schema changed?");
}

export async function safeFetch({ url, method, payload: payload, signal, acquireToken }: FetchOptions): Promise<Response> {
	const token = await acquireToken();

	const response = await fetch(`${import.meta.env.VITE_API_URL}/${url}`, {
		signal,
		method,
		body: payload ? JSON.stringify(payload) : undefined,

		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error("API call failed.");
	}

	return response;
}
