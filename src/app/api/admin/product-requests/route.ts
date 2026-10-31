import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { productRequests } from '@/db/schema';
import { requireAdminResponse } from '@/lib/auth/require-admin';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireAdminResponse();
  if (auth.response) return auth.response;
  const rows = await db.select().from(productRequests).orderBy(desc(productRequests.createdAt)).limit(300);
  return NextResponse.json(rows, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminResponse();
  if (auth.response) return auth.response;
  const parsed = z.object({
    id: z.string().uuid(),
    status: z.enum(['new', 'contacted', 'fulfilled', 'rejected']),
    adminNotes: z.string().trim().max(1500).optional().nullable(),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'بيانات تحديث الطلب غير صحيحة.' }, { status: 400 });
  const [updated] = await db.update(productRequests).set({
    status: parsed.data.status,
    adminNotes: parsed.data.adminNotes || null,
    updatedAt: new Date(),
  }).where(eq(productRequests.id, parsed.data.id)).returning({ id: productRequests.id });
  if (!updated) return NextResponse.json({ error: 'طلب المنتج غير موجود.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
