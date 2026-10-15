# Birth profile delivery and verification

15 October 2026. Based on `main` commit `d7433de0633c34a57ad5aef54ddad24b4b5bc5bb`.

## Delivered
- Birth chart → Birth profile: independent Standard and Deep reports covering eight personal themes, available before any reading exists.
- Dedicated natal-only prompt and structured response contract, one independent DeepSeek call per uncached request, separate standard/deep token budgets, complete-output validation, evidence IDs resolved to server-calculated facts.
- Private, owner-bound and memory-bounded immutable report cache with a maximum 24-hour TTL; export survives calculation-context expiry. Existing reading/enhancement artifacts are not overwritten.
- Standalone PDF with every profile section, synthesis, reflection questions, birth clock/timezone/confidence, uncertainty, natal wheel when reliable, supporting facts and evidence catalogue.
- Separate UI state across workspace/sky-date changes; birth edits cancel stale requests. Retry, export errors and explicit chart recalculation are supported. Profile modal uses pointer events explicitly because the parent workspace otherwise disables them.
- Walkthrough, privacy text, model deployment guidance and implementation plan included.

## Verified
| Check | Result |
| --- | --- |
| `npm test` | 115 total: 113 passed, 0 failed, 2 skipped. Skips are existing opt-in real/live PDF tests. |
| New feature tests | 9 endpoint/cache/PDF tests plus 4 React state/control tests pass. |
| `npx tsc --noEmit` | Pass. Also checked by Next production build. |
| `npm run build` | Pass; both new API routes included. |
| Live local production-server smoke | Profile confirmation → real Kerykeion natal calculation → new deep-profile endpoint → cached repeat → standalone PDF all pass. Model HTTP response simulated; one model request observed. |
| PDF visual review | Ten-page long synthetic profile rendered and inspected; fixed continuation-page text colour before final verification. Six-page real-wheel export also inspected, including vector natal wheel. |
| Source whitespace | `git diff --check` passes. |

The cloud workspace initially lacked Python dependencies. Installed the project's pinned requirements in an isolated Python 3.12 environment using GCC/G++; the complete suite then passed. No dependency versions were changed.

## Verification limits
- No production credentials were available and no paid live DeepSeek request was made. Provider request shape, model ID, complete/partial response handling and failures were tested with simulated upstream responses. Inspect interpretive quality using your own chart after deployment.
- Browser installation was blocked by an invalid/truncated download in this cloud environment. React interaction/state checks passed, but desktop/mobile browser visual checks remain to be performed. No claim of a completed live browser test is made.
- Cache is intentionally process-local, like the existing chart architecture: one replica, no cross-device/account persistence, no survival across restart. Download the PDF to keep it.
- Evidence reference validation guarantees IDs correspond to supplied chart facts; it does not independently verify every natural-language sentence produced by the model.

## Model and deployment
Set `DEEPSEEK_API_KEY` and `DEEPSEEK_MODEL=deepseek-v4-pro` on the hosting service, plus a stable `ASTROLOGY_SESSION_SECRET`. Both the repository default and `.env.example` already used V4-Pro at the inspected baseline; the new report uses that same configuration. An existing deployment environment override will still take precedence and must be updated there.

Zeus remains the separately configured Deepgram-managed `claude-sonnet-4-6` voice thinking provider. Speech recognition/narration models are unchanged. The V4-Pro configuration applies to written reading and independent natal-profile generation.

Official references verified during implementation:
- https://api-docs.deepseek.com/quick_start/pricing/
- https://api-docs.deepseek.com/updates/
- https://api-docs.deepseek.com/guides/thinking_mode/

This ZIP is the complete source tree, not a patch. It excludes `.git`, local environments, dependencies, build output, test artifacts and secrets. Run the existing Docker/Railway build or follow README local setup. GitHub connector access reported `push: false`, so no branch, pull request or deployment was created.

## Suggested deployment smoke check
1. Confirm known synthetic birth details, calculate the chart and open Birth profile.
2. Generate Standard, inspect eight sections and their supporting facts, then generate Deep.
3. Switch back to Standard and change the selected sky date: the accepted natal report should remain intact.
4. Download each report's PDF and inspect prose, wheel, evidence and final reflection question.
5. Edit the birth details: the old profile should clear. Repeat with an estimated time: no houses, angles or wheel should appear.

## Local release verification — 15 October 2026
- Imported into the existing `aeon-app` checkout without replacing unrelated local assets. The package baseline matches the previously deployed `d7433de` code.
- Re-ran TypeScript, production build and the complete regression suite: 115 tests, 113 passed, 2 existing opt-in tests skipped, no failures.
- The bundled macOS PDF extractor stalled on stdin in one existing test. A temporary, external adapter passed the same PDF bytes via a file; the complete suite then finished successfully. No application or test source changes were needed for this tooling workaround.
- Inspected pages 1, 6 and 10 of the long synthetic standalone profile PDF: readable prose, complete final reflection and evidence catalogue, no clipping.
- Browser smoke check confirmed Birth chart → Birth profile, Standard/Deep selection and the disabled generation guidance before chart calculation. Confirmed synthetic birth details and exercised chart calculation independently of a reading.
- Railway model settings are intentionally left unchanged for the user to update in the Railway interface.
