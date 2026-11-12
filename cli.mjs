#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {audit,inventory,validatePolicy} from './audit.mjs';
import {ENDPOINTS,rpcRequest,snapshotFrom} from './web.mjs';
const USAGE='Usage: node cli.mjs live|replay policy.json snapshot.json | scan snapshot.json | scan testnet|mainnet account';
const fetchKeys=async target=>{
  const {url,init}=rpcRequest(target);
  const response=await fetch(url,{...init,signal:AbortSignal.timeout(15000)});
  if(!response.ok) throw Error('RPC HTTP '+response.status);
  return snapshotFrom(target,await response.json());
};
try {
  const [mode,policyPath,snapshotPath,...extra]=process.argv.slice(2);
  if (mode==='scan'&&policyPath&&!extra.length) {
    // One argument replays a saved snapshot offline; two arguments (network, account) ask the public RPC.
    let snapshot;
    if (!snapshotPath) snapshot=JSON.parse(await readFile(policyPath,'utf8'));
    else {
      if (!Object.hasOwn(ENDPOINTS,policyPath)||snapshotPath.length>64||!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(snapshotPath)) throw Error(USAGE);
      snapshot=await fetchKeys({network:policyPath,account:snapshotPath});
    }
    const report={mode:'scan',...inventory(snapshot)};
    console.log(JSON.stringify(report,null,2));
    process.exitCode=report.status==='REPORT'?0:2;
  } else {
    if (!['live','replay'].includes(mode)||!policyPath||!snapshotPath||extra.length) throw Error(USAGE);
    const policy=JSON.parse(await readFile(policyPath,'utf8'));
    validatePolicy(policy);
    let snapshot;
    if(mode==='live') {
      snapshot=await fetchKeys(policy);
      await writeFile(snapshotPath,JSON.stringify(snapshot,null,2)+'\n',{flag:'wx'});
    } else snapshot=JSON.parse(await readFile(snapshotPath,'utf8'));
    const report={mode,...audit(snapshot,policy)};
    console.log(JSON.stringify(report,null,2));
    process.exitCode={PASS:0,FAIL:1,UNKNOWN:2}[report.status];
  }
} catch(e) {
  console.log(JSON.stringify({status:'UNKNOWN',error:e.message}));
  process.exitCode=2;
}
