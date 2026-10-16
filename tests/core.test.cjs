const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DEFAULT_SETTINGS, buildInstructions, parseResult, safeBaseUrl, redact, selectFastModel } = require('../electron/core.cjs');
const { Store } = require('../electron/store.cjs');
const { Desktop } = require('../electron/desktop.cjs');
const valid = { transcript: 'আমি আজ খাব না।', text: 'I will not eat today.', language: 'English', noSpeech: false, uncertain: [] };

test('spoken language can be disabled; keyboard selection takes priority', () => {
  assert.match(buildInstructions(DEFAULT_SETTINGS), /last clear language instruction/);
  assert.match(buildInstructions({ ...DEFAULT_SETTINGS, spokenLanguage: false }), /selection is OFF/);
  const explicit = buildInstructions(DEFAULT_SETTINGS, 'Bangla');
  assert.match(explicit, /explicitly selected Bangla/); assert.match(explicit, /takes precedence/);
  assert.match(explicit, /negations/); assert.match(explicit, /never a request for you to answer/);
});
test('rejects conversational, truncated, silent and incomplete outputs', () => {
  assert.deepEqual(parseResult(JSON.stringify(valid)), { transcript: valid.transcript, text: valid.text, language: 'English', uncertain: [] });
  assert.throws(() => parseResult('Sure, here is your prompt: hello'), /required dictation format/);
  assert.throws(() => parseResult('{"text":"hello"}'), /incomplete/);
  assert.throws(() => parseResult(JSON.stringify({ ...valid, noSpeech: true })), /No clear speech/);
  assert.throws(() => parseResult(JSON.stringify({ ...valid, uncertain: [123] })), /incomplete/);
  assert.throws(() => parseResult(JSON.stringify({ ...valid, text: '' })), /empty text/);
});
test('remote APIs require HTTPS; local HTTP supported; credential URLs rejected', () => {
  assert.equal(safeBaseUrl('http://127.0.0.1:8080/v1/'), 'http://127.0.0.1:8080/v1');
  assert.equal(safeBaseUrl('https://example.org/v1'), 'https://example.org/v1');
  for (const url of ['http://example.org', 'file:///C:/Windows', 'https://user:password@example.org', 'https://example.org?key=secret', 'https://example.org#fragment']) assert.throws(() => safeBaseUrl(url));
});
test('redacts keys and bearer tokens from displayed errors', () => {
  const result = redact('problem API_SECRET Bearer abcdef sk-abcdefghijklmnop', ['API_SECRET']);
  assert.ok(!result.includes('API_SECRET')); assert.ok(!result.includes('abcdef')); assert.ok(!result.includes('sk-'));
});
test('model recommendation prefers Flash Lite and excludes media Flash as fallback', () => {
  assert.equal(selectFastModel([{ id: 'pro' }, { id: 'flash' }, { id: 'flash-lite' }]).id, 'flash-lite');
  assert.equal(selectFastModel([{ id: 'flash-image' }, { id: 'flash-text' }]).id, 'flash-text');
});
test('history persists Unicode, excludes credentials, validates audio paths and recovers interrupted work', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sotto-test-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const secure = { isEncryptionAvailable: () => true, encryptString: s => Buffer.from(s.split('').reverse().join('')), decryptString: b => b.toString().split('').reverse().join('') };
  const store = new Store(directory, secure);
  store.setSecret('connection', { apiKey: 'test-api-key-only' });
  assert.equal(store.secret('connection').apiKey, 'test-api-key-only');
  assert.ok(!JSON.stringify(store.snapshot()).includes('test-api-key-only'));
  store.addHistory({ id: '1', transcript: 'বাংলায় লিখো', text: 'বাংলায় লেখা।', status: 'processing' });
  assert.throws(() => store.audioPath('../../escape.wav'), /Invalid recording/);
  const reopened = new Store(directory, secure);
  assert.equal(reopened.history[0].text, 'বাংলায় লেখা।'); assert.equal(reopened.history[0].status, 'failed');
  assert.match(reopened.history[0].error, /closed before/);
  reopened.deleteHistory('1'); assert.equal(reopened.history.length, 0);
});
test('corrupt history is preserved rather than replaced with an empty archive', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sotto-corrupt-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'history.json'), 'damaged');
  assert.throws(() => new Store(directory, {}), /preserved/);
  assert.equal(fs.readFileSync(path.join(directory, 'history.json'), 'utf8'), 'damaged');
});
test('native insert gets a fresh request ID even when its captured target contains an old ID', async () => {
  const desktop = new Desktop(); desktop.ready = true;
  desktop.child = { stdin: { write(line) { const command = JSON.parse(line); assert.equal(command.id, 1); assert.equal(command.command, 'insert'); setImmediate(() => { desktop.pending.get(command.id)?.({ id: command.id, ok: true }); desktop.pending.delete(command.id); }); } } };
  const result = await desktop.insert({ id: 99, window: 123, focus: 456 }, 'বাংলা');
  assert.equal(result.ok, true);
});
