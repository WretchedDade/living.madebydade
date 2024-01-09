import { SimpleGrid, SimpleGridProps } from "@mantine/core";

import { BillPayment } from "../api/BillPayment";
import { BillPaymentCard } from "./BillPaymentCard";

export function BillPaymentsGrid(props: BillsGridProps) {
	const cols: SimpleGridProps["cols"] = { base: 1, xs: 2, lg: 4 };

	if (isSkeleton(props)) return <></>;

	return (
		<SimpleGrid cols={cols}>
			{props.billPayments.map((bill) => (
				<BillPaymentCard key={bill.id} billPayment={bill} />
			))}
		</SimpleGrid>
	);
}

type BillsGridProps = { billPayments: BillPayment[] } | SkeletonProps;
type SkeletonProps = { skeleton: true; numberOfSkeletons: number };

function isSkeleton(props: BillsGridProps): props is SkeletonProps {
	return (props as SkeletonProps).skeleton === true;
}
