import React, { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { getButtonStyles, ButtonStyleOptions } from './buttonStyles';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleOptions {
  children?: ReactNode;
  color?: ButtonStyleOptions['color'];
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      icon = false,
      className = '',
      circular = false,
      color,
      ...props
    },
    ref
  ) => {
    const classes = getButtonStyles({ variant, size, icon, circular, className, color });

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);
