import React from 'react';

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return <span className="text-amber-500 text-sm font-normal mt-2 block">{error}</span>;
}
