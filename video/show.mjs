// Compact, reproducible display of the actual CLI output for the demo video.
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const mode = process.argv[2];
if (mode === 'policy') {
  const p = JSON.parse(readFileSync('examples/policy.json'));
  console.log(`Network: ${p.network}\nAccount: ${p.account}\nReceiver: ${p.receiver}\nAllowed methods: ${p.methods.join(', ')}\nGas allowance cap: ${p.maxAllowanceYocto} yoctoNEAR\nPolicy is illustrative; this is a third-party public example.`);
} else {
  if (!['replay','capture'].includes(mode)) throw Error('Use policy, replay, or capture');
  const file = mode === 'capture' ? 'video/live-snapshot.json' : 'examples/testnet-snapshot.json';
  const r = spawnSync(process.execPath, ['cli.mjs','replay','examples/policy.json',file], {encoding:'utf8'});
  if (r.error || r.status !== 1) throw Error('Expected real rejection, got: '+r.stdout+r.stderr);
  const report = JSON.parse(r.stdout);
  console.log(`Mode: offline replay of ${mode === 'capture' ? 'fresh RPC capture' : 'bundled snapshot'}\nVerdict: ${report.status} (CLI exit ${r.status})\nFinding: ${report.findings.map(f=>f.code).join(', ')}\n${report.findings[0].message}\nBlock: ${report.evidence.blockHeight}\nHash: ${report.evidence.blockHash}\nCaptured: ${report.evidence.fetchedAt}`);
}
