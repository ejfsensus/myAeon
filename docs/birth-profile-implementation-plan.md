# Independent birth-chart profile: analysis and implementation plan

Baseline: main d7433de0633c34a57ad5aef54ddad24b4b5bc5bb, inspected 15 October 2026.

## Existing architecture
- Next.js 14 App Router, React 18, Zod; custom Node server also handles Zeus WebSockets.
- Birth details are confirmed by /api/astrology/profile. /api/astrology/chart calculates a private server-owned geocentric tropical natal context with Kerykeion; anonymous signed cookies bind ownership. Calculation contexts expire after one hour.
- /api/reading/enhance either appends a short birth-chart interpretation to a reading or generates another daily/full reading. This cannot deliver a durable, independent personality profile without conflating models and state.
- requestReadingJson already defaults to deepseek-v4-pro and supports strict structured tool output, timeout/cancellation and private error messages. .env.example already selects that model. Preserve environment overrides and add regression coverage/documentation. Official DeepSeek pricing and changelog confirm continued V4-Pro availability on this date.
- Existing PDFKit + SVG renderer and bundled fonts support server-owned exports. Reading artifacts are process-local, bounded and retained for up to 24 hours.
- Zeus currently uses a separately managed Anthropic thinking provider through Deepgram; its voice integration is independent of the requested chart-analysis/reading model. Do not silently change this previously configured voice contract as part of the natal-report feature.

## Implementation design
1. Add a distinct natal-profile contract and prompt, versioned separately from reading prompts. Standard and deep modes cover the same eight subjects: personality, interests/learning, strengths, communication, emotional needs, relationships, motivation/purpose, and growth. Deep mode requests fuller synthesis of tensions and several chart factors. No daily/transit forecasts or prior reading are inputs.
2. Build a bounded evidence catalogue from server-owned natal facts. Use fixed section keys and validated evidence IDs; display the supporting facts alongside each section. No LLM-generated chart data is authoritative. Estimated birth times exclude houses and angles and carry explicit uncertainty; unknown times cannot produce a natal profile.
3. POST /api/astrology/natal-profile accepts only contextId and depth. Require same origin, signed ownership, valid profile/context and strict bounded bodies. One separate DeepSeek call per uncached request. Validate the complete response; never save partial output as success.
4. Store immutable report snapshots independently, keyed by owner/profile/depth/model/prompt version, with bounded process memory and a 24-hour TTL. Repeated requests reuse the report; simultaneous duplicate work is blocked. No database or paid chart calculation is added. Restart, eviction or expiry requires regeneration.
5. Add frontend state owned above the chart view so switching workspaces preserves it. Birth-input changes invalidate state, cancel pending work and prevent stale responses. Changing only the sky date does not change the natal profile. Separate loading, retry, depth selection and PDF states must never mutate an existing reading.
6. POST /api/astrology/natal-profile/pdf accepts only reportId. Resolve immutable report and chart under the same owner; reject forged content and other users. Export a standalone branded report with birth clock/timezone, confidence, generated date, all sections, synthesis, reflections, evidence and a natal wheel when reliable. Include no transit report or unrelated reading.
7. Explain the feature and temporary retention in the walkthrough/privacy text. Document DEEPSEEK_MODEL=deepseek-v4-pro deployment requirement: an existing environment override takes precedence over source defaults.

## Acceptance and verification
- A chart can produce a profile before any reading exists; profile generation never calls /api/reading/enhance.
- Standard and deep requests use their own budgets and identical complete subject coverage; profile input excludes transits, current date, prior reading and semantic mixed-chart XML.
- Invalid inputs, wrong ownership, unknown time, expired context, upstream failure, truncation and invalid evidence IDs are handled without leaking internals.
- Duplicate calls are avoided; cached reports remain exportable after chart-context expiry; export does not trigger an LLM call.
- UI preserves separate depth reports across workspace navigation, cancels on birth-detail change and handles retry/download failures.
- Run repository tests, TypeScript check and production build. Render synthetic PDFs and inspect page layout, long prose and final content. No real birth details or live paid model calls are required for local automated tests.

## Delivery
GitHub reports pull=true, push=false. Deliver complete source ZIP excluding credentials, .git, dependencies and build products; include this plan and verification notes. No production deployment or main-branch mutation.
