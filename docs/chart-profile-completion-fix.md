# Chart-profile completion failure

Deployment inspected on 15 October 2026, based on main 4fd22da.

## Observed
- Railway production /api/reading returned 200 in approximately 67–68 seconds.
- /api/reading/enhance returned 200 in approximately 16–17 seconds.
- /api/astrology/natal-profile returned 502 in 55–62 seconds for three user attempts; another attempt ended as client-disconnected 499.
- An earlier independent profile request completed in 39 seconds and exported its PDF. Chart calculation and API credentials therefore work for at least some requests.
- Production health confirms deepseek-v4-pro, direct api.deepseek.com endpoint and a 180-second model timeout. A 55–62 second 502 is not evidence that the configured 180-second timeout elapsed.
- The original implementation discards upstream response diagnostics and emits only a generic error on local profile validation failure. The earlier synthetic tests exercised only ideal model output.

## Repair plan
Reproduce using synthetic birth details. Preserve model output validation, owner checks and separate profile/PDF contracts. Fix the confirmed failing stage, cover the production response shape with regression tests, and add diagnostics containing structural metadata only (no birth details, prompts, model prose or credentials). Complete tests/build and ship an updated source ZIP because GitHub reports read-only access.

## Confirmed failing boundary
A fresh synthetic London birth chart was calculated successfully on the deployed service. Deep profile generation returned HTTP 502 after 66.7 seconds with `The birth profile was incomplete. Please try again.` This exact message is thrown by `acceptNatalOutput` after the model request and JSON parsing, when local output validation fails. The service does not expose the rejected payload, and the old code logged no failed field paths. The exact failed field in those historical requests cannot be recovered from the available logs.

## Changes
- Separate editorial guidance from essential completeness. The upstream schema requires strings, sections and arrays but imposes none of the old local 80-character minimum / 6-reference maximum / 3–6-question constraints. Non-empty, complete analysis is no longer discarded just for those differences. Finite size bounds remain for resource protection.
- Require all eight topic bodies, overview, title, synthesis and reflection questions, and at least one server-matching evidence ID in each section. Every evidence reference is still checked; unknown references and genuinely absent prose fail.
- Recover already-generated synthesis/reflections when closing-brace placement nests them inside `sections`, matching the existing chart-enhancement approach. No missing prose, generic fallback or chart evidence is fabricated.
- Ignore unused display metadata. Deduplicate valid evidence IDs while preserving every distinct cited fact. Preserve generated prose in the report and PDF.
- Record failed field paths/codes and upstream HTTP/truncation metadata without logging prompts, birth details, credentials, raw provider errors or model prose.
- Catch timeouts/cancellation during response-body reading as well as during initial fetch. Such failures now return 504 rather than being swallowed as an empty model response.
- Bump natal prompt/cache version so cached v1 results do not obscure repair verification.

## Verification scope
Regression coverage includes concise complete prose, eight valid references, seven questions, extra display metadata, nested trailing fields, missing/blank sections, invalid references, diagnostics privacy, response-body timeout, and standalone PDF export of accepted variations. The latter uses exactly one simulated LLM call.

The patch has not been applied to Railway production. Live post-patch DeepSeek verification requires deploying this update; the fresh production reproduction above ran against the original build. Do not interpret local regression results as proof that the historical rejected payload was recovered.

After deployment, recalculate your chart, request Standard and Deep profiles, and export their PDFs. If a profile still fails, the new Railway runtime entry `[natal-profile] output_rejected` identifies the failed field path and validation code without exposing the chart or generated text.

## Final local results
- `npm test` with the pinned Python chart environment: 122 tests, 120 pass, 0 fail, 2 existing opt-in tests skipped.
- `npm run build`: pass.
- `npx tsc --noEmit` and `git diff --check`: pass.
- Local production-server HTTP check: confirmation → real Kerykeion chart → deep profile with simulated editorial variations → cache reuse → standalone PDF → homepage all pass. Exactly one simulated model request, 52,731-byte PDF.
- No production deployment, configuration mutation or GitHub push was performed. GitHub still reports push permission false. The source ZIP includes all application files and this repair, excluding dependencies, local test environments, build output and credentials.
