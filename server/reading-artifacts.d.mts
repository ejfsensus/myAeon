import type { ReadingPayload } from '../src/components/ui/types';
import type { AstrologyContext } from '../src/lib/astrologyTypes';
export function saveArtifact(owner: string | null, reading: ReadingPayload, context: AstrologyContext): void;
export function getArtifact(owner: string | null, id: string, version: number): { reading: ReadingPayload; context: AstrologyContext } | null;
