const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { act, create } = require('react-test-renderer');
const { test } = require('node:test');
const assert = require('node:assert/strict');
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8').replace(/(["'])@\/([^"']+)\1/g, (_, quote, target) => JSON.stringify(path.resolve(__dirname, '../src', target)));
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
};
const { useNatalProfile } = require('../src/components/ui/useNatalProfile.ts');
const Panel = require('../src/components/ui/NatalProfilePanel.tsx').default;
const report = depth => ({ id: `${depth}-id`, kind: 'natal-profile', depth, title: 'A profile', birth: { date: '1990-05-03', localTime: '10:15', timezone: 'Europe/London', confidence: 'known' }, overview: 'Overview', sections: [], limitations: [], synthesis: 'Synthesis', reflections: [], generatedAt: '2026-10-15T12:00:00Z' });
function harness(t) {
  const originalFetch = global.fetch;
  const requests = [];
  global.fetch = (url, options) => new Promise(resolve => requests.push({ url, options, body: JSON.parse(options.body), resolve }));
  let controls, tree;
  function Harness(props) { controls = useNatalProfile(props.birthKey, props.contextId); return null; }
  act(() => { tree = create(React.createElement(Harness, { birthKey: 'birth-a', contextId: 'chart-a' })); });
  t.after(() => { act(() => tree.unmount()); global.fetch = originalFetch; });
  return { requests, get controls() { return controls; }, update(birthKey, contextId) { act(() => tree.update(React.createElement(Harness, { birthKey, contextId }))); } };
}
test('generation is natal-only; standard/deep reports remain separate and survive a sky-date/context change', async t => {
  const f = harness(t);
  let pending;
  act(() => { pending = f.controls.generate(); });
  assert.equal(f.controls.busy, true); assert.equal(f.requests[0].url, '/api/astrology/natal-profile');
  assert.deepEqual(f.requests[0].body, { contextId: 'chart-a', depth: 'standard' });
  await act(async () => { f.requests[0].resolve(Response.json({ report: report('standard') })); await pending; });
  f.update('birth-a', 'other-date-chart'); assert.equal(f.controls.report.depth, 'standard');
  act(() => f.controls.setDepth('deep')); assert.equal(f.controls.report, null);
  act(() => { pending = f.controls.generate(); });
  await act(async () => { f.requests[1].resolve(Response.json({ report: report('deep') })); await pending; });
  assert.equal(f.controls.report.depth, 'deep');
  act(() => f.controls.setDepth('standard')); assert.equal(f.controls.report.id, 'standard-id');
});
test('birth changes abort pending generation and a stale response cannot populate the new profile', async t => {
  const f = harness(t); let pending;
  act(() => { pending = f.controls.generate(); });
  f.update('birth-b', 'chart-b'); assert.equal(f.requests[0].options.signal.aborted, true);
  await act(async () => { f.requests[0].resolve(Response.json({ report: report('standard') })); await pending; });
  assert.equal(f.controls.report, null); assert.equal(f.controls.busy, false);
});
test('generation and PDF errors are independent; PDF submits only the report identifier', async t => {
  const f = harness(t); let pending;
  act(() => { pending = f.controls.generate(); });
  await act(async () => { f.requests[0].resolve(Response.json({ error: 'Retry the profile.' }, { status: 502 })); await pending; });
  assert.match(f.controls.error, /Retry/); assert.equal(f.controls.report, null);
  act(() => { pending = f.controls.generate(); });
  await act(async () => { f.requests[1].resolve(Response.json({ report: report('standard') })); await pending; });
  act(() => { pending = f.controls.exportPdf(); });
  assert.deepEqual(f.requests[2].body, { reportId: 'standard-id' });
  await act(async () => { f.requests[2].resolve(Response.json({ error: 'Saved profile expired.' }, { status: 409 })); await pending; });
  assert.equal(f.controls.report.id, 'standard-id'); assert.equal(f.controls.error, null); assert.match(f.controls.pdfError, /expired/);
});
test('profile panel exposes accessible depth, generation, report and PDF controls', () => {
  const calls = [];
  const controls = { report: report('deep'), depth: 'deep', setDepth: value => calls.push(value), busy: false, pdfBusy: false, error: null, pdfError: null,
    generate: () => calls.push('generate'), exportPdf: () => calls.push('pdf') };
  let tree;
  act(() => { tree = create(React.createElement(Panel, { controls, available: true })); });
  const buttons = tree.root.findAllByType('button');
  assert.equal(buttons[1].props['aria-pressed'], true);
  act(() => { buttons[0].props.onClick(); buttons[2].props.onClick(); buttons[3].props.onClick(); });
  assert.deepEqual(calls, ['standard', 'generate', 'pdf']);
  assert.equal(tree.root.findByProps({ 'aria-label': 'Generated birth profile' }).type, 'article');
  act(() => tree.unmount());
});
