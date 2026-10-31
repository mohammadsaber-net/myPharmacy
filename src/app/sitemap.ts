import type { MetadataRoute } from 'next';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { categories, products } from '@/db/schema';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const [productRows, categoryRows] = await Promise.all([
    db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.isActive, true)),
    db.select({ slug: categories.slug, updatedAt: categories.updatedAt }).from(categories).where(eq(categories.isActive, true)),
  ]);
  return [
    { url: baseUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/products`, changeFrequency: 'daily', priority: 0.9 },
    ...categoryRows.map((row) => ({ url: `${baseUrl}/products?category=${encodeURIComponent(row.slug)}`, lastModified: row.updatedAt, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...productRows.map((row) => ({ url: `${baseUrl}/products/${row.slug}`, lastModified: row.updatedAt, changeFrequency: 'weekly' as const, priority: 0.7 })),
  ];
}
