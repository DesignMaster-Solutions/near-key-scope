#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {audit,validatePolicy} from './audit.mjs';
const endpoints={testnet:'https://rpc.testnet.near.org',mainnet:'https://rpc.mainnet.near.org'};
try {
  const [mode,policyPath,snapshotPath,...extra]=process.argv.slice(2);
  if (!['live','replay'].includes(mode)||!policyPath||!snapshotPath||extra.length) throw Error('Usage: node cli.mjs live|replay policy.json snapshot.json');
  const policy=JSON.parse(await readFile(policyPath,'utf8'));
  validatePolicy(policy);
  let snapshot;
  if(mode==='live') {
    const response=await fetch(endpoints[policy.network],{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'key-scope',method:'query',params:{request_type:'view_access_key_list',finality:'final',account_id:policy.account}}),signal:AbortSignal.timeout(15000)});
    if(!response.ok) throw Error('RPC HTTP '+response.status);
    snapshot={network:policy.network,account:policy.account,endpoint:endpoints[policy.network],fetchedAt:new Date().toISOString(),rpc:await response.json()};
    await writeFile(snapshotPath,JSON.stringify(snapshot,null,2)+'\n',{flag:'wx'});
  } else snapshot=JSON.parse(await readFile(snapshotPath,'utf8'));
  const report={mode,...audit(snapshot,policy)};
  console.log(JSON.stringify(report,null,2));
  process.exitCode={PASS:0,FAIL:1,UNKNOWN:2}[report.status];
} catch(e) {
  console.log(JSON.stringify({status:'UNKNOWN',error:e.message}));
  process.exitCode=2;
}
