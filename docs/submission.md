# Submission status and remaining work

As checked on 2026-10-31. This is a working CLI prototype, **not a submitted entry**.

## Verified event facts

Source: https://nearhackathon.com/HACKATHON.md (Q-001, Q-005, Q-010, Q-012 through Q-017 and Prizes).

- Code from the announcement on October 19, 2026 counts. Development need not wait until November 1.
- Final submission opens November 1 00:00 UTC (October 31 21:00 Sao Paulo) and ends November 14 23:59 UTC (20:59 Sao Paulo).
- AI-assisted code and testnet-only prototypes are allowed. Any license is acceptable; team retains code rights.
- Public repository must remain available through judging. For a local CLI, screenshots alone are insufficient: a video in the public X demo is required.
- Track `security`: 1st US$10,000, 2nd US$3,000, 3rd US$2,000, fixed in USD and paid in NEAR. Not revenue or guaranteed winnings.
- Results by November 18 23:59 UTC. Payment within 30 days of results.
- No advance registration; one final submission per project, not editable. Public demo and a real mainnet payout account are mandatory. No residency restriction is stated on the checked FAQ; final terms still need checking before submission.

## Hosted demo (Q-012: "Hosted demo is a plus; keep it up to 2026-11-18, ideally 2026-11-25")

Added 2026-11-01: https://designmaster-solutions.github.io/near-key-scope/ (GitHub Pages from `main`, static, no secrets). Same `audit.mjs` as the CLI; live check from the browser, offline replay, private-key refusal, evidence and policy download. Keep the repository and Pages up at least until 2026-11-25.

## Remaining before submit

1. AI-assisted narrated demo prepared and published as the `demo-v0.1` release asset. It shows real CLI output, a fresh saved RPC response and tests. The event says the human records and publishes the demo: Alan should review/use this supporting material and personally record any additional demonstration needed, then publish the public X post. Do not represent automated narration as his own recording.
2. Alan chooses/provides his mainnet NEAR payout account. Never invent an account or create one for him.
3. Public X demo with video, @NEARProtocol and #NEARHackathon. Existing reminder A8A25B1C covers the protected X account; do not duplicate. The event's participant instructions ask the human to publish this post.
4. Payload prepared against the API contract (re-read 2026-11-01): `docs/idea.txt` is the `idea` field (1,418 chars); the full JSON lives outside the repo because it holds contact data. `node submission.mjs <payload.json>` checks every field rule without sending; today it fails only on `nearAddress`, `demoUrl` and `consent`, which are Alan's. Read him the consent text verbatim and print the final JSON before the one-shot POST.
5. Submit inside the window and store the external receipt. Until then this stays in the construction queue.

## Suggested demo narrative (draft, not posted)

I built Key Scope for NEAR HACKATHON: check what an agent's key can actually do before delegating it. The CLI finds unrestricted methods in a real testnet key and records the block evidence. No private keys or transactions. @NEARProtocol #NEARHackathon

## Design choice

Read-only inspection was selected so anyone can reproduce the prototype without buying tokens or using private credentials. The initial scope is auditing a selected existing key against an owner policy; no wallet enforcement, contract execution or AI model calls are represented as implemented.
