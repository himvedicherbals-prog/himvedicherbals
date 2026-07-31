import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HimVedi Herbals | Ancient Ayurvedic Wisdom for Modern Wellness',
  description: 'Discover authentic Ayurvedic herbal products crafted from traditional recipes. Pure Himalayan herbs for stress relief, immunity, digestion, and overall wellness.',
  keywords: ['Ayurveda', 'herbal products', 'Ashwagandha', 'Tulsi', 'Triphala', 'natural remedies', 'wellness'],
  authors: [{ name: 'HimVedi Herbals' }],
  openGraph: {
    title: 'HimVedi Herbals - Natural Ayurvedic Products',
    description: 'Ancient wisdom meets modern wellness with our authentic herbal formulations.',
    type: 'website',
    locale: 'en_US',
    siteName: 'HimVedi Herbals',
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
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Google Fonts */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
