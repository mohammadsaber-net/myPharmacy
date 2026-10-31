import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth/session';
export default async function AdminIndex(){redirect(await getCurrentAdmin()?'/admin/dashboard':'/admin/login');}
