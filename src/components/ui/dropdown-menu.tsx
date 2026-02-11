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

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (value: boolean) => void;
};

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const context = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <DropdownMenuContext.Provider value={context}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ children }: { children: ReactNode }) {
  const context = useContext(DropdownMenuContext);
  return (
    <button type="button" onClick={() => context?.setOpen(!context.open)}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const context = useContext(DropdownMenuContext);

  if (!context?.open) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute right-0 z-10 mt-2 min-w-32 rounded-md border border-slate-200 bg-white p-1 shadow-md',
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuItem({ className, ...props }: HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn('flex w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-slate-100', className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('my-1 h-px bg-slate-200', className)} {...props} />;
}
