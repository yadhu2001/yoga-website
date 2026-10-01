import {getSettings} from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(){try{const s=await getSettings();return new Response(s.indexable?`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /download/\nSitemap: ${s.siteUrl.replace(/\/$/,'')}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain'}})}catch{return new Response('User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain'}})}}
