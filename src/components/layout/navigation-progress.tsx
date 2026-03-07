'use client';

import { useNavigationProgress } from '@/hooks/use-navigation-progress';

export function NavigationProgress() {
  const { isNavigating } = useNavigationProgress();

  return (
    <div
      className="nav-progress-bar pointer-events-none fixed left-0 right-0 top-16 z-50 h-[2px] sm:top-[4.25rem]"
      role="progressbar"
      aria-hidden={!isNavigating}
      style={{ opacity: isNavigating ? 1 : 0, transition: 'opacity 150ms ease' }}
    />
  );
}
