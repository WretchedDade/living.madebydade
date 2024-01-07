import { ActionIcon, Group, ScrollArea, Table } from "@mantine/core";

import { IconPencil, IconTrash } from "@tabler/icons-react";
import { Bill } from "../Bill";

interface BillsTableProps {
	bills: Bill[];
	onEdit: (bill: Bill) => void;
	onDelete: (bill: Bill) => void;
}

export default function BillsTable({ bills, onEdit, onDelete }: BillsTableProps) {
	return (
		<ScrollArea>
			<Table miw={800} verticalSpacing="sm">
				<Table.Thead>
					<Table.Tr>
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
							<Table.Td>{bill.name}</Table.Td>
							<Table.Td>{bill.amount}</Table.Td>
							<Table.Td>{bill.dueType === "Fixed" ? bill.dayDue : "End of the Month"}</Table.Td>
							<Table.Td>{bill.isAutoPay ? "Yes" : "No"}</Table.Td>
							<Table.Td>
								<Group>
									<ActionIcon variant="light" onClick={() => onEdit(bill)}>
										<IconPencil size={20} />
									</ActionIcon>
									<ActionIcon c="red.9" bg="red.1" variant="light" onClick={() => onDelete(bill)}>
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
