import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#141526',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Genetic Algorithm V2', // Default title, inferred
  description: 'Genetic Algorithm simulation', // Default description
  applicationName: 'Genetic Algorithm V2',
  keywords: ['react', 'typescript', 'javascript', 'github', 'nextjs'],
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.png',
  },
  manifest: '/manifest.json',
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
