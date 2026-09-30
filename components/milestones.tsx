'use client';
import {useState} from 'react';
import type {Milestone} from '@/lib/content';

export function MilestoneJourney({items}:{items:Milestone[]}){
  const [active,setActive]=useState(0);
  const index=Math.min(active,Math.max(0,items.length-1));
  const start=Math.min(index,Math.max(0,items.length-3));
  const visible=items.slice(start,start+3);
  return <section className="journey" aria-labelledby="milestones-heading">
    <div className="journey-kicker">Our journey</div>
    <h2 id="milestones-heading">Milestones</h2>
    <div className="journey-track">
      {items.map((item,i)=><button type="button" key={`${item.year}-${i}`} className={i===index?'journey-dot active':'journey-dot'} aria-label={`Show ${item.year}`} aria-current={i===index?'true':undefined} onClick={()=>setActive(i)}/>)}
    </div>
    <div className="journey-cards">
      {visible.map((item,i)=>{const itemIndex=start+i;return <button type="button" key={`${item.year}-${itemIndex}`} className={itemIndex===index?'journey-card active':'journey-card'} onClick={()=>setActive(itemIndex)}><strong>{item.year}</strong><span>{item.text}</span></button>;})}
    </div>
    {items.length>1&&<div className="journey-pager">{items.map((item,i)=><button type="button" key={`${item.year}-page-${i}`} className={i===index?'active':undefined} aria-label={`Show ${item.year}`} onClick={()=>setActive(i)}/>)}</div>}
  </section>;
}
