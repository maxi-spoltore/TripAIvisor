import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-base ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background enabled:active:translate-y-px enabled:active:shadow-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-card hover:bg-brand-primary-hover',
        outline: 'border border-input bg-surface text-foreground-primary hover:bg-muted',
        ghost: 'bg-transparent text-foreground-secondary hover:bg-muted hover:text-foreground-primary',
        destructive: 'bg-destructive text-destructive-foreground shadow-card hover:brightness-95'
      },
      size: {
        default: 'h-11 px-4 text-body-sm',
        sm: 'h-11 px-3.5 text-body-sm',
        lg: 'h-12 px-8 text-body-md'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, type = 'button', variant, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} type={type} {...props} />
  )
);

Button.displayName = 'Button';
