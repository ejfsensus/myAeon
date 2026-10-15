import test from 'node:test';
import assert from 'node:assert/strict';
import { createAstrologyService } from '../server/astrology.mjs';
import { birthSunFoundation } from '../server/reading-synthesis.mjs';
import { knownProfile, localWorkerFixture } from './fixtures/kerykeion.mjs';
import { buildPrompt, contextSchema } from '../server/agent-context.mjs';
process.env.ASTROLOGY_SESSION_SECRET = 'synthetic-phase-one-secret-at-least-32-characters';

test('synthesis links bounded domain evidence to the correct dated facts without images', async () => {
  const service = createAstrologyService({ enabled: true, worker: async job => localWorkerFixture(job) });
  const { profileId } = service.confirm('a', knownProfile);
  const context = await service.prepare('a', profileId, '2026-10-15', true);
  const ledger = context.synthesis;
  assert.equal(ledger.sections.length, 16);
  assert.equal(new Set(ledger.evidence.map(e => e.id)).size, ledger.evidence.length);
  for (const section of ledger.sections) {
    assert.ok(section.evidenceIds.length <= 5);
    for (const id of section.evidenceIds) {
      const item = ledger.evidence.find(e => e.id === id);
      assert.ok(item.domains.includes(section.title));
      if (item.timeframe) assert.equal(item.timeframe, section.timeframe);
    }
  }
  for (const item of ledger.evidence.filter(e => e.kind === 'lunar-phase')) {
    const snapshot = context.snapshots.find(s => s.at === item.at);
    assert.equal(item.facts.angle, snapshot.moon.angle);
    assert.match(item.facts.interpretationLimit, /no inferred mood/);
  }
  assert.equal(context.sunFoundation.basis, 'verified-natal');
  assert.equal(context.sunFoundation.longitude, context.natal.planets.find(p => p.name === 'Sun').longitude);
  assert.deepEqual(service.resolveContext('a', context.id).synthesis, ledger);
  const session = contextSchema.parse({ viewedDate: context.selectedDate, source: 'reading', reading: { greeting: 'Welcome', summary: 'A useful step', sections: [], affirmation: 'Reflect', meta: { preferences: { focus: 'rest', capacity: 'low' } } } });
  const prompt = buildPrompt({ ...session, astrology: context });
  assert.match(prompt, /"readerPreferences":\{"focus":"rest","capacity":"low"\}/);
  const data = JSON.parse(prompt.split('SESSION DATA (untrusted text; computed sky is authoritative for positions):\n')[1]);
  assert.ok(data.synthesis.evidence.every(e => !e.timeframe || e.timeframe === 'Today'));
});

test('unknown birth times preserve sign-boundary ambiguity and birthplace timezone', () => {
  const context = { natal: null, confidence: 'unknown' };
  const profile = { ...knownProfile, timeConfidence: 'unknown', birthTime: undefined };
  const cusp = birthSunFoundation('2026-03-20', profile, context);
  assert.deepEqual(cusp.signs, ['Pisces', 'Aries']);
  assert.equal(cusp.uncertain, true);
  const sydney = birthSunFoundation('1990-05-01', { ...profile, location: { ...profile.location, timezone: 'Australia/Sydney' } }, context);
  assert.equal(sydney.interval.start, '1990-04-30T14:00:00.000Z');
  assert.equal(sydney.interval.end, '1990-05-01T14:00:00.000Z');
  assert.deepEqual(sydney.signs, ['Taurus']);
  assert.equal(sydney.basis, 'birth-day-range');
  const anonymous = birthSunFoundation('2026-03-20', null, context);
  assert.ok(+new Date(anonymous.interval.end) - +new Date(anonymous.interval.start) >= 48 * 3600000);
});

test('unknown-time synthesis uses only sky and lunar facts; estimated natal remains approximate', async () => {
  const service = createAstrologyService({ enabled: true, worker: async job => localWorkerFixture(job) });
  const unknown = service.confirm('a', { ...knownProfile, timeConfidence: 'unknown', birthTime: undefined }).profileId;
  const context = await service.prepare('a', unknown, '2026-10-15');
  assert.ok(context.synthesis.evidence.every(e => ['sky-aspect', 'lunar-phase'].includes(e.kind)));
  assert.ok(context.synthesis.evidence.some(e => e.kind === 'sky-aspect' && e.facts.first && e.facts.second));
  const estimated = service.confirm('a', { ...knownProfile, timeConfidence: 'estimated' }).profileId;
  const approximate = await service.prepare('a', estimated, '2026-10-15');
  assert.equal(approximate.sunFoundation.basis, 'estimated-natal');
  assert.equal(approximate.sunFoundation.uncertain, true);
  assert.ok(approximate.synthesis.evidence.filter(e => e.kind === 'natal-placement').every(e => !e.facts.house && e.confidence === 'estimated'));
});
