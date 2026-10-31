# Demo production and provenance

AI-assisted supporting video for the participant to review, not a submitted competition entry or a recording of Alan speaking.

- `demo.json`: English narration and scene specification for the shared Clauditor `video-editing/scripts/demo_slides.py` renderer. Uses local macOS Samantha speech; no paid API.
- `show.mjs`: compact display of the actual CLI output. Rejects an unexpected exit status; does not substitute expected findings.
- `live-snapshot.json`: public testnet RPC response fetched at 2026-10-31T17:41:18.962Z, block 275631668. The CLI `live` query produced FAIL / ALL_METHODS. Its capture scene explicitly replays the saved response.
- Original bundled snapshot: `../examples/testnet-snapshot.json`, block 275629817.
- Passing restricted key: synthetic test fixture only. No claim of an on-chain positive case.

Render from this directory using the shared renderer, then normalize narration to -14 LUFS. Generated MP4/audio/frames stay outside git; the final MP4 is a public GitHub release asset. The source script and both real snapshots allow the findings to be reproduced independently.

Event requirements: https://nearhackathon.com/HACKATHON.md, Q-012 and Procedure 2. A local-only project needs a video in a public X demo; the event asks the human to record/publish the post. A release video alone is not a completed submission. See `../docs/submission.md` for the remaining steps.
