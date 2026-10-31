import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { customerMessages } from '@/db/schema';
import { requireAdminResponse } from '@/lib/auth/require-admin';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireAdminResponse();
  if (auth.response) return auth.response;
  const rows = await db.select().from(customerMessages).orderBy(desc(customerMessages.createdAt)).limit(300);
  return NextResponse.json(rows, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminResponse();
  if (auth.response) return auth.response;
  const parsed = z.object({
    id: z.string().uuid(),
    status: z.enum(['unread', 'read', 'replied', 'archived']),
    adminReply: z.string().trim().max(3000).optional().nullable(),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'بيانات تحديث الرسالة غير صحيحة.' }, { status: 400 });
  const hasReply = Boolean(parsed.data.adminReply);
  const [updated] = await db.update(customerMessages).set({
    status: hasReply ? 'replied' : parsed.data.status,
    adminReply: parsed.data.adminReply || null,
    repliedAt: hasReply ? new Date() : undefined,
    updatedAt: new Date(),
  }).where(eq(customerMessages.id, parsed.data.id)).returning({ id: customerMessages.id });
  if (!updated) return NextResponse.json({ error: 'الرسالة غير موجودة.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
