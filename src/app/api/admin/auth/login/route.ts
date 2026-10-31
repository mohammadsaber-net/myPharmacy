import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { and, count, eq, gt, lt, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { adminLoginAttempts, admins } from '@/db/schema';
import { verifyPassword } from '@/lib/auth/password';
import { createAdminSession } from '@/lib/auth/session';

export const runtime = 'nodejs';
const schema = z.object({ email: z.string().email().max(255), password: z.string().min(1).max(200) });
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getFingerprint(request: Request, email: string) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const secret = process.env.AUTH_RATE_LIMIT_SECRET || process.env.DATABASE_URL || 'saydalety-local-rate-limit';
  return createHmac('sha256', secret).update(`${ip}|${email}`).digest('hex');
}

async function reserveLoginAttempt(fingerprint: string) {
  return db.transaction(async (tx) => {
    // Serialize attempts for this fingerprint to prevent parallel requests bypassing the limit.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${fingerprint})::bigint)`);
    const cutoff = new Date(Date.now() - WINDOW_MS);
    await tx.delete(adminLoginAttempts).where(lt(adminLoginAttempts.attemptedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
    const [result] = await tx.select({ value: count() }).from(adminLoginAttempts)
      .where(and(eq(adminLoginAttempts.fingerprint, fingerprint), gt(adminLoginAttempts.attemptedAt, cutoff)));
    if (Number(result?.value ?? 0) >= MAX_ATTEMPTS) return false;
    await tx.insert(adminLoginAttempts).values({ fingerprint });
    return true;
  });
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'أدخل البريد الإلكتروني وكلمة المرور بشكل صحيح.' }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  const fingerprint = getFingerprint(req, email);

  try {
    const allowed = await reserveLoginAttempt(fingerprint);
    if (!allowed) {
      return NextResponse.json({ error: 'محاولات دخول كثيرة. انتظر 15 دقيقة ثم حاول مرة أخرى.' }, {
        status: 429,
        headers: { 'Retry-After': '900', 'Cache-Control': 'no-store' },
      });
    }

    const [admin] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
    if (!admin || !admin.isActive || !(await verifyPassword(parsed.data.password, admin.passwordHash))) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }

    await createAdminSession(admin.id);
    await db.update(admins).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(admins.id, admin.id));
    await db.delete(adminLoginAttempts).where(eq(adminLoginAttempts.fingerprint, fingerprint));
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Admin login failed:', error);
    return NextResponse.json({ error: 'تعذر تسجيل الدخول حاليًا. حاول مرة أخرى.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
