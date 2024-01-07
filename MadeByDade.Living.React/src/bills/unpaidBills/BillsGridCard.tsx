import { Button, Card, Group, Text } from "@mantine/core";

import { format } from "../../utils";
import { BillPayment } from "../BillPayment";
import { useBillPaymentUpdateMutation } from "../Mutations";
import classes from "./BillsGridCard.module.css";

export function BillsGridCard(props: BillsGridCardProps) {
	const skeleton = isSkeleton(props);

	const mutation = useBillPaymentUpdateMutation({ mutationKey: ["Pay Bill", skeleton ? undefined : props.billPayment.id] });

	if (isSkeleton(props)) return <></>;

	const { billPayment } = props;

	return (
		<Card shadow="xl" radius="md" p="md" className={classes.card}>
			<Card.Section className={classes.section}>
				<Group>
					{/* <BillGridCardIcon billPayment={billPayment} /> */}
					<Text fz="lg" fw={500}>
						{billPayment.bill.name}
					</Text>
				</Group>
				<Group gap={7} mt="md">
					{/* {bill.tags?.map((tag) => (
						<Badge variant="dot" key={tag.name} color="green" tt="none" fw="500">
							{tag.name}
						</Badge>
					))} */}
				</Group>
			</Card.Section>

			<Card.Section className={classes.stats}>
				<div>
					<Text size="xs" c="dimmed">
						Amount
					</Text>
					<Text fw={500} size="sm">
						{format.asCurrency(billPayment.bill.amount)}
					</Text>
				</div>
				<div>
					<Text size="xs" c="dimmed">
						Date Due
					</Text>
					<Text fw={500} size="sm">
						{format.asDateString(billPayment.dateDue, "medium")}
					</Text>
				</div>
			</Card.Section>

			<Group mt="xs">
				<Button
					loading={mutation.isPending}
					loaderProps={{ type: "dots" }}
					variant="light"
					radius="md"
					style={{ flex: 1 }}
					onClick={() => mutation.mutate({ ...billPayment, datePaid: new Date().toISOString() })}
				>
					Mark as Paid
				</Button>
				{/* {billPayment.linkToPay != null && (
					<ActionIcon
						variant="gradient"
						gradient={{ from: "gray", to: "indigo", deg: 45 }}
						color="green"
						radius="md"
						size={36}
						onClick={() => window.open(billPayment.linkToPay, "_blank")}
					>
						<IconExternalLink />
					</ActionIcon>
				)} */}
			</Group>
		</Card>
	);
}

type BillsGridCardProps = { billPayment: BillPayment } | SkeletonProps;
type SkeletonProps = { skeleton: true };

function isSkeleton(props: BillsGridCardProps): props is SkeletonProps {
	return (props as SkeletonProps).skeleton === true;
}
