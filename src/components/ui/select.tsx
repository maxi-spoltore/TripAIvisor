'use client';

import {
  ButtonHTMLAttributes,
  createContext,
  HTMLAttributes,
  ReactNode,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type SelectContextValue = {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (value: boolean) => void;
  listboxId: string;
};

const SelectContext = createContext<SelectContextValue | null>(null);

type SelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
};

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (!rootRef.current?.contains(targetNode)) {
        setOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const context = useMemo(
    () => ({ value, onValueChange, open, setOpen, listboxId }),
    [listboxId, onValueChange, open, value]
  );

  return (
    <SelectContext.Provider value={context}>
      <div className="relative w-full" ref={rootRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  className,
  children,
  onClick,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = useContext(SelectContext);

  return (
    <button
      aria-controls={context?.listboxId}
      aria-expanded={context?.open}
      aria-haspopup="listbox"
      type="button"
      disabled={disabled}
      className={cn(
        'flex h-11 w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 text-body-sm text-foreground-primary transition-[border-color,box-shadow,background-color] duration-base ease-standard focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-60',
        className
      )}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || disabled) {
          return;
        }

        context?.setOpen(!context.open);
      }}
      {...props}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-left">{children}</span>
      <ChevronDown
        aria-hidden="true"
        className={cn(
          'h-4 w-4 shrink-0 text-foreground-muted transition-transform duration-fast ease-standard',
          context?.open ? 'rotate-180' : ''
        )}
      />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = useContext(SelectContext);
  const hasValue = Boolean(context?.value);

  return (
    <span className={cn('block truncate', !hasValue && 'text-foreground-muted')}>
      {context?.value ?? placeholder ?? ''}
    </span>
  );
}

export function SelectContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const context = useContext(SelectContext);

  if (!context || !context.open) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute left-0 top-[calc(100%+0.5rem)] z-40 max-h-72 w-full min-w-[10rem] overflow-y-auto rounded-md border border-border bg-elevated p-1 shadow-floating animate-fade-in',
        className
      )}
      id={context.listboxId}
      role="listbox"
      {...props}
    />
  );
}

type SelectItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};

export function SelectItem({ className, value, children, onClick, ...props }: SelectItemProps) {
  const context = useContext(SelectContext);
  const isSelected = context?.value === value;

  return (
    <button
      type="button"
      aria-selected={isSelected}
      role="option"
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-left text-body-sm text-foreground-secondary transition-colors duration-fast ease-standard hover:bg-subtle hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        isSelected && 'bg-brand-accent-soft text-foreground-primary',
        className
      )}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }

        context?.onValueChange?.(value);
        context?.setOpen(false);
      }}
      {...props}
    >
      {children}
      {isSelected ? <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-primary" /> : null}
    </button>
  );
}
