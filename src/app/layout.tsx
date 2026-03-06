import './globals.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'TripAIvisor',
  description: 'TripAIvisor migration workspace'
};

const manrope = localFont({
  src: [
    {
      path: './fonts/Manrope/Manrope-VariableFont_wght.ttf',
      weight: '200 800',
      style: 'normal'
    }
  ],
  display: 'swap',
  variable: '--font-manrope'
});

const spaceGrotesk = localFont({
  src: [
    {
      path: './fonts/Space_Grotesk/SpaceGrotesk-VariableFont_wght.ttf',
      weight: '300 700',
      style: 'normal'
    }
  ],
  display: 'swap',
  variable: '--font-space-grotesk'
});

const themeInitScript = `
(() => {
  try {
    const storageKey = 'tripaivisor-theme';
    const root = document.documentElement;
    const storedTheme = localStorage.getItem(storageKey);
    const preferredTheme = storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
      ? storedTheme
      : 'system';
    const resolvedTheme = preferredTheme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preferredTheme;

    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
  } catch {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
  }
})();
`;

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${manrope.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
