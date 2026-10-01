import {getEntries,getSettings} from '@/lib/server';
export const dynamic='force-dynamic';
const escape=(s:string)=>s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
export async function GET(){try{const [s,entries]=await Promise.all([getSettings(),getEntries()]);const urls=s.indexable?entries.filter(e=>e.type==='pages'&&!e.noindex).map(e=>`<url><loc>${escape(s.siteUrl.replace(/\/$/,'')+(e.slug==='home'?'':'/'+e.slug))}</loc></url>`).join(''):'';return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,{headers:{'Content-Type':'application/xml'}})}catch{return new Response('Temporarily unavailable',{status:503})}}
