# myAeon: richer readings through a coherent synthesis

Research and proposal, 15 October 2026. This document proposes future work; it does not describe features already released.

## Recommendation

Keep one recognisable myAeon reading. Deepen its account of personal patterns, the current sky and changing lunar rhythms, then selectively introduce other traditions when they contribute a useful perspective. Keep the reader's priorities and self-reported capacity at the centre of the advice.

The proposed benefit is clearer reflection and more usable support. A larger number of calculations does not establish greater predictive accuracy or a physical effect on a person's energy. Use “energy” in the everyday sense of attention, motivation, emotional bandwidth and capacity.

Start with the existing tropical natal/transit foundation and lunar data. Pilot a Jyotish lunar perspective next. Treat heliocentric interpretation as an optional experiment before making it a default. Longer-term cycles can follow once the foundation is validated.

## What the terms mean for the product

The [Wikipedia list requested for review](https://en.wikipedia.org/wiki/List_of_astrological_traditions,_types,_and_systems) mixes traditions, reference frames, techniques and applications. It is useful for discovery; it is not an implementation specification.

- **Zodiac:** a framework for expressing positions. Tropical and sidereal settings need explicit conventions. Sidereal calculation also needs a named ayanamsha, the convention that places its zodiac origin. The engine supports several, including Lahiri; there is no reason to expose all of them in the everyday experience. [Kerykeion sidereal documentation](https://kerykeion.net/content/examples/v6/sidereal-modes)
- **Sun-sign reading:** a narrower reading based on the Sun's sign, already part of myAeon's baseline. It does not add another independent body of astronomical evidence. Prefer a verified natal Sun when available; retain a broad date-only fallback when necessary.
- **Vedic astrology / Jyotish:** a wider interpretive tradition, with lunar mansions, period systems, divisional charts and other techniques. Changing sign labels alone would not amount to implementing it. A small initial offering should be named a “Jyotish lunar perspective,” with its scope explained. [P.V.R. Narasimha Rao's textbook](https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf)
- **Heliocentric:** changes the centre of calculation to the Sun. It is separate from the choice of tropical or sidereal zodiac. It requires its own positions and valid set of points. [Swiss Ephemeris programming documentation, §5.3 and §5.8](https://www.astro.com/swisseph/swephprg.htm)
- **Psychological / humanistic style:** an approach to interpretation and conversation. It can strengthen the existing supportive voice without introducing another calculation engine.

## What the application has today

Verified against the local source and installed Kerykeion 6.0.2 API:

| Existing capability | Consequence for expansion |
| --- | --- |
| Reading charts use tropical, apparent geocentric positions and Placidus houses. | The normaliser and worker explicitly enforce these settings. New perspectives require validated adapters, not a prompt-only switch. |
| Known birth times support natal planets, angles, houses and transit comparisons. Estimated times omit houses/angles; unknown times receive a conservative fallback. | Preserve uncertainty handling. Extra systems must not manufacture missing birth precision. |
| Moon phase angle, approximate illumination and an eight-phase label are already calculated. | Lunar guidance is a low-infrastructure starting point. Exact phase transitions still need event calculations. |
| Full readings use Today, +3, +7 and +30 day snapshots at London noon. | These anchors do not establish an exact aspect date, duration or best hour. Timing improvements need a time series and event refinement. |
| The 3D scene calculates heliocentric longitudes, including Earth, using astronomy-engine. | There is reusable calculation capability, but these values are not currently validated reading facts or a natal heliocentric chart. |
| The installed factory exposes sidereal modes, heliocentric perspective and nakshatra calculation. | Core support exists; product integration, interpretation, validation and context schemas are still work. |
| Shared prompts already emphasise everyday meaning, one manageable action and a smaller alternative. | Extend this shared contract across new lenses, audio, PDF and Zeus. |

Relevant source: `server/astrology.mjs`, `server/kerykeion_worker.py`, `server/sky.mjs`, `src/lib/zodiac.ts`, `server/supportive-guidance.mjs`, and `docs/supportive-reading-guidance.md`.

## Candidate additions, ranked by likely usefulness

These are product judgements to validate with users, not measured claims of benefit.

| Addition | Intended reader benefit | Calculation / interpretation work | Priority |
| --- | --- | --- | --- |
| Stronger whole-chart synthesis | A clear main theme, a useful strength and a manageable friction point, rather than a catalogue of placements. | Curate the existing natal and transit facts; deduplicate themes and limit what appears. | First |
| Lunar rhythm | A gentle prompt to begin, sustain, review or release an activity, adapted to the user's actual capacity. | Reuse existing phase data; add verified upcoming phase transitions for dated guidance. Do not prescribe feelings from phase alone. | First |
| Changing transit emphasis | Explain a short-lived theme versus one worth revisiting over weeks. | Sample a time range; derive applying/separating status, entry/exit and exact hits where supported, including repeated hits. | First foundation, then fuller timing |
| Verified Sun-sign foundation | More reliable baseline near sign boundaries. | Use verified Sun longitude where available; calculate a possible interval when birth time is missing and disclose ambiguity if the sign changes. | First |
| Jyotish lunar perspective | Another symbolic vocabulary for emotional habits, attention, motivation and reflection. | Explicit Lahiri sidereal calculation; Moon nakshatra and optionally tithi. Develop a reviewed interpretation guide. | Second, opt-in pilot |
| Heliocentric perspective | An optional broader reflection on purpose, contribution and perspective. This is a proposed editorial use, not an astronomical property. | Server-side natal/current heliocentric facts, same-frame relationships and a distinct interpretation guide. Test incremental usefulness. | Third, experimental |
| Annual / longer-term themes | Help connect today's action to an ongoing reflective theme. | Validate solar returns first; assess progressions, profections or a Jyotish period system separately. | Later |
| Relationship reflection | Conversation prompts about needs and differences. | A dedicated two-person flow, birth uncertainty handling and appropriate consent. | Later, if requested |

The first Jyotish pilot should remain deliberately small:

1. Use one declared convention: Lahiri sidereal longitudes and the 27-nakshatra scheme. The installed engine exposes nakshatra name, quarter and ruler; these are calculated fields, not a finished interpretation. [Kerykeion schemas](https://kerykeion.net/python-library/docs/v6/schemas)
2. Begin with Moon nakshatra and optional tithi, which describes the Sun–Moon angular phase in finer divisions. Do not label a partial lunar layer a complete Panchanga. [Rao, basic concepts](https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf)
3. Only introduce a sidereal house layer after choosing and validating its convention, such as Whole Sign. Keep it distinct from the existing Placidus chart. If adding Rahu/Ketu, specify true or mean nodes consistently.
4. Defer dashas and divisional charts until timing conventions, birth uncertainty and interpretation have been reviewed. Do not present adverse periods as fate or require paid remedies.

For heliocentric work, include Earth and exclude the Sun as a positioned body in its own frame. Do not reuse geocentric lunar nodes, terrestrial houses or Ascendant as heliocentric facts. A heliocentric Moon position can be calculated, but it is not interchangeable with the geocentric Moon; omit it from the initial pilot. Swiss Ephemeris documents both the frame flag and the degenerate points. [Swiss Ephemeris §5.3](https://www.astro.com/swisseph/swephprg.htm)

Do not prioritise adding every tradition in the list. Chinese calendrical systems, astrocartography, horary and electional readings each need their own conventions and user purpose. Medical and financial prediction are a poor fit for the proposed everyday support experience. Additional asteroids, fixed stars and minor aspects should earn their place by improving a reading, rather than increasing its technical density.

## One reading for the user

Keep the existing four areas: Love & Connection, Purpose & Work, Body & Energy, and Inner World. Give the overall reading a small number of clear priorities. Today stays concise; Full develops the same priorities across the existing horizons.

Each domain should answer:

1. **What may be worth noticing?** A recognisable everyday pattern, presented as an invitation to reflect.
2. **What could support you?** One practical suggestion linked to the main theme.
3. **How might you try it?** A concrete example and a smaller version for limited capacity.
4. **What shaped this suggestion?** Brief verified astrological context, with fuller calculation details available on demand.

Illustrative tone only; this is not a calculated reading:

> You may find it easier to make progress when you give one thing your full attention. If several requests are competing for your time, choose the one that matters most and give it a short, protected window. Twenty minutes is enough to begin; if today is already full, write down the first step and leave it there. Rest can sit alongside progress—you do not have to earn it by finishing everything.

The calculation should determine which theme is selected; the paragraph above is not a universal template to attach to any chart. Hope should come from agency, proportion and a useful next step. Acknowledge difficulty plainly without forced positivity.

Offer optional focus and capacity inputs, for example “What would you like support with?” and “How much room do you have today?” Let users skip them. Self-reported experience should shape the advice more than an inferred mood. Do not add these prompts to every visit.

Keep tradition choices in preferences or an expandable explanation: the core reading remains the default; expanded perspectives are initially opt-in. Explain which perspectives contributed without demanding technical expertise. Avoid a dashboard of competing signs or an unexplained “energy score.”

## How the synthesis should work

1. Validate the profile and birth-time uncertainty. Calculate each enabled perspective independently with explicit settings.
2. Keep typed evidence records: lens, body, position/event, time, zodiac, ayanamsha, frame, house system, node convention, engine/version and input uncertainty. Interpretation remains separate from astronomical facts.
3. Select a bounded set of relevant evidence and derive a few candidate themes using a reviewed interpretation guide. Keep a link from every selected theme back to its supporting facts.
4. Deduplicate correlated evidence. A shared rotation of longitudes preserves their pairwise angular separations, so the same aspect expressed tropically and sidereally must not count twice. This is a mathematical inference; it does not imply all cross-date transit calculations or tradition-specific aspect rules are identical.
5. Resolve differences deliberately. Do not average tropical and sidereal identities or silently switch their meanings. Where interpretations differ, offer a balanced reflection or omit the weaker/less relevant theme; explain the distinction if the user asks. Do not invent agreement.
6. Generate one integrated reading from the selected facts, user focus and supportive guidance contract. Additional lenses should not automatically create longer output or another model call each.
7. Validate grounding, uncertainty, length and tone. Save the perspective settings and selected evidence alongside the reading artifact. UI, PDF, narration and Zeus should draw on that same artifact while it remains available.

Extend cache keys and context schemas for each calculation convention. The present `SETTINGS`, provider verification and semantic XML all assume tropical/geocentric calculations. Keep the existing core calculation path stable while new adapters are introduced. Respect the current bounded artifact lifetimes; permanent reading history would be a separate product change.

For Zeus, pass the synthesized reading, selected domain or placement, perspective settings, time horizon and limitations at launch. Tools that calculate a follow-up must use compatible settings or explicitly explain a switch. Zeus should be able to answer “Why this suggestion?” and “What would a smaller version look like?” without inventing chart details.

## Delivery sequence and release gates

**Phase 1 — deepen the core.** Improve theme selection using existing facts, make existing lunar context useful, prefer verified natal Sun and allow optional focus/capacity. Establish evidence/provenance records and reference cases. Keep exact timing claims out until the event calculations are validated.

**Phase 2 — validated timing and Jyotish pilot.** Add bounded event searches for lunar transitions and transit duration. Introduce one opt-in lunar perspective with explicitly named conventions. Check reference charts and interpretations with someone competent in Jyotish; test the complete reading against the core version.

**Phase 3 — heliocentric pilot.** Calculate and validate a separate heliocentric fact set. Reuse the existing astronomy infrastructure where appropriate. Compare readings with and without this perspective; promote it only if users find the resulting advice clearer, more relevant or more reflective.

**Phase 4 — ongoing cycles.** Assess annual reflections first, then longer-term techniques or relationship readings according to demand. Each technique needs a separate calculation and editorial acceptance review.

Before each release:

- Benchmark planetary positions, sign/nakshatra boundaries, Moon phase transitions and new frame settings against reference outputs with matching conventions. Check backend flags, expected coverage and missing-data behaviour.
- Cover known, estimated and unknown birth times; date boundaries, timezones/DST and polar locations. Where an input interval crosses a boundary, suppress the claim or explain the uncertainty.
- Verify that incompatible frames never mix, that repeated representations do not inflate support, and that snapshots cannot produce invented exact event times.
- Confirm useful, warm and proportionate advice without diagnosis, fatalism, guaranteed outcomes or compulsory spiritual remedies. Distinguish interpretive relevance from calculation certainty.
- Confirm that text, audio, PDF and contextual Zeus use the same reading and limitations. Preserve current response-length and narration budgets, with measured latency/token changes.
- Compare core and expanded readings with users: comprehension, actionable usefulness, relevance, warmth and overload. Adopt additions on those results, rather than on the number of systems included.

The next implementation milestone should be Phase 1 plus the evidence structure needed for Phase 2. It provides an immediate improvement and makes later synthesis auditable without multiplying the user's work.
