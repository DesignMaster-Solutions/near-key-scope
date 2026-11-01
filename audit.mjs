// Read-only comparison of one observed NEAR access key against a trusted policy.
const isObject = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const uint = x => typeof x === 'string' && /^(0|[1-9][0-9]*)$/.test(x) && BigInt(x) < 2n ** 128n;
const names = x => Array.isArray(x) && x.every(v => typeof v === 'string' && v.length > 0 && v.length <= 256);
export function validatePolicy(p) {
  const fields = ['network','account','publicKey','receiver','methods','maxAllowanceYocto'];
  if (!isObject(p) || Object.keys(p).length !== fields.length || fields.some(k => !Object.hasOwn(p,k))) throw Error('Policy requires exactly: '+fields.join(', '));
  if (!['testnet','mainnet'].includes(p.network)) throw Error('Unknown network');
  for (const k of ['account','receiver']) if (typeof p[k] !== 'string' || p[k].length < 2 || p[k].length > 64 || !/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(p[k])) throw Error('Invalid '+k);
  if (typeof p.publicKey !== 'string' || !/^[a-z0-9-]+:[A-Za-z0-9]+$/.test(p.publicKey)) throw Error('Invalid public key handle');
  if (!names(p.methods) || !p.methods.length || new Set(p.methods).size !== p.methods.length) throw Error('Policy must name unique allowed methods');
  if (!uint(p.maxAllowanceYocto) || BigInt(p.maxAllowanceYocto) === 0n) throw Error('Allowance cap must be a positive u128 decimal string');
}
export function audit(snapshot, policy) {
  const findings=[];
  const finding=(code,message)=>findings.push({code,message});
  let evidence=null;
  try {
    validatePolicy(policy);
    if (!isObject(snapshot) || snapshot.network !== policy.network || snapshot.account !== policy.account) throw Error('Snapshot chain/account does not match policy');
    if (typeof snapshot.fetchedAt !== 'string' || !Number.isFinite(Date.parse(snapshot.fetchedAt))) throw Error('Missing fetch time');
    const rpc=snapshot.rpc;
    if (!isObject(rpc) || rpc.error || !isObject(rpc.result)) throw Error('RPC did not return a successful result');
    const r=rpc.result;
    if (typeof r.block_hash !== 'string' || !r.block_hash || !Number.isSafeInteger(r.block_height) || r.block_height < 1 || !Array.isArray(r.keys)) throw Error('Incomplete block/key evidence');
    if (r.keys.some(k=>!isObject(k)||typeof k.public_key!=='string')) throw Error('Malformed key list');
    const matches=r.keys.filter(k=>k.public_key===policy.publicKey);
    evidence={network:snapshot.network,account:snapshot.account,publicKey:policy.publicKey,blockHash:r.block_hash,blockHeight:r.block_height,fetchedAt:snapshot.fetchedAt,permission:null};
    if (matches.length > 1) throw Error('Duplicate queried key');
    if (!matches.length) finding('KEY_MISSING','The selected agent key is not present.');
    else {
      const permission=matches[0].access_key?.permission;
      if (permission==='FullAccess') {
        evidence.permission='FullAccess';
        finding('FULL_ACCESS','This key can transfer funds, change keys and delete the account. Do not delegate it to this agent.');
      }
      else {
        if (!isObject(permission)||Object.keys(permission).length!==1||!isObject(permission.FunctionCall)) throw Error('Unsupported key permission');
        const f=permission.FunctionCall;
        if (typeof f.receiver_id!=='string'||!names(f.method_names)||!(f.allowance===null||uint(f.allowance))) throw Error('Malformed function-call permission');
        evidence.permission={kind:'FunctionCall',receiver:f.receiver_id,methods:[...f.method_names],allowanceYocto:f.allowance};
        if (f.receiver_id!==policy.receiver) finding('WRONG_RECEIVER','Observed contract differs from the approved contract.');
        if (!f.method_names.length) finding('ALL_METHODS','An empty method list allows EVERY method on this contract.');
        else if (f.method_names.some(m=>!policy.methods.includes(m))) finding('EXTRA_METHODS','Key allows methods outside the policy: '+f.method_names.filter(m=>!policy.methods.includes(m)).join(', '));
        if (f.allowance===null) finding('UNLIMITED_GAS','Null allowance has no key-level gas budget.');
        else if (BigInt(f.allowance)===0n) finding('EXHAUSTED','Observed key has no remaining gas allowance.');
        else if (BigInt(f.allowance)>BigInt(policy.maxAllowanceYocto)) finding('ALLOWANCE_TOO_HIGH','Remaining gas allowance exceeds the approved cap.');
      }
    }
    return {status:findings.length?'FAIL':'PASS',findings,evidence,scope:'Key permissions only; not a contract audit or transaction authorization.'};
  } catch(e) {
    return {status:'UNKNOWN',findings:[{code:'INVALID_EVIDENCE_OR_POLICY',message:e.message}],evidence};
  }
}
