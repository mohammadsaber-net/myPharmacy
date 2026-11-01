import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/components/store/cart-provider';
import { StoreUiProvider } from '@/components/store/store-ui-provider';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const newLocal = 'صيدلية د';
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'صيدليتي | رعايتك أقرب', template: '%s | صيدليتي' },
  description: 'تصفح منتجات صيدليتي، تعرّف على التصنيفات المتاحة، وأرسل طلبك بسهولة مع الدفع نقدًا عند الاستلام.',
  applicationName:"صيدلية د. محمد صابر",
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    siteName: "صيدلية د. محمد صابر",
    title: 'صيدليتي | رعايتك أقرب',
    description: 'احتياجاتك الصحية ومنتجات العناية في مكان واحد.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body><CartProvider><StoreUiProvider>{children}</StoreUiProvider></CartProvider></body></html>;
}
