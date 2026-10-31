import { StoreHeader } from '@/components/store/header';
import { CheckoutForm } from '@/components/store/checkout-form';
export default function CheckoutPage() { return <><StoreHeader/><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><h1 className="text-3xl font-black">إتمام الطلب</h1><p className="mb-6 mt-2 text-sm text-slate-500">أدخل بيانات التواصل والعنوان، وستتواصل معك الصيدلية لتأكيد الطلب.</p><CheckoutForm/></main></>; }
