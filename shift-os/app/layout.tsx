import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shift OS',
  description: 'The operating system for your club',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%23000'/><text y='.9em' font-size='72' font-family='Arial' font-weight='bold' fill='%2300C851' x='50%25' text-anchor='middle'>S</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
