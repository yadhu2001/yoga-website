import {admin,db,getEntries,getSettings,runtimeEnv} from '@/lib/server';
import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {Admin,SetupAdmin} from '@/components/admin';
export const dynamic='force-dynamic';
export const metadata={title:'Admin | Sree Pranavam Yoga',robots:{index:false,follow:false}};
export default async function AdminPage(){const user=await requireChatGPTUser('/admin');const count=await db().prepare('SELECT COUNT(*) AS n FROM admins').first();if(!count.n)return <SetupAdmin/>;if(!await admin())return <main className="wrap section"><h1 style={{fontSize:40}}>Administrator access required.</h1><p className="my-5">Your account is signed in, but it does not have permission to manage this website.</p><a href="/" className="btn">Return to website</a></main>;const [entries,settings,result]=await Promise.all([getEntries(true),getSettings(),db().prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 1000').all()]);return <Admin initialEntries={entries} initialSettings={settings} initialLeads={result.results} email={user.email} emailReady={!!runtimeEnv().RESEND_API_KEY}/>}
