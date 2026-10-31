import { NextResponse } from 'next/server';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
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
  price: z.coerce.number().min(0).max(999999999),
  discount: z.coerce.number().min(0).max(100).default(0),
  quantity: z.coerce.number().int().min(0).max(1000000),
  lowStockThreshold: z.coerce.number().int().min(0).max(1000000).default(5),
  requiresPrescription: z.boolean().default(false), isActive: z.boolean().default(true),
});
export async function GET(req: Request) {
  const auth = await requireAdminResponse(); if (auth.response) return auth.response;
  const term = new URL(req.url).searchParams.get('q')?.trim();
  const query = db.select({
    id: products.id, name: products.name, slug: products.slug, sku: products.sku, description: products.description,
    type: products.type, price: products.price, discount: products.discount,
    quantity: products.quantity, lowStockThreshold: products.lowStockThreshold,
    requiresPrescription: products.requiresPrescription, isActive: products.isActive,
    categoryId: products.categoryId, categoryName: categories.name, imageUrl: productImages.imageUrl,
  }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).leftJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true))).orderBy(desc(products.createdAt));
  const rows = term ? await query.where(or(ilike(products.name, `%${term}%`), ilike(products.sku, `%${term}%`))) : await query;
  return NextResponse.json(rows, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
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
