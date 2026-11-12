# Key Scope

Before giving a NEAR key to an AI agent, compare its **actual on-chain permissions** with what the owner intended. A key named "read-only agent" can still have FullAccess. A function-call key with an empty method list can call every method on its receiver.

Key Scope is a working, read-only CLI. It queries finalized NEAR access keys, compares one selected key against a local policy, and emits a machine-readable verdict with the block hash, height, capture time, and the selected key's observed permission (FullAccess or its actual receiver, methods, and remaining gas allowance). It never reads private keys or signs transactions.

## Hosted demo (no install)

**https://designmaster-solutions.github.io/near-key-scope/** runs the same `audit.mjs` in your browser. Do X, see Y:

1. Press **Fill example**, then **Check live** (or open [`?demo=live`](https://designmaster-solutions.github.io/near-key-scope/?demo=live), which does both): you see **FAIL** with `ALL_METHODS` and a fresh finalized block height, fetched by your browser from the public testnet RPC.
2. Under the verdict, open **9 keys on this account**: every key on the account, worst first, from the same query (7 `FULL_ACCESS`, 2 `ALL_METHODS` on the example), with the key you checked marked. It is the CLI's `scan`, with no extra request.
3. Press **Replay**: the same verdict from the snapshot recorded on 2026-10-31, offline.
4. Put `ed25519:` plus 88 characters in the key field and press **Check live**: the page refuses it as a private key before any request.
5. **Download evidence JSON** and **Download policy JSON**, then `node cli.mjs replay policy.json key-scope-evidence.json`: the CLI reaches the same verdict.

The page is static (GitHub Pages), makes one read-only `view_access_key_list` query with `finality: final`, and never asks for a wallet, a signature or a private key. `web.mjs` (form to policy, NEAR to yocto with BigInt, the RPC request and the snapshot) is shared with `cli.mjs` and covered by `test/web.test.mjs`.

## Try it in 30 seconds

Node.js 22+; no dependencies, API keys, account or installation required.

```sh
npm test
npm run demo
```

The demo deliberately exits **1** and reports `FAIL / ALL_METHODS`. That is the expected successful detection, not a crash. It replays the real public `guest-book.testnet` snapshot in `examples/`, captured on 2026-10-31. The example policy permits only `add_message`; the selected key permits every method. This account is a third-party public example, not ours. We make no claim that its configuration violates its owner's intent: the narrow example policy is ours.

Fetch fresh data instead (choose a NEW snapshot filename; existing evidence is never overwritten):

```sh
node cli.mjs live examples/policy.json /tmp/key-scope-fresh.json
```

The current chain may differ from the recorded snapshot. Only `live` contacts the public RPC. `replay` is explicitly offline and is never proof of the current state.

## Scan a whole account (no policy needed)

Which of the keys on this account must never be handed to an agent? Do X, see Y:

```sh
node cli.mjs scan examples/testnet-snapshot.json   # offline, the recorded snapshot
node cli.mjs scan testnet guest-book.testnet       # one read-only RPC query, finalized block
```

Both print `"status": "REPORT"` with `"counts": {"FULL_ACCESS": 7, "ALL_METHODS": 2, "UNLIMITED_GAS": 0, "SCOPED": 0}` for the recorded snapshot (live counts follow the chain), then every key sorted worst first with its receiver, methods and remaining allowance, and the block hash and height it was read at. Exit 0 means a report was produced, not that the account is safe; exit 2 is UNKNOWN (bad arguments, RPC failure, or a permission variant this version does not know, which fails closed).

- `FULL_ACCESS`: can transfer funds, change keys and delete the account. Normal for an owner, never for an agent.
- `ALL_METHODS`: function-call key with an empty method list, so every method on its receiver.
- `UNLIMITED_GAS`: named methods, but no key-level gas budget.
- `SCOPED`: one receiver, named methods, finite allowance. Still check it against your policy with `live`.

An account that does not exist on the chosen network returns zero keys and a `note` saying so.

## Narrated walkthrough

[Download or watch the demo video](https://github.com/DesignMaster-Solutions/near-key-scope/releases/download/demo-v0.1/key-scope-demo.mp4). AI-assisted narration demonstrates the real CLI rejection, a fresh finalized RPC capture, and all 20 tests. The video is supporting material, not a claim of hackathon submission.

Reproduce the scenes with `node video/show.mjs policy`, `node video/show.mjs replay`, `node video/show.mjs capture`, and `npm test`. The capture scene replays `video/live-snapshot.json`, fetched on October 31, 2026; it is not a live network call during playback. See [video production notes](video/README.md).

## Your agent policy

Copy `examples/policy.json`. Set `network` (`testnet` or `mainnet`), `account`, the exact **public** key handle, approved `receiver`, explicit `methods`, and `maxAllowanceYocto`. Unknown/missing policy fields are rejected. One NEAR is 10^24 yoctoNEAR; amounts must be decimal strings. BigInt comparisons preserve a one-yocto difference.

The allowance limits **remaining gas**, not token balances, daily spending or the economic effects of contract calls. NEAR function-call keys cannot attach NEAR to a call. The target contract can still have powerful zero-deposit methods. Review those methods independently.

| Exit | Verdict | Meaning |
| --- | --- | --- |
| 0 | PASS | Selected key's observed permissions fit this policy |
| 1 | FAIL | FullAccess, unrestricted/extra methods, wrong receiver, unlimited/excess/exhausted allowance, or missing key |
| 2 | UNKNOWN | Bad policy, malformed response, RPC failure, unavailable file or incomplete evidence |

Full-access owner/recovery keys elsewhere on the account are not flagged by `live`/`replay`: they evaluate only the key you identify as the agent's. To see every key at once, use `scan` below. Neither recommends deleting the owner's recovery key.

## Limits and trust boundary

- This is an auditor, not an enforcing wallet, contract vulnerability scanner or authorization to transfer money.
- Policy is trusted owner input. Do not let an untrusted agent rewrite its own policy.
- A public RPC response is trusted transport data, not a cryptographic state proof. No independent-node consensus is claimed.
- A PASS is tied to the recorded block. Keys can change immediately afterwards; no TOCTOU protection or continuous monitoring exists.
- Replay files can be edited. The live snapshot is provided for reproducibility, not attestation.
- Method allowlists do not inspect contract code, upgrades or arguments. No claim of complete asset safety.
- Unknown permission variants fail closed. Public-key handles are matched exactly; the tool is not a signature verifier.

## NEAR HACKATHON

Target track: **AI Security & Defense** (`security`). New project started October 31, 2026 with Codex assistance. No pre-existing product code or third-party runtime dependencies. Not yet submitted. [Current build/submission requirements](docs/submission.md).

NEAR-specific integration: finalized `query / view_access_key_list`, native FunctionCall versus FullAccess permissions, receiver and method constraints, and exact u128 yoctoNEAR gas allowances. Tests (36) cover boundary values, incorrect chain/account, unavailable evidence, command exit statuses, NEAR/yocto conversion and the private-key refusal of the hosted page. The included positive case is synthetic and labelled as such in the test; live proof currently demonstrates rejection only.

## Sources

- [NEAR access key semantics](https://docs.near.org/protocol/accounts-contracts/access-keys)
- [NEAR RPC contract/key queries](https://docs.near.org/api/rpc/contracts)
- [Event rules and FAQ](https://nearhackathon.com/HACKATHON.md), Q-001 permits code from the October 19 announcement; Q-005 allows AI-assisted code; Q-010 allows testnet-only projects; Q-012 requires a video for local-only demos.

MIT license. Design Master Solutions LLC.
