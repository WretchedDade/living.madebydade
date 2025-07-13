import React from 'react';
import { Checkbox } from '@radix-ui/react-checkbox';

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
}

export function CheckboxField({ label, checked, onChange, id = 'checkbox', className }: CheckboxFieldProps) {
  return (
    <div className={`flex items-center gap-2 align-middle ${className || ''}`}>
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        className="w-5 h-5 border border-cyan-400 bg-zinc-800 data-[state=checked]:bg-cyan-400 data-[state=checked]:border-cyan-400 rounded"
        id={id}
      />
      <label htmlFor={id} className="text-cyan-300 font-bold">{label}</label>
    </div>
  );
}
