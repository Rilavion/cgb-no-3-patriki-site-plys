import type { Metadata } from 'next';
import './globals.css';

const [githubOwner, githubRepository] =
  process.env.GITHUB_REPOSITORY?.split('/') ?? [];
const siteUrl =
  process.env.GITHUB_ACTIONS === 'true' && githubOwner && githubRepository
    ? `https://${githubOwner}.github.io/${githubRepository}`
    : 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Учёт поставок',
  description: 'Оперативный учёт сотрудников на поставках ЗМХ и МС',
  openGraph: {
    title: 'Учёт поставок',
    description: 'Оперативный учёт сотрудников на поставках ЗМХ и МС',
    images: [
      {
        url: `${siteUrl}/og.png`,
        width: 1680,
        height: 945,
        alt: 'Учёт поставок — оперативная статистика',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Учёт поставок',
    description: 'Оперативный учёт сотрудников на поставках ЗМХ и МС',
    images: [`${siteUrl}/og.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
