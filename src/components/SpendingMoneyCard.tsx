import React from 'react';
import { useSpendingMoney } from '~/hooks/use-spending-money';

/**
 * Displays the user's available spending money with dynamic color states:
 *  - Red when negative
 *  - Amber when below $100
 *  - Cyan otherwise
 */
export function SpendingMoneyCard() {
  const { spendingMoney } = useSpendingMoney();

  const spendingState = spendingMoney < 0 ? 'negative' : spendingMoney < 100 ? 'low' : 'ok';
  const spendingBgClass = spendingState === 'negative'
    ? 'bg-red-900/80'
    : spendingState === 'low'
      ? 'bg-amber-900/80'
      : 'bg-cyan-900/80';
  const spendingTitleColor = spendingState === 'negative'
    ? 'text-red-300'
    : spendingState === 'low'
      ? 'text-amber-300'
      : 'text-cyan-300';
  const spendingValueColor = spendingState === 'negative'
    ? 'text-red-400'
    : spendingState === 'low'
      ? 'text-amber-400'
      : 'text-cyan-400';

  return (
    <div className="mb-6">
      <div className={`relative ${spendingBgClass} rounded-xl shadow-lg p-6 flex flex-col items-center justify-center overflow-hidden transition-colors duration-500`}>
        <div className="shimmer-bg" />
        <span className={`relative z-10 text-lg font-semibold ${spendingTitleColor} mb-1`}>Spending Money</span>
        <span className={`relative z-10 text-4xl font-extrabold ${spendingValueColor} tracking-wide drop-shadow sci-fi-title-glow`}>
          {spendingMoney.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </span>
      </div>
    </div>
  );
}
