'use client';
import {useEffect} from 'react';
import {EditorContent,useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {TextStyleKit} from '@tiptap/extension-text-style';
import {isRichHtml,sanitizeRich} from '@/lib/rich-text';

const sizes=['14px','16px','18px','20px','24px','32px'];

function toDoc(value?:string){
  const text=value||'';
  if(!text.trim())return '<p></p>';
  if(isRichHtml(text))return sanitizeRich(text);
  return text.split(/\n/).map(line=>`<p>${line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')||'<br>'}</p>`).join('');
}

export function RichEditor({value,onChange}:{value?:string;onChange:(value:string)=>void}){
  const editor=useEditor({
    immediatelyRender:false,
    shouldRerenderOnTransaction:true,
    extensions:[
      StarterKit.configure({heading:{levels:[2,3]},code:false,codeBlock:false,blockquote:false,horizontalRule:false,link:false}),
      TextStyleKit.configure({backgroundColor:false,fontFamily:false,lineHeight:false}),
    ],
    content:toDoc(value),
    editorProps:{attributes:{class:'rich-editor-body'}},
    onUpdate:({editor})=>{
      onChange(editor.getText().trim()?sanitizeRich(editor.getHTML()):'');
    },
  });
  useEffect(()=>{
    if(!editor||editor.isFocused)return;
    const next=toDoc(value);
    if(editor.getHTML()!==next)editor.commands.setContent(next,{emitUpdate:false});
  },[editor,value]);
  if(!editor)return <div className="rich-editor"/>;
  const size=editor.getAttributes('textStyle').fontSize||'';
  return <div className="rich-editor">
    <div className="rich-toolbar">
      <button type="button" className={editor.isActive('bold')?'active':''} onClick={()=>editor.chain().focus().toggleBold().run()}>Bold</button>
      <button type="button" className={editor.isActive('italic')?'active':''} onClick={()=>editor.chain().focus().toggleItalic().run()}>Italic</button>
      <button type="button" className={editor.isActive('underline')?'active':''} onClick={()=>editor.chain().focus().toggleUnderline().run()}>Underline</button>
      <button type="button" className={editor.isActive('bulletList')?'active':''} onClick={()=>editor.chain().focus().toggleBulletList().run()}>Bullets</button>
      <button type="button" className={editor.isActive('orderedList')?'active':''} onClick={()=>editor.chain().focus().toggleOrderedList().run()}>Numbers</button>
      <label>Size<select value={size} onChange={e=>{const next=e.target.value;if(!next)editor.chain().focus().unsetFontSize().run();else editor.chain().focus().setFontSize(next).run();}}><option value="">Size</option>{sizes.map(item=><option key={item} value={item}>{item.replace('px','')}</option>)}</select></label>
      <label>Color<input type="color" aria-label="Font color" value={editor.getAttributes('textStyle').color||'#102b50'} onChange={e=>editor.chain().focus().setColor(e.target.value).run()}/></label>
    </div>
    <EditorContent editor={editor}/>
  </div>;
}
