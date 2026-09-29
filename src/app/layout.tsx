import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Evelyn · Task Tracker',
  description: 'Everyday Virtual Executive for Lists & Your Nudges',
  icons: {
    icon: '/evelyn.jpg',
    apple: '/evelyn.jpg',
  },
};

export const viewport: Viewport = {
  themeColor: '#060810',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}