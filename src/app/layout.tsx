import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watchall LierGame',
  description: '후',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>???????????{children}</body>
    </html>
  );
}
