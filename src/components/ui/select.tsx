'use client';

import {
  createContext,
  HTMLAttributes,
  ReactNode,
  useContext,
  useMemo,
  useState
} from 'react';
import { cn } from '@/lib/utils';

type SelectContextValue = {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (value: boolean) => void;
};

const SelectContext = createContext<SelectContextValue | null>(null);

type SelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
};

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = useState(false);
  const context = useMemo(
    () => ({ value, onValueChange, open, setOpen }),
    [onValueChange, open, value]
  );

  return <SelectContext.Provider value={context}>{children}</SelectContext.Provider>;
}

export function SelectTrigger({ className, ...props }: HTMLAttributes<HTMLButtonElement>) {
  const context = useContext(SelectContext);

  return (
    <button
      type="button"
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm',
        className
      )}
      onClick={() => context?.setOpen(!context.open)}
      {...props}
    />
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = useContext(SelectContext);
  return <span>{context?.value ?? placeholder ?? ''}</span>;
}

export function SelectContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const context = useContext(SelectContext);

  if (!context?.open) {
    return null;
  }

  return (
    <div
      className={cn('mt-1 rounded-md border border-slate-200 bg-white p-1 shadow-md', className)}
      {...props}
    />
  );
}

type SelectItemProps = HTMLAttributes<HTMLButtonElement> & {
  value: string;
};

export function SelectItem({ className, value, children, ...props }: SelectItemProps) {
  const context = useContext(SelectContext);

  return (
    <button
      type="button"
      className={cn('flex w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-slate-100', className)}
      onClick={() => {
        context?.onValueChange?.(value);
        context?.setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
