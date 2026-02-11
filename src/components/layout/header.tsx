import { LocaleSwitcher } from './locale-switcher';

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <span className="font-semibold">TripAIvisor</span>
        <LocaleSwitcher />
      </div>
    </header>
  );
}
