import {Site} from '@/components/site';
import {getEntries,getSettings,publicSettings} from '@/lib/server';
import {metadataFor} from '@/lib/seo';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{page:string}>}){return metadataFor((await params).page)}
export default async function Page({params}:{params:Promise<{page:string}>}){const {page}=await params;const [entries,s]=await Promise.all([getEntries(),getSettings()]);if(!entries.some(e=>e.type==='pages'&&e.slug===page))notFound();return <Site entries={entries} s={publicSettings(s)} page={page}/>}
