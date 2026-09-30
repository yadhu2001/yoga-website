export function PointText({text}:{text?:string}){
  const lines=String(text||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  if(lines.length<2)return <p className="long-text">{text}</p>;
  return <ul className="point-list">{lines.map((line,index)=><li key={index}>{line.replace(/^([-*•]|\d+[.)])\s*/,'')}</li>)}</ul>;
}
