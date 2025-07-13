import React from 'react';
import * as RadioGroup from '@radix-ui/react-radio-group';

interface Option {
  value: string;
  label: string;
}

interface RadioGroupFieldProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export function RadioGroupField({ label, value, options, onChange, error, className }: RadioGroupFieldProps) {
  return (
    <div className={className}>
      <label className="block text-cyan-300 font-bold mb-1">{label}</label>
      <RadioGroup.Root value={value} onValueChange={onChange} className="flex gap-4 mt-2">
        {options.map(opt => (
          <RadioGroup.Item key={opt.value} value={opt.value} id={`radio-${opt.value}`} className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border border-cyan-400 bg-zinc-800 flex items-center justify-center mr-2">
              <RadioGroup.Indicator className="w-2 h-2 rounded-full bg-cyan-400" />
            </span>
            <label htmlFor={`radio-${opt.value}`} className="text-white cursor-pointer">{opt.label}</label>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
      {error && (
        <span className="text-amber-500 text-sm font-normal">{error}</span>
      )}
    </div>
  );
}
