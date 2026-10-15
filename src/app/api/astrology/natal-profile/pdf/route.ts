import { NextResponse } from "next/server";
import { z } from "zod";
import { sameRequestOrigin } from "@/lib/serverRequest";
import { privateHeaders, readPrivateJson, requestFailure } from "@/lib/readingRequest";
import { ReadingGenerationError } from "@/lib/readingGeneration";
import { renderNatalProfilePdf } from "@/lib/natalProfilePdf";
import { getNatalProfile } from "../../../../../../server/natal-profiles.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const Input = z.object({ reportId: z.string().uuid() }).strict();
export async function POST(req: Request) {
  if (!sameRequestOrigin(req)) return NextResponse.json({ error: "Request not allowed." }, { status: 403, headers: privateHeaders() });
  let cookie: string | null = null;
  try {
    const { reportId } = Input.parse(await readPrivateJson(req, 1024));
    const { requestIdentity } = await import("../../../../../../server/astrology-quota.mjs");
    const user = requestIdentity(req); cookie = user.cookie;
    const saved = getNatalProfile(user.id, reportId);
    if (!saved) throw new ReadingGenerationError("This saved profile has expired. Refresh the profile to generate it again before exporting.", 409);
    const bytes = await renderNatalProfilePdf(saved.report, saved.natalSvg);
    return new NextResponse(new Uint8Array(bytes), { headers: {
      ...privateHeaders(cookie), "Content-Type": "application/pdf", "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `attachment; filename="myAeon-birth-profile-${saved.report.depth}.pdf"`,
    } });
  } catch (error) {
    const failure = requestFailure(error, "Could not export your birth profile. Please try again.");
    return NextResponse.json({ error: failure.error }, { status: failure.status, headers: privateHeaders(cookie) });
  }
}
