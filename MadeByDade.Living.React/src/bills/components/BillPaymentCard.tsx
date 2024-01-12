import dayjs from "dayjs";

import { Badge, Button, Group, MantineColor, Text, ThemeIcon } from "@mantine/core";
import { IconCircleCheck, IconClock, IconProgressCheck } from "@tabler/icons-react";

import { format } from "../../utils";

import LivingCard, { LivingCardProps } from "../../shared/LivingCard";
import { BillPayment } from "../api/BillPayment";
import { useBillPaymentUpdateMutation } from "../api/Mutations";

export function BillPaymentCard(props: BillCardProps) {
	const skeleton = isSkeleton(props);

	const mutation = useBillPaymentUpdateMutation({ mutationKey: ["Pay Bill", skeleton ? undefined : props.billPayment.id] });

	if (isSkeleton(props)) return <></>;

	const { billPayment, livingCard = {} } = props;

	// The number of days remaining until the bill is due.
	const daysRemaining = dayjs(billPayment.dateDue).diff(dayjs().startOf("day"), "days");

	// The total number of days from when the payment was created and when it is due.
	// const totalDays = dayjs(billPayment.dateDue).diff(dayjs(billPayment.createdOn), "days") + 11;

	// What percentage of time has passed since the bill was created and when it is due.
	// const progress = ((totalDays - daysRemaining) / totalDays) * 100;

	const isAutoPay = billPayment.bill.isAutoPay;

	return (
		<LivingCard {...livingCard}>
			<div>
				<Group justify="space-between">
					<ThemeIcon size="lg" variant="light" color={getBadgeColor(daysRemaining, isAutoPay, billPayment.isPaid)}>
						<BadgeIcon isAutoPay={isAutoPay} isPaid={billPayment.isPaid} />
					</ThemeIcon>
					<Badge variant="filled" color={getBadgeColor(daysRemaining, isAutoPay, billPayment.isPaid)}>
						{getBadgeText(daysRemaining, isAutoPay, billPayment.isPaid)}
					</Badge>
				</Group>
				<Text fz="lg" fw={500} mt="md">
					{billPayment.bill.name}
				</Text>
				<Text fz="sm" c="dimmed" mt={5}>
					{getDescriptionText(billPayment)}
				</Text>
			</div>

			{!billPayment.isPaid && (
				<Button
					mt="md"
					variant="filled"
					loading={mutation.isPending}
					loaderProps={{ type: "dots" }}
					onClick={() => {
						console.log("Marking as paid");
						mutation.mutate({ ...billPayment, datePaid: new Date().toISOString() });
					}}
				>
					Mark as Paid
				</Button>
			)}
		</LivingCard>
	);
}

type BillCardProps = { billPayment: BillPayment; livingCard?: LivingCardProps } | SkeletonProps;
type SkeletonProps = { skeleton: true };

function isSkeleton(props: BillCardProps): props is SkeletonProps {
	return (props as SkeletonProps).skeleton === true;
}

function BadgeIcon({ isAutoPay, isPaid }: { isAutoPay: boolean; isPaid: boolean }) {
	if (isPaid) return <IconCircleCheck />;
	if (isAutoPay) return <IconProgressCheck />;
	return <IconClock />;
}

function getBadgeText(daysRemaining: number, isAutoPay: boolean, isPaid: boolean): string {
	if (isPaid) return "Paid";

	if (isAutoPay) return daysRemaining === 0 ? "Auto Pays Today" : `Auto Pays in ${daysRemaining} days`;

	return daysRemaining === 0 ? "Due Today" : `${daysRemaining} days till due`;
}

function getBadgeColor(daysRemaining: number, isAutoPay: boolean, isPaid: boolean): MantineColor {
	if (isPaid) return "gray";

	if (isAutoPay) return "green";

	if (daysRemaining <= 3) return "red";
	else if (daysRemaining <= 7) return "orange";
	else return "blue";
}

function getDescriptionText(billPayment: BillPayment): string {
	if (billPayment.isPaid) {
		return `${format.asCurrency(billPayment.bill.amount)} was paid on ${format.asDateString(billPayment.dateDue, "full")}`;
	} else {
		return `${format.asCurrency(billPayment.bill.amount)} is due on ${format.asDateString(billPayment.dateDue, "full")}`;
	}
}
