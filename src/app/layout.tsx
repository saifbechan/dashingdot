import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#141526',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Dashing Dot',
  description:
    'An AI-powered endless runner where neural networks evolve to survive.',
  applicationName: 'Dashing Dot',
  keywords: [
    'phaser',
    'neuroevolution',
    'genetic algorithm',
    'nextjs',
    'typescript',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
