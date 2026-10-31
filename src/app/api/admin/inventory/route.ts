import { NextResponse } from 'next/server';
import { asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { inventoryMovements, products } from '@/db/schema';
import { requireAdminResponse } from '@/lib/auth/require-admin';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireAdminResponse();
  if (auth.response) return auth.response;
  const rows = await db.select({
    id: products.id,
    name: products.name,
    sku: products.sku,
    quantity: products.quantity,
    lowStockThreshold: products.lowStockThreshold,
    isActive: products.isActive,
  }).from(products).orderBy(asc(products.name));
  const movements = await db.select({
    id: inventoryMovements.id,
    productId: inventoryMovements.productId,
    movementType: inventoryMovements.movementType,
    quantityChange: inventoryMovements.quantityChange,
    quantityAfter: inventoryMovements.quantityAfter,
    note: inventoryMovements.note,
    createdAt: inventoryMovements.createdAt,
    productName: products.name,
  }).from(inventoryMovements).innerJoin(products, eq(inventoryMovements.productId, products.id))
    .orderBy(sql`${inventoryMovements.createdAt} desc`).limit(100);
  return NextResponse.json({ products: rows, movements }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}

export async function POST(request: Request) {
  const auth = await requireAdminResponse();
  if (auth.response) return auth.response;
  const parsed = z.object({
    productId: z.string().uuid(),
    operation: z.enum(['add', 'remove', 'set']),
    quantity: z.coerce.number().int().min(0).max(1000000),
    note: z.string().trim().min(3).max(500),
  }).refine((data) => data.operation === 'set' || data.quantity > 0, {
    message: 'الكمية يجب أن تكون أكبر من صفر لهذه العملية.',
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'راجع المنتج والكمية وسبب حركة المخزون.' }, { status: 400 });

  try {
    const result = await db.transaction(async (tx) => {
      const [product] = await tx.select().from(products).where(eq(products.id, parsed.data.productId)).for('update');
      if (!product) throw new Error('PRODUCT_NOT_FOUND');
      const nextQuantity = parsed.data.operation === 'set'
        ? parsed.data.quantity
        : parsed.data.operation === 'add'
          ? product.quantity + parsed.data.quantity
          : product.quantity - parsed.data.quantity;
      if (nextQuantity < 0) throw new Error('INSUFFICIENT_STOCK');
      const delta = nextQuantity - product.quantity;
      if (delta === 0) return { quantity: product.quantity, unchanged: true };
      await tx.update(products).set({ quantity: nextQuantity, updatedAt: new Date() }).where(eq(products.id, product.id));
      await tx.insert(inventoryMovements).values({
        productId: product.id,
        movementType: parsed.data.operation === 'add' ? 'restock' : 'adjustment',
        quantityChange: delta,
        quantityAfter: nextQuantity,
        note: parsed.data.note,
      });
      return { quantity: nextQuantity, unchanged: false };
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'PRODUCT_NOT_FOUND') return NextResponse.json({ error: 'المنتج غير موجود.' }, { status: 404 });
    if (message === 'INSUFFICIENT_STOCK') return NextResponse.json({ error: 'لا يمكن سحب كمية أكبر من المخزون الحالي.' }, { status: 409 });
    console.error('Inventory adjustment failed:', error);
    return NextResponse.json({ error: 'تعذر تحديث المخزون.' }, { status: 500 });
  }
}
