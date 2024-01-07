import { Image, ThemeIcon } from "@mantine/core";

import { BillPayment } from "../Bills.types";

interface BillGridCardIconProps {
	billPayment: BillPayment;
}

export function BillGridCardIcon({ billPayment }: BillGridCardIconProps) {
	if (billPayment.iconUri)
		return (
			<ThemeIcon variant="light" color="gray">
				<Image h="70%" m="auto" src={billPayment.iconUri} alt={billPayment.name} />
			</ThemeIcon>
		);

	if (billPayment.emoji)
		return (
			<ThemeIcon variant="light" color="gray">
				{billPayment.emoji}
			</ThemeIcon>
		);

	return <></>;
}
