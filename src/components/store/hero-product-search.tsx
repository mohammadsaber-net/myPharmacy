'use client';
import Link from 'next/link';
import { useEffect,useRef,useState } from 'react';
import { useStoreUi } from './store-ui-context';
type Result={id:string;name:string;slug:string;scientificName:string};
export default function HeroProductSearch(){
const {openModal}=useStoreUi();
 const [query,setQuery]=useState(''),[results,setResults]=useState<Result[]>([]),[loading,setLoading]=useState(false),[searched,setSearched]=useState(false),[open,setOpen]=useState(false);const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
    const term=query.trim();
    if(term.length<2)return;
    let cancelled=false;
    const timer=setTimeout(async()=>{setLoading(true);
    try{
        const r=await fetch(`/api/products/search?q=${encodeURIComponent(term)}`);
        const d=await r.json();
        if(!cancelled){setResults(d.products||[]);
            setSearched(true);
            setOpen(true);
        }}catch{if(!cancelled){setResults([]);
        setSearched(true);
    }}finally{if(!cancelled)
        setLoading(false);
    }},280);
    return()=>{
        cancelled=true;clearTimeout(timer)
    };},[query]);
 useEffect(()=>{
    function outside(e:MouseEvent){
        if(root.current&&!root.current.contains(e.target as Node))
        setOpen(false)
    };
    document.addEventListener('mousedown',outside);
    return()=>document.removeEventListener('mousedown',outside)
},[]);
 return <div ref={root} className="relative mt-7 max-w-xl">
    <label htmlFor="hero-product-search" className="mb-2 block text-sm font-bold text-white">ابحث عن دواء أو منتج كما مدون علي العبوة
        </label>
        <div className="flex rounded-2xl bg-white p-1.5 shadow-lg">
            <input id="hero-product-search" value={query} onFocus={()=>setOpen(true)} onChange={e=>{setQuery(e.target.value);setResults([]);setSearched(false);setOpen(true)}} 
            placeholder="الاسم التجاري أو العلمي أو الإنجليزي كما مدون علي العبوة" 
            className="min-w-0 flex-1 rounded-xl px-3 py-3 text-sm text-slate-900 outline-none"/>
            <span className="flex items-center px-3 text-lg font-semibold text-emerald-700">
                {loading?'يجري البحث...':'⌕'}
            </span>
            </div>
 {open&&query.trim().length>=2&&<div className="absolute right-0 top-full z-40 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-2xl">{results.map(item=><div key={item.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 hover:bg-emerald-50"><span className="min-w-0 flex-1 text-sm font-semibold">{item.name}</span><Link onClick={()=>setOpen(false)} href={`/products/${item.slug}`} className="shrink-0 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">عرض المنتج</Link></div>)}
 {searched&&!results.length&&!loading&&<div className="p-3 text-center">
    <p className="text-sm text-slate-600">لم نعثر على منتج مطابق.</p>
    <button type="button"
          className='rounded-lg bg-cyan-600 text-white px-3 py-2.5 hover:bg-cyan-700  mt-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'
          onClick={() => {openModal('request'); }}> الصنف غير متوفر! اطلبه الان😊 </button>
    </div>}
    </div>}</div>
}
