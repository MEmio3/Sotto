const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { generate, models, geminiText, request } = require('../electron/providers.cjs');
const { DEFAULT_SETTINGS } = require('../electron/core.cjs');
const sample = { transcript: 'আমি এখন খাব না।', text: 'I will not eat now.', language: 'English', noSpeech: false, uncertain: [] };

test('compatible audio pipeline transcribes, preserves original, polishes and scopes auth', async t => {
  const seen = [];
  const server = http.createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk.toString(); seen.push({ path: req.url, authorization: req.headers.authorization, body });
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/v1/models') res.end(JSON.stringify({ data: [{ id: 'fast-test' }] }));
    else if (req.url === '/v1/audio/transcriptions') res.end(JSON.stringify({ text: sample.transcript }));
    else if (req.url === '/v1/chat/completions') res.end(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ ...sample, transcript: 'A provider must not replace the actual ASR transcript.' }) } }] }));
    else res.writeHead(404).end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); t.after(() => new Promise(resolve => server.close(resolve)));
  const connection = { type: 'compatible', baseUrl: `http://127.0.0.1:${server.address().port}/v1`, model: 'fast-test', transcriptionModel: 'whisper-test' };
  const list = await models(connection, { apiKey: 'unit-key' }); assert.equal(list[0].id, 'fast-test');
  const stages = []; let original;
  const result = await generate({ connection, secret: { apiKey: 'unit-key' }, settings: DEFAULT_SETTINGS, bytes: Buffer.from('test wave bytes'), onStage: stage => stages.push(stage), onTranscript: text => original = text });
  assert.equal(result.transcript, sample.transcript); assert.equal(original, sample.transcript); assert.equal(result.text, sample.text);
  assert.deepEqual(stages, ['transcribing', 'polishing']);
  assert.ok(seen.every(req => req.authorization === 'Bearer unit-key'));
  assert.match(seen[1].body, /whisper-test/); assert.match(seen[2].body, /DICTATION DATA/);
});
test('Gemini uses inline audio, schema, explicit language; rejects partial generations', async t => {
  let received;
  const server = http.createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    received = { url: req.url, key: req.headers['x-goog-api-key'], body: JSON.parse(body) };
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(sample) }] } }] }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); t.after(() => new Promise(resolve => server.close(resolve)));
  const result = await generate({ connection: { type: 'gemini', baseUrl: `http://127.0.0.1:${server.address().port}/v1beta`, model: 'gemini-flash-test' }, secret: { apiKey: 'unit-key' }, settings: DEFAULT_SETTINGS, override: 'Bangla', bytes: Buffer.from('audio'), onStage: () => {} });
  assert.equal(result.text, sample.text); assert.equal(received.key, 'unit-key');
  assert.equal(received.body.contents[0].parts[0].inlineData.mimeType, 'audio/wav');
  assert.match(received.body.systemInstruction.parts[0].text, /explicitly selected Bangla/);
  assert.equal(received.body.generationConfig.responseMimeType, 'application/json');
  assert.throws(() => geminiText({ candidates: [{ finishReason: 'MAX_TOKENS' }] }), /did not finish/);
  assert.equal(geminiText({ candidates: [{ content: { parts: [{ thought: true, text: 'private reasoning' }, { text: 'final only' }] } }] }), 'final only');
});
test('HTTP errors never echo upstream bodies and cancellation stops requests', async t => {
  const server = http.createServer((req, res) => { if (req.url === '/slow') return; res.writeHead(429).end('echoed sensitive-key should never surface'); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  await assert.rejects(request(base), error => error.status === 429 && !error.message.includes('sensitive-key'));
  const abort = new AbortController(); const promise = request(base + '/slow', {}, abort.signal); abort.abort();
  await assert.rejects(promise, error => error.name === 'AbortError');
});
