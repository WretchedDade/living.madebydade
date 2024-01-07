import { DefaultError, UseMutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../auth";
import { BillPayment } from "./BillPayment";
import { BillQueryKeys } from "./Queries";

type BillPaymentUpdateMutationOptions = Omit<UseMutationOptions<void, DefaultError, BillPayment, unknown>, "mutationFn">;

export function useBillPaymentUpdateMutation(options?: BillPaymentUpdateMutationOptions) {
	const { acquireToken } = useAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (billPayment: BillPayment) => {
			const accessToken = await acquireToken();

			const response = await fetch(`${import.meta.env.VITE_API_URL}/api/BillPayments/${billPayment.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify(billPayment),
			});

			if (!response.ok) throw new Error("Failed to update bill payment");
		},

		onMutate: async (billPayment) => {
			queryClient.setQueryData<BillPayment[] | undefined>(BillQueryKeys.UnpaidBillPayments, (oldData) => {
				if (oldData === undefined) return;

				return [...oldData].filter((bill) => bill.id !== billPayment.id);
			});
		},

		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: BillQueryKeys.UnpaidBillPayments });
		},

		...(options ?? {}),
	});
}
