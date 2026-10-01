'use client';
import {Heart,Sun} from 'lucide-react';
import {branchItems,milestoneItems} from '@/lib/content';
import {MilestoneJourney} from '@/components/milestones';
import {BranchList} from '@/components/branches';
import {PointText} from '@/components/points';
import {RichText} from '@/components/rich-text';

export function AboutView({s}:{s:Record<string,any>}){
  const branches=branchItems(s.branches);
  const milestones=milestoneItems(s.milestones);
  return <>
    <section className={s.aboutHeroImage?'page-hero about-page-hero':'page-hero'} style={s.aboutHeroImage?{backgroundImage:`linear-gradient(90deg, rgba(9,44,88,.9), rgba(9,44,88,.45)), url(${s.aboutHeroImage})`}:undefined}>
      <div className="wrap">
        <div className="eyebrow" style={s.aboutHeroImage?{color:'#d2e5ff'}:undefined}>Sree Pranavam</div>
        <h1>{s.aboutHeading?<RichText text={s.aboutHeading} inline/>:'About Sree Pranavam Yoga Vidyapeedom'}</h1>
      </div>
    </section>
    <section className="section">
      <div className="wrap">
        <div>
          <div className="eyebrow">About us</div>
          <h2>About Sree Pranavam Yoga Vidyapeedom</h2>
          <RichText className="long-text mt-5 about-copy" text={s.about}/>
        </div>
        <div className="grid2 mt-10">
          <div className="program-card"><Sun size={32}/><div><h3>Our vision</h3><PointText text={s.vision}/></div></div>
          <div className="program-card"><Heart size={32}/><div><h3>Our mission</h3><PointText text={s.mission}/></div></div>
        </div>
        {milestones.length>0&&<div className="mt-16"><MilestoneJourney items={milestones}/></div>}
        {branches.length>0&&<div className="mt-16">
          <div className="eyebrow">Our locations</div>
          <h2>Branches</h2>
          <BranchList items={branches}/>
        </div>}
      </div>
    </section>
  </>;
}
