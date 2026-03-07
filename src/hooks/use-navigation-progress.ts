'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function useNavigationProgress() {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // End detection: pathname changed means navigation completed
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
    setIsNavigating(false);
  }, [pathname]);

  // Start detection: click listener on <a> elements
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Skip if modifier keys (new tab / window)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      // Find nearest <a> ancestor
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Skip target="_blank"
      if (anchor.target === '_blank') return;

      // Skip external links
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        // Skip same pathname
        if (url.pathname === window.location.pathname) return;
        // Skip hash-only changes
        if (url.pathname === window.location.pathname && url.hash) return;
      } catch {
        return;
      }

      // Debounce: only show bar after 100ms to avoid flicker on fast navigations
      debounceTimer.current = setTimeout(() => {
        setIsNavigating(true);

        // Safety timeout: reset after 10s if navigation never completes
        safetyTimer.current = setTimeout(() => {
          setIsNavigating(false);
        }, 10_000);
      }, 100);
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return { isNavigating };
}
