import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'إدارة صيدليتي', template: '%s | صيدليتي' },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
