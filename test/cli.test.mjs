import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const root=new URL('../',import.meta.url);
const temp=mkdtempSync(join(tmpdir(),'key-scope-test-'));
const run=(...args)=>{const r=spawnSync(process.execPath,['cli.mjs',...args],{cwd:root,encoding:'utf8'});return {exit:r.status,report:JSON.parse(r.stdout)}};
test('CLI replay of real public key returns FAIL/1 and observed block',()=>{const r=run('replay','examples/policy.json','examples/testnet-snapshot.json');assert.equal(r.exit,1);assert.equal(r.report.findings[0].code,'ALL_METHODS');assert.equal(r.report.mode,'replay');assert.ok(r.report.evidence.blockHeight>0)});
test('CLI returns PASS/0 for explicitly labelled synthetic restricted key',()=>{
const s=JSON.parse(readFileSync(new URL('../examples/testnet-snapshot.json',import.meta.url)));
const p=JSON.parse(readFileSync(new URL('../examples/policy.json',import.meta.url)));
s.rpc.result.keys.find(k=>k.public_key===p.publicKey).access_key.permission.FunctionCall.method_names=['add_message'];
const path=join(temp,'synthetic-restricted.json'); writeFileSync(path,JSON.stringify(s));
const r=run('replay','examples/policy.json',path);assert.equal(r.exit,0);assert.equal(r.report.status,'PASS');
});
test('CLI bad input returns UNKNOWN/2',()=>{for(const args of [[],['replay','examples/policy.json',join(temp,'missing.json')]]){const r=run(...args);assert.equal(r.exit,2);assert.equal(r.report.status,'UNKNOWN')}});
test('CLI scan lists every key on the account, worst first, with counts and the block',()=>{
const r=run('scan','examples/testnet-snapshot.json');assert.equal(r.exit,0);assert.equal(r.report.status,'REPORT');
const s=JSON.parse(readFileSync(new URL('../examples/testnet-snapshot.json',import.meta.url)));
assert.equal(r.report.keys.length,s.rpc.result.keys.length);
assert.equal(r.report.counts.FULL_ACCESS,s.rpc.result.keys.filter(k=>k.access_key.permission==='FullAccess').length);
assert.equal(r.report.keys[0].risk,'FULL_ACCESS');
assert.equal(r.report.keys.find(k=>k.publicKey==='ed25519:FnF8jNEV5uLJAdTLLs1iCBhzCQi7QrVzghvWXwfc5KxS').risk,'ALL_METHODS');
assert.ok(r.report.evidence.blockHeight>0);
assert.equal(Object.values(r.report.counts).reduce((a,b)=>a+b),r.report.keys.length);
});
test('CLI scan fails closed on an unknown permission variant and on a bad network',()=>{
const s=JSON.parse(readFileSync(new URL('../examples/testnet-snapshot.json',import.meta.url)));
s.rpc.result.keys[0].access_key.permission={Future:{}};const path=join(temp,'future.json');writeFileSync(path,JSON.stringify(s));
for(const args of [['scan',path],['scan','devnet','guest-book.testnet']]){const r=run(...args);assert.equal(r.exit,2);assert.equal(r.report.status,'UNKNOWN')}
});
test('CLI scan of an account with no keys says so instead of looking safe',()=>{
const s=JSON.parse(readFileSync(new URL('../examples/testnet-snapshot.json',import.meta.url)));
s.rpc.result.keys=[];const path=join(temp,'empty.json');writeFileSync(path,JSON.stringify(s));
const r=run('scan',path);assert.equal(r.exit,0);assert.match(r.report.note,/does not exist/);
});
