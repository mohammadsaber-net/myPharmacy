import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { productImages, products } from '@/db/schema';
import { requireAdminResponse } from '@/lib/auth/require-admin';
import { deleteCloudinaryImage, uploadProductImage } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const maxDuration = 60;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminResponse();
  if (auth.response) return auth.response;
  const { id } = await params;
  const formData = await req.formData().catch(() => null);
  const file = formData?.get('image');
  if (!(file instanceof File)) return NextResponse.json({ error: 'اختر صورة للمنتج أولًا.' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WEBP أو AVIF.' }, { status: 400 });
  if (file.size < 1 || file.size > MAX_IMAGE_SIZE) return NextResponse.json({ error: 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت.' }, { status: 400 });
  const [product] = await db.select({ id: products.id, name: products.name }).from(products).where(eq(products.id, id)).limit(1);
  if (!product) return NextResponse.json({ error: 'المنتج غير موجود.' }, { status: 404 });

  let uploaded: { secureUrl: string; publicId: string } | null = null;
  let databaseCommitted = false;
  try {
    uploaded = await uploadProductImage(file, id);
    const oldImages = await db.select({ id: productImages.id, publicId: productImages.publicId })
      .from(productImages).where(and(eq(productImages.productId, id), eq(productImages.isPrimary, true)));
    await db.transaction(async (tx) => {
      await tx.update(productImages).set({ isPrimary: false }).where(eq(productImages.productId, id));
      await tx.insert(productImages).values({
        productId: id,
        imageUrl: uploaded!.secureUrl,
        publicId: uploaded!.publicId,
        altText: product.name,
        isPrimary: true,
        sortOrder: 0,
      });
    });
    databaseCommitted = true;
    for (const oldImage of oldImages) {
      if (oldImage.publicId) {
        try { await deleteCloudinaryImage(oldImage.publicId); } catch (error) { console.error('Cloudinary old image cleanup failed:', error); }
      }
      try { await db.delete(productImages).where(eq(productImages.id, oldImage.id)); } catch (error) { console.error('Old product image record cleanup failed:', error); }
    }
    return NextResponse.json({ ok: true, imageUrl: uploaded.secureUrl });
  } catch (error) {
    if (uploaded?.publicId && !databaseCommitted) {
      try { await deleteCloudinaryImage(uploaded.publicId); } catch (cleanupError) { console.error('Cloudinary upload rollback failed:', cleanupError); }
    }
    console.error('Product image upload failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'تعذر رفع صورة المنتج.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminResponse();
  if (auth.response) return auth.response;
  const { id } = await params;
  const images = await db.select({ id: productImages.id, publicId: productImages.publicId })
    .from(productImages).where(eq(productImages.productId, id));
  if (!images.length) return NextResponse.json({ ok: true });
  await db.delete(productImages).where(eq(productImages.productId, id));
  for (const image of images) {
    if (image.publicId) {
      try { await deleteCloudinaryImage(image.publicId); } catch (error) { console.error('Cloudinary image deletion failed:', error); }
    }
  }
  return NextResponse.json({ ok: true });
}
