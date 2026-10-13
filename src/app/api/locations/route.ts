import { NextResponse } from "next/server";
const cache = new Map<string, { at: number; locations: unknown[] }>();
export async function GET(req: Request) {
  const query = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 3 || query.length > 100)
    return NextResponse.json({ locations: [] });
  const cached = cache.get(query.toLowerCase());
  if (cached && Date.now() - cached.at < 3600000)
    return NextResponse.json({ locations: cached.locations });
  try {
    const endpoint = new URL(
      process.env.GEOCODING_API_URL ||
        (process.env.OPEN_METEO_API_KEY
          ? "https://customer-geocoding-api.open-meteo.com/v1/search"
          : "https://geocoding-api.open-meteo.com/v1/search"),
    );
    endpoint.search = new URLSearchParams({
      name: query,
      count: "6",
      language: "en",
      format: "json",
      ...(process.env.OPEN_METEO_API_KEY
        ? { apikey: process.env.OPEN_METEO_API_KEY }
        : {}),
    }).toString();
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error();
    const data = await response.json();
    const locations = (Array.isArray(data.results) ? data.results : [])
      .filter(
        (p: any) =>
          typeof p.name === "string" &&
          typeof p.timezone === "string" &&
          /^[A-Z]{2}$/.test(p.country_code) &&
          Number.isFinite(p.latitude) &&
          Number.isFinite(p.longitude),
      )
      .map((p: any) => ({
        city: p.name,
        nation: p.country_code,
        latitude: p.latitude,
        longitude: p.longitude,
        timezone: p.timezone,
        region: p.admin1 ?? "",
      }));
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(query.toLowerCase(), { at: Date.now(), locations });
    return NextResponse.json({ locations });
  } catch {
    return NextResponse.json(
      {
        error:
          "Place search is unavailable. Enter coordinates and timezone below.",
      },
      { status: 503 },
    );
  }
}
