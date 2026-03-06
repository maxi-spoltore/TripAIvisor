import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      className={cn(
        'flex h-11 w-full rounded-md border border-input bg-surface px-3 text-body-sm text-foreground-primary placeholder:text-foreground-muted transition-[border-color,box-shadow,background-color] duration-base ease-standard file:border-0 file:bg-transparent file:text-body-sm file:font-medium focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-60',
        className
      )}
      ref={ref}
      type={type}
      {...props}
    />
  )
);

Input.displayName = 'Input';
