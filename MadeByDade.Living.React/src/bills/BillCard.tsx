import dayjs from "dayjs";

import { Badge, Button, Group, MantineColor, Text, ThemeIcon } from "@mantine/core";
import { IconReceipt } from "@tabler/icons-react";

import { format } from "../utils";

import Card from "../shared/Card";
import { BillPayment } from "./BillPayment";
import { useBillPaymentUpdateMutation } from "./Mutations";

export function BillCard(props: BillCardProps) {
	const skeleton = isSkeleton(props);

	const mutation = useBillPaymentUpdateMutation({ mutationKey: ["Pay Bill", skeleton ? undefined : props.billPayment.id] });

	if (isSkeleton(props)) return <></>;

	const { billPayment } = props;

	// The number of days remaining until the bill is due.
	const daysRemaining = dayjs(billPayment.dateDue).diff(dayjs().startOf("day"), "days");

	// The total number of days from when the payment was created and when it is due.
	// const totalDays = dayjs(billPayment.dateDue).diff(dayjs(billPayment.createdOn), "days") + 11;

	// What percentage of time has passed since the bill was created and when it is due.
	// const progress = ((totalDays - daysRemaining) / totalDays) * 100;

	return (
		<Card>
			<div>
				<Group justify="space-between">
					<ThemeIcon size="lg" variant="light">
						<IconReceipt />
					</ThemeIcon>
					<Badge variant="filled" color={getBadgeColor(daysRemaining)}>
						{daysRemaining} days till due
					</Badge>
				</Group>
				<Text fz="lg" fw={500} mt="md">
					{billPayment.bill.name}
				</Text>
				<Text fz="sm" c="dimmed" mt={5}>
					{format.asCurrency(billPayment.bill.amount)} is due on {format.asDateString(billPayment.dateDue, "medium")}
				</Text>
			</div>

			<Button
				mt="md"
				variant="light"
				loading={mutation.isPending}
				loaderProps={{ type: "dots" }}
				onClick={() => mutation.mutate({ ...billPayment, datePaid: new Date().toISOString() })}
			>
				Mark as Paid
			</Button>
		</Card>
	);
}

type BillCardProps = { billPayment: BillPayment } | SkeletonProps;
type SkeletonProps = { skeleton: true };

function isSkeleton(props: BillCardProps): props is SkeletonProps {
	return (props as SkeletonProps).skeleton === true;
}

function getBadgeColor(daysRemaining: number): MantineColor {
	if (daysRemaining <= 3) return "red";
	else if (daysRemaining <= 7) return "orange";
	else return "blue";
}
