import './globals.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'TripAIvisor',
  description: 'TripAIvisor migration workspace'
};

const inter = localFont({
  src: [
    {
      path: './fonts/inter/Inter-VariableFont_opsz,wght.ttf',
      weight: '100 900',
      style: 'normal'
    },
    {
      path: './fonts/inter/Inter-Italic-VariableFont_opsz,wght.ttf',
      weight: '100 900',
      style: 'italic'
    }
  ],
  display: 'swap',
  variable: '--font-inter'
});

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable} ${inter.className}`}>
      <body>{children}</body>
    </html>
  );
}
