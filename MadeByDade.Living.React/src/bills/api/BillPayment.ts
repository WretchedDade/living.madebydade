import { z } from "zod";
import { BillSchema } from "./Bill";

export const BillPaymentSchema = z.object({
	id: z.number(),
	billId: z.number(),
	dateDue: z.string(),
	datePaid: z.string().nullable(),
	createdOn: z.string(),
	isPaid: z.boolean(),

	bill: BillSchema,
});

export const BillPaymentsSchema = z.array(BillPaymentSchema);

export type BillPayment = z.infer<typeof BillPaymentSchema>;
