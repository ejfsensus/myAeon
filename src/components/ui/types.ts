import type { PlanetId } from "@/lib/zodiac";
import type { AudioAuthorization } from "@/lib/readingAudio";

export type ThemeMode = "dark" | "light";

export type ZeusSource = "welcome" | "solar" | "chart" | "reading";
export type ZeusReadingFocus = { title: string; timeframe: string };

export type PlanetInsight = {
  id: PlanetId;
  name: string;
  sign: string;
  degree: number;
  title: string;
  body: string;
  reflection: string;
};

export type ReadingPayload = {
  id?: string; version?: number; mode?: "today" | "full"; quality?: "complete" | "partial";
  sunSign: { id: string; name: string; symbol: string };
  greeting: string;
  summary: string;
  sections: Array<{
    title: string;
    timeframe: string;
    body: string;
    evidenceIds?: string[];
  }>;
  planetInsights?: PlanetInsight[];
  affirmation: string;
  audioScript?: string;
  audioAuthorization?: AudioAuthorization;
  birthChart?: BirthChartInterpretation;
  meta?: {
    timezone?: string; schemaVersion?: number;
    astrology?: import("@/lib/astrologyTypes").AstrologyMetadata;
    provider?: string;
    model?: string;
    endpoint?: string;
    endpointMode?: string;
    generatedAt?: string;
    readingDate?: string;
    birthDate?: string;
    birthTime?: string;
    birthPlace?: string;
    profileId?: string;
    preferences?: import('@/lib/astrologyTypes').ReadingPreferences;
  };
};

export type BirthChartInterpretation = {
  contextId: string;
  title: string;
  overview: string;
  sections: Array<{ title: string; body: string }>;
  synthesis: string;
  reflection: string;
};
