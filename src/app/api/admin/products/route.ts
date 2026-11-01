import { NextResponse } from 'next/server';
import { asc, desc, eq, ilike, inArray, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { categories, products, productImages } from '@/db/schema';
import { requireAdminResponse } from '@/lib/auth/require-admin';
export const runtime = 'nodejs';
const productSchema = z.object({
  name: z.string().trim().min(2).max(220), slug: z.string().trim().min(2).max(240).regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional().nullable(), sku: z.string().max(80).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  type: z.enum(['medicine','medical_supply','cosmetics','health_product']),
  price: z.coerce.number().min(0).max(999999999), discount: z.coerce.number().min(0).max(100).default(0),
  quantity: z.coerce.number().int().min(0).max(1000000), lowStockThreshold: z.coerce.number().int().min(0).max(1000000).default(5),
  requiresPrescription: z.boolean().default(false), isActive: z.boolean().default(true),
});
export async function GET(req: Request) {
  const auth = await requireAdminResponse(); if (auth.response) return auth.response;
  const term = new URL(req.url).searchParams.get('q')?.trim();
  const baseQuery = db.select({
    id: products.id, name: products.name, slug: products.slug, sku: products.sku, description: products.description,
    type: products.type, price: products.price, discount: products.discount, quantity: products.quantity,
    lowStockThreshold: products.lowStockThreshold, requiresPrescription: products.requiresPrescription,
    isActive: products.isActive, categoryId: products.categoryId, categoryName: categories.name,
  }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).orderBy(desc(products.createdAt));
  const rows = term ? await baseQuery.where(or(ilike(products.name, `%${term}%`), ilike(products.sku, `%${term}%`))) : await baseQuery;
  const ids = rows.map((row) => row.id);
  const images = ids.length ? await db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.sortOrder)) : [];
  const grouped = new Map<string, typeof images>();
  for (const image of images) grouped.set(image.productId, [...(grouped.get(image.productId) || []), image]);
  return NextResponse.json(rows.map((row) => {
    const productImagesList = grouped.get(row.id) || [];
    return { ...row, images: productImagesList, imageUrl: productImagesList.find((image) => image.isPrimary)?.imageUrl || productImagesList[0]?.imageUrl || null };
  }), { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}
export async function POST(req: Request) {
  const auth = await requireAdminResponse(); if (auth.response) return auth.response;
  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'راجع بيانات المنتج والسعر والكمية.' }, { status: 400 });
  try {
    const [created] = await db.insert(products).values({
      ...parsed.data, price: parsed.data.price.toFixed(2), discount: parsed.data.discount.toFixed(2),
    }).returning({ id: products.id });
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'تعذر إضافة المنتج. تأكد من عدم تكرار الرابط المختصر أو SKU وصحة التصنيف.' }, { status: 409 });
  }
}
