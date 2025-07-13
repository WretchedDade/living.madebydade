import React from 'react';

interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  className?: string;
  inputClassName?: string;
}

export function IconInput({ icon, className = '', inputClassName = '', ...props }: IconInputProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-300 text-lg pointer-events-none">{icon}</span>
      <input
        {...props}
        className={`w-full pl-8 rounded border border-cyan-400 bg-zinc-800 text-white p-2 ${inputClassName}`}
      />
    </div>
  );
}
