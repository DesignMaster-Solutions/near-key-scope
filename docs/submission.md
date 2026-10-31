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

## Remaining before submit

1. Record a short terminal demo: tests, replay rejection, fresh RPC query and the block evidence; explain the synthetic positive case. Use video-editing/demo_slides.py if making narrated scenes.
2. Alan chooses/provides his mainnet NEAR payout account. Never invent an account or create one for him.
3. Public X demo with video, @NEARProtocol and #NEARHackathon. Existing reminder A8A25B1C covers the protected X account; do not duplicate. The event's participant instructions ask the human to publish this post.
4. Prepare exact submission JSON using the current contract in HACKATHON.md; check the final payload and any consent that commits the company with Alan before the one-shot submission.
5. Submit inside the window and store the external receipt. Until then this stays in the construction queue.

## Suggested demo narrative (draft, not posted)

I built Key Scope for NEAR HACKATHON: check what an agent's key can actually do before delegating it. The CLI finds unrestricted methods in a real testnet key and records the block evidence. No private keys or transactions. @NEARProtocol #NEARHackathon

## Design choice

Read-only inspection was selected so anyone can reproduce the prototype without buying tokens or using private credentials. The initial scope is auditing a selected existing key against an owner policy; no wallet enforcement, contract execution or AI model calls are represented as implemented.
