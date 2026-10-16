const test = require('node:test');
const assert = require('node:assert/strict');
const { GoogleAccount, projectId, extractProject, googleHeaders } = require('../electron/google.cjs');
const session = project => ({ accessToken: 'synthetic-session-token', expiresAt: Date.now() + 3600000, projectId: project });
const json = value => new Response(JSON.stringify(value));

test('Google project extraction accepts only scalar IDs and never promotes an empty object', () => {
  assert.equal(extractProject({ cloudaicompanionProject: ' example-project ' }), 'example-project');
  assert.equal(extractProject({ response: { cloudaicompanionProject: { id: 'example-project' } } }), 'example-project');
  for (const value of [{}, [], 12, { id: {} }, { id: [] }, '[object Object]', '', null]) assert.equal(projectId(value), '');
  assert.equal(extractProject({ response: { cloudaicompanionProject: {} } }), '');
});

test('Google requests use the client protocol expected by account and model endpoints', () => {
  const account = googleHeaders('loadCodeAssist', 'synthetic-token');
  assert.match(account['User-Agent'], /^antigravity\/2\.5\.5 .*google-api-nodejs-client/);
  assert.ok(account['X-Goog-Api-Client']);
  const catalog = googleHeaders('fetchAvailableModels', 'synthetic-token');
  assert.match(catalog['User-Agent'], /^antigravity\/ide\/2\.5\.5 /);
  assert.equal(catalog.Authorization, 'Bearer synthetic-token');
});

test('a malformed saved project heals through discovery and new account models remain selectable', async () => {
  const calls = [], saves = [];
  const google = new GoogleAccount({ setSecret: (_id, secret) => saves.push({ ...secret }) }, () => {}, { request: async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    if (url.endsWith(':loadCodeAssist')) return json({ cloudaicompanionProject: 'recovered-project' });
    assert.equal(JSON.parse(init.body).project, 'recovered-project');
    return json({ models: { 'gemini-future-flash-low': { displayName: 'Future Flash' }, 'gemini-future-flash-image': {}, 'other-model': {} } });
  } });
  const secret = session({});
  const result = await google.models(secret, 'connection-id');
  assert.deepEqual(result, [{ id: 'gemini-future-flash-low', name: 'Future Flash' }]);
  assert.equal(saves[0].projectId, 'recovered-project');
  assert.equal(calls.length, 2);
});

test('settled onboarding without a project is reported clearly and never sent to model discovery', async () => {
  const calls = [], saved = [];
  const google = new GoogleAccount({ setSecret: (_id, secret) => saved.push({ ...secret }) }, () => {}, { request: async (url, init) => {
    const body = JSON.parse(init.body); calls.push({ url, body });
    if (url.endsWith(':loadCodeAssist')) return json({ allowedTiers: [{ id: 'standard-tier', isDefault: true }] });
    assert.ok(url.endsWith(':onboardUser'));
    assert.equal(body.tier_id, 'standard-tier'); assert.equal(body.tierId, undefined);
    return json({ done: true, response: { cloudaicompanionProject: {} } });
  } });
  await assert.rejects(google.models(session({}), 'connection-id'), error => error.code === 'GOOGLE_PROJECT_REQUIRED' && /account setup/.test(error.message));
  assert.equal(calls.length, 3); assert.equal(saved[0].projectId, '');
  assert.ok(calls.every(call => !call.url.endsWith(':fetchAvailableModels')));
});

test('pending onboarding is bounded and distinguished from a missing project', async () => {
  let attempts = 0, waits = 0;
  const google = new GoogleAccount({ setSecret() {} }, () => {}, { pause: async () => { waits++; }, request: async url => {
    if (url.endsWith(':loadCodeAssist')) return json({ allowedTiers: [{ id: 'free-tier', isDefault: true }] });
    attempts++; return json({ done: false });
  } });
  await assert.rejects(google.models(session(''), 'connection-id'), error => error.code === 'GOOGLE_SETUP_PENDING');
  assert.equal(attempts, 3); assert.equal(waits, 2);
});

test('onboarding completion can provide a nested project after an asynchronous operation', async () => {
  let attempts = 0;
  const google = new GoogleAccount({ setSecret() {} }, () => {}, { pause: async () => {}, request: async (url, init) => {
    if (url.endsWith(':loadCodeAssist')) return json({ allowedTiers: [{ id: 'free-tier', isDefault: true }] });
    if (url.endsWith(':onboardUser')) return json(++attempts === 1 ? { done: false } : { done: true, response: { cloudaicompanionProject: { id: 'ready-project' } } });
    assert.equal(JSON.parse(init.body).project, 'ready-project'); return json({ models: { 'gemini-new-flash': {} } });
  } });
  const result = await google.models(session(''), 'connection-id');
  assert.equal(result[0].id, 'gemini-new-flash'); assert.equal(attempts, 2);
});

test('model-discovery rejection identifies the failed step without blaming audio or exposing bodies', async () => {
  const google = new GoogleAccount({ setSecret() {} }, () => {}, { request: async () => { const error = new Error('upstream-sensitive-body'); error.status = 400; throw error; } });
  await assert.rejects(google.models(session('valid-project'), 'connection-id'), error => /model discovery/.test(error.message) && !/audio|sensitive/.test(error.message));
});
