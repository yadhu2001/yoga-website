import {Site} from '@/components/site';
import {getEntries,getSettings,publicSettings} from '@/lib/server';
import {metadataFor,structuredData} from '@/lib/seo';
export const dynamic='force-dynamic';
export async function generateMetadata(){return metadataFor('home')}
export default async function Page(){const [entries,s,data]=await Promise.all([getEntries(),getSettings(),structuredData()]);return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,'\\u003c')}}/><Site entries={entries} s={publicSettings(s)}/></>}
