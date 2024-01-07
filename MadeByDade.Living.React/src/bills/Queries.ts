import { GetQueryOptionsBuilder } from "../router/utils";

import { BillsSchema, type Bill } from "./Bill";
import { BillPaymentsSchema, type BillPayment } from "./BillPayment";

export const BillQueryKeys = {
	Bills: ["Bills"],
	UnpaidBillPayments: ["Unpaid Bill Payments"],
} as const;

export const BuildBillsQueryOptions = GetQueryOptionsBuilder(({ acquireToken }) => ({
	queryKey: BillQueryKeys.Bills,

	queryFn: async ({ signal }): Promise<Bill[]> => {
		const token = await acquireToken();

		const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bills`, {
			signal,
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!response.ok) {
			throw new Error("Unable to fetch bills.");
		}

		const json = await response.json();
		const parseResult = BillsSchema.safeParse(json);

		if (parseResult.success) return parseResult.data;
		else throw new Error("Unable to parse the API response. Has the schema changed?");
	},
}));

export const BuildUnpaidBillPaymentsQueryOptions = GetQueryOptionsBuilder(({ acquireToken }) => ({
	queryKey: BillQueryKeys.UnpaidBillPayments,

	queryFn: async ({ signal }): Promise<BillPayment[]> => {
		const token = await acquireToken();

		const response = await fetch(`${import.meta.env.VITE_API_URL}/api/BillPayments?unpaidOnly=true`, {
			signal,
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!response.ok) {
			throw new Error("Unable to fetch bills.");
		}

		const json = await response.json();
		const parseResult = BillPaymentsSchema.safeParse(json);

		if (parseResult.success) return parseResult.data;
		else throw new Error("Unable to parse the API response. Has the schema changed?");
	},
}));
