import {Site} from '@/components/site';
import {getEntries,getSettings,publicSettings} from '@/lib/server';

export const dynamic='force-dynamic';
export const metadata={title:'About Us | Sree Pranavam Yoga Vidyapeedom'};

export default async function AboutPage(){
  const [entries,s]=await Promise.all([getEntries(),getSettings()]);
  return <Site entries={entries} s={publicSettings(s)} page="about"/>;
}
