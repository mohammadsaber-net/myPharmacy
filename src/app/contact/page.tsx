import Link from 'next/link';
import { StoreHeader } from '@/components/store/header';
import ContactForm from '@/components/store/contact-form';
import { StoreFooter } from '@/components/store/footer';
export const metadata={title:'تواصل معنا | صيدليتي'};
export default function ContactPage(){return <><StoreHeader/><main className="mx-auto max-w-3xl px-4 py-10" dir="rtl"><Link href="/" className="text-sm font-semibold text-emerald-700">الرئيسية</Link><h1 className="mt-3 text-3xl font-black">تواصل مع الصيدلية</h1><p className="mb-6 mt-3 leading-7 text-slate-600">أرسل استفسارك أو ملاحظتك، وسيتمكن فريق الصيدلية من مراجعتها والرد عليك.</p><ContactForm/></main><StoreFooter /></>}
