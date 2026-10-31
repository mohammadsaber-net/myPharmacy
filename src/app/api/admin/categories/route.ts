import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { requireAdminResponse } from '@/lib/auth/require-admin';
const schema = z.object({ name: z.string().trim().min(2).max(120), slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9-]+$/), description: z.string().max(1000).optional().nullable(), sortOrder: z.coerce.number().int().min(0).default(0), isActive: z.boolean().default(true) });
export async function GET() {
  const auth = await requireAdminResponse(); if (auth.response) return auth.response;
  return NextResponse.json(await db.select().from(categories).orderBy(asc(categories.sortOrder)), { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}
export async function POST(req: Request) {
  const auth = await requireAdminResponse(); if (auth.response) return auth.response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'راجع اسم التصنيف والرابط المختصر.' }, { status: 400 });
  try { const [row] = await db.insert(categories).values(parsed.data).returning({ id: categories.id }); return NextResponse.json(row, { status: 201 }); }
  catch { return NextResponse.json({ error: 'تعذر إنشاء التصنيف. ربما الرابط المختصر مستخدم.' }, { status: 409 }); }
}
