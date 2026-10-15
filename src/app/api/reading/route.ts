import { saveArtifact } from "../../../../server/reading-artifacts.mjs";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { sameRequestOrigin } from "@/lib/serverRequest";
import { longitudeToSign, ZODIAC_SIGNS } from "@/lib/zodiac";
import { birthSunFoundation } from "../../../../server/reading-synthesis.mjs";
import {
  ReadingInputSchema, SYSTEM_PROMPT, TODAY_SYSTEM_PROMPT, buildUserPrompt, generatedReading,
  readingModelConfig, requestReadingJson, signedReadingAudio,
} from "@/lib/readingGeneration";
import { privateHeaders, readPrivateJson, requestFailure } from "@/lib/readingRequest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const started = performance.now();
  let cookie: string | null = null;
  try {
    const input = ReadingInputSchema.parse(await readPrivateJson(req, 10_000));
    if ((input.profileId || req.headers.has("origin")) && !sameRequestOrigin(req)) {
      return NextResponse.json({ error: "Request not allowed." }, { status: 403, headers: privateHeaders() });
    }
    const { astrology, contextMetadata } = await import("../../../../server/astrology.mjs");
    const { requestIdentity } = await import("../../../../server/astrology-quota.mjs");
    const { dateSchema, LONDON } = await import("../../../../server/astrology-input.mjs");
    dateSchema.parse(input.birthDate);
    let owner: string | null = null;
    // Anonymous sky readings also work without chart-session configuration.
    if (input.profileId || process.env.ASTROLOGY_SESSION_SECRET) {
      const user = requestIdentity(req); owner = user.id; cookie = user.cookie;
    }
    const profile = owner && input.profileId ? astrology.resolveProfile(owner, input.profileId) : null;
    if (input.profileId && (!profile || profile.birthDate !== input.birthDate
      || (input.birthTime && input.birthTime !== profile.birthTime))) {
      return NextResponse.json({ error: "Birth details changed. Confirm them again before casting." }, { status: 400, headers: privateHeaders(cookie) });
    }
    const selectedDate = input.readingDate || new Intl.DateTimeFormat("en-CA", {
      timeZone: LONDON.timezone, year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());
    // Personal calculations are part of the normal reading, without another
    // generation or a separate action the reader has to discover.
    const context = await astrology.prepare(owner, input.profileId, selectedDate, input.mode === "full", req.signal);
    context.sunFoundation ||= birthSunFoundation(input.birthDate, profile, context);
    if (context.sunFoundation.signs.length > 1) context.limitations.push(`Birth time is needed to distinguish the Sun signs ${context.sunFoundation.signs.join(' and ')} on this birth date.`);
    const calculated = performance.now();
    const baseSign = longitudeToSign(context.sunFoundation.longitude);
    const sunSign = context.sunFoundation.signs.length > 1 ? { ...baseSign, id: 'uncertain', name: context.sunFoundation.signs.join(' / '), glyph: '☉' } : baseSign;
    const { json, config } = await requestReadingJson(input.mode === "today" ? TODAY_SYSTEM_PROMPT : SYSTEM_PROMPT, buildUserPrompt(input, sunSign.name, context), req.signal, undefined, input.mode === "today" ? 2400 : 12288);
    const generated = performance.now();
    const response = {
      ...generatedReading(json, sunSign, context, input.mode),
      id: randomUUID(), version: 1,
      meta: {
        timezone: "Europe/London", schemaVersion: 3, preferences: input.preferences,
        provider: "deepseek", model: config.model, endpoint: config.url, endpointMode: config.mode,
        generatedAt: new Date().toISOString(), readingDate: context.selectedDate,
        profileId: input.profileId, birthDate: profile?.birthDate ?? input.birthDate,
        birthTime: profile ? (profile.timeConfidence === "unknown" ? undefined : profile.birthTime) : input.birthTime,
        birthPlace: profile ? `${profile.location.city}, ${profile.location.nation}` : input.birthPlace,
        astrology: contextMetadata(context),
      },
    };
    const artifact = { ...response, ...signedReadingAudio(input.mode === "today" ? undefined : json?.audioScript, response) };
    saveArtifact(owner, artifact, context);
    return NextResponse.json(artifact, { headers: { ...privateHeaders(cookie), "Server-Timing": `calculation;dur=${(calculated-started).toFixed(1)},generation;dur=${(generated-calculated).toFixed(1)},total;dur=${(performance.now()-started).toFixed(1)}` } });
  } catch (error) {
    const failure = requestFailure(error, "Check your birth details, confirmed profile and sky date, then try again.");
    return NextResponse.json({ error: failure.error }, { status: failure.status, headers: privateHeaders(cookie) });
  }
}

export async function GET() {
  const config = readingModelConfig();
  return NextResponse.json({
    service: "aeon-reading", provider: "deepseek", model: config.model,
    apiBase: process.env.DEEPSEEK_API_BASE ?? "https://api.deepseek.com",
    endpoint: config.url, endpointMode: config.mode, timeoutMs: config.timeoutMs,
    configured: config.configured, supportsReadingDate: true,
    signs: ZODIAC_SIGNS.map(sign => ({ id: sign.id, name: sign.name })),
  }, { headers: privateHeaders() });
}
