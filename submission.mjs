// Checks a NEAR HACKATHON submission payload against the published API contract
// (https://nearhackathon.com/HACKATHON.md, "Submission API", read 2026-11-01). Never sends anything.
import {readFileSync} from 'node:fs';
const SIZES=['1','2 - 4','4 - 6','6 - 8','8+'];
const TRACKS=['defi','thesis','privacy','business','swarms','security','agents','realworld','games','nfts','memecoins','social','open'];
const FIELDS=['requestId','projectName','leadName','email','size','tracks','nearAddress','projectUrl','demoUrl','idea','consent'];
const ACCOUNT=/^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;
const len=(v,a,b)=>typeof v==='string'&&v.length>=a&&v.length<=b;
const url=v=>len(v,1,300)&&/^https?:\/\/\S+$/.test(v);
export function validate(p){
  const e=[];
  for(const k of Object.keys(p))if(!FIELDS.includes(k))e.push(`${k}: not in contract`);
  for(const k of FIELDS)if(!(k in p))e.push(`${k}: missing`);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(p.requestId??''))e.push('requestId: lowercase UUID');
  if(!len(p.projectName,2,80))e.push('projectName: 2-80 chars');
  if(!len(p.leadName,2,80))e.push('leadName: 2-80 chars');
  if(!len(p.email,3,160)||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email))e.push('email: valid, max 160');
  if(!SIZES.includes(p.size))e.push(`size: one of ${SIZES.join(' | ')}`);
  if(!Array.isArray(p.tracks)||!p.tracks.length||new Set(p.tracks).size!==p.tracks.length||p.tracks.some(t=>!TRACKS.includes(t)))e.push('tracks: unique known ids');
  if(!len(p.nearAddress,2,64)||!ACCOUNT.test(p.nearAddress))e.push('nearAddress: lowercase NEAR account, 2-64');
  if(!url(p.projectUrl))e.push('projectUrl: http(s), max 300');
  if(!url(p.demoUrl))e.push('demoUrl: http(s), max 300');
  if(!len(p.idea,20,2000))e.push('idea: 20-2000 chars');
  if(p.consent!==true)e.push('consent: true only after the human agreed');
  if(Buffer.byteLength(JSON.stringify(p))>12000)e.push('body: over 12000 bytes');
  return e;
}
if(import.meta.url===`file://${process.argv[1]}`){
  const errors=validate(JSON.parse(readFileSync(process.argv[2],'utf8')));
  console.log(errors.length?errors.join('\n'):'OK: payload matches the contract (not sent)');
  process.exit(errors.length?1:0);
}
