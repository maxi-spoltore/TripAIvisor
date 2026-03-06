import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
};

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-brand-primary text-white shadow-card hover:bg-brand-primary-hover',
  outline: 'border border-border bg-surface text-foreground-primary hover:bg-subtle',
  ghost: 'bg-transparent text-foreground-secondary hover:bg-subtle hover:text-foreground-primary',
  destructive: 'bg-danger text-white shadow-card hover:brightness-95'
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  default: 'h-11 px-4 text-sm leading-5',
  sm: 'h-11 px-3.5 text-[0.8125rem] leading-[1.125rem]',
  lg: 'h-12 px-8 text-[0.9375rem] leading-[1.375rem]'
};

export function Button({ className, variant = 'default', size = 'default', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-base ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas enabled:active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
