const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8').replace(/(["'])@\/([^"']+)\1/g, (_, quote, target) => JSON.stringify(path.resolve(__dirname, '../src', target)));
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
};
const { requestReadingJson } = require('../src/lib/readingGeneration.ts');

for (const name of ['TimeoutError', 'AbortError']) test(`a ${name} while reading the response body is treated as a timeout, not empty output`, async t => {
  const originalFetch = global.fetch, previousKey = process.env.DEEPSEEK_API_KEY;
  process.env.DEEPSEEK_API_KEY = 'synthetic';
  global.fetch = async () => ({ ok: true, json: async () => { throw new DOMException('PRIVATE_BODY_DETAILS', name); } });
  t.after(() => { global.fetch = originalFetch; if (previousKey === undefined) delete process.env.DEEPSEEK_API_KEY; else process.env.DEEPSEEK_API_KEY = previousKey; });
  await assert.rejects(requestReadingJson('system', 'prompt'), error => error.status === 504 && !error.message.includes('PRIVATE_BODY_DETAILS'));
});
test('upstream rejection logs status without request credentials or provider response text', async t => {
  const originalFetch = global.fetch, originalWarn = console.warn, previousKey = process.env.DEEPSEEK_API_KEY, warnings = [];
  process.env.DEEPSEEK_API_KEY = 'PRIVATE_CREDENTIAL';
  global.fetch = async () => ({ ok: false, status: 400, json: async () => ({ error: 'PRIVATE_RESPONSE' }) });
  console.warn = (...args) => warnings.push(args);
  t.after(() => { global.fetch = originalFetch; console.warn = originalWarn; if (previousKey === undefined) delete process.env.DEEPSEEK_API_KEY; else process.env.DEEPSEEK_API_KEY = previousKey; });
  await assert.rejects(requestReadingJson('PRIVATE_PROMPT', 'PRIVATE_BIRTH_DETAILS'), error => error.status === 502);
  assert.match(JSON.stringify(warnings), /400/);
  assert.ok(!/PRIVATE_/.test(JSON.stringify(warnings)));
});
