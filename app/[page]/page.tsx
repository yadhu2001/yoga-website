import {Site} from '@/components/site';
import {getEntries,getSettings,publicSettings} from '@/lib/server';
import {metadataFor} from '@/lib/seo';
import {notFound,redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{page:string}>}){const {page}=await params;return metadataFor(page==='courses'?'course':page)}
export default async function Page({params}:{params:Promise<{page:string}>}){const {page}=await params;if(page==='courses')redirect('/course');const [entries,s]=await Promise.all([getEntries(),getSettings()]);const known=page==='course'||entries.some(e=>e.type==='pages'&&e.slug===page)||(page==='articles'&&entries.some(e=>e.type==='pages'&&e.slug==='resources'));if(!known)notFound();return <Site entries={entries} s={publicSettings(s)} page={page}/>}
