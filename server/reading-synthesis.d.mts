import type { AstrologyContext, BirthProfile, ReadingSynthesis, SunFoundation } from '../src/lib/astrologyTypes';
export function birthSunFoundation(birthDate: string, profile: BirthProfile | null, context: AstrologyContext): SunFoundation;
export function buildReadingSynthesis(context: AstrologyContext): ReadingSynthesis;
