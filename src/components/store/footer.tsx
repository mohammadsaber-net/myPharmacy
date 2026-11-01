import Link from 'next/link';

export function StoreFooter() {
  return <footer className="store-footer mt-16 border-t border-slate-200 bg-gray-800">
    <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
      <div><Link href="/" className="text-xl font-black text-emerald-400">صيدليتي</Link><p className="mt-2 max-w-sm text-sm leading-7 text-slate-100">رعايتك أقرب. تصفح احتياجاتك الصحية ومنتجات العناية، وسنتواصل معك لتأكيد الطلب والتوصيل.</p></div>
      <div><h2 className="font-bold text-slate-100">روابط مهمة</h2><div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-100"><Link href="/products">المنتجات</Link><Link href="/privacy">سياسة الخصوصية</Link><Link href="/terms">الشروط والأحكام</Link><Link href="/policy">سياسات التوصيل والاسترجاع</Link></div></div>
      <div><h2 className="font-bold text-slate-100">خدمة العملاء</h2><p className="mt-3 text-sm leading-7 text-slate-100">للاستفسارات أو طلب منتج غير متوفر، استخدم خيارات التواصل من القائمة الرئيسية.</p></div>
    </div>
    <div className="border-t border-slate-100 px-4 py-4 text-center text-xs text-slate-300">© {new Date().getFullYear()} صيدليتي — جميع الحقوق محفوظة</div>
  </footer>;
}
