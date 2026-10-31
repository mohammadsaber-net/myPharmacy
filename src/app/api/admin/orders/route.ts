import { NextResponse } from 'next/server';
import { desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { inventoryMovements, orderItems, orders, products } from '@/db/schema';
import { requireAdminResponse } from '@/lib/auth/require-admin';
export const runtime = 'nodejs';
const statusSchema = z.object({ status: z.enum(['pending','confirmed','preparing','out_for_delivery','delivered','cancelled']) });
export async function GET() {
  const auth = await requireAdminResponse(); if (auth.response) return auth.response;
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200);
  const items = rows.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, rows.map((order) => order.id)))
    : [];
  const itemsByOrder = new Map<string, typeof items>();
  for (const item of items) {
    const current = itemsByOrder.get(item.orderId) ?? [];
    current.push(item);
    itemsByOrder.set(item.orderId, current);
  }
  return NextResponse.json(rows.map((order) => ({ ...order, items: itemsByOrder.get(order.id) ?? [] })), {
    headers: { 'Cache-Control': 'private, no-store, max-age=0' },
  });
}
export async function PATCH(req: Request) {
  const auth = await requireAdminResponse(); if (auth.response) return auth.response;
  const parsed = z.object({ orderId: z.string().uuid(), ...statusSchema.shape }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'بيانات الحالة غير صحيحة.' }, { status: 400 });
  try {
    await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, parsed.data.orderId)).for('update');
      if (!order) throw new Error('NOT_FOUND');
      if (order.status === 'delivered' && parsed.data.status !== 'delivered') throw new Error('DELIVERED_FINAL');
      if (order.status === 'cancelled' && parsed.data.status !== 'cancelled') throw new Error('CANCELLED_FINAL');
      if (parsed.data.status === 'cancelled' && order.status !== 'cancelled') {
        const lines = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        for (const line of lines) {
          if (!line.productId) continue;
          const [product] = await tx.select().from(products).where(eq(products.id, line.productId)).for('update');
          if (!product) continue;
          const quantityAfter = product.quantity + line.quantity;
          await tx.update(products).set({ quantity: quantityAfter, updatedAt: new Date() }).where(eq(products.id, product.id));
          await tx.insert(inventoryMovements).values({ productId: product.id, orderId: order.id, movementType: 'order_cancelled', quantityChange: line.quantity, quantityAfter, note: `إرجاع مخزون الطلب ${order.orderNumber} بعد الإلغاء` });
        }
      }
      await tx.update(orders).set({ status: parsed.data.status, updatedAt: new Date() }).where(eq(orders.id, order.id));
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'NOT_FOUND') return NextResponse.json({ error: 'الطلب غير موجود.' }, { status: 404 });
    if (message === 'DELIVERED_FINAL' || message === 'CANCELLED_FINAL') return NextResponse.json({ error: 'لا يمكن تغيير حالة طلب مكتمل أو ملغي.' }, { status: 409 });
    return NextResponse.json({ error: 'تعذر تحديث حالة الطلب.' }, { status: 500 });
  }
}
