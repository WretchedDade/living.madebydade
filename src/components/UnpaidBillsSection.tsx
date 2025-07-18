import { SectionHeader } from '~/components/layout/SectionHeader';
import { ClockIcon, ListBulletIcon } from '@radix-ui/react-icons';
import * as Switch from '@radix-ui/react-switch';
import { Button } from '~/components/ui/Button';
import { Link } from '~/components/ui/Link';
import React from 'react';

interface UnpaidBillsSectionProps {
  payments: any[];
  isLoading: boolean;
  showAutoPay: boolean;
  setShowAutoPay: (checked: boolean) => void;
  onMarkPaid: (payment: any) => Promise<void>;
}

export function UnpaidBillsSection({
  payments,
  isLoading,
  showAutoPay,
  setShowAutoPay,
  onMarkPaid,
}: UnpaidBillsSectionProps) {
  return (
    <div className="flex-1 bg-zinc-900 rounded-2xl p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center gap-4 whitespace-nowrap">
          <SectionHeader
            icon={<ClockIcon className="w-4 h-4 sm:w-7 sm:h-7 text-yellow-400 drop-shadow-[0_0_6px_rgba(253,224,71,0.7)]" />}
            title={<span className="flex items-center gap-1 whitespace-nowrap">Unpaid Bills <span className="font-normal">({payments?.length ?? 0})</span></span>}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400 sm:mt-0 mt-2 self-end sm:self-auto">
          <span>Show Auto-Pay</span>
          <Switch.Root
            checked={showAutoPay}
            onCheckedChange={setShowAutoPay}
            className="w-10 h-6 bg-zinc-700 rounded-full relative transition-colors data-[state=checked]:bg-cyan-600 focus:outline-none"
            id="auto-pay-toggle"
          >
            <Switch.Thumb
              className="block w-4 h-4 bg-white rounded-full shadow absolute left-1 top-1 transition-transform data-[state=checked]:translate-x-4 data-[state=checked]:bg-cyan-400"
              style={{ transition: 'transform 0.2s' }}
            />
          </Switch.Root>
        </div>
      </div>
      {isLoading ? (
        <div className="text-cyan-400 text-center py-6 animate-pulse text-lg">Loading payments...</div>
      ) : payments?.length === 0 ? (
        <div className="text-zinc-400 text-center py-8 text-lg">🎉 All bills are paid! You're a legend!</div>
      ) : (
        <ul className="divide-y divide-zinc-800 overflow-y-auto">
          {payments && payments.map((payment: any) => (
            <li key={payment._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 px-2 mb-2 min-w-0">
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="font-bold text-cyan-400 text-base drop-shadow truncate w-full">{payment.bill?.name}</span>
                <span className="text-zinc-300 text-xs">Due: {new Date(payment.dateDue).toLocaleDateString()}</span>
                {payment.isAutoPay && (
                  <span className="text-[10px] text-cyan-500 bg-zinc-700 rounded px-2 py-0.5 mt-1">Auto-Pay</span>
                )}
              </div>
              <Button
                variant="subtle"
                disabled={!!payment.datePaid}
                onClick={() => onMarkPaid(payment)}
                className="w-full sm:w-auto mt-2 sm:mt-0"
              >
                Mark Paid
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="w-full text-right mt-4">
        <Link
          href="/bills"
          className="inline-flex items-end gap-1 px-3 py-1.5 rounded-lg border border-cyan-700 bg-zinc-800 text-cyan-300 font-semibold text-sm shadow hover:bg-cyan-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 align-middle"
        >
          <ListBulletIcon className="w-5 h-5 mr-1" />
          View all bills
        </Link>
      </div>
    </div>
  );
}
