import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db';
import { adminSessions, admins } from '@/db/schema';

const COOKIE_NAME = 'saydalety_admin_session';
const SESSION_DAYS = 7;
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createAdminSession(adminId: string) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(adminSessions).values({ adminId, tokenHash: hashToken(token), expiresAt });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function getCurrentAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const [row] = await db.select({
    id: admins.id,
    fullName: admins.fullName,
    email: admins.email,
  }).from(adminSessions)
    .innerJoin(admins, eq(adminSessions.adminId, admins.id))
    .where(and(
      eq(adminSessions.tokenHash, hashToken(token)),
      gt(adminSessions.expiresAt, new Date()),
      eq(admins.isActive, true),
    ))
    .limit(1);
  if (!row) {
    await db.delete(adminSessions).where(eq(adminSessions.tokenHash, hashToken(token)));
    return null;
  }
  return row;
}

export async function destroyAdminSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, hashToken(token)));
  jar.delete(COOKIE_NAME);
}
