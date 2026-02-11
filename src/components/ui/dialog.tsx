import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

export function Dialog({ children }: DialogProps) {
  return <>{children}</>;
}

export function DialogTrigger({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function DialogClose({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function DialogContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-6 shadow-lg',
        className
      )}
      {...props}
    />
  );
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col space-y-1.5', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-4 flex justify-end gap-2', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold', className)} {...props} />;
}

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-slate-600', className)} {...props} />;
}
