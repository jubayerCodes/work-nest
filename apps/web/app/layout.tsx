import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'WorkNest', template: '%s | WorkNest' },
  description: 'Collaborative Team Hub — manage goals, tasks, and announcements in real time.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1px solid var(--border-strong)',
              borderRadius: '10px',
              fontSize: '0.875rem',
            },
          }}
        />
      </body>
    </html>
  );
}
