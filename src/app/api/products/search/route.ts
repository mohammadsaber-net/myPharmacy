import { NextResponse } from 'next/server';
import { ilike, or, and, eq, asc } from 'drizzle-orm';
import { db } from '@/db';
import { products } from '@/db/schema';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const q=(new URL(request.url).searchParams.get('q')||'').trim();
 if(q.length<2)return NextResponse.json({products:[]},{headers:{'Cache-Control':'no-store'}});
 const rows=await db.select({id:products.id,name:products.name,slug:products.slug,scientificName:products.scientificName}).from(products).where(and(eq(products.isActive,true),or(ilike(products.name,`%${q}%`),ilike(products.englishName,`%${q}%`),ilike(products.scientificName,`%${q}%`)))).orderBy(asc(products.name));
 return NextResponse.json({products:rows},{headers:{'Cache-Control':'no-store'}});
}
