import Link from 'next/link';

type CreateTripButtonProps = {
  href: string;
  label: string;
};

export function CreateTripButton({ href, label }: CreateTripButtonProps) {
  return (
    <Link
      className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
      href={href}
    >
      {label}
    </Link>
  );
}
