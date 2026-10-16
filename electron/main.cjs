const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage, screen, clipboard, safeStorage, dialog, shell, session } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { Store } = require('./store.cjs');
const { Desktop } = require('./desktop.cjs');
const { GoogleAccount } = require('./google.cjs');
const providers = require('./providers.cjs');
const { DEFAULT_SETTINGS, WRITING_MODES, id, redact, safeBaseUrl, selectFastModel } = require('./core.cjs');

let win, hud, tray, store, desktop, google, quitting = false, target = null, controller = null, lastJob = null;
let state = { stage: 'idle', message: '', override: '', startedAt: 0, result: null, canRetry: false };
let boundHotkey = '', preferredOverride = '', hudHideTimer;
const activeStages = ['starting', 'recording', 'transcribing', 'polishing', 'inserting'];
const recordingStages = ['starting', 'recording'];
if (process.env.SOTTO_TEST_DATA) app.setPath('userData', process.env.SOTTO_TEST_DATA);
if (process.env.SOTTO_SMOKE_TEST === '1') {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('use-fake-device-for-media-stream');
  app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
}
const locked = app.requestSingleInstanceLock();
if (!locked) app.quit();
app.on('second-instance', () => show());

function snapshot() { return { ...store.snapshot(), state, writingModes: Object.entries(WRITING_MODES).map(([id, mode]) => ({ id, label: mode.label, description: mode.description })), version: app.getVersion(), desktopReady: desktop.ready, platform: process.platform }; }
function send(channel, value) { for (const window of [win, hud]) if (window && !window.isDestroyed()) window.webContents.send(channel, value); }
function update(patch) {
  state = { ...state, ...patch };
  state.effectiveLanguage = state.override || store.config.settings.outputLanguage;
  state.languageKeys = store.config.settings.languageKeys;
  state.spokenLanguage = store.config.settings.spokenLanguage;
  state.hotkey = store.config.settings.hotkey;
  state.writingMode = store.config.settings.writingMode;
  state.writingModeLabel = WRITING_MODES[state.writingMode]?.label || 'Precise';
  send('state', state);
  if (hud && !hud.isDestroyed()) {
    clearTimeout(hudHideTimer);
    if (activeStages.includes(state.stage)) hud.showInactive();
    else if (['done', 'error', 'cancelled'].includes(state.stage)) {
      hud.showInactive(); hudHideTimer = setTimeout(() => { if (!activeStages.includes(state.stage)) hud.hide(); }, state.stage === 'error' ? 7000 : state.stage === 'done' ? 3500 : 1800);
    } else hud.hide();
  }
  if (tray) tray.setToolTip(`Sotto · ${state.stage === 'idle' ? 'Ready when you are' : state.stage}`);
}
function changed() { send('data', snapshot()); }
function show(page) { if (!win) return; if (win.isMinimized()) win.restore(); win.show(); win.focus(); if (page) win.webContents.send('navigate', page); }
function bindHotkey(accelerator) {
  if (accelerator === boundHotkey) return;
  if (!/^(?:(?:CommandOrControl|Control|Ctrl|Alt|Shift|Super)\+)+(?:[A-Z0-9]|Space|F(?:[1-9]|1[0-9]|2[0-4]))$/i.test(accelerator)) throw new Error('Use a shortcut such as Control+P or Control+Shift+Space.');
  const previous = boundHotkey;
  if (!globalShortcut.register(accelerator, () => toggleRecording().catch(e => fail(e)))) throw new Error('That shortcut is already in use. Choose a different combination.');
  if (previous) globalShortcut.unregister(previous);
  boundHotkey = accelerator;
}
function languageKeys(on) {
  for (const key of ['B', 'E']) globalShortcut.unregister(key);
  if (on && store.config.settings.languageKeys) {
    for (const [key, language] of [['B', 'Bangla'], ['E', 'English']]) {
      if (!globalShortcut.register(key, () => update({ override: language }))) send('notice', `${key} could not be registered. Select the output language in Sotto instead.`);
    }
  }
}
function fail(error) {
  languageKeys(false);
  const message = error?.name === 'TimeoutError' ? 'The provider took too long. Your recording is available to retry.' : error?.name === 'AbortError' ? 'Dictation cancelled.' : redact(error.message);
  update({ stage: 'error', message, canRetry: false });
}
async function toggleRecording() {
  if (state.stage === 'recording') { languageKeys(false); update({ stage: 'transcribing', message: '' }); win.webContents.send('recording:stop'); return; }
  if (activeStages.includes(state.stage)) return;
  const connection = store.config.connections.find(c => c.id === store.config.activeId);
  if (!connection || !connection.model) { show('connections'); send('notice', 'Add a connection and select a model before recording.'); return; }
  if (!store.secret(connection.id).apiKey && connection.type !== 'antigravity' && !connection.allowNoKey) { show('connections'); send('notice', 'Add your API key to this connection.'); return; }
  lastJob = null;
  update({ stage: 'starting', message: '', override: preferredOverride, result: null, startedAt: Date.now(), canRetry: false });
  target = await desktop.capture();
  const handle = win.getNativeWindowHandle();
  const ownWindow = handle.length >= 8 ? Number(handle.readBigUInt64LE()) : handle.readUInt32LE();
  if (target.pid === process.pid || target.window === ownWindow || !target.window) target = null;
  if (state.stage !== 'starting') return;
  languageKeys(true);
  win.webContents.send('recording:begin', { settings: store.config.settings });
}
function cancel() {
  if (state.stage === 'inserting') { send('notice', 'The paste is finishing. Check the destination before starting another recording.'); return; }
  if (!activeStages.includes(state.stage) && !google.cancelLogin) return;
  google.cancelLogin?.(); languageKeys(false); controller?.abort();
  win.webContents.send('recording:cancel'); target = null;
  update({ stage: 'cancelled', message: 'Recording cancelled. Nothing was inserted.' });
}
async function processJob(job, existingId = null) {
  controller = new AbortController();
  const signal = controller.signal;
  const selected = store.config.connections.find(c => c.id === store.config.activeId);
  const connection = selected ? { ...selected } : null;
  if (!connection) throw new Error('Choose a connection first.');
  const secret = store.secret(connection.id), settings = { ...store.config.settings };
  const requestId = existingId || id();
  const filename = job.bytes ? store.saveAudio(requestId, job.bytes) : null;
  const record = { id: requestId, createdAt: (existingId && store.history.find(e => e.id === existingId)?.createdAt) || new Date().toISOString(), duration: job.duration || 0, connection: connection.name, model: connection.model, writingMode: settings.writingMode, status: 'processing', text: '', transcript: job.text || '', language: job.override || settings.outputLanguage, uncertain: [], audio: filename, error: '' };
  if (existingId) store.updateHistory(existingId, record); else if (settings.saveHistory) store.addHistory(record);
  lastJob = job;
  changed(); update({ stage: 'transcribing', message: '', result: null, canRetry: false });
  const began = Date.now();
  try {
    const result = await providers.generate({ connection, secret, settings, override: job.override, bytes: job.bytes, filename: filename ? store.audioPath(filename) : null, text: job.text, signal, onStage: stage => { if (!signal.aborted) update({ stage }); }, onTranscript: transcript => { record.transcript = transcript; if (existingId || settings.saveHistory) store.updateHistory(requestId, { transcript }); }, google });
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    let insertion = 'copy', insertionMessage = 'Your text is ready to copy.';
    if (settings.autoPaste && job.target && !result.uncertain.length) {
      update({ stage: 'inserting' });
      const response = await desktop.insert(job.target, result.text);
      insertion = response.ok ? 'inserted' : 'copy';
      insertionMessage = response.ok ? 'Inserted at your cursor.' : response.error;
    } else if (result.uncertain.length) insertionMessage = 'Some speech was unclear. Review your text before copying.';
    const entry = { ...record, ...result, status: 'success', elapsed: Date.now() - began, insertion, error: '' };
    if (!settings.keepAudio && filename) { store.deleteAudio(filename); entry.audio = null; }
    if (existingId || settings.saveHistory) store.updateHistory(requestId, entry);
    changed(); update({ stage: 'done', message: insertionMessage, result: { ...entry, audio: undefined } });
  } catch (e) {
    const message = signal.aborted ? 'Dictation cancelled. Your recording is available to retry.' : redact(e.message, [secret.apiKey, secret.accessToken, secret.refreshToken]);
    if (existingId || settings.saveHistory) store.updateHistory(requestId, { status: signal.aborted ? 'cancelled' : 'failed', error: message });
    changed(); update({ stage: signal.aborted ? 'cancelled' : 'error', message, canRetry: true });
  } finally { if (!settings.saveHistory && filename) store.deleteAudio(filename); controller = null; target = null; }
}
function handle(channel, callback) {
  ipcMain.handle(channel, async (event, ...args) => {
    if (![win?.webContents, hud?.webContents].includes(event.sender)) return { ok: false, error: 'Untrusted window.' };
    try { return { ok: true, value: await callback(...args) }; }
    catch (e) { return { ok: false, error: redact(e.message) }; }
  });
}
function installHandlers() {
  handle('snapshot', snapshot);
  handle('window', action => { if (action === 'minimize') win.minimize(); else if (action === 'maximize') win.isMaximized() ? win.unmaximize() : win.maximize(); else if (action === 'close') win.hide(); else if (action === 'show') show(); });
  handle('hud:hide', () => { clearTimeout(hudHideTimer); hud.hide(); });
  handle('recording:toggle', toggleRecording);
  handle('recording:cancel', cancel);
  handle('recording:ready', () => { if (state.stage === 'starting') update({ stage: 'recording', startedAt: Date.now() }); });
  handle('recording:error', message => { fail(new Error(String(message).slice(0, 500))); });
  handle('recording:level', level => { send('level', Math.max(0, Math.min(1, Number(level) || 0))); });
  handle('language', language => { if (!['', 'English', 'Bangla', 'Arabic', 'Hindi', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Korean', 'Portuguese', 'Urdu', 'Same as speech'].includes(language)) throw new Error('Choose a supported output setting. Spoken instructions can select other languages.'); if (!activeStages.includes(state.stage)) preferredOverride = language; update({ override: language }); });
  handle('mode', mode => {
    if (activeStages.includes(state.stage)) throw new Error('Finish or cancel the current dictation before changing writing modes.');
    if (typeof mode !== 'string' || !Object.hasOwn(WRITING_MODES, mode)) throw new Error('Choose one of the five writing modes.');
    store.config.settings.writingMode = mode; store.save(); changed(); update({});
  });
  handle('recording:audio', async payload => {
    languageKeys(false);
    if (!recordingStages.includes(state.stage) && state.stage !== 'transcribing') return;
    const bytes = Buffer.from(payload.bytes);
    if (bytes.length < 45 || bytes.length > 16000000 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE') throw new Error('The recording was empty or too large. Try again.');
    return processJob({ bytes, duration: Math.max(0, Math.min(180, Number(payload.duration) || 0)), override: state.override, target });
  });
  handle('text:process', async text => {
    if (activeStages.includes(state.stage)) throw new Error('Finish or cancel the current dictation first.');
    if (typeof text !== 'string' || !text.trim() || text.length > 60000) throw new Error('Enter up to 60,000 characters to polish.');
    return processJob({ text: text.trim(), override: state.override, target: null });
  });
  handle('retry', async entryId => {
    if (activeStages.includes(state.stage)) throw new Error('Finish or cancel the current dictation first.');
    if (!entryId) { if (!lastJob || !state.canRetry) throw new Error('No current dictation is available to retry. Start a new recording.'); return processJob({ ...lastJob, target: null }); }
    const entry = store.history.find(e => e.id === entryId);
    if (!entry) throw new Error('That history entry no longer exists.');
    const job = entry.audio ? { bytes: fs.readFileSync(store.audioPath(entry.audio)), duration: entry.duration } : entry.transcript ? { text: entry.transcript } : null;
    if (!job) throw new Error('No recording or transcript is available for this entry.');
    return processJob({ ...job, override: state.override, target: null }, entryId);
  });
  handle('settings:save', settings => {
    if (activeStages.includes(state.stage)) throw new Error('Finish or cancel your dictation before changing settings.');
    const next = { ...store.config.settings };
    for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
      if (key in settings && typeof settings[key] === typeof defaultValue) next[key] = typeof defaultValue === 'string' ? settings[key].slice(0, key === 'extraInstructions' ? 3000 : 500) : settings[key];
    }
    if (!['conservative', 'literal'].includes(next.cleanup) || !['provider', 'local'].includes(next.transcription)) throw new Error('Invalid processing setting.');
    if (!Object.hasOwn(WRITING_MODES, next.writingMode)) throw new Error('Choose one of the five writing modes.');
    bindHotkey(next.hotkey); store.config.settings = next; store.save(); changed(); return snapshot();
  });
  handle('connection:save', data => {
    if (activeStages.includes(state.stage)) throw new Error('Finish the current dictation before changing connections.');
    if (!data || !['gemini', 'compatible'].includes(data.type)) throw new Error('Choose an API provider type.');
    const existing = store.config.connections.find(c => c.id === data.id);
    const normalizedBase = safeBaseUrl(data.baseUrl || (data.type === 'gemini' ? 'https://generativelanguage.googleapis.com/v1beta' : ''));
    if (existing && (existing.baseUrl !== normalizedBase || existing.type !== data.type) && !data.apiKey?.trim() && !data.allowNoKey) throw new Error('Enter an API key again when changing the provider URL or type.');
    const connectionId = existing?.id || id();
    const connection = { id: connectionId, type: data.type, name: String(data.name || (data.type === 'gemini' ? 'Gemini API' : 'Compatible API')).slice(0, 70), baseUrl: safeBaseUrl(data.baseUrl || (data.type === 'gemini' ? 'https://generativelanguage.googleapis.com/v1beta' : '')), model: String(data.model || '').trim().slice(0, 150), transcriptionModel: String(data.transcriptionModel || 'whisper-1').trim().slice(0, 150), allowNoKey: !!data.allowNoKey, verifiedAt: null };
    if (data.apiKey?.trim()) store.setSecret(connectionId, { apiKey: data.apiKey.trim() });
    else if (!existing && !connection.allowNoKey) throw new Error('Enter your API key.');
    if (existing) Object.assign(existing, connection); else store.config.connections.push(connection);
    if (!store.config.activeId) store.config.activeId = connectionId;
    store.save(); changed(); return connection;
  });
  handle('connection:select', connectionId => { if (activeStages.includes(state.stage)) throw new Error('Finish the current dictation first.'); if (!store.config.connections.some(c => c.id === connectionId)) throw new Error('Connection not found.'); store.config.activeId = connectionId; store.save(); changed(); });
  handle('connection:delete', connectionId => {
    if (activeStages.includes(state.stage)) throw new Error('Finish the current dictation first.');
    store.deleteSecret(connectionId); store.config.connections = store.config.connections.filter(c => c.id !== connectionId);
    if (store.config.activeId === connectionId) store.config.activeId = store.config.connections[0]?.id || null;
    store.save(); changed();
  });
  handle('connection:models', async connectionId => {
    if (activeStages.includes(state.stage)) throw new Error('Finish the current dictation before checking models.');
    const c = store.config.connections.find(c => c.id === connectionId); if (!c) throw new Error('Save the connection first.');
    const secret = store.secret(c.id);
    try {
      const choices = await providers.models(c, secret, google);
      if (c.type === 'antigravity') { c.projectRequired = false; c.setupError = ''; store.save(); changed(); }
      return choices;
    } catch (error) {
      if (c.type === 'antigravity') {
        c.projectRequired = error.code === 'GOOGLE_PROJECT_REQUIRED'; c.setupError = redact(error.message, [secret.accessToken, secret.refreshToken]);
        c.verifiedAt = null; store.save(); changed();
      }
      throw error;
    }
  });
  handle('connection:model', ({ connectionId, model }) => {
    if (activeStages.includes(state.stage)) throw new Error('Finish the current dictation before changing models.');
    const c = store.config.connections.find(c => c.id === connectionId); if (!c) throw new Error('Connection not found.');
    c.model = String(model).slice(0, 150); c.verifiedAt = null; store.save(); changed();
  });
  handle('connection:test', async connectionId => {
    if (activeStages.includes(state.stage)) throw new Error('Finish the current dictation before testing a connection.');
    const c = store.config.connections.find(c => c.id === connectionId);
    if (!c?.model) throw new Error('Select a model before testing.');
    c.verifiedAt = null; store.save(); changed();
    const start = Date.now();
    await providers.generate({ connection: c, secret: store.secret(c.id), settings: store.config.settings, text: 'Please send the revised drawings tomorrow.', onStage: () => {}, google });
    c.verifiedAt = new Date().toISOString(); c.latency = Date.now() - start; store.save(); changed(); return { latency: c.latency };
  });
  handle('google:connect', async () => {
    const { secret, email } = await google.login();
    const c = { id: id(), type: 'antigravity', name: email, model: '', verifiedAt: null, experimental: true };
    store.setSecret(c.id, secret); store.config.connections.push(c); store.save(); changed();
    try {
      await google.discover(secret); store.setSecret(c.id, secret);
      const choices = await google.models(secret, c.id); c.model = selectFastModel(choices)?.id || '';
      if (!store.config.activeId && c.model) store.config.activeId = c.id;
      store.save(); changed();
      return { connection: c, models: choices, warning: c.model ? 'Signed in. Test the connection to verify model access. Audio support is not yet verified.' : 'Signed in, but no Flash models were returned. Add an API connection to continue.' };
    } catch (e) {
      c.projectRequired = e.code === 'GOOGLE_PROJECT_REQUIRED'; c.setupError = redact(e.message, [secret.accessToken, secret.refreshToken]);
      store.setSecret(c.id, secret); store.save(); changed();
      return { connection: c, warning: c.setupError };
    }
  });
  handle('google:cancel', () => google.cancelLogin?.());
  handle('history:delete', entryId => { if (store.history.find(e => e.id === entryId)?.status === 'processing') throw new Error('Finish or cancel this dictation before deleting it.'); store.deleteHistory(entryId); changed(); });
  handle('history:audio', entryId => { const entry = store.history.find(e => e.id === entryId); if (!entry?.audio) throw new Error('This recording was not kept.'); return fs.readFileSync(store.audioPath(entry.audio)); });
  handle('history:export', async () => {
    const result = await dialog.showSaveDialog(win, { title: 'Export dictation history', defaultPath: 'Sotto-history.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (!result.canceled && result.filePath) { fs.writeFileSync(result.filePath, JSON.stringify(store.history.map(({ audio, ...entry }) => entry), null, 2)); return true; } return false;
  });
  handle('copy', text => { if (typeof text !== 'string' || text.length > 300000) throw new Error('Invalid text.'); clipboard.writeText(text); });
  handle('file:choose', async kind => {
    const result = await dialog.showOpenDialog(win, { title: kind === 'executable' ? 'Choose whisper.cpp executable' : 'Choose Whisper model', properties: ['openFile'], filters: kind === 'executable' ? [{ name: 'Executable', extensions: ['exe'] }] : [{ name: 'Whisper model', extensions: ['bin'] }] });
    return result.canceled ? '' : result.filePaths[0];
  });
  handle('link', name => { const links = { gemini: 'https://aistudio.google.com/apikey', whisper: 'https://github.com/ggml-org/whisper.cpp', antigravity: 'https://antigravity.google/' }; if (links[name]) return shell.openExternal(links[name]); });
}
function createWindows() {
  win = new BrowserWindow({ width: 1240, height: 850, minWidth: 900, minHeight: 670, frame: false, show: false, backgroundColor: '#f8f8f6', title: 'Sotto', icon: path.join(__dirname, '../src/assets/icon.png'), webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, spellcheck: false } });
  win.loadFile(path.join(__dirname, '../src/index.html'));
  win.once('ready-to-show', () => { if (!store.config.settings.startHidden || !store.config.connections.length) win.show(); });
  win.on('close', event => { if (!quitting) { event.preventDefault(); win.hide(); } });
  const work = screen.getPrimaryDisplay().workArea;
  hud = new BrowserWindow({ width: 438, height: 104, x: Math.round(work.x + (work.width - 438) / 2), y: work.y + work.height - 132, frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true, focusable: false, resizable: false, show: false, webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  hud.loadFile(path.join(__dirname, '../src/hud.html'));
  for (const window of [win, hud]) {
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', event => event.preventDefault());
  }
}
if (locked) app.whenReady().then(() => {
  try {
    store = new Store(app.getPath('userData'), safeStorage);
    desktop = new Desktop(); desktop.start(); google = new GoogleAccount(store, url => shell.openExternal(url));
    session.defaultSession.setPermissionRequestHandler((contents, permission, callback) => callback(contents === win?.webContents && permission === 'media'));
    session.defaultSession.setPermissionCheckHandler((contents, permission) => contents === win?.webContents && permission === 'media');
    installHandlers(); createWindows();
    tray = new Tray(nativeImage.createFromPath(path.join(__dirname, '../src/assets/tray.png')));
    tray.setContextMenu(Menu.buildFromTemplate([{ label: 'Open Sotto', click: () => show() }, { label: 'Start / stop dictation', click: () => toggleRecording().catch(fail) }, { label: 'Cancel dictation', click: cancel }, { type: 'separator' }, { label: 'Quit Sotto', click: () => { quitting = true; app.quit(); } }]));
    tray.on('double-click', () => show()); tray.setToolTip('Sotto · Ready when you are');
    try { bindHotkey(store.config.settings.hotkey); } catch (e) { win.webContents.once('did-finish-load', () => send('notice', e.message)); }
    if (process.env.SOTTO_SMOKE_TEST === '1') win.webContents.once('did-finish-load', () => require('./smoke.cjs').run({ win, hud, store, desktop, google, app, globalShortcut, clipboard, directory: process.env.SOTTO_TEST_DATA }));
  } catch (e) { dialog.showErrorBox('Sotto could not start', redact(e.message)); quitting = true; app.quit(); }
});
app.on('before-quit', () => { quitting = true; controller?.abort(); google?.cancelLogin?.(); globalShortcut.unregisterAll(); desktop?.close(); });
app.on('window-all-closed', () => { if (quitting) app.quit(); });
