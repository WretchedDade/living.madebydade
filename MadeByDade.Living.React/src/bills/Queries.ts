import { GetQueryOptionsBuilder } from "../router/utils";
import { BillsSchema } from "./Bill";

export const BillQueryKeys = {
	Bills: ["bills"],
} as const;

export const BuildBillsQueryOptions = GetQueryOptionsBuilder(({ acquireToken }) => ({
	queryKey: BillQueryKeys.Bills,

	queryFn: async ({ signal }) => {
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
