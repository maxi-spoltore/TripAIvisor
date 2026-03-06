'use client';

import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
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

const VIEWPORT_GUTTER = 16;
const POPOVER_OFFSET = 8;

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
  const [position, setPosition] = useState<CSSProperties>({
    left: 0,
    maxHeight: 0,
    maxWidth: 0,
    minWidth: 0,
    top: 0
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const triggerRect = triggerRef.current?.getBoundingClientRect();
    if (!triggerRect) {
      return;
    }

    const contentRect = contentRef.current?.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const maxWidth = Math.max(0, viewportWidth - VIEWPORT_GUTTER * 2);
    const estimatedWidth = Math.min(contentRect?.width ?? triggerRect.width, maxWidth);
    const estimatedHeight = contentRect?.height ?? 320;

    const defaultLeft = align === 'end' ? triggerRect.right - estimatedWidth : triggerRect.left;
    const clampedLeft = Math.min(
      Math.max(defaultLeft, VIEWPORT_GUTTER),
      Math.max(VIEWPORT_GUTTER, viewportWidth - estimatedWidth - VIEWPORT_GUTTER)
    );

    const spaceBelow = viewportHeight - triggerRect.bottom - POPOVER_OFFSET - VIEWPORT_GUTTER;
    const spaceAbove = triggerRect.top - POPOVER_OFFSET - VIEWPORT_GUTTER;
    const shouldShowAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
    const top = shouldShowAbove
      ? Math.max(VIEWPORT_GUTTER, triggerRect.top - POPOVER_OFFSET - estimatedHeight)
      : triggerRect.bottom + POPOVER_OFFSET;
    const maxHeight = Math.max(
      120,
      shouldShowAbove ? triggerRect.top - POPOVER_OFFSET - VIEWPORT_GUTTER : spaceBelow
    );

    setPosition({
      left: clampedLeft,
      maxHeight,
      maxWidth,
      minWidth: Math.min(triggerRect.width, maxWidth),
      top,
      transformOrigin: shouldShowAbove ? 'bottom' : 'top'
    });
  }, [align]);

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

    updatePosition();
    const animationFrameId = window.requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  const content =
    open && mounted
      ? createPortal(
          <div
            className={cn(
              'fixed z-[70] overflow-y-auto rounded-lg border border-border bg-elevated shadow-floating animate-fade-in',
              className
            )}
            ref={contentRef}
            style={position}
          >
            {children}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={triggerRef} className="inline-flex max-w-full">
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
