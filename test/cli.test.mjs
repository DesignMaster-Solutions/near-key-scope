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
