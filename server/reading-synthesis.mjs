import { localInstant } from './astrology-input.mjs';
import { sunLongitudeAt } from './sky.mjs';

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const DOMAINS = ['Love & Connection', 'Purpose & Work', 'Body & Energy', 'Inner World'];
const RELEVANCE = [new Set(['Moon', 'Venus', 'Mercury']), new Set(['Sun', 'Mars', 'Jupiter', 'Saturn', 'Medium_Coeli']), new Set(['Sun', 'Moon', 'Mars', 'Saturn']), new Set(['Moon', 'Mercury', 'Neptune', 'Pluto'])];
const LUNAR_REFLECTIONS = ['Begin with one small intention', 'Try a manageable first step', 'Review friction and adjust the plan', 'Refine what is already underway', 'Notice what deserves recognition or perspective', 'Keep what is useful and simplify the rest', 'Review what can be finished or set aside', 'Leave room to rest and prepare'];

// A birth date is an interval, not an exact natal instant. Preserve cusp ambiguity.
export function birthSunFoundation(birthDate, profile, context) {
  const natal = context.natal?.planets.find(p => p.name === 'Sun');
  if (natal) return { basis: context.confidence === 'known' ? 'verified-natal' : 'estimated-natal', source: context.natal.source, signs: [natal.sign], longitude: natal.longitude, at: context.natal.at, uncertain: context.confidence !== 'known' };
  const next = new Date(`${birthDate}T12:00:00Z`); next.setUTCDate(next.getUTCDate() + 1);
  let start, end;
  try {
    if (!profile) throw new Error('No birth timezone');
    start = localInstant(birthDate, '00:00', profile.location.timezone, 'earlier');
    end = localInstant(next.toISOString().slice(0, 10), '00:00', profile.location.timezone, 'later');
  } catch {
    // Conservative range when timezone or a historical midnight is unavailable.
    const midnight = +new Date(`${birthDate}T00:00:00Z`);
    start = new Date(midnight - 14 * 3600000); end = new Date(midnight + 36 * 3600000);
  }
  const signs = [...new Set([sunLongitudeAt(start), sunLongitudeAt(new Date(+end - 1))].map(lon => SIGNS[Math.floor(lon / 30)]))];
  return { basis: 'birth-day-range', source: 'astronomy-engine', signs, longitude: sunLongitudeAt(new Date((+start + +end) / 2)), interval: { start: start.toISOString(), end: end.toISOString() }, uncertain: signs.length > 1 };
}

// Select traceable calculation evidence, never a score of predictive certainty.
export function buildReadingSynthesis(context) {
  const evidence = [], sections = [];
  const add = (id, kind, at, source, facts, names, timeframe) => {
    const item = { id, kind, at, source, confidence: kind.startsWith('natal') || kind === 'personal-aspect' ? context.confidence : 'calculated-snapshot', facts, domains: DOMAINS.filter((_, i) => names.some(name => RELEVANCE[i].has(name))), ...(timeframe ? { timeframe } : {}) };
    evidence.push(item); return item;
  };
  if (context.natal) {
    for (const p of [...context.natal.planets, ...context.natal.angles.filter(p => ['Ascendant', 'Medium_Coeli'].includes(p.name))]) add(`natal:${p.name}`, 'natal-placement', context.natal.at, context.natal.source, p, [p.name]);
    for (const a of context.natal.aspects.slice(0, 8)) add(`natal:${a.first}:${a.aspect}:${a.second}`, 'natal-aspect', context.natal.at, context.natal.source, a, [a.first, a.second]);
  }
  for (const snapshot of context.snapshots) {
    const timeframe = snapshot.label;
    const bucket = Math.floor((snapshot.moon.angle + 22.5) / 45) % 8;
    const moon = add(`${snapshot.date}:moon`, 'lunar-phase', snapshot.at, snapshot.moon.source, { ...snapshot.moon, reflectionTheme: LUNAR_REFLECTIONS[bucket], interpretationLimit: 'Optional symbolic reflection; no inferred mood, exact lunation event or physiological effect.' }, ['Moon'], timeframe);
    const candidates = [];
    for (const [kind, aspects] of [['personal-aspect', snapshot.natalAspects], ['sky-aspect', snapshot.aspects]]) {
      const selected = new Map();
      for (let i = 0; i < DOMAINS.length; i++) {
        for (const a of [...aspects].sort((a, b) => a.orb - b.orb).filter(a => [a.natal || a.first, a.transit || a.second].some(n => RELEVANCE[i].has(n))).slice(0, 2)) selected.set(JSON.stringify(a), a);
      }
      for (const a of selected.values()) candidates.push(add(`${snapshot.date}:${kind}:${a.natal || a.first}:${a.aspect}:${a.transit || a.second}`, kind, snapshot.at, snapshot.source, a, [a.natal || a.first, a.transit || a.second], timeframe));
    }
    for (const title of DOMAINS) {
      const personal = candidates.filter(e => e.kind === 'personal-aspect' && e.domains.includes(title)).slice(0, 2);
      const natal = evidence.filter(e => e.kind === 'natal-placement' && e.domains.includes(title)).slice(0, 1);
      const sky = candidates.filter(e => e.kind === 'sky-aspect' && e.domains.includes(title)).slice(0, 1);
      sections.push({ title, timeframe, date: snapshot.date, evidenceIds: [...personal, ...natal, ...sky, ...(moon.domains.includes(title) ? [moon] : [])].slice(0, 5).map(e => e.id) });
    }
  }
  return { version: 1, lens: 'tropical-geocentric', settings: context.settings, evidence, sections, rules: ['Select a few overall priorities; do not recite each placement.', 'Repeated facts across domains are shared context, not independent confirmation.', 'Snapshot differences do not establish duration, exact peaks or intervening events.', 'Lunar reflection is optional and must adapt to the reader’s reported capacity.'] };
}
