const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');
const { test } = require('node:test');
const assert = require('node:assert/strict');
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8').replace(/(["'])@\/([^"']+)\1/g, (_, q, p) => JSON.stringify(path.resolve(__dirname, '../src', p)));
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
};
const locationsRoute = require('../src/app/api/locations/route.ts');
const { default: PlaceSearch } = require('../src/components/ui/PlaceSearch.tsx');
const { birthProfile, initialBirthInput } = require('../src/components/ui/BirthDetailsForm.tsx');

test('international place search selects a strict profile without region/country display metadata', async t => {
  const original = global.fetch;
  t.after(() => { global.fetch = original; });
  let endpoint;
  global.fetch = async url => { endpoint = new URL(url); return Response.json({ results: [{ name: 'Sydney', country_code: 'AU', country: 'Australia', latitude: -33.86785, longitude: 151.20732, timezone: 'Australia/Sydney', admin1: 'New South Wales' }] }); };
  const result = await locationsRoute.GET(new Request('http://localhost/api/locations?q=Sydney%2C%20Australia'));
  const { locations } = await result.json();
  assert.equal(endpoint.searchParams.get('name'), 'Sydney, Australia');
  assert.equal(locations[0].region, 'New South Wales');
  global.fetch = async () => Response.json({ locations });
  let tree, selected;
  await act(async () => { tree = create(React.createElement(PlaceSearch, { selected: null, onSelect: value => { selected = value; }, onClear() {} })); });
  t.after(() => act(() => tree.unmount()));
  await act(async () => { tree.root.findByType('input').props.onChange({ target: { value: 'Sydney, Australia' } }); });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 400)); });
  act(() => tree.root.findByType('button').props.onClick());
  assert.deepEqual(Object.keys(selected).sort(), ['city', 'latitude', 'longitude', 'nation', 'timezone']);
  const { validateProfile } = await import('../server/astrology-input.mjs');
  const profile = birthProfile({ ...initialBirthInput(), birthDate: '1990-05-01', birthTime: '10:15', timeConfidence: 'known', location: selected });
  assert.equal(validateProfile(profile).location.timezone, 'Australia/Sydney');
  // Defensive serialisation also handles metadata-bearing older UI callers.
  assert.equal(validateProfile(birthProfile({ ...initialBirthInput(), birthDate: '1990-05-01', location: locations[0] })).location.nation, 'AU');
});

test('section evidence cannot cite another horizon or invent calculation references', async () => {
  const { generatedReading, buildUserPrompt } = require('../src/lib/readingGeneration.ts');
  const { createAstrologyService } = await import('../server/astrology.mjs');
  const service = createAstrologyService({ enabled: false });
  const context = await service.prepare(null, undefined, '2026-10-15', true);
  const allowed = context.synthesis.sections.find(s => s.title === 'Inner World' && s.timeframe === 'Today').evidenceIds;
  const input = { mode: 'today', birthDate: '1990-05-01', name: '', preferences: { capacity: 'low' } };
  const reading = generatedReading({ sections: [{ title: 'Inner World', timeframe: 'Today', body: 'A small reflection.', evidenceIds: [...allowed, '2026-10-18:moon', 'invented'] }] }, { id: 'taurus', name: 'Taurus', glyph: 'T' }, context, 'today');
  assert.deepEqual(reading.sections.find(s => s.title === 'Inner World').evidenceIds, allowed);
  const prompt = buildUserPrompt(input, 'Taurus', { ...context, charts: { natal: { dark: '<svg>private image</svg>' } }, chartContext: '<private-xml />' });
  assert.ok(!prompt.includes('private image') && !prompt.includes('private-xml'));
  assert.match(prompt, /"capacity":"low"/);
});

test('requests for a gentle pace cannot become asserted symptoms or dietary restrictions', async () => {
  const { generatedReading } = require('../src/lib/readingGeneration.ts');
  const { createAstrologyService } = await import('../server/astrology.mjs');
  const context = await createAstrologyService({ enabled: false }).prepare(null, undefined, '2026-10-15');
  const sections = ['Love & Connection', 'Purpose & Work', 'Body & Energy', 'Inner World'].map(title => ({ title, timeframe: 'Today', body: 'If your energy is low, you could choose one small step.' }));
  sections[2].body = 'Your body is asking for rest. Avoid caffeine or sugar for a quick lift.';
  const reading = generatedReading({ summary: 'Your energy is low, so you must rest.', sections }, { id: 'taurus', name: 'Taurus', glyph: 'T' }, context, 'today');
  assert.equal(reading.quality, 'partial');
  assert.match(reading.summary, /general reflections/);
  assert.doesNotMatch(reading.sections[2].body, /body is asking|caffeine|sugar/);
  assert.equal(reading.sections[0].body, sections[0].body);
});
