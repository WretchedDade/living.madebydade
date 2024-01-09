import { z } from "zod";

export const BillSchema = z.object({
	id: z.number(),
	name: z.string(),
	amount: z.number(),
	dayDue: z.number(),
	isAutoPay: z.boolean(),
	dueType: z.enum(["Fixed", "EndOfMonth"]),
});

export const BillsSchema = z.array(BillSchema);

export type Bill = z.infer<typeof BillSchema>;
