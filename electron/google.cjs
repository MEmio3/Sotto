// Direct OAuth implementation. Protocol references and public installed-client
// configuration: OmniRoute (MIT), see THIRD_PARTY_NOTICES.md.
const http = require('node:http');
const crypto = require('node:crypto');
const { request, geminiText } = require('./providers.cjs');
const client = require('./public-google-client.json');
const BOOTSTRAP = 'https://cloudcode-pa.googleapis.com';
const CONTENT = 'https://daily-cloudcode-pa.googleapis.com';
const metadata = { ideType: 9, platform: 5, pluginType: 2 };

class GoogleAccount {
  constructor(store, openBrowser) { this.store = store; this.openBrowser = openBrowser; this.cancelLogin = null; }
  async login() {
    if (this.cancelLogin) throw new Error('A Google sign-in is already open. Finish it or cancel first.');
    const state = crypto.randomBytes(32).toString('hex');
    const redirect = 'http://127.0.0.1:20128/callback';
    const code = await new Promise((resolve, reject) => {
      let timer;
      const finish = (error, value) => { clearTimeout(timer); this.cancelLogin = null; server.close(); error ? reject(error) : resolve(value); };
      const server = http.createServer((req, res) => {
        const url = new URL(req.url, redirect);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
        if (url.pathname !== '/callback') { res.writeHead(404).end(); return; }
        if (url.searchParams.get('state') !== state) { res.writeHead(400).end('Invalid sign-in state. Return to Sotto and start again.'); return; }
        const authCode = url.searchParams.get('code');
        if (url.searchParams.has('error') || !authCode) { res.end('Sign-in cancelled. You can return to Sotto.'); finish(new Error('Google sign-in was cancelled or denied.')); return; }
        res.end('<html><body style="background:#111;color:#fff;font:18px system-ui;padding:64px"><h1>You can return to Sotto.</h1><p>Sign-in received. Sotto is checking your model access.</p></body></html>');
        finish(null, authCode);
      });
      this.cancelLogin = () => finish(new Error('Google sign-in cancelled.'));
      server.once('error', () => finish(new Error('The local sign-in port (20128) is busy. Close the app using it and try again.')));
      server.listen(20128, '127.0.0.1', () => {
        const params = new URLSearchParams({ client_id: client.clientId, redirect_uri: redirect, response_type: 'code', access_type: 'offline', prompt: 'consent', state, scope: ['cloud-platform', 'userinfo.email', 'userinfo.profile', 'cclog', 'experimentsandconfigs'].map(s => `https://www.googleapis.com/auth/${s}`).join(' ') });
        this.openBrowser(`https://accounts.google.com/o/oauth2/v2/auth?${params}`).catch(() => finish(new Error('Could not open your browser. Set a default browser and retry.')));
      });
      timer = setTimeout(() => finish(new Error('Google sign-in timed out. Try connecting again.')), 180000);
    });
    const response = await request('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', client_id: client.clientId, client_secret: client.clientSecret, code, redirect_uri: redirect }) }, null, 20000);
    const tokens = await response.json();
    if (!tokens.access_token) throw new Error('Google did not return an access token.');
    const secret = { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000, projectId: '' };
    let email = 'Google account';
    try { const info = await request('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', { headers: { Authorization: `Bearer ${secret.accessToken}` } }, null, 10000); email = (await info.json()).email || email; } catch {}
    return { secret, email };
  }
  async token(secret, connectionId) {
    if (secret.accessToken && Date.now() < secret.expiresAt - 60000) return secret.accessToken;
    if (!secret.refreshToken) throw new Error('Your Google session expired. Reconnect in Connections.');
    const response = await request('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', client_id: client.clientId, client_secret: client.clientSecret, refresh_token: secret.refreshToken }) }, null, 20000);
    const data = await response.json();
    if (!data.access_token) throw new Error('Google did not renew your session. Reconnect in Connections.');
    Object.assign(secret, { accessToken: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 });
    if (data.refresh_token) secret.refreshToken = data.refresh_token;
    if (connectionId) this.store.setSecret(connectionId, secret);
    return secret.accessToken;
  }
  async post(base, action, secret, body, signal) {
    const response = await request(`${base}/v1internal:${action}`, { method: 'POST', headers: { Authorization: `Bearer ${secret.accessToken}`, 'Content-Type': 'application/json', 'User-Agent': 'Sotto/0.1.0' }, body: JSON.stringify(body) }, signal, action === 'generateContent' ? 90000 : 20000);
    return response.json();
  }
  async discover(secret) {
    await this.token(secret);
    const extract = data => typeof data.cloudaicompanionProject === 'string' ? data.cloudaicompanionProject : data.cloudaicompanionProject?.id || data.response?.cloudaicompanionProject?.id || data.response?.cloudaicompanionProject || '';
    const data = await this.post(BOOTSTRAP, 'loadCodeAssist', secret, { metadata });
    secret.projectId = extract(data);
    if (!secret.projectId) {
      const tier = data.allowedTiers?.find(t => t.isDefault)?.id || data.allowedTiers?.[0]?.id || 'free-tier';
      const onboard = await this.post(BOOTSTRAP, 'onboardUser', secret, { tierId: tier, metadata });
      secret.projectId = extract(onboard);
      if (!secret.projectId) secret.projectId = extract(await this.post(BOOTSTRAP, 'loadCodeAssist', secret, { metadata }));
    }
    if (!secret.projectId) throw new Error('Signed in, but Google did not provide Antigravity model access. Use an API connection, or finish account onboarding and reconnect.');
    return secret;
  }
  async models(secret) {
    await this.token(secret);
    if (!secret.projectId) await this.discover(secret);
    const data = await this.post(CONTENT, 'fetchAvailableModels', secret, { project: secret.projectId });
    const list = data.models || data.availableModels || {};
    return (Array.isArray(list) ? list.map(m => ({ id: m.id || m.name, name: m.displayName || m.id || m.name })) : Object.entries(list).map(([id, m]) => ({ id, name: m.displayName || id }))).filter(m => m.id && /gemini.*flash/i.test(m.id) && !/image|live|tts/i.test(m.id));
  }
  async generate(connection, secret, parts, instructions, signal) {
    await this.token(secret, connection.id);
    if (!secret.projectId) { await this.discover(secret); this.store.setSecret(connection.id, secret); }
    const data = await this.post(CONTENT, 'generateContent', secret, { project: secret.projectId, model: connection.model, requestId: crypto.randomUUID(), userAgent: 'sotto', request: { systemInstruction: { parts: [{ text: instructions }] }, contents: [{ role: 'user', parts }], generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json' } } }, signal);
    return geminiText(data);
  }
}
module.exports = { GoogleAccount };
