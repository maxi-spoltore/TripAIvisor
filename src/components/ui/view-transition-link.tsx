'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CSSProperties, ComponentPropsWithoutRef, MouseEvent } from 'react';

type ViewTransitionLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, 'href'> & {
  href: string;
  transitionName?: string;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => void;
};

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function ViewTransitionLink({ href, onClick, style, transitionName, ...props }: ViewTransitionLinkProps) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const viewTransitionDocument = document as ViewTransitionDocument;
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;

    if (!viewTransitionDocument.startViewTransition || reducedMotion) {
      return;
    }

    event.preventDefault();
    viewTransitionDocument.startViewTransition(() => {
      router.push(href);
    });
  };

  const nextStyle: CSSProperties | undefined = transitionName
    ? {
        ...style,
        viewTransitionName: transitionName
      }
    : style;

  return <Link {...props} href={href} onClick={handleClick} style={nextStyle} />;
}
