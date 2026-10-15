const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8').replace(/(["'])@\/([^"']+)\1/g, (_, quote, target) => JSON.stringify(path.resolve(__dirname, '../src', target)));
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
};
const route = require('../src/app/api/astrology/natal-profile/route.ts');
const pdfRoute = require('../src/app/api/astrology/natal-profile/pdf/route.ts');
const lib = require('../src/lib/natalProfile.ts');
const { readingModelConfig } = require('../src/lib/readingGeneration.ts');
const origin = 'http://localhost';
const request = (body, cookie, url = '/api/astrology/natal-profile') => new Request(origin + url, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
function output(evidence, long = false) {
  const prose = 'In this symbolic tradition, the supplied Sun placement may invite reflection on steady self-expression. You might recognise this in the way you develop an interest over time; compare the idea with your own experience. ';
  return { title: 'Your independent birth profile', overview: prose.repeat(long ? 3 : 1),
    sections: Object.fromEntries(Object.keys(lib.NATAL_TOPICS).map(key => [key, { body: prose.repeat(long ? 7 : 1), evidenceIds: [evidence[0].id] }])),
    synthesis: prose.repeat(long ? 8 : 1) + ' FINAL_SYNTHESIS_SENTENCE.',
    reflections: ['Which pattern fits your lived experience?', 'Where do two needs pull in different directions?', 'What small experiment would you like to try? FINAL_REFLECTION.'] };
}
async function fixture(t, options = {}) {
  const env = { ...process.env }, originalFetch = global.fetch;
  Object.assign(process.env, { ASTROLOGY_SESSION_SECRET: 'synthetic-session-secret-at-least-32-characters', DEEPSEEK_API_KEY: 'synthetic-key' });
  delete process.env.DEEPSEEK_MODEL;
  const { astrology, createAstrologyService } = await import('../server/astrology.mjs');
  const { requestIdentity } = await import('../server/astrology-quota.mjs');
  const { knownProfile, subjectFixture } = await import('./fixtures/astrologer.mjs');
  const original = { ...astrology };
  const wheel = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><circle cx="300" cy="300" r="250" fill="none" stroke="#15788a"/><text x="200" y="300">SYNTHETIC NATAL WHEEL</text></svg>';
  const service = createAstrologyService({ enabled: true, worker: async job => ({
    engine: { name: 'Kerykeion', version: '6.0.2', backend: 'swisseph-moshier' },
    natal: subjectFixture(job.subject), snapshots: job.targets.map(target => subjectFixture(target, 5)),
    chartContext: '<astrology_context><natal/></astrology_context>',
    ...(job.confidence === 'known' ? { charts: { natal: { light: wheel, dark: wheel }, transit: { light: wheel, dark: wheel } } } : {}),
  }) });
  Object.assign(astrology, service);
  const identity = requestIdentity(request({}));
  const birth = { ...knownProfile, ...(options.birth ?? {}) };
  const { profileId } = service.confirm(identity.id, birth);
  const context = await service.prepare(identity.id, profileId, '2026-10-15', true);
  let calls = 0, lastBody;
  global.fetch = async (_url, args) => {
    calls++; lastBody = JSON.parse(args.body);
    if (options.wait) await options.wait;
    if (options.failure) throw new Error('PRIVATE_UPSTREAM_CREDENTIAL');
    const evidence = JSON.parse(lastBody.messages[1].content).natalEvidence;
    const result = output(evidence, options.long);
    if (options.invalidEvidence) result.sections.personality.evidenceIds = ['forged:aspect'];
    if (options.incomplete) delete result.sections.communication;
    return Response.json({ choices: [{ finish_reason: options.truncated ? 'length' : 'tool_calls', message: { tool_calls: [{ type: 'function', function: { name: 'emit_chart_reading', arguments: JSON.stringify(result) } }] } }] });
  };
  t.after(() => { Object.assign(astrology, original); process.env = env; global.fetch = originalFetch; });
  return { identity, context, service, profileId, get calls() { return calls; }, get lastBody() { return lastBody; } };
}

test('independent standard/deep profiles use one separate call, natal-only prompt and model default; duplicates are cached', async t => {
  const f = await fixture(t);
  assert.equal(readingModelConfig().model, 'deepseek-v4-pro');
  const first = await route.POST(request({ contextId: f.context.id }, f.identity.cookie));
  assert.equal(first.status, 200, await first.clone().text());
  const { report } = await first.json();
  assert.equal(report.kind, 'natal-profile'); assert.equal(report.sections.length, 8);
  assert.equal(f.calls, 1); assert.equal(f.lastBody.model, 'deepseek-v4-pro'); assert.equal(f.lastBody.max_tokens, 5000);
  const prompt = JSON.parse(f.lastBody.messages[1].content);
  assert.deepEqual(Object.keys(prompt), ['confirmedBirth', 'settings', 'natalEvidence']);
  assert.ok(!/selectedDate|snapshots|chartContext|reading|transit/i.test(JSON.stringify(prompt)));
  assert.equal(f.lastBody.messages[0].content, lib.natalSystemPrompt('standard'));
  const cached = await route.POST(request({ contextId: f.context.id }, f.identity.cookie));
  assert.equal((await cached.json()).report.id, report.id); assert.equal(f.calls, 1);
  const otherDate = await f.service.prepare(f.identity.id, f.profileId, '2026-10-20', true);
  const reused = await route.POST(request({ contextId: otherDate.id }, f.identity.cookie));
  assert.equal((await reused.json()).report.id, report.id); assert.equal(f.calls, 1);
  const deep = await route.POST(request({ contextId: f.context.id, depth: 'deep' }, f.identity.cookie));
  assert.equal(deep.status, 200); const deepReport = (await deep.json()).report;
  assert.equal(deepReport.depth, 'deep'); assert.notEqual(deepReport.id, report.id); assert.equal(f.calls, 2);
  assert.equal(f.lastBody.max_tokens, 8500); assert.match(f.lastBody.messages[0].content, /DEEP ANALYSIS/);
  assert.equal(f.service.resolveContext(f.identity.id, f.context.id).interpretation, undefined);
});

test('estimated-time evidence excludes houses and angles even if a context contains them', async t => {
  const f = await fixture(t, { birth: { timeConfidence: 'estimated' } });
  const response = await route.POST(request({ contextId: f.context.id }, f.identity.cookie));
  assert.equal(response.status, 200); const { report } = await response.json();
  assert.ok(report.limitations.some(line => /approximate/.test(line)));
  const forged = structuredClone(f.context); forged.natal.planets[0].house = 'first_house'; forged.natal.angles = [{ name: 'Ascendant', sign: 'Aries', degree: 12 }];
  forged.natal.aspects.push({ first: 'Sun', second: 'Ascendant', aspect: 'trine', orb: 1 });
  assert.ok(!/house|Ascendant/.test(JSON.stringify(lib.natalEvidence(forged))));
  assert.equal(JSON.parse(f.lastBody.messages[1].content).settings.houses, 'omitted');
});

test('unknown time, expired context, foreign owner, forged input and cross-origin requests never invoke the model', async t => {
  const f = await fixture(t);
  assert.equal((await route.POST(request({ contextId: f.context.id }))).status, 409);
  assert.equal((await route.POST(request({ contextId: 'f'.repeat(48) }, f.identity.cookie))).status, 409);
  assert.equal((await route.POST(request({ contextId: f.context.id, reading: 'FORGED' }, f.identity.cookie))).status, 400);
  assert.equal((await route.POST(request({ contextId: f.context.id, depth: 'unexpected' }, f.identity.cookie))).status, 400);
  assert.equal((await route.POST(request({ contextId: f.context.id, padding: 'x'.repeat(2200) }, f.identity.cookie))).status, 413);
  const foreign = new Request(origin + '/api/astrology/natal-profile', { method: 'POST', headers: { Origin: 'https://evil.example' }, body: '{}' });
  assert.equal((await route.POST(foreign)).status, 403);
  const { knownProfile } = await import('./fixtures/astrologer.mjs');
  const { profileId } = f.service.confirm(f.identity.id, { ...knownProfile, birthTime: undefined, timeConfidence: 'unknown' });
  const unknown = await f.service.prepare(f.identity.id, profileId, '2026-10-15', true);
  assert.equal((await route.POST(request({ contextId: unknown.id }, f.identity.cookie))).status, 422);
  assert.equal(f.calls, 0);
});

for (const option of ['failure', 'invalidEvidence', 'incomplete', 'truncated']) test(`${option} is rejected privately and can be retried`, async t => {
  const f = await fixture(t, { [option]: true });
  for (let i = 0; i < 2; i++) {
    const response = await route.POST(request({ contextId: f.context.id }, f.identity.cookie));
    assert.equal(response.status, 502); assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.ok(!/PRIVATE_UPSTREAM|synthetic-key/.test(await response.text()));
  }
  assert.equal(f.calls, 2);
});

test('simultaneous requests are deduplicated while generation is pending', async t => {
  let finish;
  const f = await fixture(t, { wait: new Promise(resolve => { finish = resolve; }) });
  const first = route.POST(request({ contextId: f.context.id }, f.identity.cookie));
  while (!f.calls) await new Promise(resolve => setImmediate(resolve));
  const duplicate = await route.POST(request({ contextId: f.context.id }, f.identity.cookie));
  assert.equal(duplicate.status, 409); assert.equal(f.calls, 1);
  finish(); assert.equal((await first).status, 200);
});

test('standalone PDF uses immutable owner-scoped report after context expiry, never an LLM or client text', async t => {
  const f = await fixture(t, { long: true });
  const response = await route.POST(request({ contextId: f.context.id, depth: 'deep' }, f.identity.cookie));
  const { report } = await response.json();
  assert.equal(f.calls, 1);
  const { astrology } = await import('../server/astrology.mjs');
  astrology.resolveContext = () => { throw new Error('expired'); };
  const exported = await pdfRoute.POST(request({ reportId: report.id }, f.identity.cookie));
  assert.equal(exported.status, 200, await exported.clone().text());
  assert.equal(exported.headers.get('content-type'), 'application/pdf');
  assert.equal(exported.headers.get('cache-control'), 'private, no-store');
  const bytes = Buffer.from(await exported.arrayBuffer());
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-'); assert.ok(bytes.length > 10000); assert.equal(f.calls, 1);
  assert.ok((bytes.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length >= 5);
  assert.equal((await pdfRoute.POST(request({ reportId: report.id }))).status, 409);
  assert.equal((await pdfRoute.POST(request({ reportId: report.id, report: { overview: 'FORGED' } }, f.identity.cookie))).status, 400);
  if (process.env.AEON_NATAL_TEST_PDF) fs.writeFileSync(process.env.AEON_NATAL_TEST_PDF, bytes);
});
