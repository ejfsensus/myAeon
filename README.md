# myAeon

An interactive solar system, personal birth-chart workspace and reflective
astrological readings. The solar display uses heliocentric geometry; birth charts
and the facts used in readings are geocentric, tropical and Placidus. Astrology
is a reflective practice, not deterministic prediction.

## Experience

The public homepage at `/` introduces the experience with a decorative 3D
orrery, interactive reading examples, birth-chart and Zeus features, FAQs and
the full user guide. All entry links lead to the existing start screen at
`/app`. Installed apps launch directly at `/app`; the application wordmark
returns to the homepage. Both routes share the saved light/dark preference.

The landing scene loads separately from the page, honours reduced motion and
pauses when offscreen or hidden. A CSS illustration remains available when
WebGL is unavailable. Its solar system and sample reading are illustrative.

- Live or selected-date solar system, flat/3D views and planet insights.
- Locally calculated natal and transit wheels, rendered as SVG textures in 3D.
- Birth date, time, time confidence, confirmed coordinates and IANA timezone.
- Today, three-day, weekly and monthly readings across four life domains.
- Independent birth profiles: Standard or Deep analysis across eight personal themes, with supporting natal facts and a standalone PDF.
- Optional birth-chart interpretation, standalone or enhancing a reading.
- Designed PDF with all reading sections, planetary reflections and chart pages.
- Streamed listening, downloadable narration and additional birth-chart insight.
- Talk to Zeus using fresh sky, confirmed facts and generated interpretation.
- Mobile reading drawer, reading-only view, light/dark themes and first-use tour.
- Separate privacy policy; no provider branding in routine controls.

## Architecture

Next.js and the custom Node server run beside an offline Python worker in one
Docker container. Kerykeion 6.0.2 with the Swiss Ephemeris Moshier backend computes
charts without RapidAPI, GeoNames or ephemeris downloads. No chart key, hosted
subscription, five-call allowance or persistent quota ledger is used.

Signed anonymous browser identities bind profiles, charts and enhanced readings
to their owner. These are temporary in-memory caches, not an account database;
they expire and are lost on deployment/restart. One Railway replica is required
until context and WebSocket tickets move to shared storage.

The initial reading and chart preparation run independently after birth details
are confirmed. Chart interpretation is an explicit action, not an automatic
extra AI request. It sends structured facts and bounded semantic chart context,
**not SVG markup or unsupported vision input**, to DeepSeek. SVGs are retained for
visualization, download and PDF. Zeus receives facts and generated text through
read-only server functions.

## Local Development

Requires Node.js 22 and Python 3.12 or later.

```bash
npm ci
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env.local
npm run dev
```

Set `ASTROLOGY_SESSION_SECRET` to a stable random value of at least 32 characters.
Set `DEEPSEEK_API_KEY` for written interpretation and `DEEPGRAM_API_KEY` for
listening and Zeus. Keys remain
server-side. Open http://localhost:3000.

The worker auto-detects `.venv/bin/python`; override with `ASTROLOGY_PYTHON` for
another environment. Coordinates/timezone are entered or explicitly confirmed;
no network geocoding is performed. Estimated times omit houses and angles.
Unknown times do not invent a natal chart.

## Deployment

Railway builds the Dockerfile with both runtimes and pinned Python dependencies.
Keep the existing AI keys and stable `ASTROLOGY_SESSION_SECRET`. Old
`ASTROLOGER_*` and `ASTROLOGY_QUOTA_DIR` variables are ignored. Do not rotate the
session secret during migration.

```bash
railway up --detach -m "Deploy myAeon local chart core"
```

The custom server listens on Railway's `PORT`. `/api/reading` reports reading
configuration and `/api/astrology/profile` reports chart availability. Smoke-test
actual calculation using a confirmed synthetic profile. Concurrency, payload,
queue and timeout bounds protect the process; no daily/lifetime chart quota
applies. Written AI and voice calls still incur their providers' normal costs.

## API Flow

1. `POST /api/astrology/profile` confirms details and returns an opaque ID.
2. `POST /api/reading` produces the initial sky reading independently of natal work.
3. `POST /api/astrology/chart` with `{profileId, readingDate}` prepares local
   natal/transit facts and theme-specific SVGs in temporary memory.
4. `POST /api/reading/enhance` with `{contextId, reading?}` produces a complete
   reading with a `birthChart` section and saves it against the owned context.
   Omit `reading` for standalone interpretation.
5. PDF and audio use the current reading. PDF SVGs come from owned server context,
   never client-submitted markup.
6. Zeus hydrates fresh facts and the saved interpretation at session open/refresh.

## Verification

```bash
npm test
npx tsc --noEmit
npm run build
```

Worker tests use the installed Python runtime; mocked tests cover owner isolation,
temporary storage, cancellation and no quota. Browser checks cover both scenes,
mobile controls, themes and chart rendering. Paid live checks require keys.

## Documentation

- [Implementation plan](docs/kerykeion-core-plan.md)
- [Reading prompt](docs/reading-prompt.md)
- [Voice agent and tools](docs/voice-agent.md)
- [Reading audio](docs/reading-audio.md)
- [Product info sheet](docs/myAeon-product-info-sheet.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)

## Licensing

Application source is published above; this notice does not relicense it.
Kerykeion and its calculation backend carry separate upstream licenses; review
the notices and application licensing before distribution
or network availability. Non-commercial use does not automatically remove AGPL
source obligations. Switching to a paid hosted service later does not resolve
obligations of earlier self-hosted releases. This is a technical notice, not legal
advice.

## Independent birth profiles

In **Birth chart → Birth profile**, choose **Standard** or **Deep analysis**, then generate. No daily/full reading is needed. The separate request uses only verified natal evidence and a dedicated prompt in `src/lib/natalProfile.ts`. It covers personality, interests/learning, believed strengths, communication, emotional needs, relationships, motivation and growth. Deep mode requests a fuller synthesis of interacting placements, tensions and practical examples.

- Generation: `POST /api/astrology/natal-profile` with `{contextId, depth: "standard" | "deep"}`.
- Export: `POST /api/astrology/natal-profile/pdf` with `{reportId}`. Exports resolve an immutable owner-scoped saved report; they do not accept client prose or call the model.
- Standard and deep reports are separate. Switching workspace or sky date preserves them; changing birth details clears them. Reopening the app requires recalculating the chart and requesting the report again.
- Profile requests reuse a cached result for the same confirmed profile, depth, model and prompt version. Concurrent duplicates are blocked. Temporary cache retention is at most 24 hours, limited to 64 reports / 32 MiB, and is lost on restart or eviction. Keep one server replica, as with the existing chart cache. Download the PDF for a permanent copy.
- Estimated times omit houses, angles and the natal wheel. Unknown times cannot generate a natal profile. The report presents astrological beliefs as reflective possibilities, never established personality findings.

### Model configuration

Set `DEEPSEEK_API_KEY` and **`DEEPSEEK_MODEL=deepseek-v4-pro`** on the server. This is the code default and `.env.example` value, already present in the inspected main branch; an older deployment-level override must be updated explicitly. Both written readings and the independent profile use this shared configuration. `DEEPSEEK_TIMEOUT_MS` defaults to 120000. Standard/deep profile requests have 5000/8500 output-token budgets and explicit non-thinking structured output for reliable complete JSON. Deep analysis means fuller interpretive coverage, not exposing hidden reasoning.

Zeus's separately managed Deepgram voice-agent thinking provider remains its existing `claude-sonnet-4-6` configuration; this feature changes neither speech recognition nor narration.

Plan: [docs/birth-profile-implementation-plan.md](docs/birth-profile-implementation-plan.md). Verification and delivery notes: [docs/birth-profile-verification.md](docs/birth-profile-verification.md).

### Birth-profile completion repair

If an older deployment returns `The birth profile was incomplete` after an otherwise successful model request, deploy this updated build. Profile validation now separates completeness from editorial length/count targets, preserves valid generated text and references, and reports structural failure details privately in runtime logs. See [chart-profile-completion-fix.md](docs/chart-profile-completion-fix.md) for the confirmed production reproduction and verification limits.

Live-provider verification and deployment check: [birth-profile-live-verification.md](docs/birth-profile-live-verification.md). After deploying the repaired source, `GET /api/astrology/natal-profile` must report `release: "birth-profile-completion-v2"`. A restart of an unchanged deployment does not apply the repair.
