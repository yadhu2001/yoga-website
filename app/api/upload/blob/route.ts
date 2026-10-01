import {handleUpload,type HandleUploadBody} from '@vercel/blob/client';
import {del} from '@vercel/blob';
import {admin,fail,runtimeEnv,sameOrigin} from '@/lib/server';
import {BLOB_PREFIX} from '@/lib/local-env';
import {MAX_UPLOAD_BYTES,MEDIA_KEY,UPLOAD_ERROR,UPLOAD_TYPES,sniff} from '@/lib/upload';

// Direct browser → Vercel Blob uploads (files up to 50 MB bypass the 4.5 MB function limit).
// 1. The admin asks this route for an upload token (handleUpload).
// 2. After the upload, the admin calls it again with {action:'verify'} so the real file type is checked;
//    files that are not genuine images, videos or PDFs are deleted.
export async function POST(r:Request){try{
  if(!sameOrigin(r)||!await admin())return fail('Administrator access required.',403);
  const bucket=runtimeEnv().BUCKET;
  if(bucket.kind!=='blob')return fail('Direct uploads are not configured.',501);
  const body=await r.json();
  if(body?.action==='verify'){
    const key=String(body.key||'');
    if(!MEDIA_KEY.test(key))return fail('Invalid upload.',400);
    const url=bucket.publicUrl(key);
    const res=url?await fetch(url,{headers:{Range:'bytes=0-31'},cache:'no-store'}):null;
    const bytes=res&&res.ok?new Uint8Array(await res.arrayBuffer()).slice(0,32):new Uint8Array();
    const kind=sniff(bytes);
    if(!kind||UPLOAD_TYPES[kind]!==key.split('.').pop()){await del(BLOB_PREFIX+key).catch(()=>{});return fail(UPLOAD_ERROR,400);}
    return Response.json({url:'/media/'+key});
  }
  const result=await handleUpload({body:body as HandleUploadBody,request:r,onBeforeGenerateToken:async pathname=>{
    const key=pathname.startsWith(BLOB_PREFIX)?pathname.slice(BLOB_PREFIX.length):'';
    if(!MEDIA_KEY.test(key))throw new Error('Invalid upload path.');
    const ext=key.split('.').pop();
    const type=(Object.keys(UPLOAD_TYPES) as (keyof typeof UPLOAD_TYPES)[]).find(t=>UPLOAD_TYPES[t]===ext);
    return {allowedContentTypes:type?[type]:[],maximumSizeInBytes:MAX_UPLOAD_BYTES,addRandomSuffix:false,allowOverwrite:false};
  }});
  return Response.json(result);
}catch(e){console.error(e);return fail((e as Error).message==='Invalid upload path.'?'Invalid upload.':'Upload failed. Please try again.',400);}}
