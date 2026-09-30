import {MapPin} from 'lucide-react';
import {mapEmbed,type Branch} from '@/lib/content';

export function BranchList({items}:{items:Branch[]}){
  if(!items.length)return null;
  return <div className="branch-list">{items.map((branch,index)=>{const map=mapEmbed(branch.mapUrl);return <article className={map?'branch-row':'branch-row branch-row-single'} key={`${branch.name}-${index}`}><div className="branch-card"><span className="branch-name"><MapPin size={14}/>{branch.name}</span>{branch.address&&<p>{branch.address}</p>}</div>{map&&<iframe className="branch-map" src={map} title={`Map for ${branch.name||'branch'}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>}</article>;})}</div>;
}
