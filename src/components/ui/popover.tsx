'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type PopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'end';
  className?: string;
  disabled?: boolean;
};

export function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  align = 'start',
  className,
  disabled = false
}: PopoverProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      const isInsideTrigger = triggerRef.current?.contains(targetNode);
      const isInsideContent = contentRef.current?.contains(targetNode);

      if (!isInsideTrigger && !isInsideContent) {
        onOpenChange(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updatePosition = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      if (!triggerRect) {
        return;
      }

      setPosition({
        top: triggerRect.bottom + 8,
        left: align === 'end' ? triggerRect.right : triggerRect.left
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [align, open]);

  const content =
    open && mounted
      ? createPortal(
          <div
            className={cn(
              'fixed z-[70] rounded-xl border border-slate-200 bg-white shadow-lg animate-fade-in',
              className
            )}
            ref={contentRef}
            style={{
              top: position.top,
              left: position.left,
              transform: align === 'end' ? 'translateX(-100%)' : undefined
            }}
          >
            {children}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={triggerRef} className="relative inline-block">
      <div
        onClick={() => {
          if (!disabled) {
            onOpenChange(!open);
          }
        }}
      >
        {trigger}
      </div>
      {content}
    </div>
  );
}
