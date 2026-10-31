import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { requireAdminResponse } from '@/lib/auth/require-admin';
const schema = z.object({ name: z.string().trim().min(2).max(120), slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9-]+$/), description: z.string().max(1000).optional().nullable(), sortOrder: z.coerce.number().int().min(0), isActive: z.boolean() });
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminResponse(); if (auth.response) return auth.response;
  const { id } = await params; const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'بيانات التصنيف غير صحيحة.' }, { status: 400 });
  try { const [row] = await db.update(categories).set({ ...parsed.data, updatedAt: new Date() }).where(eq(categories.id, id)).returning({ id: categories.id }); return row ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'التصنيف غير موجود.' }, { status: 404 }); }
  catch { return NextResponse.json({ error: 'تعذر تحديث التصنيف.' }, { status: 409 }); }
}
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminResponse(); if (auth.response) return auth.response;
  const { id } = await params;
  const [row] = await db.update(categories).set({ isActive: false, updatedAt: new Date() }).where(eq(categories.id, id)).returning({ id: categories.id });
  return row ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'التصنيف غير موجود.' }, { status: 404 });
}
