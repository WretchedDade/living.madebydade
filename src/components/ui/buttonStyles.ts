// Tailwind JIT safelist: Add these classes to your safelist in tailwind.config.js if using JIT mode.
// bg-amber-600 bg-amber-700 bg-amber-800 border-amber-600 text-white
// bg-rose-600 bg-rose-700 bg-rose-800 border-rose-600 text-white
// bg-emerald-600 bg-emerald-700 bg-emerald-800 border-emerald-600 text-white
// bg-cyan-400 bg-cyan-300 bg-cyan-600 border-cyan-400 text-zinc-900
// text-cyan-400 text-cyan-300 text-cyan-100
// border border-cyan-400 border border-amber-600 border border-rose-600 border border-emerald-600 border border-cyan-400
// hover:bg-amber-700 hover:bg-rose-700 hover:bg-emerald-700 hover:bg-cyan-300 hover:bg-zinc-700
// active:bg-amber-800 active:bg-rose-800 active:bg-emerald-800 active:bg-cyan-600 active:bg-zinc-800
// hover:text-white hover:text-cyan-400 hover:text-cyan-300
// active:text-white active:text-cyan-100
// bg-cyan-400/10 hover:bg-cyan-400/30 active:bg-cyan-400/50
// bg-amber-600/10 hover:bg-amber-700/30 active:bg-amber-800/50
// bg-rose-600/10 hover:bg-rose-700/30 active:bg-rose-800/50
// bg-emerald-600/10 hover:bg-emerald-700/30 active:bg-emerald-800/50
// rounded-full rounded-lg
// px-2 py-1 px-4 py-2 px-6 py-3 p-1 p-2 p-3 text-base text-sm text-lg text-xl
// focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-x-1 gap-y-1 font-medium transition-colors

// Shared style generator for Button and Link components
export interface ButtonStyleOptions {
  variant?: 'primary' | 'outline' | 'ghost' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  icon?: boolean;
  circular?: boolean;
  className?: string;
  color?: 'amber' | 'rose' | 'emerald' | 'cyan';
}

export function getButtonStyles({
  variant = 'primary',
  size = 'md',
  icon = false,
  circular = false,
  className = '',
  color = 'cyan',
}: ButtonStyleOptions) {
  const base =
    'inline-flex items-center justify-center font-medium transition-colors gap-x-1 gap-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const colorStyles: Record<string, { bg: string; text: string; border: string; hoverBg?: string; hoverText?: string; activeBg?: string; activeText?: string }> = {
    amber: {
      bg: 'bg-amber-600',
      text: 'text-white',
      border: 'border border-amber-600',
      hoverBg: 'bg-amber-700',
      hoverText: 'text-white',
      activeBg: 'bg-amber-800',
      activeText: 'text-white',
    },
    rose: {
      bg: 'bg-rose-600',
      text: 'text-white',
      border: 'border border-rose-600',
      hoverBg: 'bg-rose-700',
      activeBg: 'bg-rose-800',
    },
    emerald: {
      bg: 'bg-emerald-600',
      text: 'text-white',
      border: 'border border-emerald-600',
      hoverBg: 'bg-emerald-700',
      activeBg: 'bg-emerald-800',
    },
    cyan: {
      bg: 'bg-cyan-400',
      text: 'text-white',
      border: 'border border-cyan-400',
      hoverBg: 'bg-cyan-300',
      hoverText: 'text-zinc-900',
      activeBg: 'bg-cyan-600',
    },
  };

  const variantFns: Record<string, (c: typeof colorStyles[string]) => string> = {
    primary: c => [
      c.bg,
      c.text,
      c.border,
      c.hoverBg && `hover:${c.hoverBg}`,
      c.hoverText && `hover:${c.hoverText}`,
      c.activeBg && `active:${c.activeBg}`,
      c.activeText && `active:${c.activeText}`,
    ].filter(Boolean).join(' '),
    outline: c => [
      'bg-transparent',
      c.border || 'border border-cyan-400',
      c.text || 'text-cyan-400',
      c.hoverBg && `hover:${c.hoverBg}`,
      c.hoverText && `hover:${c.hoverText}`,
      c.activeBg && `active:${c.activeBg}`,
      c.activeText && `active:${c.activeText}`,
    ].filter(Boolean).join(' '),
    ghost: c => [
      'bg-transparent',
      c.text || 'text-cyan-400',
      'hover:bg-zinc-700',
      'active:bg-zinc-800',
      c.hoverText && `hover:${c.hoverText}`,
      c.activeText && `active:${c.activeText}`,
    ].filter(Boolean).join(' '),
    subtle: c => [
      c.bg ? `${c.bg}/10` : 'bg-cyan-400/10',
      c.text || 'text-cyan-300',
      c.hoverBg ? `hover:${c.hoverBg}/30` : 'hover:bg-cyan-400/30',
      c.activeBg ? `active:${c.activeBg}/50` : 'active:bg-cyan-400/50',
      c.activeText || 'active:text-cyan-100',
    ].filter(Boolean).join(' '),
  };

  const sizes: Record<string, string> = {
    sm: icon ? 'p-1 text-base' : 'px-2 py-1 text-sm',
    md: icon ? 'p-2 text-lg' : 'px-4 py-2 text-base',
    lg: icon ? 'p-3 text-xl' : 'px-6 py-3 text-lg',
  };

  const iconOnly = icon && !className;
  const iconClass = iconOnly ? 'flex items-center justify-center' : '';

  return [
    base,
    variantFns[variant](colorStyles[color]),
    sizes[size],
    iconClass,
    circular ? 'rounded-full' : 'rounded-lg',
    className,
  ].filter(Boolean).join(' ');
}
