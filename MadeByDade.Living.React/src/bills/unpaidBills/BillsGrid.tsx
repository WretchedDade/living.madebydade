import { SimpleGrid, SimpleGridProps } from "@mantine/core";

import { BillPayment } from "../BillPayment";
import { BillsGridCard } from "./BillsGridCard";

export function BillsGrid(props: BillsGridProps) {
	const cols: SimpleGridProps["cols"] = { base: 1, xs: 2, lg: 4 };

	if (isSkeleton(props)) return <></>;

	return (
		<SimpleGrid cols={cols}>
			{props.bills.map((bill) => (
				<BillsGridCard key={bill.id} billPayment={bill} />
			))}
		</SimpleGrid>
	);
}

type BillsGridProps = { bills: BillPayment[] } | SkeletonProps;
type SkeletonProps = { skeleton: true; numberOfSkeletons: number };

function isSkeleton(props: BillsGridProps): props is SkeletonProps {
	return (props as SkeletonProps).skeleton === true;
}
