import {isRichHtml} from '@/lib/rich-text';
import {RichText} from '@/components/rich-text';

export function PointText({text}:{text?:string}){
  if(isRichHtml(text))return <RichText text={text}/>;
  const lines=String(text||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  if(lines.length<2)return <p className="long-text">{text}</p>;
  return <ul className="point-list">{lines.map((line,index)=><li key={index}>{line.replace(/^([-*•]|\d+[.)])\s*/,'')}</li>)}</ul>;
}
