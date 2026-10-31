import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { customerMessages } from '@/db/schema';

export const runtime = 'nodejs';

const messageSchema = z.object({
  customerName: z.string().trim().min(2).max(160),
  phone: z.string().trim().regex(/^[0-9+()\- ]{10,20}$/).optional().or(z.literal('')),
  email: z.string().trim().email().max(255).optional().or(z.literal('')),
  subject: z.string().trim().max(180).optional().or(z.literal('')),
  message: z.string().trim().min(5).max(3000),
}).refine((data) => Boolean(data.phone || data.email), { message: 'أدخل رقم هاتف أو بريدًا إلكترونيًا للتواصل.' });

export async function POST(request: Request) {
  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'راجع بيانات الرسالة، وأدخل رقم هاتف أو بريدًا إلكترونيًا صحيحًا.' }, { status: 400 });
  try {
    const [created] = await db.insert(customerMessages).values({
      customerName: parsed.data.customerName,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
      status: 'unread',
    }).returning({ id: customerMessages.id });
    return NextResponse.json({ ok: true, id: created.id, message: 'تم إرسال رسالتك بنجاح.' }, { status: 201 });
  } catch (error) {
    console.error('Customer message submission failed:', error);
    return NextResponse.json({ error: 'تعذر إرسال الرسالة حاليًا. حاول مرة أخرى.' }, { status: 500 });
  }
}
