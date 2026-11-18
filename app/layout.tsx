import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'كاميرات مفتوحة | إسرائيل — بث مباشر بلا كلمة مرور',
  description:
    'دليل الكاميرات الإسرائيلية المكشوفة على الإنترنت: صور حيّة تُسحب عبر بروكسي خاص، وتُفتح كل كاميرا بزر واحد. مصدر مباشر، بلا بيانات وهمية.',
  keywords: ['كاميرات مباشرة', 'إسرائيل', 'insecam', 'opencctv', 'بث مباشر', 'كاميرات مفتوحة'],
  openGraph: {
    title: 'كاميرات مفتوحة | إسرائيل',
    description: 'كاميرات إسرائيلية مكشوفة على الإنترنت تُفتح بزر واحد — صور حيّة عبر بروكسي خاص.',
    type: 'website',
    locale: 'ar_IL',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      {
        url:
          'data:image/svg+xml,' +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="78" font-size="80">📹</text></svg>',
          ),
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#070b14',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
