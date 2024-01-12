import { AcquireToken } from "../../auth/AuthProvider";
import { Page, PageBaseSchema, safeFetchAndParse } from "../../utils";

import { BillSchema, BillsSchema, type Bill } from "./Bill";
import { BillPaymentsSchema, type BillPayment } from "./BillPayment";

export const BillQueryKeys = {
	Bills: ["Bills"],

	Bill: (billId: number) => ["Bill", billId] as const,

	UnpaidBillPayments: ["Bill Payments", "Unpaid"] as const,
	BillPaymentsPage: (billId: number, page: number, pageSize: number) => ["Bill Payments", billId, page, pageSize] as const,
} as const;

export async function GetBills(acquireToken: AcquireToken, signal: AbortSignal): Promise<Bill[]> {
	return await safeFetchAndParse({ url: "api/Bills", schema: BillsSchema, signal, acquireToken });
}

export async function GetBill(billId: number, acquireToken: AcquireToken, signal: AbortSignal): Promise<Bill> {
	return await safeFetchAndParse({ url: `api/Bills/${billId}`, schema: BillSchema, signal, acquireToken });
}

export async function GetUnpaidBillPayments(acquireToken: AcquireToken, signal: AbortSignal): Promise<BillPayment[]> {
	const queryParams = new URLSearchParams({
		unpaidOnly: "true",
	});

	const url = `api/BillPayments?${queryParams.toString()}`;

	return await safeFetchAndParse({ url, schema: BillPaymentsSchema, signal, acquireToken });
}

export async function GetBillPaymentsPage(
	billId: number,
	page: number,
	pageSize: number,
	acquireToken: AcquireToken,
	signal: AbortSignal
): Promise<Page<BillPayment>> {
	const queryParams = new URLSearchParams({
		billId: billId.toString(),
		unpaidOnly: "false",
		page: page.toString(),
		pageSize: pageSize.toString(),
	});

	const url = `api/BillPayments?${queryParams.toString()}`;

	return await safeFetchAndParse({ url, schema: PageBaseSchema.extend({ items: BillPaymentsSchema }), signal, acquireToken });
}
