import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shift OS',
  description: 'Shift OS auth scaffold with Supabase SSR'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
