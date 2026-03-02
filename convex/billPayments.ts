import { GenericActionCtx } from "convex/server";
import { v } from "convex/values";
import { DateTime } from "luxon";

import { internal } from "./_generated/api";

import { DataModel, Doc, Id } from "./_generated/dataModel";
import { internalAction, internalMutation, mutation, query } from "./_generated/server";

import { EST_TIMEZONE } from "../constants";
import { getAccessibleUserIds } from "./userShares";

export type BillWithPayments = Doc<"bills"> & { payments: Doc<"billPayments">[] };
export type BillPaymentWithBill = Doc<"billPayments"> & { bill: Doc<"bills"> };

export const getById = query({
	args: { id: v.id("billPayments") },
	handler: async (ctx, { id }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		const payment = await ctx.db.get(id);

		if (payment && payment.userId !== identity.subject) {
			throw new Error("Not authorized to view this payment");
		}

		return payment;
	},
});

export const listUnpaid = query({
	args: {
		includeAutoPay: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		const accessibleIds = await getAccessibleUserIds(ctx);

		const paymentsPerUser = await Promise.all(
			accessibleIds.map(async userId => {
				if (args.includeAutoPay) {
					return ctx.db
						.query("billPayments")
						.withIndex("byUserUnpaidDue", q => q.eq("userId", userId).eq("datePaid", undefined))
						.order("asc")
						.collect();
				} else {
					return (await ctx.db
						.query("billPayments")
						.withIndex("byUserUnpaidDue", q => q.eq("userId", userId).eq("datePaid", undefined))
						.order("asc")
						.collect()
					).filter(p => !p.isAutoPay);
				}
			}),
		);

		const payments = paymentsPerUser.flat();

		return await Promise.all(
			payments.map(async payment => {
				const bill = await ctx.db.get(payment.billId);

				if (!bill) {
					throw new Error("Bill not found");
				}

				return { ...payment, bill };
			}),
		);
	},
});

export const list = query({
	args: { take: v.optional(v.number()) },
	handler: async (ctx, { take = 50 }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		const accessibleIds = await getAccessibleUserIds(ctx);
		const perUserPayments = await Promise.all(
			accessibleIds.map(userId =>
				ctx.db
					.query("billPayments")
					.withIndex("byUserId", q => q.eq("userId", userId))
					.order("desc")
					.take(take),
			),
		);
		const payments = perUserPayments.flat()
			.sort((a, b) => b._creationTime - a._creationTime)
			.slice(0, take);

		return Promise.all(
			payments.map(async payment => {
				const bill = await ctx.db.get(payment.billId);

				if (!bill) {
					throw new Error("Bill not found");
				}

				return { ...payment, bill };
			}),
		);
	},
});

function getDate(payment: Doc<"billPayments">) {
	if (payment.datePaid) {
		return DateTime.fromISO(payment.datePaid);
	}

	return DateTime.fromMillis(payment._creationTime);
}

export const listRecentlyPaid = query({
	args: {},
	handler: async ctx => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		const accessibleIds = await getAccessibleUserIds(ctx);

		const perUserPayments = await Promise.all(
			accessibleIds.map(userId =>
				ctx.db
					.query("billPayments")
					.withIndex("byUserDatePaid", q => q.eq("userId", userId).gt("datePaid", "0"))
					.order("desc")
					.take(50),
			),
		);
		const userPayments = perUserPayments.flat()
			.sort((a, b) => (b.datePaid ?? "").localeCompare(a.datePaid ?? ""))
			.slice(0, 50);

		return Promise.all(
			userPayments.map(async payment => {
				const bill = await ctx.db.get(payment.billId);

				if (!bill) {
					throw new Error("Bill not found");
				}

				return { ...payment, bill, datePaid: payment.datePaid! };
			}),
		);
	},
});

export const markPaid = mutation({
	args: {
		billPaymentId: v.id("billPayments"),
		datePaid: v.string(),
	},
	handler: async (ctx, { billPaymentId, datePaid }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.subject) throw new Error("User not authenticated");

		const payment = await ctx.db.get(billPaymentId);

		if (!payment) {
			throw new Error("Payment not found");
		}

		if (payment.userId !== identity.subject) {
			throw new Error("Not authorized to modify this payment");
		}

		const bill = await ctx.db.get(payment.billId);
		if (!bill) {
			throw new Error("Bill not found");
		}
		if ((bill as { userId?: string }).userId !== identity.subject) {
			throw new Error("Not authorized to modify this bill payment");
		}

		await ctx.db.patch(billPaymentId, { datePaid });
	},
});

export const markBillPaid = internalMutation({
	args: {
		billPaymentId: v.id("billPayments"),
		datePaid: v.string(),
	},
	handler: async (ctx, { billPaymentId, datePaid }) => {
		const payment = await ctx.db.get(billPaymentId);

		if (!payment) {
			throw new Error("Payment not found");
		}

		await ctx.db.patch(billPaymentId, { datePaid });
	},
});

export const insertBillPayment = internalMutation({
	args: {
		userId: v.string(),
		dateDue: v.string(),
		datePaid: v.optional(v.string()),
		billId: v.id("bills"),
		isAutoPay: v.boolean(),
	},
	handler: (ctx, payment) => ctx.db.insert("billPayments", payment),
});

export const createUpcomingPayments = internalAction({
	args: {},
	handler: async (ctx, args) => {
		const bills = await ctx.runQuery(internal.bills.listWithPayments, {});

		await createUpcomingPaymentsForBills(ctx, bills);
	},
});

const createUpcomingPaymentsForBills = async (ctx: GenericActionCtx<DataModel>, bills: BillWithPayments[]) => {
	console.log(`${bills.length} bills found`);
	const today = DateTime.now().setZone(EST_TIMEZONE).startOf("day");

	if (!today.isValid) {
		console.log(`Today is invalid: ${today.invalidReason}. ${today.invalidExplanation}`);
		return;
	}

	for (const bill of bills) {
		const nextPaymentDate = getNextPaymentDate(bill, today);

		// Check if Bill Payment already exists for this date
		const existingPayment = bill.payments.find(payment => isUnpaidOrMatchesDate(payment, nextPaymentDate));

		if (existingPayment != null) {
			// Check if the bill is auto-pay and is due today
			if (bill.isAutoPay && DateTime.fromISO(existingPayment.dateDue).hasSame(today, "day")) {
				console.log(`${bill.name} is due today and auto-pays. Marking as paid...`);
				await ctx.runMutation(internal.billPayments.markBillPaid, {
					billPaymentId: existingPayment._id,
					datePaid: DateTime.utc().toISO(),
				});

				await ctx.runMutation(internal.activity.logActivityInternal, {
					type: "billPaid",
					userId: "system",
					targetId: existingPayment._id,
					details: { billName: bill.name },
				});

				continue;
			} else {
				console.log(`Bill ${bill.name} already has a payment scheduled for ${existingPayment.dateDue}`);
				continue;
			}
		}

		// Continue if next payment date could not be determined
		if (nextPaymentDate == null) {
			console.log(`Skipping bill ${bill.name} because the next payment date could not be determined`);
			continue;
		}

		if (!nextPaymentDate.isValid) {
			console.log(
				`Skipping bill ${bill.name} because the next payment date is invalid. Reason: ${nextPaymentDate.invalidReason}. Explanation: ${nextPaymentDate.invalidExplanation}`,
			);
			continue;
		}

		const daysUntilDue = nextPaymentDate.diff(today, "days").days;
		if (daysUntilDue > 15) {
			console.log(`Skipping bill ${bill.name} because it is more than 15 days away`);
			continue;
		}

		console.log(`Creating payment for ${bill.name} due on ${nextPaymentDate.toISO()}`);
		const billPaymentId: Id<"billPayments"> = await ctx.runMutation(internal.billPayments.insertBillPayment, {
			userId: bill.userId ?? "",
			billId: bill._id,
			dateDue: nextPaymentDate.toISO()!,
			isAutoPay: bill.isAutoPay,
		});

		await ctx.runMutation(internal.activity.logActivityInternal, {
			type: "billDue",
			userId: "system",
			targetId: billPaymentId,
			details: { billName: bill.name, dueDate: nextPaymentDate.toISO() ?? undefined },
		});
	}
};

const getNextPaymentDate = (bill: BillWithPayments, today: DateTime) => {
	if (bill.dueType === "Fixed") {
		if (bill.dayDue == null) {
			console.error(
				`Bill ${bill.name} is configured incorrectly. It has a fixed due type but the day due is ${bill.dayDue}`,
			);

			return null;
		}

		if (bill.dayDue < 1 || bill.dayDue > 31) {
			console.error(
				`Bill ${bill.name} is configured incorrectly. It has a fixed due type but the day due is ${bill.dayDue}`,
			);

			return null;
		}

		const dayDue = Math.min(today.daysInMonth!, bill.dayDue);

		const dateDueThisMonth = today.set({ day: dayDue });

		if (today < dateDueThisMonth) {
			return dateDueThisMonth;
		} else {
			return dateDueThisMonth.plus({ months: 1 });
		}
	} else if (bill.dueType === "EndOfMonth") {
		const endOfCurrentMonth = today.endOf("month").startOf("day");

		if (today < endOfCurrentMonth) {
			return endOfCurrentMonth;
		} else {
			return endOfCurrentMonth.plus({ months: 1 });
		}
	} else {
		console.error(`Bill ${bill.name} has an unknown due type ${bill.dueType}`);
		return null;
	}
};

function isUnpaidOrMatchesDate(payment: Doc<"billPayments">, date: DateTime | null) {
	if (payment.datePaid == null) {
		return true;
	}

	if (date == null) {
		return false;
	}

	return DateTime.fromISO(payment.dateDue).hasSame(date, "month");
}
