import { Badge, Button, Card, Group, Text } from "@mantine/core";

import dayjs from "dayjs";
import { format } from "../../utils";
import { BillPayment } from "../BillPayment";
import { useBillPaymentUpdateMutation } from "../Mutations";

export function BillsGridCard(props: BillsGridCardProps) {
	const skeleton = isSkeleton(props);

	const mutation = useBillPaymentUpdateMutation({ mutationKey: ["Pay Bill", skeleton ? undefined : props.billPayment.id] });

	if (isSkeleton(props)) return <></>;

	const { billPayment } = props;

	// using DayJS calculate days remaining
	const daysRemaining = dayjs(billPayment.dateDue).diff(dayjs(), "days");

	return (
		<Card withBorder padding="lg" shadow="xl">
			<Group justify="space-between">
				{/* <MantineLogo type="mark" size="2rem" /> */}
				<Badge>{daysRemaining} days till due</Badge>
			</Group>

			<Text fz="lg" fw={500} mt="md">
				{billPayment.bill.name}
			</Text>
			<Text fz="sm" c="dimmed" mt={5}>
				{format.asCurrency(billPayment.bill.amount)} is due on {format.asDateString(billPayment.dateDue, "medium")}
			</Text>

			{/* <Text c="dimmed" fz="sm" mt="md">
				Tasks completed:{" "}
				<Text span fw={500} c="bright">
					23/36
				</Text>
			</Text> */}

			{/* <Progress value={(23 / 36) * 100} mt={5} /> */}

			<Button
				loading={mutation.isPending}
				loaderProps={{ type: "dots" }}
				variant="light"
				mt="md"
				onClick={() => mutation.mutate({ ...billPayment, datePaid: new Date().toISOString() })}
			>
				Mark as Paid
			</Button>
		</Card>
	);

	// return (
	// 	<Card shadow="xl" radius="md" p="md" className={classes.card}>
	// 		<Card.Section className={classes.section}>
	// 			<Group>
	// 				{/* <BillGridCardIcon billPayment={billPayment} /> */}
	// 				<Text fz="lg" fw={500}>
	// 					{billPayment.bill.name}
	// 				</Text>
	// 			</Group>
	// 			<Group gap={7} mt="md">
	// 				{/* {bill.tags?.map((tag) => (
	// 					<Badge variant="dot" key={tag.name} color="green" tt="none" fw="500">
	// 						{tag.name}
	// 					</Badge>
	// 				))} */}
	// 			</Group>
	// 		</Card.Section>

	// 		<Card.Section className={classes.stats}>
	// 			<div>
	// 				<Text size="xs" c="dimmed">
	// 					Amount
	// 				</Text>
	// 				<Text fw={500} size="sm">
	// 					{format.asCurrency(billPayment.bill.amount)}
	// 				</Text>
	// 			</div>
	// 			<div>
	// 				<Text size="xs" c="dimmed">
	// 					Date Due
	// 				</Text>
	// 				<Text fw={500} size="sm">
	// 					{format.asDateString(billPayment.dateDue, "medium")}
	// 				</Text>
	// 			</div>
	// 		</Card.Section>

	// 		<Group mt="xs">
	// 			<Button
	// 				loading={mutation.isPending}
	// 				loaderProps={{ type: "dots" }}
	// 				variant="light"
	// 				radius="md"
	// 				style={{ flex: 1 }}
	// 				onClick={() => mutation.mutate({ ...billPayment, datePaid: new Date().toISOString() })}
	// 			>
	// 				Mark as Paid
	// 			</Button>
	// 			{/* {billPayment.linkToPay != null && (
	// 				<ActionIcon
	// 					variant="gradient"
	// 					gradient={{ from: "gray", to: "indigo", deg: 45 }}
	// 					color="green"
	// 					radius="md"
	// 					size={36}
	// 					onClick={() => window.open(billPayment.linkToPay, "_blank")}
	// 				>
	// 					<IconExternalLink />
	// 				</ActionIcon>
	// 			)} */}
	// 		</Group>
	// 	</Card>
	// );
}

type BillsGridCardProps = { billPayment: BillPayment } | SkeletonProps;
type SkeletonProps = { skeleton: true };

function isSkeleton(props: BillsGridCardProps): props is SkeletonProps {
	return (props as SkeletonProps).skeleton === true;
}
