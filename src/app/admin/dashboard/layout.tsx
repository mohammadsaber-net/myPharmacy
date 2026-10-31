import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentAdmin } from '@/lib/auth/session';
import AdminLogout from '@/components/admin/logout';

export const metadata: Metadata = {
  title: { default: 'لوحة الإدارة | صيدليتي', template: '%s | إدارة صيدليتي' },
  robots: { index: false, follow: false, nocache: true },
};

const navigation = [
  { href: '/admin/dashboard', label: 'الرئيسية', icon: '⌂' },
  { href: '/admin/dashboard/products', label: 'المنتجات', icon: '▦' },
  { href: '/admin/dashboard/categories', label: 'التصنيفات', icon: '◇' },
  { href: '/admin/dashboard/orders', label: 'الطلبات', icon: '▤' },
  { href: '/admin/dashboard/inventory', label: 'المخزون', icon: '▥' },
  { href: '/admin/dashboard/requests', label: 'طلبات المنتجات', icon: '＋' },
  { href: '/admin/dashboard/messages', label: 'رسائل العملاء', icon: '✉' },
];

export default async function AdminDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  return (
    <div className="admin-app" dir="rtl">
      <aside className="admin-sidebar">
        <Link href="/admin/dashboard" className="admin-brand">
          <span className="admin-brand-mark">ص</span>
          <span><strong>صيدليتي</strong><small>لوحة إدارة الصيدلية</small></span>
        </Link>
        <div className="admin-nav-label">القائمة الرئيسية</div>
        <nav className="admin-nav" aria-label="القائمة الرئيسية">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href} className="admin-nav-link">
              <span className="admin-nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer"><span className="admin-status-dot" /><span>النظام يعمل</span></div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title"><span className="admin-topbar-eyebrow">مساحة العمل</span><strong>إدارة صيدليتي</strong></div>
          <div className="admin-user">
            <span className="admin-avatar">{admin.fullName.trim().charAt(0) || 'م'}</span>
            <span className="admin-user-details"><strong>{admin.fullName}</strong><small>مدير النظام</small></span>
            <AdminLogout />
          </div>
        </header>
        <nav className="admin-mobile-nav" aria-label="التنقل السريع">
          {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
