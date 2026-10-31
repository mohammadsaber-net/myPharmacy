import 'dotenv/config';
import { db } from '../src/db';
import { admins } from '../src/db/schema';
import { hashPassword } from '../src/lib/auth/password';
import { eq } from 'drizzle-orm';

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME?.trim() || 'مدير صيدليتي';
  if (!email || !password || password.length < 12) {
    throw new Error('Set ADMIN_EMAIL, ADMIN_PASSWORD (at least 12 characters), and optionally ADMIN_NAME in .env');
  }
  const passwordHash = await hashPassword(password);
  const [existing] = await db.select({ id: admins.id }).from(admins).where(eq(admins.email, email)).limit(1);
  if (existing) {
    await db.update(admins).set({ fullName, passwordHash, isActive: true, updatedAt: new Date() }).where(eq(admins.id, existing.id));
    console.info('Admin account password updated.');
  } else {
    await db.insert(admins).values({ fullName, email, passwordHash });
    console.info('Admin account created.');
  }
  process.exit(0);
}
main().catch((error) => { console.error(error); process.exit(1); });
