import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { categories, products } from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

const seedCategories = [
  { name: 'الأدوية', slug: 'medicines', description: 'الأدوية المسموح بتداولها وفق القواعد المعمول بها' },
  { name: 'المستلزمات الطبية', slug: 'medical-supplies', description: 'مستلزمات وأدوات الرعاية الصحية' },
  { name: 'العناية الشخصية', slug: 'personal-care', description: 'منتجات النظافة والعناية الشخصية' },
  { name: 'الأم والطفل', slug: 'mother-and-child', description: 'منتجات العناية بالأم والطفل' },
];

async function main() {
  for (const category of seedCategories) {
    await db.insert(categories).values(category).onConflictDoNothing({ target: categories.slug });
  }

  const categoryRows = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const categoryBySlug = new Map(categoryRows.map((category) => [category.slug, category.id]));
  const demoProducts = [
    { categoryId: categoryBySlug.get('medical-supplies') ?? null, name: 'شاش طبي معقم - عبوة تجريبية', slug: 'demo-sterile-gauze', description: 'بيانات تجريبية لاختبار المتجر فقط. راجع الصنف والسعر والمواصفات قبل الاستخدام الفعلي.', type: 'medical_supply' as const, price: '25.00', quantity: 20 },
    { categoryId: categoryBySlug.get('medical-supplies') ?? null, name: 'قطن طبي - عبوة تجريبية', slug: 'demo-medical-cotton', description: 'بيانات تجريبية لاختبار المتجر فقط. راجع الصنف والسعر والمواصفات قبل الاستخدام الفعلي.', type: 'medical_supply' as const, price: '32.00', quantity: 15 },
    { categoryId: categoryBySlug.get('medical-supplies') ?? null, name: 'كمامات طبية - عبوة تجريبية', slug: 'demo-medical-masks', description: 'بيانات تجريبية لاختبار المتجر فقط. راجع الصنف والسعر والمواصفات قبل الاستخدام الفعلي.', type: 'medical_supply' as const, price: '45.00', quantity: 30 },
    { categoryId: categoryBySlug.get('personal-care') ?? null, name: 'مرطب بشرة - منتج تجريبي', slug: 'demo-skin-moisturizer', description: 'بيانات تجريبية لاختبار المتجر فقط. راجع الصنف والسعر والمواصفات قبل الاستخدام الفعلي.', type: 'cosmetics' as const, price: '85.00', quantity: 12 },
  ];
  for (const product of demoProducts) {
    await db.insert(products).values(product).onConflictDoNothing({ target: products.slug });
  }

  console.info('Seed completed: Arabic categories and demo storefront products inserted.');
  console.info('Demo products are not real pharmacy inventory or price quotes. Replace them with approved, verified products before launch. No prescription medicines were seeded.');
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
