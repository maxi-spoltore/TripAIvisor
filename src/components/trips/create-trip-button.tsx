import { Plus } from 'lucide-react';
import { ViewTransitionLink } from '@/components/ui/view-transition-link';

type CreateTripButtonProps = {
  href: string;
  label: string;
};

export function CreateTripButton({ href, label }: CreateTripButtonProps) {
  return (
    <ViewTransitionLink
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-brand-primary-hover active:scale-[0.98]"
      href={href}
    >
      <Plus className="h-4 w-4" />
      {label}
    </ViewTransitionLink>
  );
}
