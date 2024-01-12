import { DefaultError, UseMutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../auth";
import { safeFetch } from "../../utils";
import { Bill } from "./Bill";
import { BillPayment } from "./BillPayment";
import { BillQueryKeys } from "./Queries";

type BillPaymentUpdateMutationOptions = Omit<UseMutationOptions<void, DefaultError, BillPayment, unknown>, "mutationFn">;

export function useBillPaymentUpdateMutation(options?: BillPaymentUpdateMutationOptions) {
	const auth = useAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (billPayment: BillPayment) => {
			await safeFetch({
				acquireToken: auth.acquireToken,

				method: "PUT",
				payload: billPayment,
				url: `api/BillPayments/${billPayment.id}`,
			});
		},

		onMutate: async (billPayment) => {
			queryClient.setQueryData<BillPayment[] | undefined>(BillQueryKeys.BillPayments(), (oldData) => {
				if (oldData === undefined) return;

				return [...oldData].filter((payment) => payment.id !== billPayment.id);
			});
		},

		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: [BillQueryKeys.BillPayments()[0]] });
		},

		...(options ?? {}),
	});
}

type DeleteBillMutationOptions = Omit<UseMutationOptions<void, DefaultError, Bill, unknown>, "mutationFn">;

export function useDeleteBillMutation(options?: DeleteBillMutationOptions) {
	const auth = useAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (bill: Bill) => {
			await safeFetch({
				acquireToken: auth.acquireToken,

				method: "DELETE",
				url: `api/bills/${bill.id}`,
			});
		},

		onMutate: (bill: Bill) => {
			queryClient.cancelQueries({ queryKey: BillQueryKeys.Bills });

			queryClient.setQueryData(BillQueryKeys.Bills, (old: Bill[] | undefined) => {
				return old?.filter((b) => b.id !== bill.id) ?? [];
			});
		},

		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: BillQueryKeys.Bills });
		},

		...(options ?? {}),
	});
}

interface BillMutationVariables extends Omit<Bill, "id"> {
	id: number | undefined;
}

type BillMutationOptions = Omit<UseMutationOptions<void, DefaultError, BillMutationVariables, unknown>, "mutationFn">;

export function useBillMutation(options?: BillMutationOptions) {
	const auth = useAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (bill: BillMutationVariables) => {
			await safeFetch({
				acquireToken: auth.acquireToken,

				payload: bill,
				method: bill.id == null ? "POST" : "PUT",
				url: bill.id == null ? "api/bills" : `api/bills/${bill.id}`,
			});
		},

		onMutate: (bill: BillMutationVariables) => {
			queryClient.setQueryData([BillQueryKeys.Bills], (old: Bill[] | undefined) => {
				if (old == null) {
					return;
				}

				if (bill.id == null) {
					return [...old, bill];
				}

				return old.map((b) => (b.id === bill.id ? bill : b));
			});
		},

		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: BillQueryKeys.Bills });
		},

		...(options ?? {}),
	});
}
