import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { productImages, products } from '@/db/schema';
import { requireAdminResponse } from '@/lib/auth/require-admin';
import { deleteCloudinaryImages, uploadProductImage } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const maxDuration = 60;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteContext) {
  const auth = await requireAdminResponse();
  if (auth.response) return auth.response;
  const { id } = await params;
  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'بيانات الصور غير صالحة.' }, { status: 400 });

  const files = formData.getAll('images').filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const keepRaw = formData.get('keepImageIds');
  const primaryRaw = formData.get('primaryImageKey');
  if (files.length > MAX_IMAGES) return NextResponse.json({ error: `يمكن إضافة ${MAX_IMAGES} صور كحد أقصى في المرة الواحدة.` }, { status: 400 });
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'نوع صورة غير مدعوم. استخدم JPG أو PNG أو WEBP أو AVIF.' }, { status: 400 });
    if (file.size > MAX_IMAGE_SIZE) return NextResponse.json({ error: 'يجب ألا يتجاوز حجم كل صورة 5 ميجابايت.' }, { status: 400 });
  }

  let keepImageIds: string[];
  try {
    keepImageIds = keepRaw ? JSON.parse(String(keepRaw)) as string[] : [];
    if (!Array.isArray(keepImageIds) || keepImageIds.some((value) => typeof value !== 'string') || new Set(keepImageIds).size !== keepImageIds.length) throw new Error('invalid');
  } catch {
    return NextResponse.json({ error: 'قائمة الصور المحتفظ بها غير صحيحة.' }, { status: 400 });
  }

  const [product] = await db.select({ id: products.id, name: products.name }).from(products).where(eq(products.id, id)).limit(1);
  if (!product) return NextResponse.json({ error: 'المنتج غير موجود.' }, { status: 404 });
  const currentImages = await db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.sortOrder));
  const currentIds = new Set(currentImages.map((image) => image.id));
  if (keepImageIds.some((imageId) => !currentIds.has(imageId))) {
    return NextResponse.json({ error: 'بعض الصور المحددة لا تخص هذا المنتج. حدّث الصفحة وحاول مرة أخرى.' }, { status: 409 });
  }
  if (keepImageIds.length + files.length > MAX_IMAGES) {
    return NextResponse.json({ error: `لا يمكن أن يتجاوز إجمالي صور المنتج ${MAX_IMAGES} صور.` }, { status: 400 });
  }

  const uploaded: Array<{ secureUrl: string; publicId: string }> = [];
  try {
    for (const file of files) uploaded.push(await uploadProductImage(file, id));

    const newPrimaryMatch = /^new:(\d+)$/.exec(String(primaryRaw || ''));
    const existingPrimaryId = String(primaryRaw || '').startsWith('existing:') ? String(primaryRaw).slice('existing:'.length) : null;
    const primaryNewIndex = newPrimaryMatch ? Number(newPrimaryMatch[1]) : -1;
    const validPrimary = existingPrimaryId ? keepImageIds.includes(existingPrimaryId) : primaryNewIndex >= 0 && primaryNewIndex < uploaded.length;
    const primaryKey = validPrimary ? String(primaryRaw) : keepImageIds.length ? `existing:${keepImageIds[0]}` : uploaded.length ? 'new:0' : null;

    const keptImages = keepImageIds.map((imageId) => currentImages.find((image) => image.id === imageId)!).filter(Boolean);
    const nextImages: Array<{ id?: string; productId: string; imageUrl: string; publicId: string | null; altText: string }> = [
      ...keptImages.map((image) => ({ id: image.id, productId: id, imageUrl: image.imageUrl, publicId: image.publicId, altText: image.altText || product.name })),
      ...uploaded.map((image) => ({ productId: id, imageUrl: image.secureUrl, publicId: image.publicId, altText: product.name })),
    ];

    await db.transaction(async (tx) => {
      await tx.delete(productImages).where(eq(productImages.productId, id));
      if (nextImages.length) {
        await tx.insert(productImages).values(nextImages.map((image, index) => ({
          ...image,
          sortOrder: index,
          isPrimary: primaryKey === (image.id ? `existing:${image.id}` : `new:${index - keptImages.length}`),
        })));
      }
    });

    const retained = new Set(keepImageIds);
    const removedPublicIds = currentImages.filter((image) => !retained.has(image.id)).map((image) => image.publicId || '').filter(Boolean);
    const cleanupFailures = await deleteCloudinaryImages(removedPublicIds);
    return NextResponse.json({
      ok: true,
      images: nextImages.length,
      cleanupWarning: cleanupFailures.length ? 'تم تحديث الصور، لكن تعذر حذف بعض الصور القديمة من Cloudinary. راجع سجلات الخادم.' : undefined,
    });
  } catch (error) {
    const cleanupFailures = await deleteCloudinaryImages(uploaded.map((image) => image.publicId));
    if (cleanupFailures.length) console.error('Cloudinary rollback cleanup failed:', cleanupFailures);
    console.error('Product image update failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'تعذر تحديث صور المنتج.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const auth = await requireAdminResponse();
  if (auth.response) return auth.response;
  const { id } = await params;
  const images = await db.select({ id: productImages.id, publicId: productImages.publicId }).from(productImages).where(eq(productImages.productId, id));
  await db.delete(productImages).where(eq(productImages.productId, id));
  const cleanupFailures = await deleteCloudinaryImages(images.map((image) => image.publicId || ''));
  return NextResponse.json({ ok: true, cleanupWarning: cleanupFailures.length ? 'تعذر حذف بعض الصور من Cloudinary. راجع سجلات الخادم.' : undefined });
}
