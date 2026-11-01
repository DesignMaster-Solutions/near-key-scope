#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {audit,validatePolicy} from './audit.mjs';
import {rpcRequest,snapshotFrom} from './web.mjs';
try {
  const [mode,policyPath,snapshotPath,...extra]=process.argv.slice(2);
  if (!['live','replay'].includes(mode)||!policyPath||!snapshotPath||extra.length) throw Error('Usage: node cli.mjs live|replay policy.json snapshot.json');
  const policy=JSON.parse(await readFile(policyPath,'utf8'));
  validatePolicy(policy);
  let snapshot;
  if(mode==='live') {
    const {url,init}=rpcRequest(policy);
    const response=await fetch(url,{...init,signal:AbortSignal.timeout(15000)});
    if(!response.ok) throw Error('RPC HTTP '+response.status);
    snapshot=snapshotFrom(policy,await response.json());
    await writeFile(snapshotPath,JSON.stringify(snapshot,null,2)+'\n',{flag:'wx'});
  } else snapshot=JSON.parse(await readFile(snapshotPath,'utf8'));
  const report={mode,...audit(snapshot,policy)};
  console.log(JSON.stringify(report,null,2));
  process.exitCode={PASS:0,FAIL:1,UNKNOWN:2}[report.status];
} catch(e) {
  console.log(JSON.stringify({status:'UNKNOWN',error:e.message}));
  process.exitCode=2;
}
