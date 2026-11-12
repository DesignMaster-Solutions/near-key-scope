import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {audit} from '../audit.mjs';
import {ENDPOINTS,nearToYocto,yoctoToNear,looksPrivate,policyFromForm,rpcRequest,snapshotFrom} from '../web.mjs';
const read=(p)=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const policy=read('examples/policy.json');
const form={network:'testnet',account:'guest-book.testnet',publicKey:policy.publicKey,receiver:policy.receiver,methods:'add_message',maxAllowanceNear:'0.01'};
test('NEAR amounts become exact yocto strings, one yocto included',()=>{
  assert.equal(nearToYocto('0.01'),'10000000000000000000000');
  assert.equal(nearToYocto('1'),'1'+'0'.repeat(24));
  assert.equal(nearToYocto('0.000000000000000000000001'),'1');
  for(const bad of ['','-1','1e3','0.1.2','1.0000000000000000000000001','abc']) assert.throws(()=>nearToYocto(bad),/NEAR amount/);
});
test('yocto strings print back as NEAR without float rounding',()=>{
  assert.equal(yoctoToNear('10000000000000000000000'),'0.01');
  assert.equal(yoctoToNear('1'),'0.000000000000000000000001');
  assert.equal(yoctoToNear('2500000000000000000000000'),'2.5');
});
test('the form for the guest-book example is exactly examples/policy.json',()=>assert.deepEqual(policyFromForm(form),policy));
test('methods may be separated by commas, spaces or new lines; duplicates are rejected',()=>{
  assert.deepEqual(policyFromForm({...form,methods:' add_message,\n get_messages '}).methods,['add_message','get_messages']);
  assert.throws(()=>policyFromForm({...form,methods:'add_message, add_message'}),/unique/);
});
test('a pasted SECRET key is refused before anything is sent',()=>{
  const secret='ed25519:'+'3'.repeat(88);
  assert.equal(looksPrivate(secret),true);
  assert.equal(looksPrivate(policy.publicKey),false);
  assert.throws(()=>policyFromForm({...form,publicKey:secret}),/PRIVATE key/);
});
test('the browser and the CLI ask the same finalized RPC question',()=>{
  const {url,init}=rpcRequest(policy);
  assert.equal(url,ENDPOINTS.testnet);
  assert.equal(init.method,'POST');
  assert.deepEqual(JSON.parse(init.body).params,{request_type:'view_access_key_list',finality:'final',account_id:'guest-book.testnet'});
});
test('a snapshot built in the browser audits like the recorded one',()=>{
  const recorded=read('examples/testnet-snapshot.json');
  const s=snapshotFrom(policy,recorded.rpc,new Date('2026-11-01T20:00:00Z'));
  assert.equal(s.fetchedAt,'2026-11-01T20:00:00.000Z');
  assert.equal(s.endpoint,ENDPOINTS.testnet);
  const r=audit(s,policy);
  assert.equal(r.status,'FAIL');
  assert.equal(r.findings[0].code,'ALL_METHODS');
  assert.equal(r.evidence.blockHeight,recorded.rpc.result.block_height);
});
test('the page summarises every key of the checked account from the same snapshot, zero counts left out',async()=>{
  const {scanLine}=await import('../web.mjs');
  const {inventory}=await import('../audit.mjs');
  assert.equal(scanLine(inventory(read('examples/testnet-snapshot.json'))),'9 keys on this account: 7 FULL_ACCESS, 2 ALL_METHODS');
  assert.equal(scanLine({status:'UNKNOWN',error:'x'}),null);
});
