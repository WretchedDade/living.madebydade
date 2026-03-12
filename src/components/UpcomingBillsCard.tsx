import { BillPaymentWithBill } from "@/convex/billPayments";
import { Button } from "~/components/ui/Button";
import { Link } from "~/components/ui/Link";
import { Skeleton } from "~/components/ui/Skeleton";
import { ClockIcon } from "@heroicons/react/24/outline";
import * as Switch from "@radix-ui/react-switch";

interface UpcomingBillsCardProps {
	payments: BillPaymentWithBill[];
	isLoading: boolean;
	showAutoPay: boolean;
	setShowAutoPay: (checked: boolean) => void;
	onMarkPaid: (payment: BillPaymentWithBill) => Promise<void>;
}

export function UpcomingBillsCard({ payments, isLoading, showAutoPay, setShowAutoPay, onMarkPaid }: UpcomingBillsCardProps) {
	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-sm font-semibold text-foreground flex items-center gap-2.5">
					<ClockIcon className="w-[18px] h-[18px] text-warning shrink-0" />
					<span>Unpaid Bills</span>
					{!isLoading && (
						<span className="text-xs text-muted-foreground font-normal bg-muted/50 rounded-full px-2 py-0.5">{payments.length}</span>
					)}
				</h3>
				<div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
					<span className="hidden sm:inline">Auto-Pay</span>
					<Switch.Root
						checked={showAutoPay}
						onCheckedChange={setShowAutoPay}
						className="w-8 h-5 bg-muted rounded-full relative transition-colors data-[state=checked]:bg-primary cursor-pointer"
					>
						<Switch.Thumb
							className="block w-3.5 h-3.5 bg-white rounded-full shadow absolute left-[3px] top-[3px] transition-transform data-[state=checked]:translate-x-3"
						/>
					</Switch.Root>
				</div>
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="flex items-center justify-between">
							<div>
								<Skeleton className="w-24 h-4 mb-1" />
								<Skeleton className="w-16 h-3" />
							</div>
							<Skeleton className="w-16 h-4" />
						</div>
					))}
				</div>
			) : payments.length === 0 ? (
				<div className="text-center py-8">
					<div className="text-3xl mb-2">🎉</div>
					<p className="text-success font-semibold text-sm">All bills paid!</p>
					<p className="text-muted-foreground text-xs mt-1">Nothing due right now</p>
				</div>
			) : (
				<div className="space-y-1.5">
					{payments.map(payment => (
						<div
							key={payment._id}
							className="flex items-center justify-between py-3 px-3.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
						>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<span className="font-medium text-foreground text-sm truncate">
										{payment.bill?.name}
									</span>
									{payment.isAutoPay && (
										<span className="text-[10px] text-primary bg-primary/10 rounded px-1.5 py-0.5 font-medium">
											Auto
										</span>
									)}
								</div>
								<div className="text-xs text-muted-foreground">
									Due {new Date(payment.dateDue).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
								</div>
							</div>
							<div className="flex items-center gap-3">
								<span className="font-semibold text-sm text-warning tabular-nums">
									{((payment.bill?.amount ?? 0) / 100).toLocaleString("en-US", {
										style: "currency",
										currency: "USD",
									})}
								</span>
								<Button
									variant="subtle"
									size="sm"
									className="text-xs"
									onClick={() => onMarkPaid(payment)}
								>
									✓ Pay
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
