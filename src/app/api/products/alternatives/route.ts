import { NextResponse } from 'next/server';
import { and, eq, ne, gt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { products } from '@/db/schema';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 const scientificName=(params.get('scientificName')||'').trim();
 const excludeId=(params.get('excludeId')||'').trim();
 if(!scientificName||scientificName.length>220||!excludeId)
    return NextResponse.json(
{error:'بيانات البحث غير مكتملة.'},{status:400}
);
 const [match]=await db.select
 ({id:products.id}).from(products)
 .where(and(eq(products.isActive,true),
 gt(products.quantity,0)
 ,sql`lower(${products.scientificName}) = lower(${scientificName})`,
 ne(products.id,excludeId))).limit(1);
 return NextResponse.json(
    {hasAlternatives:Boolean(match)},{headers:{'Cache-Control':'no-store'}}
);
}
