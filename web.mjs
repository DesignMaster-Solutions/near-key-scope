// Shared by cli.mjs and the hosted page (index.html): the RPC question, the snapshot, and the owner's form -> policy.
// Pure functions; tested in test/web.test.mjs.
import {validatePolicy} from './audit.mjs';
export const ENDPOINTS={testnet:'https://rpc.testnet.near.org',mainnet:'https://rpc.mainnet.near.org'};
export function rpcRequest(policy) {
  return {url:ENDPOINTS[policy.network],init:{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jsonrpc:'2.0',id:'key-scope',method:'query',params:{request_type:'view_access_key_list',finality:'final',account_id:policy.account}})}};
}
export function snapshotFrom(policy,rpc,now=new Date()) {
  return {network:policy.network,account:policy.account,endpoint:ENDPOINTS[policy.network],fetchedAt:now.toISOString(),rpc};
}
// 1 NEAR = 10^24 yoctoNEAR. String and BigInt math only, so a one-yocto difference survives.
export function nearToYocto(near) {
  const m=/^(0|[1-9][0-9]*)(?:\.([0-9]{1,24}))?$/.exec(String(near).trim());
  if (!m) throw Error('Allowance must be a NEAR amount like 0.25 (up to 24 decimals)');
  return (BigInt(m[1])*10n**24n+BigInt((m[2]||'').padEnd(24,'0'))).toString();
}
export function yoctoToNear(yocto) {
  const v=BigInt(yocto), whole=v/10n**24n, frac=(v%10n**24n).toString().padStart(24,'0').replace(/0+$/,'');
  return frac?`${whole}.${frac}`:`${whole}`;
}
// An ed25519 public key is 32 bytes (about 44 base58 characters); a secret key is 64 bytes (about 88). Refuse the second.
export function looksPrivate(handle) {
  const m=/^ed25519:([1-9A-HJ-NP-Za-km-z]+)$/.exec(String(handle).trim());
  return !!m&&m[1].length>60;
}
export function policyFromForm(f) {
  if (looksPrivate(f.publicKey)) throw Error('That looks like a PRIVATE key. Never paste a private key anywhere: use the public key (ed25519:..., about 44 characters).');
  const policy={network:f.network,account:String(f.account).trim(),publicKey:String(f.publicKey).trim(),receiver:String(f.receiver).trim(),
    methods:String(f.methods).split(/[\s,]+/).filter(Boolean),maxAllowanceYocto:nearToYocto(f.maxAllowanceNear)};
  validatePolicy(policy);
  return policy;
}
// Scan needs no policy: only where to look. Validated because it comes straight from the form.
export function scanTarget(f) {
  const t={network:f.network,account:String(f.account).trim()};
  if (!Object.hasOwn(ENDPOINTS,t.network)) throw Error('Unknown network');
  if (t.account.length<2||t.account.length>64||!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(t.account)) throw Error('Invalid account: type the account name, like my-agent.near');
  return t;
}
// One line for the page: how many keys the account has and how many of each risk (zero counts left out). null when the inventory failed.
export function scanLine(inv) {
  if (inv?.status!=='REPORT') return null;
  const parts=Object.entries(inv.counts).filter(([,n])=>n).map(([risk,n])=>`${n} ${risk}`);
  return `${inv.keys.length} key${inv.keys.length===1?'':'s'} on this account${parts.length?': '+parts.join(', '):''}`;
}
