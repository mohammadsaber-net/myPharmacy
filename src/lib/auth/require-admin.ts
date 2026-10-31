import { NextResponse } from 'next/server';
import { getCurrentAdmin } from './session';
export async function requireAdminResponse() {
  const admin = await getCurrentAdmin();
  if (!admin) return { admin: null, response: NextResponse.json({ error: 'غير مصرح. سجل دخول الإدارة أولاً.' }, { status: 401 }) };
  return { admin, response: null };
}
