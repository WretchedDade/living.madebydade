import { AcquireToken } from "../../auth/AuthProvider";
import { safeFetchAndParse } from "../../utils";

import { BillSchema, BillsSchema, type Bill } from "./Bill";
import { BillPaymentsSchema, type BillPayment } from "./BillPayment";

export const BillQueryKeys = {
	Bills: ["Bills"],

	Bill: (billId: number) => ["Bill", billId] as const,

	UnpaidBillPayments: ["Unpaid Bill Payments"],
} as const;

export async function GetBills(acquireToken: AcquireToken, signal: AbortSignal): Promise<Bill[]> {
	return await safeFetchAndParse({ url: "api/Bills", schema: BillsSchema, signal, acquireToken });
}

export async function GetBill(billId: number, acquireToken: AcquireToken, signal: AbortSignal): Promise<Bill> {
	return await safeFetchAndParse({ url: `api/Bills/${billId}`, schema: BillSchema, signal, acquireToken });
}

export async function GetUnpaidBillPayments(acquireToken: AcquireToken, signal: AbortSignal): Promise<BillPayment[]> {
	return await safeFetchAndParse({ url: "api/BillPayments?unpaidOnly=true", schema: BillPaymentsSchema, signal, acquireToken });
}
