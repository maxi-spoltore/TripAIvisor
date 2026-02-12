import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
};

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]',
  outline: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 active:scale-[0.98]',
  ghost: 'bg-transparent text-slate-900 hover:bg-slate-100',
  destructive: 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]'
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-8 px-3 text-sm',
  lg: 'h-11 px-8'
};

export function Button({ className, variant = 'default', size = 'default', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
