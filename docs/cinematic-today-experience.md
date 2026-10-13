# Today, cinematic exploration and Zeus

Implemented against main `816d0374e7968cb136bb50e1c347117f3840c765`.

## Experience

- Today is the primary welcome action. Full reading, planetary exploration and Zeus are secondary paths. Both supplied Zeus icons follow the selected theme.
- One responsive workspace serves desktop and mobile. Gestures are locked until the user unlocks the solar view; foreground dialogs make the scene inert. Internal panels scroll, respect safe areas and use the visual viewport for keyboards.
- The solar scene has focus/reset and top-down cameras, original procedural materials, Saturn rings, bounded pixel density, reduced-motion support, hidden-page rendering suspension and a usable 2D fallback.
- The birth chart uses calculated longitudes and unequal house cusps as interactive SVG/native Three.js geometry. Flat is the default; Tilt, transit comparison, placement inspection and selected-body aspect connections support exploration. Original vector wheels remain downloadable. Unknown/estimated times retain their calculation limitations.
- Birthplace search fills coordinates and timezone; choosing another location clears the previous coordinates. Advanced coordinate entry remains available.
- Completed readings survive changes to the preview date or birth form. A chart addendum preserves the accepted reading rather than replacing it.

## Today and latency

Today sends one London-noon snapshot and requests four Today sections plus two planetary insights at a 2,400-token cap. It does not request hidden Week/Month content or a separate audio script. Standalone Today chart interpretation has a dedicated one-day schema and 4,000-token cap, including its chart prose; an addendum requests only chart prose at 2,400 tokens. Full remains available.

The server seeds the current date per request, and solar/reading snapshots use noon Europe/London consistently. `Server-Timing` exposes calculation, generation and overall reading duration. No paid-provider latency reduction is claimed without production measurements.

PDF generation was already on demand. It remains outside the initial reading request and performs no new model or speech generation. Today has a compact layout and optional chart appendix; fonts retain Unicode. Reading IDs and versions resolve owner-bound snapshots for export even after the shorter live chart context expires. Snapshots are in-memory, bounded to 64 entries/64 MiB, with a 24-hour TTL; eviction or process restart ends availability. This is not permanent reading storage.

## Mandatory ambient audio

The supplied `Nikola-Tesla-3-6-9-first-10min.m4a` (600.0036 seconds) is packaged as `public/audio/reading-ambience.m4a`. The packaged track is loudness-normalized to approximately -35.3 LUFS, then played/mixed at gain 0.35; speech is at gain 0.95. This is deliberately quiet and requires a real-device listening check with the production voice.

Listen starts speech and the music through the same Web Audio context after the user's tap. There is no music-off control. Music pauses with speech, buffering, stopping or microphone handoff to Zeus, and follows seeking. Autoplay restrictions are respected. Faster playback is supported; speeds below 1x are omitted to keep narration within the track's length.

Downloads are AAC/M4A files containing speech plus the same music, mixed on demand by FFmpeg with fades and a peak limiter. The stream and download paths share a bounded completed PCM master and pending synthesis job; a completed listen can supply a download without another synthesis. Incomplete/cancelled streams never become completed masters. Masters expire after one hour or capacity eviction. A restart or eviction can require synthesis again. This cache is process-local; multiple replicas need shared storage to guarantee cross-replica reuse.

Narration budgets target less than ten minutes. Both transport and export reject audio beyond 600 seconds instead of silently truncating spoken content. An unusually long provider result therefore needs regeneration. Written Full content remains more detailed than its spoken condensation.

The Docker image installs FFmpeg. Other runtimes need `ffmpeg` on PATH or `FFMPEG_PATH`. Mixed exports are bounded to two concurrent jobs and four cached outputs.

## Zeus configuration

```json
{
  "agent": {
    "speak": { "provider": { "type": "deepgram", "version": "v2", "model": "flux-rufus-en" } },
    "listen": { "provider": { "type": "deepgram", "version": "v2", "model": "flux-general-en" } },
    "think": { "provider": { "type": "anthropic", "model": "claude-sonnet-4-6" } }
  }
}
```

These are the requested settings, asserted in tests. `ZEUS_TTS_MODEL` defaults to `flux-rufus-en`; set it explicitly to that value in deployment if an older override exists. Reading narration keeps its independent `DEEPGRAM_MODEL` / `DEEPGRAM_VOICE` settings. Secrets remain server-side.

The prompt emphasizes a patient wise elder: warm, plainspoken, thoughtful and grounded in computed facts, without grandiose authority or deterministic claims. Selected chart body/frame/date pass into Zeus. Text-only conversation works without microphone permission, using the same managed agent with bounded recent dialogue. Starting Zeus stops reading playback.

## Verification and release limits

- Production Next build and TypeScript checks pass.
- Automated suite: 89 pass, 0 fail, 2 opt-in integration tests skipped (91 total).
- Additional real Python-worker PDF integration: 25 pass, 0 fail, 1 live-server test skipped. Real wheel vector geometry and PDF pagination validated; rendered PDF inspected.
- Local production browser: desktop/mobile welcome and birth-details dialog; confirmed synthetic birth data; real chart calculation; flat/3D chart; portrait/landscape layout; placement selection and Zeus handoff; reduced motion and forced no-WebGL fallback. No uncaught page errors. Smallest fallback tested at 320×568 without horizontal overflow.
- Typed Zeus tested against a local WebSocket provider fixture with provider settings, history and microphone-free messages.
- Deepgram/Anthropic account acceptance, real speech intelligibility on iOS/Android, actual GPU frame rates, and Today-versus-Full provider latency distributions are release checks still requiring the deployed account/devices. These are not represented as measured results.

This branch does not deploy or change Railway variables. Optional chapter-linked scene navigation, persistent reading history, photographic planet textures, per-aspect interpretation cards and cross-replica media storage are not implemented. The native chart supports placement selection and connected aspect inspection; it does not claim these additional interactions.
