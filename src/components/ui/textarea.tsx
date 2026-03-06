import { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-foreground-primary placeholder:text-foreground-muted transition-[border-color,box-shadow,background-color] duration-base ease-standard focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
}
