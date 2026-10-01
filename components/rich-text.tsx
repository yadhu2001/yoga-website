import {isRichHtml,sanitizeRich} from '@/lib/rich-text';

export function RichText({text,className,inline=false}:{text?:string;className?:string;inline?:boolean}){
  const value=String(text??'');
  if(!value.trim())return null;
  if(!isRichHtml(value)){
    const Tag=inline?'span':'p';
    return <Tag className={className} style={{whiteSpace:'pre-line'}}>{value}</Tag>;
  }
  let html=sanitizeRich(value);
  if(inline)html=html.replace(/^<p>/,'').replace(/<\/p>$/,'');
  const Tag=inline?'span':'div';
  return <Tag className={className?`rich-text ${className}`:'rich-text'} dangerouslySetInnerHTML={{__html:html}}/>;
}
