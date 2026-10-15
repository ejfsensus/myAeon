import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sameRequestOrigin } from "@/lib/serverRequest";
import { ContextIdSchema, privateHeaders, readPrivateJson, requestFailure } from "@/lib/readingRequest";
import { ReadingGenerationError, readingModelConfig, requestReadingJson } from "@/lib/readingGeneration";
import { requireNatalContext } from "@/lib/readingEnhancement";
import { acceptNatalOutput, natalEvidence, natalPrompt, natalResponseSchema, natalSystemPrompt, NATAL_PROMPT_VERSION, type NatalProfileReport } from "@/lib/natalProfile";
import { beginNatalProfile, cachedNatalProfile, saveNatalProfile } from "../../../../../server/natal-profiles.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const Input = z.object({ contextId: ContextIdSchema, depth: z.enum(["standard", "deep"]).default("standard") }).strict();

export async function POST(req: Request) {
  if (!sameRequestOrigin(req)) return NextResponse.json({ error: "Request not allowed." }, { status: 403, headers: privateHeaders() });
  let cookie: string | null = null;
  let release: (() => void) | null = null;
  try {
    const input = Input.parse(await readPrivateJson(req, 2048));
    const { requestIdentity } = await import("../../../../../server/astrology-quota.mjs");
    const { astrology } = await import("../../../../../server/astrology.mjs");
    const user = requestIdentity(req); cookie = user.cookie;
    let context, profile;
    try {
      context = astrology.resolveContext(user.id, input.contextId);
      profile = context?.profileId ? astrology.resolveProfile(user.id, context.profileId) : null;
    } catch { throw new ReadingGenerationError("Your birth chart has expired. Confirm your details and calculate it again.", 409); }
    requireNatalContext(context, profile, input.contextId);
    if (!context || !profile) throw new ReadingGenerationError("Calculate your birth chart first.", 409);
    const config = readingModelConfig();
    const key = `${context.profileId}:${input.depth}:${config.model}:${NATAL_PROMPT_VERSION}`;
    const cached = cachedNatalProfile(user.id, key);
    if (cached) return NextResponse.json({ report: cached, cached: true }, { headers: privateHeaders(cookie) });
    release = beginNatalProfile(user.id, key);
    if (!release) throw new ReadingGenerationError("A birth profile is already being prepared. Please wait and try again.", 409);
    const evidence = natalEvidence(context);
    const result = await requestReadingJson(natalSystemPrompt(input.depth), natalPrompt(context, profile, evidence), req.signal,
      natalResponseSchema(evidence), input.depth === "deep" ? 8500 : 5000);
    const content = acceptNatalOutput(result.json, evidence);
    const report: NatalProfileReport = {
      ...content, id: randomUUID(), kind: "natal-profile", profileId: context.profileId!, contextId: context.id,
      depth: input.depth, generatedAt: new Date().toISOString(), model: result.config.model, promptVersion: NATAL_PROMPT_VERSION,
      birth: { date: profile.birthDate, localTime: profile.birthTime, timezone: profile.location.timezone,
        place: `${profile.location.city}, ${profile.location.nation}`, confidence: profile.timeConfidence },
      limitations: ["Astrology is a symbolic belief tradition, not a scientifically established personality assessment. Use this profile as an invitation to reflect, not a fixed description of who you are.",
        ...(context.confidence === "estimated" ? ["Birth time is estimated: placements and aspects are approximate. Houses and angles are omitted."] : []),
        "Calculated with the offline Moshier ephemeris; chart positions and their symbolic interpretations are distinct."],
      evidence,
    };
    saveNatalProfile(user.id, key, report, context);
    return NextResponse.json({ report, cached: false }, { headers: privateHeaders(cookie) });
  } catch (error) {
    const failure = requestFailure(error, "Could not prepare your birth profile. Check your chart and try again.");
    return NextResponse.json({ error: failure.error }, { status: failure.status, headers: privateHeaders(cookie) });
  } finally { release?.(); }
}
