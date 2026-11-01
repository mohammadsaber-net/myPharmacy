'use client';
import Image from 'next/image';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStoreUi } from '@/components/store/store-ui-context';

type ProductImage = { id: string; imageUrl: string; publicId: string | null; altText: string | null; sortOrder: number; isPrimary: boolean };
type Product = { id: string; name: string; slug: string; sku: string | null; description: string | null; type: string; price: string; discount: string; quantity: number; lowStockThreshold: number; requiresPrescription: boolean; isActive: boolean; categoryId: string | null; categoryName: string | null; imageUrl: string | null; images: ProductImage[] };
type Category = { id: string; name: string };
type NewImage = { id: string; file: File; preview: string };
const blank = { name: '', slug: '', sku: '', description: '', categoryId: '', type: 'medical_supply', price: '0', discount: '0', quantity: '0', lowStockThreshold: '5', requiresPrescription: false, isActive: true };

export default function ProductsManager() {
  const router = useRouter();
  const { toast } = useStoreUi();
  const [rows, setRows] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [removedExistingImageIds, setRemovedExistingImageIds] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [primaryImageKey, setPrimaryImageKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const newImagesRef = useRef<NewImage[]>([]);
  const visibleExistingImages = useMemo(() => existingImages.filter((image) => !removedExistingImageIds.includes(image.id)), [existingImages, removedExistingImageIds]);
  const load = useCallback(async () => {
    const [productsResponse, categoriesResponse] = await Promise.all([fetch('/api/admin/products'), fetch('/api/admin/categories')]);
    if (productsResponse.status === 401 || categoriesResponse.status === 401) { router.replace('/admin/login'); return; }
    if (!productsResponse.ok || !categoriesResponse.ok) throw new Error('تعذر تحميل بيانات المنتجات والتصنيفات.');
    setRows(await productsResponse.json());
    setCats(await categoriesResponse.json());
  }, [router]);

  useEffect(() => { void Promise.resolve().then(load).catch(() => setError('تعذر تحميل البيانات')); }, [load]);
  useEffect(() => () => { newImagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview)); }, []);

  function change(key: keyof typeof blank, value: string | boolean) { setForm((old) => ({ ...old, [key]: value })); }
  function clearNewImages() { newImages.forEach((image) => URL.revokeObjectURL(image.preview)); newImagesRef.current = []; setNewImages([]); }
  function resetForm() {
    clearNewImages(); setEditing(null); setForm(blank); setExistingImages([]); setRemovedExistingImageIds([]); setPrimaryImageKey(''); setError('');
  }
  function edit(product: Product) {
    clearNewImages();
    setEditing(product.id);
    setForm({ name: product.name, slug: product.slug, sku: product.sku || '', description: product.description || '', categoryId: product.categoryId || '', type: product.type, price: product.price, discount: product.discount, quantity: String(product.quantity), lowStockThreshold: String(product.lowStockThreshold), requiresPrescription: product.requiresPrescription, isActive: product.isActive });
    setExistingImages(product.images || []); setRemovedExistingImageIds([]);
    const primary = product.images?.find((image) => image.isPrimary) || product.images?.[0];
    setPrimaryImageKey(primary ? `existing:${primary.id}` : '');
    setError(''); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function selectImages(files: FileList | null) {
    if (!files?.length) return;
    const remaining = Math.max(0, 10 - visibleExistingImages.length - newImages.length);
    const selected = Array.from(files).slice(0, remaining).map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }));
    if (Array.from(files).length > remaining) setError('يمكن أن يحتوي المنتج على 10 صور كحد أقصى.');
    const nextImages = [...newImages, ...selected];
    newImagesRef.current = nextImages;
    setNewImages(nextImages);
    if (!primaryImageKey && selected[0]) setPrimaryImageKey(`new:${selected[0].id}`);
  }
  function removeNewImage(id: string) {
    const target = newImages.find((image) => image.id === id);
    if (target) URL.revokeObjectURL(target.preview);
    const nextImages = newImages.filter((image) => image.id !== id);
    newImagesRef.current = nextImages;
    setNewImages(nextImages);
    if (primaryImageKey === `new:${id}`) {
      const fallbackExisting = visibleExistingImages[0];
      const fallbackNew = newImages.find((image) => image.id !== id);
      setPrimaryImageKey(fallbackExisting ? `existing:${fallbackExisting.id}` : fallbackNew ? `new:${fallbackNew.id}` : '');
    }
  }
  function removeExistingImage(id: string) {
    setRemovedExistingImageIds((current) => [...current, id]);
    if (primaryImageKey === `existing:${id}`) {
      const fallbackExisting = visibleExistingImages.find((image) => image.id !== id);
      setPrimaryImageKey(fallbackExisting ? `existing:${fallbackExisting.id}` : newImages[0] ? `new:${newImages[0].id}` : '');
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const payload = { ...form, sku: form.sku || null, categoryId: form.categoryId || null, price: Number(form.price), discount: Number(form.discount), quantity: Number(form.quantity), lowStockThreshold: Number(form.lowStockThreshold) };
      const response = await fetch(editing ? `/api/admin/products/${editing}` : '/api/admin/products', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر حفظ المنتج.');
      const productId = editing || data.id;
      if (!editing) setEditing(productId);
      const imageChangesExist = newImages.length > 0 || removedExistingImageIds.length > 0 || (editing && primaryImageKey !== (existingImages.find((image) => image.isPrimary)?.id ? `existing:${existingImages.find((image) => image.isPrimary)!.id}` : existingImages[0] ? `existing:${existingImages[0].id}` : ''));
      if (imageChangesExist) {
        const imageData = new FormData();
        imageData.append('keepImageIds', JSON.stringify(visibleExistingImages.map((image) => image.id)));
        const primaryKeyForApi = primaryImageKey.startsWith('new:')
          ? `new:${newImages.findIndex((image) => `new:${image.id}` === primaryImageKey)}`
          : primaryImageKey;
        imageData.append('primaryImageKey', primaryKeyForApi);
        newImages.forEach((image) => imageData.append('images', image.file));
        const imageResponse = await fetch(`/api/admin/products/${productId}/image`, { method: 'POST', body: imageData });
        const imageResult = await imageResponse.json();
        if (!imageResponse.ok) throw new Error(`تم حفظ بيانات المنتج، لكن تعذر تحديث الصور: ${imageResult.error || 'حاول مرة أخرى.'}`);
        if (imageResult.cleanupWarning) toast(imageResult.cleanupWarning, 'error');
      }
      resetForm(); await load(); toast(editing ? 'تم تحديث المنتج بنجاح.' : 'تم إضافة المنتج بنجاح.', 'success');
    } catch (submitError) { const message = submitError instanceof Error ? submitError.message : 'حدث خطأ غير متوقع.'; setError(message); toast(message, 'error'); }
    finally { setBusy(false); }
  }

  async function hide(id: string) {
    if (!confirm('سيتم إخفاء المنتج وحذف جميع صوره من Cloudinary مع الاحتفاظ بسجل الطلبات. هل تريد المتابعة؟')) return;
    const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error || 'تعذر حذف المنتج');
    else { if (data.cleanupWarning) toast(data.cleanupWarning, 'error'); await load(); toast('تم حذف صور المنتج وإخفاؤه من المتجر.', 'success'); }
  }

  return <div className="grid gap-8 lg:grid-cols-[380px_1fr]" dir="rtl">
    <form onSubmit={submit} className="h-fit rounded-2xl border bg-white p-5">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">{editing ? 'تعديل المنتج' : 'إضافة منتج'}</h2>{editing && <button type="button" onClick={resetForm} className="text-sm text-gray-500">إلغاء</button>}</div>
      <div className="grid gap-3">
        {([['name', 'اسم المنتج'], ['slug', 'الرابط المختصر بالإنجليزية'], ['sku', 'كود SKU اختياري'], ['price', 'السعر بالجنيه'], ['discount', 'الخصم %'], ['quantity', 'الكمية'], ['lowStockThreshold', 'حد التنبيه للمخزون']] as const).map(([key, label]) => <label key={key} className="grid gap-1 text-sm">{label}<input required={key !== 'sku'} value={String(form[key])} onChange={(event) => change(key, event.target.value)} className="rounded-lg border p-2" /></label>)}
        <label className="grid gap-1 text-sm">التصنيف<select value={form.categoryId} onChange={(event) => change('categoryId', event.target.value)} className="rounded-lg border p-2"><option value="">بدون تصنيف</option>{cats.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="grid gap-1 text-sm">نوع المنتج<select value={form.type} onChange={(event) => change('type', event.target.value)} className="rounded-lg border p-2"><option value="medical_supply">مستلزم طبي</option><option value="cosmetics">عناية شخصية</option><option value="health_product">منتج صحي</option><option value="medicine">دواء</option></select></label>
        <label className="grid gap-1 text-sm">الوصف<textarea value={form.description} onChange={(event) => change('description', event.target.value)} className="rounded-lg border p-2" rows={3} /></label>
        <div className="grid gap-3 rounded-xl border border-dashed p-3">
          <label className="grid gap-1 text-sm font-semibold">صور المنتج <span className="font-normal text-gray-500">يمكن اختيار حتى 10 صور إجمالًا — JPG أو PNG أو WEBP أو AVIF، بحد أقصى 5 ميجابايت للصورة</span>
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => selectImages(event.target.files)} className="block w-full text-sm" />
          </label>
          {(visibleExistingImages.length > 0 || newImages.length > 0) ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {visibleExistingImages.map((image) => <div key={image.id} className={`relative rounded-xl border p-2 ${primaryImageKey === `existing:${image.id}` ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-200'}`}>
              <Image src={image.imageUrl} alt={image.altText || 'صورة المنتج'} width={160} height={120} unoptimized className="h-24 w-full rounded-lg object-contain" />
              <div className="mt-2 flex items-center justify-between gap-1"><label className="flex items-center gap-1 text-[11px]"><input type="radio" name="primaryImage" checked={primaryImageKey === `existing:${image.id}`} onChange={() => setPrimaryImageKey(`existing:${image.id}`)} /> أساسية</label><button type="button" onClick={() => removeExistingImage(image.id)} className="text-[11px] font-semibold text-rose-600">إزالة</button></div>
            </div>)}
            {newImages.map((image) => <div key={image.id} className={`relative rounded-xl border p-2 ${primaryImageKey === `new:${image.id}` ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-200'}`}>
              <Image src={image.preview} alt={image.file.name} width={160} height={120} unoptimized className="h-24 w-full rounded-lg object-contain" />
              <p className="mt-1 truncate text-[10px] text-slate-500" title={image.file.name}>{image.file.name}</p>
              <div className="mt-2 flex items-center justify-between gap-1"><label className="flex items-center gap-1 text-[11px]"><input type="radio" name="primaryImage" checked={primaryImageKey === `new:${image.id}`} onChange={() => setPrimaryImageKey(`new:${image.id}`)} /> أساسية</label><button type="button" onClick={() => removeNewImage(image.id)} className="text-[11px] font-semibold text-rose-600">إزالة</button></div>
            </div>)}
          </div> : <p className="text-xs text-slate-500">لم تتم إضافة صور لهذا المنتج بعد.</p>}
          <p className="text-xs text-slate-500">اختر صورة أساسية لتظهر في بطاقات المتجر، ويمكن للعميل استعراض باقي الصور داخل صفحة المنتج.</p>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.requiresPrescription} onChange={(event) => change('requiresPrescription', event.target.checked)} /> يتطلب وصفة/مراجعة صيدلي</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => change('isActive', event.target.checked)} /> المنتج نشط</label>
        <button disabled={busy} className="rounded-xl bg-indigo-600 p-3 font-semibold text-white disabled:opacity-60">{busy ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة المنتج'}</button>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </div>
    </form>
    <section className="overflow-hidden rounded-2xl border bg-white"><div className="border-b p-5"><h2 className="text-xl font-bold">المنتجات ({rows.length})</h2></div><div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead className="bg-gray-50"><tr>{['الصور', 'المنتج', 'التصنيف', 'السعر', 'المخزون', 'الحالة', 'إجراء'].map((label) => <th key={label} className="whitespace-nowrap p-3">{label}</th>)}</tr></thead><tbody>{rows.map((product) => <tr key={product.id} className="border-t"><td className="p-3"><div className="flex -space-x-3 space-x-reverse">{product.images?.slice(0, 3).map((image) => <Image key={image.id} src={image.imageUrl} alt={product.name} width={42} height={42} unoptimized className="h-[42px] w-[42px] rounded-lg border border-white bg-white object-contain" />)}{!product.images?.length && <span className="text-xl text-emerald-700">✚</span>}</div><small className="text-slate-400">{product.images?.length || 0} صورة</small></td><td className="min-w-40 p-3 font-semibold">{product.name}<small className="block text-gray-400">{product.slug}</small></td><td className="p-3">{product.categoryName || '—'}</td><td className="p-3">{product.price} ج.م</td><td className="p-3">{product.quantity}</td><td className="p-3">{product.isActive ? 'نشط' : 'مخفي'}</td><td className="whitespace-nowrap p-3"><button type="button" onClick={() => edit(product)} className="ml-2 text-indigo-700">تعديل</button><button type="button" onClick={() => hide(product.id)} className="text-red-700">حذف</button></td></tr>)}{!rows.length && <tr><td colSpan={7} className="p-8 text-center text-gray-500">لا توجد منتجات بعد</td></tr>}</tbody></table></div></section>
  </div>;
}
