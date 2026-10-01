import {env} from './local-env';
import {adminLabel,adminSession} from './admin-auth';
import {defaults,seedEntries,type Entry} from './content';
export {adminLabel};
export const runtimeEnv=()=>env as unknown as Record<string,any>;
export function db(){const d=runtimeEnv().DB;if(!d)throw new Error('Content database unavailable. Please try again shortly.');return d;}
export async function admin(){return adminSession();}
export async function ensureInitialized(){const row=await db().prepare('SELECT id FROM settings WHERE id = ?').bind('initialized').first();if(!row)await initialize();}
export function sameOrigin(r:Request){const o=r.headers.get('origin');return !!o && o===new URL(r.url).origin;}
export async function getSettings(){const row=await db().prepare('SELECT data FROM settings WHERE id = ?').bind('site').first();return {...defaults,...(row?JSON.parse(row.data):{})};}
export async function getEntries(all=false):Promise<Entry[]>{const rows=await db().prepare('SELECT * FROM content ORDER BY position ASC').all();if(!rows.results.length){const initialized=await db().prepare('SELECT id FROM settings WHERE id = ?').bind('initialized').first();if(!initialized)return seedEntries.filter(e=>all||e.published===1);}return rows.results.map((r:any)=>({...JSON.parse(r.data),id:r.id,type:r.type,published:r.published,position:r.position})).filter((r:Entry)=>all||r.published===1).map((r:Entry)=>all||r.type!=='resources'||!r.file?r:{...r,file:'protected'});}
export async function initialize(){const statements=seedEntries.map(e=>db().prepare('INSERT OR IGNORE INTO content (id,type,data,published,position) VALUES (?,?,?,?,?)').bind(e.id,e.type,JSON.stringify(e),e.published,e.position));statements.push(db().prepare('INSERT OR IGNORE INTO settings (id,data) VALUES (?,?)').bind('initialized','{}'));await db().batch(statements);}
export function publicSettings(s:Record<string,any>){const {notificationEmail,emailFrom,...rest}=s;return rest;}
export const fail=(message='The service is temporarily unavailable. Please try again.',status=503)=>Response.json({error:message},{status});
export async function notifyLead(lead:Record<string,any>,s:Record<string,any>){const key=runtimeEnv().RESEND_API_KEY;if(!key||!s.notificationEmail||!s.emailFrom)return 'Not configured';try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':lead.id},signal:AbortSignal.timeout(8000),body:JSON.stringify({from:s.emailFrom,to:[s.notificationEmail],reply_to:lead.email,subject:`New ${lead.type} enquiry — Sree Pranavam`,text:Object.entries(lead).map(([k,v])=>`${k}: ${v}`).join('\n')})});return r.ok?'Sent':'Failed';}catch{return 'Failed';}}
