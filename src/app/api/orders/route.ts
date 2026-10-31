import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { inventoryMovements, orderItems, orders, products } from '@/db/schema';

export const runtime = 'nodejs';

const orderSchema = z.object({
  customerName: z.string().trim().min(3).max(160),
  phone: z.string().trim().regex(/^[0-9+()\- ]{10,20}$/),
  address: z.string().trim().min(8).max(1000),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(99) })).min(1).max(30),
});

function moneyFromCents(cents: number) { return (cents / 100).toFixed(2); }
function priceInCents(price: string, discount: string) {
  const baseCents = Math.round(Number(price) * 100);
  const discountBasisPoints = Math.round(Number(discount) * 100);
  return Math.round(baseCents * (10_000 - discountBasisPoints) / 10_000);
}

export async function POST(request: Request) {
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'راجع بيانات الطلب ورقم الهاتف والكميات.' }, { status: 400 });

  const quantities = new Map<string, number>();
  for (const item of parsed.data.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  if ([...quantities.values()].some((quantity) => quantity > 99)) return NextResponse.json({ error: 'الحد الأقصى للكمية من المنتج الواحد هو 99.' }, { status: 400 });

  try {
    const orderNumber = `SD-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const result = await db.transaction(async (tx) => {
      const ids = [...quantities.keys()];
      const lockedProducts = await tx.select().from(products).where(inArray(products.id, ids)).for('update');
      if (lockedProducts.length !== ids.length) throw new Error('PRODUCT_NOT_FOUND');

      const selected = new Map(lockedProducts.map((product) => [product.id, product]));
      let subtotalCents = 0;
      const preparedItems = ids.map((productId) => {
        const product = selected.get(productId)!;
        const quantity = quantities.get(productId)!;
        if (!product.isActive) throw new Error('PRODUCT_UNAVAILABLE');
        if (product.requiresPrescription) throw new Error('PRESCRIPTION_REQUIRED');
        if (product.quantity < quantity) throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        const unitCents = priceInCents(product.price, product.discount);
        const lineCents = unitCents * quantity;
        subtotalCents += lineCents;
        return { product, quantity, unitCents, lineCents };
      });

      const [createdOrder] = await tx.insert(orders).values({
        orderNumber,
        customerName: parsed.data.customerName,
        phone: parsed.data.phone,
        address: parsed.data.address,
        notes: parsed.data.notes || null,
        subtotal: moneyFromCents(subtotalCents),
        deliveryFee: '0.00',
        total: moneyFromCents(subtotalCents),
        currency: 'EGP',
        paymentMethod: 'cash_on_delivery',
        paymentStatus: 'unpaid',
        status: 'pending',
      }).returning({ id: orders.id });

      for (const item of preparedItems) {
        const quantityAfter = item.product.quantity - item.quantity;
        await tx.insert(orderItems).values({
          orderId: createdOrder.id,
          productId: item.product.id,
          productName: item.product.name,
          unitPrice: moneyFromCents(item.unitCents),
          quantity: item.quantity,
          lineTotal: moneyFromCents(item.lineCents),
        });
        await tx.update(products).set({ quantity: quantityAfter, updatedAt: new Date() }).where(and(eq(products.id, item.product.id), eq(products.quantity, item.product.quantity)));
        await tx.insert(inventoryMovements).values({
          productId: item.product.id,
          orderId: createdOrder.id,
          movementType: 'sale',
          quantityChange: -item.quantity,
          quantityAfter,
          note: `حجز مخزون للطلب ${orderNumber}`,
        });
      }
      return { orderNumber };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'PRODUCT_NOT_FOUND' || message === 'PRODUCT_UNAVAILABLE') return NextResponse.json({ error: 'أحد المنتجات لم يعد متاحًا. حدّث السلة وحاول مرة أخرى.' }, { status: 409 });
    if (message === 'PRESCRIPTION_REQUIRED') return NextResponse.json({ error: 'يوجد منتج يتطلب مراجعة الصيدلي أو وصفة طبية، ولا يمكن طلبه مباشرة.' }, { status: 400 });
    if (message.startsWith('INSUFFICIENT_STOCK:')) return NextResponse.json({ error: `الكمية المتاحة من ${message.split(':')[1]} غير كافية. حدّث السلة وحاول مرة أخرى.` }, { status: 409 });
    console.error('Order creation failed:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الطلب. حاول مرة أخرى أو تواصل مع الصيدلية.' }, { status: 500 });
  }
}
