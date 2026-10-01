import { Admin } from '@/components/admin';
import { admin, adminLabel, db, ensureInitialized, getEntries, getSettings, runtimeEnv } from '@/lib/server';
import { redirect } from 'next/navigation';

export const dynamic='force-dynamic';
export const metadata={title:'Events | Admin',robots:{index:false,follow:false}};

export default async function EventsAdminPage(){
  if(!(await admin()))redirect('/admin/login');
  await ensureInitialized();
  const [entries,settings,result]=await Promise.all([getEntries(true),getSettings(),db().prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 1000').all()]);
  return <Admin initialEntries={entries} initialSettings={settings} initialLeads={result.results} email={adminLabel()} emailReady={!!runtimeEnv().RESEND_API_KEY} initialSection="events"/>;
}
