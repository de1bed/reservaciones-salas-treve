import { google } from 'googleapis';
function privateKey(){ const raw=process.env.GOOGLE_PRIVATE_KEY || ''; return raw.replace(/\\n/g,'\n'); }
export function getCalendarClient(){
  const email=process.env.GOOGLE_CLIENT_EMAIL;
  const key=privateKey();
  if(!email || !key) throw new Error('Faltan variables GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY en Vercel.');
  const auth = new google.auth.GoogleAuth({credentials:{client_email:email, private_key:key}, scopes:['https://www.googleapis.com/auth/calendar']});
  return google.calendar({version:'v3', auth});
}
