import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'AI Video Ad Generator',
  description: 'Generate professional video ads with AI',
  keywords: 'video, ads, ai, generator, marketing',
  authors: [{ name: 'AI Video Ad Generator Team' }],
  openGraph: {
    title: 'AI Video Ad Generator',
    description: 'Generate professional video ads with AI',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}