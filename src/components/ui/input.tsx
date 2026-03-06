import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, type = 'text', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'h-11 w-full rounded-md border border-border bg-surface px-3 text-body-sm text-foreground-primary placeholder:text-foreground-muted transition-[border-color,box-shadow,background-color] duration-base ease-standard focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-60 file:border-0 file:bg-transparent file:text-body-sm file:font-medium',
        className
      )}
      {...props}
    />
  );
}
