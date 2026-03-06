import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-card transition-[box-shadow,transform,border-color] duration-base ease-standard motion-safe:hover:-translate-y-px motion-safe:hover:shadow-floating',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div className={cn('flex flex-col gap-1.5 p-5 sm:p-6', className)} ref={ref} {...props} />
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 className={cn('text-title-md font-semibold leading-tight text-foreground-primary', className)} ref={ref} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p className={cn('text-body-sm text-foreground-secondary', className)} ref={ref} {...props} />
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div className={cn('p-5 pt-0 sm:p-6 sm:pt-0', className)} ref={ref} {...props} />
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div className={cn('flex items-center p-5 pt-0 sm:p-6 sm:pt-0', className)} ref={ref} {...props} />
);
CardFooter.displayName = 'CardFooter';
