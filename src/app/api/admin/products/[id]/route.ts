import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { inventoryMovements, products } from '@/db/schema';
import { requireAdminResponse } from '@/lib/auth/require-admin';
export const runtime = 'nodejs';
const schema = z.object({
  name: z.string().trim().min(2).max(220), slug: z.string().trim().min(2).max(240).regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional().nullable(), sku: z.string().max(80).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(), type: z.enum(['medicine','medical_supply','cosmetics','health_product']),
  price: z.coerce.number().min(0), discount: z.coerce.number().min(0).max(100),
  quantity: z.coerce.number().int().min(0), lowStockThreshold: z.coerce.number().int().min(0),
  requiresPrescription: z.boolean(), isActive: z.boolean(),
});
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminResponse(); if (auth.response) return auth.response;
  const { id } = await params; const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'بيانات المنتج غير صحيحة.' }, { status: 400 });
  try {
    const result = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(products).where(eq(products.id, id)).for('update');
      if (!current) return false;
      const [updated] = await tx.update(products).set({
        ...parsed.data, price: parsed.data.price.toFixed(2), discount: parsed.data.discount.toFixed(2), updatedAt: new Date(),
      }).where(eq(products.id, id)).returning({ id: products.id });
      const delta = parsed.data.quantity - current.quantity;
      if (delta !== 0) await tx.insert(inventoryMovements).values({
        productId: id, movementType: 'adjustment', quantityChange: delta, quantityAfter: parsed.data.quantity,
        note: 'تعديل كمية المخزون من إدارة المنتجات',
      });
      return Boolean(updated);
    });
    return result ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'المنتج غير موجود.' }, { status: 404 });
  } catch { return NextResponse.json({ error: 'تعذر تحديث المنتج. قد يكون الرابط المختصر أو SKU مكررًا.' }, { status: 409 }); }
}
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminResponse(); if (auth.response) return auth.response;
  const { id } = await params;
  const [updated] = await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, id)).returning({ id: products.id });
  return updated ? NextResponse.json({ ok: true, message: 'تم إخفاء المنتج دون حذف سجل الطلبات.' }) : NextResponse.json({ error: 'المنتج غير موجود.' }, { status: 404 });
}
