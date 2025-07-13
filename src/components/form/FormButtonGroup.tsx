import React, { JSX } from 'react';
import { Button } from '~/components/ui/Button';
import { CheckIcon } from '@radix-ui/react-icons';

interface FormButtonGroupProps {
  onCancel?: () => void;
  submitLabel?: string;
}

export function FormButtonGroup({ onCancel, submitLabel = 'Submit' }: FormButtonGroupProps): JSX.Element {
  return (
    <div className="flex flex-row gap-4 items-center justify-end mt-2">
      <Button type="button" variant="ghost" className="text-cyan-400 flex items-center gap-2 font-normal" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" variant="primary" className="flex items-center gap-2 font-bold shadow-sm">
        <CheckIcon className="w-5 h-5" />
        {submitLabel}
      </Button>
    </div>
  );
}
