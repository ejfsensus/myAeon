# Birth-profile live verification — 16 October 2026

## Deployment state
Railway's latest deployment remains `ca43b5ce-7cb7-45e5-b667-36ce250a126e`, created 15 October at 12:50 UTC. GitHub main remains `4fd22da`. Neither contains the completion repair in local commit `c4a8fcc`. The production runtime has no new `[natal-profile]` validation diagnostics, consistent with the unchanged build.

## Configuration
- Written generation uses `DEEPSEEK_MODEL=deepseek-v4-pro`; the observed deployment timeout is 180000 ms.
- The current source has no MiniMax references. `MINIMAX_API_BASE`, `MINIMAX_API_KEY`, `MINIMAX_MODEL`, and `MINIMAX_TIMEOUT_MS` can all be deleted from hosting variables. Their presence does not select MiniMax or explain the independent-profile validation failure.
- Keep the existing `ASTROLOGY_SESSION_SECRET` in hosting; it binds calculated charts to their anonymous owner. Do not replace it casually when updating other variables.
- Zeus remains configured separately with Deepgram and `flux-rufus-en` speech.

A direct provider test is performed with synthetic London birth details and a real calculated chart. Only calculated natal facts are sent to the model. Credentials are not included in source, tests, this report or the deliverable ZIP.

## Real provider results
| Depth | Provider request | Accepted sections | Approximate report words | Reflections |
| --- | --- | --- | --- | --- |
| Standard | Success, 49.0 seconds | 8 | 1,395 | 5 |
| Deep | Success, 72.0 seconds | 8 | 2,183 | 6 |

These are actual DeepSeek V4 Pro responses, not simulated model prose. Both passed `acceptNatalOutput` using the completion repair. The actual responses were then replayed through the profile route and owner-bound PDF route: both routes returned 200, with PDF sizes 63,872 / 71,269 bytes. This verifies model compatibility, report assembly and PDF export locally; it is not a claim that the repaired code was deployed to production.

## Build verification
17 focused endpoint/transport tests pass, including the new read-only release check. The production build and TypeScript validation pass. The prior repair's full suite had 120 passes and two optional skips; this session did not repeat the full Python-worker suite.

## Deploy the code, then verify the release
1. Replace the repository/application source with this ZIP's `myAeon` directory, preserving hosting variables. Deploy that changed source. A restart or redeploy of the unchanged October 15 build will still run the old validator.
2. Open `/api/astrology/natal-profile` on the deployed hostname. The repaired build returns HTTP 200 and `release: "birth-profile-completion-v2"`, plus `promptVersion: "2"`. The original build has no GET handler and returns 405. This check makes no LLM call and exposes no keys or chart details.
3. Refresh the app, confirm/recalculate the chart, request Standard and Deep, then export each PDF. If a request still fails on the confirmed release, inspect `[natal-profile] output_rejected` in runtime logs for the failed field path/code.
4. Delete the four unused MINIMAX variables listed above in Railway's Variables panel. The connected Railway tools expose setting/listing variables but no deletion action, so they have not been removed by this task.

No production mutation or deployment was performed. GitHub main still predates the fix and connector access is read-only. Credentials supplied for testing were held outside the source tree and removed after the provider tests.

## Exact before/after proof from the real Deep response
The real DeepSeek response cited 7 facts for interests, 8 for strengths, and 7 each for relationships/purpose. All are valid catalogue IDs. The deployed original validator permits at most 6 references per section, although the upstream schema does not impose that maximum. Running this actual response through the original validator reproduces `The birth profile was incomplete`; the repaired validator accepts it. The actual Standard response in this test has 3–5 references per section and passes both validators. Model variation can therefore make the original build fail intermittently even when all required analysis exists.
