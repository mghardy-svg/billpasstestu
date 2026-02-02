import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header, Footer } from '@/components/layout';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'California Proposition Predictor | Legislative Analysis & Forecasting',
  description:
    'A data-driven tool for estimating the probability that California statewide propositions pass, based on historical data, campaign finances, demographics, and ballot wording.',
  keywords: [
    'California',
    'propositions',
    'ballot measures',
    'predictions',
    'elections',
    'voting',
    'campaign finance',
    'demographics',
    'legislative tracking',
    'political analysis',
  ],
  authors: [{ name: 'CA Prop Predictor Team' }],
  openGraph: {
    title: 'California Proposition Predictor',
    description: 'Data-driven predictions for California ballot propositions',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        {/* Subtle government-style top border */}
        <div className="h-1 bg-gradient-to-r from-blue-800 via-red-700 to-blue-800" />
        
        <Header />
        
        <main className="flex-1 relative">
          {/* Optional: Add a subtle background pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
          <div className="relative z-10">
            {children}
          </div>
        </main>
        
        <Footer />
      </body>
    </html>
  );
}
