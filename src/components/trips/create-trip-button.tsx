import Link from 'next/link';
import { Plus } from 'lucide-react';

type CreateTripButtonProps = {
  href: string;
  label: string;
};

export function CreateTripButton({ href, label }: CreateTripButtonProps) {
  return (
    <Link
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-primary-700 active:scale-[0.98]"
      href={href}
    >
      <Plus className="h-4 w-4" />
      {label}
    </Link>
  );
}
