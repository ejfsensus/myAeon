import { saveArtifact } from "../../../../../server/reading-artifacts.mjs";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { sameRequestOrigin } from "@/lib/serverRequest";
import { longitudeToSign } from "@/lib/zodiac";
import { generatedReading, requestReadingJson, signedReadingAudio } from "@/lib/readingGeneration";
import { privateHeaders, readPrivateJson, requestFailure } from "@/lib/readingRequest";
import {
  CHART_ADDENDUM_SCHEMA, CHART_ADDENDUM_PROMPT, TODAY_ENHANCEMENT_SCHEMA, TODAY_ENHANCEMENT_PROMPT,
  EnhancementInputSchema, ENHANCEMENT_SYSTEM_PROMPT, ENHANCEMENT_RESPONSE_SCHEMA, enhancementPrompt,
  normalizeBirthChart, normalizeEnhancementOutput, requireNatalContext, validatePriorReading, enhancementReadingInput,
} from "@/lib/readingEnhancement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let cookie: string | null = null;
  if (!sameRequestOrigin(req)) return NextResponse.json({ error: "Request not allowed." }, { status: 403, headers: privateHeaders() });
  try {
    const input = EnhancementInputSchema.parse(await readPrivateJson(req, 100_000));
    const { astrology, contextMetadata } = await import("../../../../../server/astrology.mjs");
    const { requestIdentity } = await import("../../../../../server/astrology-quota.mjs");
    const user = requestIdentity(req); cookie = user.cookie;
    const context = astrology.resolveContext(user.id, input.contextId);
    const profile = context?.profileId ? astrology.resolveProfile(user.id, context.profileId) : null;
    requireNatalContext(context, profile, input.contextId);
    // requireNatalContext checks both nullable server-owned records before use.
    if (!context || !profile) throw new Error("Missing chart");
    validatePriorReading(input.reading, context, profile);
    const mode = input.reading?.mode ?? input.mode ?? "full";
    const addendum = Boolean(input.reading);
    const { json, config } = await requestReadingJson(addendum ? CHART_ADDENDUM_PROMPT : mode === "today" ? TODAY_ENHANCEMENT_PROMPT : ENHANCEMENT_SYSTEM_PROMPT, enhancementPrompt(context, input.reading, profile), req.signal, addendum ? CHART_ADDENDUM_SCHEMA : mode === "today" ? TODAY_ENHANCEMENT_SCHEMA : ENHANCEMENT_RESPONSE_SCHEMA, addendum ? 2400 : mode === "today" ? 4000 : 12288);
    const model = normalizeEnhancementOutput(json, mode);
    const sunSign = longitudeToSign(context.natal!.planets.find(point => point.name === "Sun")!.longitude);
    const birthChart = normalizeBirthChart(model?.birthChart, context);
    const generated = addendum ? { ...input.reading!, planetInsights: input.reading!.planetInsights ?? [] } : generatedReading(enhancementReadingInput(model, input.reading, mode), sunSign, context, mode);
    const response = {
      ...generated, mode, id: input.reading?.id ?? randomUUID(), version: (input.reading?.version ?? 0) + 1,
      birthChart,
      meta: {
        provider: "deepseek", model: config.model, endpoint: config.url, endpointMode: config.mode,
        generatedAt: new Date().toISOString(), readingDate: context.selectedDate,
        profileId: context.profileId, birthDate: profile.birthDate, birthTime: profile.birthTime,
        birthPlace: `${profile.location.city}, ${profile.location.nation}`, astrology: contextMetadata(context),
      },
    };
    const fullReading = { ...response, ...signedReadingAudio(json?.audioScript, response) };
    await astrology.saveInterpretation(user.id, context.id, fullReading);
    saveArtifact(user.id, fullReading, context);
    return NextResponse.json(fullReading, { headers: privateHeaders(cookie) });
  } catch (error) {
    const failure = requestFailure(error, "Your birth chart has expired or could not be interpreted. Prepare it again and retry.");
    return NextResponse.json({ error: failure.error }, { status: failure.status, headers: privateHeaders(cookie) });
  }
}
