import test from 'node:test';
import assert from 'node:assert/strict';
import {validate} from '../submission.mjs';
const ok={requestId:'3f2a1c4e-8b7d-4e21-9a0b-1c2d3e4f5a6b',projectName:'Key Scope',leadName:'Test Lead',email:'lead@example.com',size:'1',tracks:['security'],nearAddress:'example.near',projectUrl:'https://github.com/example/repo',demoUrl:'https://x.com/example/status/1',idea:'A read-only auditor for agent keys on NEAR.',consent:true};
test('valid payload passes',()=>assert.deepEqual(validate(ok),[]));
test('spam-trap field, unknown track, bad account and missing consent are rejected',()=>{
  const e=validate({...ok,website:'x',tracks:['security','security'],nearAddress:'Bad.Near',consent:false});
  for(const f of ['website','tracks','nearAddress','consent'])assert.ok(e.some(m=>m.startsWith(f)),f);
});
test('placeholders left empty are caught',()=>{
  const e=validate({...ok,nearAddress:'',demoUrl:''});
  assert.ok(e.some(m=>m.startsWith('nearAddress'))&&e.some(m=>m.startsWith('demoUrl')));
});
test('64-char implicit account is accepted',()=>assert.deepEqual(validate({...ok,nearAddress:'a'.repeat(64)}),[]));
