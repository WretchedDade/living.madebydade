// Tailwind JIT safelist:
// Colors:
// bg-cyan-200 bg-cyan-300 bg-cyan-400 bg-cyan-500 bg-cyan-600 bg-cyan-700 bg-cyan-800 bg-cyan-900
// bg-emerald-200 bg-emerald-300 bg-emerald-400 bg-emerald-500 bg-emerald-600 bg-emerald-700 bg-emerald-800 bg-emerald-900
// bg-amber-200 bg-amber-300 bg-amber-400 bg-amber-500 bg-amber-600 bg-amber-700 bg-amber-800 bg-amber-900
// bg-rose-200 bg-rose-300 bg-rose-400 bg-rose-500 bg-rose-600 bg-rose-700 bg-rose-800 bg-rose-900
// Widths:
// w-3 w-4 w-6 w-8 w-10
// To support dynamic color/shade/width combinations, add more as needed.
import React from 'react';
import type { TailwindColor } from '../../utils/tailwind-types';

interface SciFiBarsProps {
  count?: number;
  className?: string;
  color?: TailwindColor;
}

function getBarWidths(count: number) {
  const widths = [3, 4, 6, 8, 10];
  const result: number[] = [];
  let prev: number | null = null;
  for (let i = 0; i < count; i++) {
    let choices = widths.filter(w => w !== prev);
    let w = choices[Math.floor(Math.random() * choices.length)];
    result.push(w);
    prev = w;
  }
  return result;
}

function getRandomColor(color: TailwindColor = 'cyan') {
  const shades = [200, 300, 400, 500, 600, 700, 800, 900];
  const shade = shades[Math.floor(Math.random() * shades.length)];
  return `bg-${color}-${shade}`;
}

export const SciFiBars: React.FC<SciFiBarsProps> = ({ count = 5, className = '', color = 'cyan' }) => {
  const barWidths = getBarWidths(count);
  return (
    <div className={`flex gap-2 ${className}`}>
      {barWidths.map((w, i) => (
        <span key={i} className={`w-${w} h-2 rounded-full ${getRandomColor(color)}`} />
      ))}
    </div>
  );
};
