import { NextResponse } from 'next/server';
import { asc, count, desc, eq, ilike, inArray, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { categories, products, productImages } from '@/db/schema';
import { requireAdminResponse } from '@/lib/auth/require-admin';

export const runtime = 'nodejs';
const PAGE_SIZE = 20;

const productSchema = z.object({
  name: z.string().trim().min(2).max(220),
  scientificName: z.string().trim().min(2, 'الاسم العلمي مطلوب.').max(220),
  englishName: z.string().trim().min(2, 'الاسم الإنجليزي مطلوب.').max(220),
  slug: z.string().trim().min(2).max(240).regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  type: z.enum(['medicine', 'medical_supply', 'cosmetics', 'health_product']),
  price: z.coerce.number().min(0).max(999999999),
  discount: z.coerce.number().min(0).max(100).default(0),
  quantity: z.coerce.number().int().min(0).max(1000000),
  lowStockThreshold: z.coerce.number().int().min(0).max(1000000).default(5),
  requiresPrescription: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
  const auth = await requireAdminResponse();
  if (auth.response) return auth.response;

  const searchParams = new URL(req.url).searchParams;
  const term = searchParams.get('q')?.trim() || '';
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = PAGE_SIZE;
  const offset = (page - 1) * limit;
  const where = term
    ? or(
        ilike(products.name, `%${term}%`),
        ilike(products.scientificName, `%${term}%`),
        ilike(products.englishName, `%${term}%`),
        ilike(products.description, `%${term}%`),
      )
    : undefined;

  const [rows, totalRows] = await Promise.all([
    db.select({
      id: products.id,
      name: products.name,
      scientificName: products.scientificName,
      englishName: products.englishName,
      slug: products.slug,
      description: products.description,
      type: products.type,
      price: products.price,
      discount: products.discount,
      quantity: products.quantity,
      lowStockThreshold: products.lowStockThreshold,
      requiresPrescription: products.requiresPrescription,
      isActive: products.isActive,
      categoryId: products.categoryId,
      categoryName: categories.name,
    })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(desc(products.createdAt), asc(products.name))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(products).where(where),
  ]);

  const total = Number(totalRows[0]?.total || 0);
  const ids = rows.map((row) => row.id);
  const images = ids.length
    ? await db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.sortOrder))
    : [];
  const grouped = new Map<string, typeof images>();
  for (const image of images) grouped.set(image.productId, [...(grouped.get(image.productId) || []), image]);

  const productsWithImages = rows.map((row) => {
    const productImageList = grouped.get(row.id) || [];
    return {
      ...row,
      images: productImageList,
      imageUrl: productImageList.find((image) => image.isPrimary)?.imageUrl || productImageList[0]?.imageUrl || null,
    };
  });

  return NextResponse.json({
    products: productsWithImages,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), hasNext: offset + rows.length < total, hasPrev: page > 1 },
  }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}

export async function POST(req: Request) {
  const auth = await requireAdminResponse();
  if (auth.response) return auth.response;
  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'الاسم العلمي والاسم الإنجليزي وباقي بيانات المنتج مطلوبة وصحيحة.' }, { status: 400 });
  try {
    const [created] = await db.insert(products).values({
      ...parsed.data,
      price: parsed.data.price.toFixed(2),
      discount: parsed.data.discount.toFixed(2),
    }).returning({ id: products.id });
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    console.error('Create product failed:', error);
    return NextResponse.json({ error: 'تعذر إضافة المنتج. تأكد من عدم تكرار الرابط المختصر وصحة التصنيف.' }, { status: 409 });
  }
}
