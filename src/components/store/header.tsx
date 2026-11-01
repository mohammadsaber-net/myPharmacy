'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from './cart-provider';
import { useStoreUi } from './store-ui-context';
import { AnimatePresence, motion } from "framer-motion";
export function StoreHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { items } = useCart();
  const { openModal } = useStoreUi();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const closeMenu = () => setMenuOpen(false);
  return <header className="store-header sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
      <Link href="/" className="shrink-0" onClick={closeMenu}><span className="block text-2xl font-black text-emerald-700">صيدليتي</span><span className="text-xs text-slate-500">صحتك تهمنا</span></Link>
      <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
        <Link className="text-slate-700 transition hover:text-emerald-700" href="/products">المنتجات</Link>
        <button type="button" className="text-slate-700 transition hover:text-emerald-700" onClick={() => openModal('request')}>اطلب منتجًا</button>
        <button type="button" className="text-slate-700 transition hover:text-emerald-700" onClick={() => openModal('contact')}>تواصل معنا</button>
      </nav>
      <div className="flex items-center gap-2">
        <Link href="/cart" className="store-cart-link" aria-label={`السلة، ${cartCount} منتج`}><span aria-hidden="true">🛒</span><span>السلة</span><span className="store-cart-count" aria-label={`${cartCount} قطعة`}>{cartCount}</span></Link>
        <button type="button" className="store-menu-toggle" aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span>{menuOpen ? '×' : '☰'}</span></button>
      </div>
    </div>
    
<AnimatePresence>
  {menuOpen && (
    <motion.nav
      key="mobile-menu"
      dir="rtl"
      className="store-mobile-menu md:hidden"
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{ opacity: 0, height: 0, y: -10 }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
    >
      <Link href="/" onClick={closeMenu}>الرئيسية</Link>
      <Link href="/products" onClick={closeMenu}>المنتجات</Link>

      <button
        type="button"
        onClick={() => {
          closeMenu();
          openModal("request");
        }}
      >
        اطلب منتجًا غير متوفر
      </button>

      <button
        type="button"
        onClick={() => {
          closeMenu();
          openModal("contact");
        }}
      >
        تواصل معنا
      </button>

      <Link href="/cart" onClick={closeMenu}>
        سلة المشتريات ({cartCount})
      </Link>
    </motion.nav>
  )}
</AnimatePresence>

    {/* {menuOpen && <nav className="store-mobile-menu" dir="rtl">
      <Link href="/" onClick={closeMenu}>الرئيسية</Link>
      <Link href="/products" onClick={closeMenu}>المنتجات</Link>
      <button type="button" onClick={() => { closeMenu(); openModal('request'); }}>اطلب منتجًا غير متوفر</button>
      <button type="button" onClick={() => { closeMenu(); openModal('contact'); }}>تواصل معنا</button>
      <Link href="/cart" onClick={closeMenu}>سلة المشتريات ({cartCount})</Link>
    </nav>} */}
  </header>;
}
