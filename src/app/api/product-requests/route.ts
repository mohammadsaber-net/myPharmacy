import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { productRequests } from '@/db/schema';

export const runtime = 'nodejs';

const requestSchema = z.object({
  customerName: z.string().trim().min(2).max(160),
  phone: z.string().trim().regex(/^[0-9+()\- ]{10,20}$/),
  productName: z.string().trim().min(2).max(220),
  details: z.string().trim().max(1500).optional().nullable(),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'راجع الاسم ورقم الهاتف واسم المنتج.' }, { status: 400 });
  try {
    const [created] = await db.insert(productRequests).values({
      ...parsed.data,
      details: parsed.data.details || null,
      status: 'new',
    }).returning({ id: productRequests.id });
    return NextResponse.json({ ok: true, id: created.id, message: 'تم استلام طلبك، وسنتواصل معك بعد مراجعة توافر المنتج.' }, { status: 201 });
  } catch (error) {
    console.error('Product request submission failed:', error);
    return NextResponse.json({ error: 'تعذر إرسال الطلب حاليًا. حاول مرة أخرى.' }, { status: 500 });
  }
}
