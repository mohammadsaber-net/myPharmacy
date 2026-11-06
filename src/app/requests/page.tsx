import Link from 'next/link';
import { StoreHeader } from '@/components/store/header';
import ProductRequestForm from '@/components/store/product-request-form';
import { StoreFooter } from '@/components/store/footer';
export const metadata={title:'طلب منتج غير متوفر | صيدليتي'};
type Props={searchParams:Promise<{productName?:string}>};
export default async function ProductRequestsPage({searchParams}:Props){const params=await searchParams;const initialProductName=(params.productName||'').trim().slice(0,220);return <><StoreHeader/><main className="mx-auto max-w-3xl px-4 py-10" dir="rtl"><Link href="/" className="text-sm font-semibold text-emerald-700">الرئيسية</Link><h1 className="mt-3 text-3xl font-black">اطلب منتجًا غير متوفر</h1><p className="mb-6 mt-3 leading-7 text-slate-600">اكتب اسم المنتج وبيانات التواصل، وسنراجع إمكانية توفيره ونتواصل معك.</p><ProductRequestForm initialProductName={initialProductName}/></main><StoreFooter /></>}
