'use client';

import { HTMLAttributes, ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const overlay = overlayRef.current;
    const dialog = overlay?.querySelector<HTMLElement>('[role="dialog"]');
    const previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const getFocusableElements = () => {
      if (!dialog) {
        return [];
      }

      return Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
    };

    requestAnimationFrame(() => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
        return;
      }

      dialog?.focus();
    });

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialog) {
        return;
      }

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement || document.activeElement === dialog) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTab);

    return () => {
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = originalOverflow;
      previousActiveElement?.focus();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-canvas/80 p-4 backdrop-blur-md animate-fade-in sm:p-6"
      onClick={() => onOpenChange(false)}
      ref={overlayRef}
    >
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full animate-slide-up sm:animate-scale-in" onClick={(event) => event.stopPropagation()}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function DialogContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-modal="true"
      className={cn(
        'max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-5 text-foreground-primary shadow-modal sm:max-h-[calc(100dvh-4rem)] sm:p-6',
        className
      )}
      role="dialog"
      tabIndex={-1}
      {...props}
    />
  );
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col gap-1.5', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-title-md font-semibold text-foreground-primary', className)} {...props} />;
}

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-body-sm text-foreground-secondary', className)} {...props} />;
}
