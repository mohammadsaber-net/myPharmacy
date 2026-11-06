import { NextResponse } from 'next/server';
import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { categories, inventoryMovements, products } from '@/db/schema';
import { requireAdminResponse } from '@/lib/auth/require-admin';
export const runtime = 'nodejs';
const PAGE_SIZE = 20;
export async function GET(request: Request) {
  const auth = await requireAdminResponse(); if (auth.response) return auth.response;
  const params = new URL(request.url).searchParams;
  const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
  const movementPage = Math.max(1, Number.parseInt(params.get('movementPage') || '1', 10) || 1);
  const q = (params.get('q') || '').trim(); const categoryId = params.get('categoryId') || '';
  const movementQ = (params.get('movementQ') || '').trim(); const movementProductId = params.get('movementProductId') || '';
  const productFilters = [];
  if (q) productFilters.push(or(ilike(products.name, `%${q}%`), ilike(products.englishName, `%${q}%`), ilike(products.scientificName, `%${q}%`))!);
  if (categoryId) productFilters.push(eq(products.categoryId, categoryId));
  const productWhere = productFilters.length ? and(...productFilters) : undefined;
  const movementFilters = [];
  if (movementQ) movementFilters.push(or(ilike(products.name, `%${movementQ}%`), ilike(products.englishName, `%${movementQ}%`), ilike(products.scientificName, `%${movementQ}%`), ilike(categories.name, `%${movementQ}%`))!);
  if (movementProductId) movementFilters.push(eq(products.id, movementProductId));
  const movementWhere = movementFilters.length ? and(...movementFilters) : undefined;
  const productOffset=(page-1)*PAGE_SIZE, movementOffset=(movementPage-1)*PAGE_SIZE;
  const [rows, productCount, movementRows, movementCount, categoryRows] = await Promise.all([
    db.select({id:products.id,name:products.name,scientificName:products.scientificName,englishName:products.englishName,quantity:products.quantity,lowStockThreshold:products.lowStockThreshold,isActive:products.isActive,categoryId:products.categoryId,categoryName:categories.name}).from(products).leftJoin(categories,eq(products.categoryId,categories.id)).where(productWhere).orderBy(asc(products.name)).limit(PAGE_SIZE).offset(productOffset),
    db.select({total:count()}).from(products).where(productWhere),
    db.select({id:inventoryMovements.id,productId:inventoryMovements.productId,movementType:inventoryMovements.movementType,quantityChange:inventoryMovements.quantityChange,quantityAfter:inventoryMovements.quantityAfter,note:inventoryMovements.note,createdAt:inventoryMovements.createdAt,productName:products.name,scientificName:products.scientificName,englishName:products.englishName}).from(inventoryMovements).innerJoin(products,eq(inventoryMovements.productId,products.id)).leftJoin(categories,eq(products.categoryId,categories.id)).where(movementWhere).orderBy(desc(inventoryMovements.createdAt)).limit(PAGE_SIZE).offset(movementOffset),
    db.select({total:count()}).from(inventoryMovements).innerJoin(products,eq(inventoryMovements.productId,products.id)).leftJoin(categories,eq(products.categoryId,categories.id)).where(movementWhere),
    db.select({id:categories.id,name:categories.name}).from(categories).orderBy(asc(categories.sortOrder),asc(categories.name)),
  ]);
  const total=Number(productCount[0]?.total||0), movementTotal=Number(movementCount[0]?.total||0);
  return NextResponse.json({products:rows,movements:movementRows,categories:categoryRows,
    pagination:{page,total,totalPages:Math.max(1,Math.ceil(total/PAGE_SIZE)),hasNext:productOffset+rows.length<total,hasPrev:page>1},
    movementPagination:{page:movementPage,total:movementTotal,totalPages:Math.max(1,Math.ceil(movementTotal/PAGE_SIZE)),hasNext:movementOffset+movementRows.length<movementTotal,hasPrev:movementPage>1}},
    {headers:{'Cache-Control':'private, no-store, max-age=0'}});
}
export async function POST(request: Request) {
  const auth=await requireAdminResponse(); if(auth.response)return auth.response;
  const parsed=z.object({productId:z.string().uuid(),operation:z.enum(['add','remove','set']),quantity:z.coerce.number().int().min(0).max(1000000),note:z.string().trim().min(3).max(500)}).refine(d=>d.operation==='set'||d.quantity>0,{message:'الكمية يجب أن تكون أكبر من صفر لهذه العملية.'}).safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:'راجع المنتج والكمية وسبب حركة المخزون.'},{status:400});
  try { const result=await db.transaction(async tx=>{const [product]=await tx.select().from(products).where(eq(products.id,parsed.data.productId)).for('update');if(!product)throw new Error('PRODUCT_NOT_FOUND');const next=parsed.data.operation==='set'?parsed.data.quantity:parsed.data.operation==='add'?product.quantity+parsed.data.quantity:product.quantity-parsed.data.quantity;if(next<0)throw new Error('INSUFFICIENT_STOCK');const delta=next-product.quantity;if(delta===0)return {quantity:product.quantity,unchanged:true};await tx.update(products).set({quantity:next,updatedAt:new Date()}).where(eq(products.id,product.id));await tx.insert(inventoryMovements).values({productId:product.id,movementType:parsed.data.operation==='add'?'restock':'adjustment',quantityChange:delta,quantityAfter:next,note:parsed.data.note});return {quantity:next,unchanged:false};});return NextResponse.json({ok:true,...result}); }
  catch(error){const message=error instanceof Error?error.message:'';if(message==='PRODUCT_NOT_FOUND')return NextResponse.json({error:'المنتج غير موجود.'},{status:404});if(message==='INSUFFICIENT_STOCK')return NextResponse.json({error:'لا يمكن سحب كمية أكبر من المخزون الحالي.'},{status:409});console.error('Inventory adjustment failed:',error);return NextResponse.json({error:'تعذر تحديث المخزون.'},{status:500});}
}
