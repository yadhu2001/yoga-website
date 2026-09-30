import { getSettings, publicSettings } from '@/lib/server';
import { MapPin, Mail, Phone } from 'lucide-react';

export const dynamic='force-dynamic';
export const metadata={title:'About Us | Sree Pranavam Yoga Vidyapeedom'};

export default async function AboutPage(){
  const s=publicSettings(await getSettings());
  const branches=String(s.branches||'').split('\n').map((item:string)=>item.trim()).filter(Boolean);
  return <main><section className="page-hero" style={s.aboutHeroImage?{backgroundImage:`linear-gradient(90deg,rgba(9,44,88,.9),rgba(9,44,88,.45)),url(${s.aboutHeroImage})`,backgroundSize:'cover',color:'white'}:undefined}><div className="wrap"><div className="eyebrow" style={s.aboutHeroImage?{color:'#d2e5ff'}:undefined}>Sree Pranavam</div><h1>{s.aboutHeading||'About Sree Pranavam Yoga Vidyapeedom'}</h1></div></section><section className="section"><div className="wrap"><div className="grid2"><div><h2>About us</h2><p className="long-text mt-5">{s.about}</p></div><div className="space-y-5"><div className="program-card"><div><h3>Our vision</h3><p>{s.vision}</p></div></div><div className="program-card"><div><h3>Our mission</h3><p>{s.mission}</p></div></div></div></div>{branches.length>0&&<section className="mt-16"><div className="eyebrow">Our locations</div><h2>Branches</h2><div className="grid3 mt-8">{branches.map((branch:string,index:number)=>{const [name,...address]=branch.split('|');return <article className="program-card items-start" key={index}><MapPin size={20}/><div><h3>{name.trim()}</h3><p>{address.join('|').trim()||name.trim()}</p></div></article>})}</div></section>}<section className="grid2 mt-16"><div>{s.mapUrl&&<iframe className="video" src={s.mapUrl} title="Sree Pranavam location" loading="lazy"/>}</div><div className="admin-panel"><div className="eyebrow">Contact us</div><h2>Let’s connect.</h2>{s.address&&<p className="mt-6 flex gap-3"><MapPin size={20}/>{s.address}</p>}{s.phone&&<a className="mt-5 flex gap-3" href={`tel:${s.phone}`}><Phone size={20}/>{s.phone}</a>}{s.email&&<a className="mt-5 flex gap-3" href={`mailto:${s.email}`}><Mail size={20}/>{s.email}</a>}</div></section></div></section></main>;
}
