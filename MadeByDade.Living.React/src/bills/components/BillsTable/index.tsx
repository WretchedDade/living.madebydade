import { ActionIcon, Button, Group, ScrollArea, Table } from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";

import { format } from "../../../utils";

import { Link } from "@tanstack/react-router";
import { Bill } from "../../api/Bill";

interface BillsTableProps {
	bills: Bill[];
	onEdit: (bill: Bill) => void;
	onDelete: (bill: Bill) => void;
}

export default function BillsTable({ bills, onEdit, onDelete }: BillsTableProps) {
	return (
		<ScrollArea>
			<Table striped="even" withTableBorder withColumnBorders miw={800} verticalSpacing="sm" stripedColor="blue.0">
				<Table.Thead>
					<Table.Tr bg="blue" c="gray.0">
						<Table.Th>Name</Table.Th>
						<Table.Th>Amount</Table.Th>
						<Table.Th>Day Due</Table.Th>
						<Table.Th>Is Auto-Pay?</Table.Th>
						<Table.Th>Actions</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{bills.map((bill) => (
						<Table.Tr key={bill.id}>
							<Table.Td>
								<Button
									variant="transparent"
									href={`/Bills/${bill.id}`}
									component={Link}
									to="/Bills/$billId"
									params={{ billId: bill.id.toString() }}
								>
									{bill.name}
								</Button>
							</Table.Td>
							<Table.Td>{format.asCurrency(bill.amount)}</Table.Td>
							<Table.Td>{bill.dueType === "Fixed" ? bill.dayDue : "End of the Month"}</Table.Td>
							<Table.Td>{bill.isAutoPay ? "Yes" : "No"}</Table.Td>
							<Table.Td>
								<Group>
									<ActionIcon variant="subtle" onClick={() => onEdit(bill)}>
										<IconPencil size={20} />
									</ActionIcon>
									<ActionIcon color="red" variant="subtle" onClick={() => onDelete(bill)}>
										<IconTrash size={20} />
									</ActionIcon>
								</Group>
							</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
		</ScrollArea>
	);
}
