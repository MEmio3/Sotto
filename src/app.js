const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const paths = {
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',
  history: '<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7m2-4v5l3 2"/>',
  plug: '<path d="M9 3v5m6-5v5M7 8h10v4a5 5 0 0 1-10 0V8Zm5 9v5"/>',
  settings: '<path d="m9 3-.6 2.1-2 .9-2.1-.5-1.5 2.6L4.4 10v2l-1.6 1.9 1.5 2.6 2.1-.5 2 .9L9 19h3l.6-2.1 2-.9 2.1.5 1.5-2.6-1.6-1.9v-2l1.6-1.9-1.5-2.6-2.1.5-2-.9L12 3H9Z"/><circle cx="10.5" cy="11" r="3"/>',
  circle: '<circle cx="12" cy="8" r="3"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/>',
  arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>', square: '<rect x="5" y="5" width="14" height="14" rx="1"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>', spark: '<path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z"/>',
  type: '<path d="M4 5V3h16v2M12 3v18m-4 0h8"/>', chevron: '<path d="m6 9 6 6 6-6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>', search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  external: '<path d="M14 3h7v7m0-7L10 14m-1-9H4v15h15v-5"/>', refresh: '<path d="M20 10a8 8 0 0 0-14-5L3 8m0-6v6h6m-5 6a8 8 0 0 0 14 5l3-3m0 6v-6h-6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
  keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.1M10 9h.1M14 9h.1M18 9h.1M6 12h.1M10 12h.1M14 12h.1M18 12h.1M7 16h10"/>',
  audio: '<path d="M4 10v4m4-8v12m4-16v20m4-16v12m4-8v4"/>', check: '<path d="m5 12 4 4L19 6"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V3H3v12h5"/>',
  edit: '<path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z"/>', trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
};
function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.circle}</svg>`; }
function mountIcons(root = document) { root.querySelectorAll('[data-icon]').forEach(node => node.innerHTML = icon(node.dataset.icon)); }

let data = { settings: { hotkey: 'Control+P', outputLanguage: 'English', languageKeys: true, spokenLanguage: true, saveHistory: true, autoPaste: true, cleanup: 'conservative', transcription: 'provider' }, connections: [], history: [], activeId: null, state: { stage: 'idle', override: '', message: '' } };
let currentPage = 'dictation', latestTab = 'text', historyTab = 'text', selectedHistory = '', toastTimer, playbackUrl = '';
const connectionBusy = new Set();
const bridge = window.sotto;
async function call(channel, ...args) {
  if (!bridge) throw new Error('This is the interface preview. Open Sotto for microphone, connections and desktop features.');
  const result = await bridge.call(channel, ...args);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}
function toast(message) { $('toast').textContent = message; $('toast').classList.remove('hidden'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.add('hidden'), 5000); }
function action(fn) { return async event => { try { await fn(event); } catch (e) { toast(e.message); } }; }
async function busy(button, text, fn) {
  if (button.disabled) return;
  const old = button.innerHTML; button.disabled = true; button.textContent = text;
  try { return await fn(); } finally { button.disabled = false; button.innerHTML = old; }
}
function time(seconds) { const n = Math.max(0, Math.floor(seconds || 0)); return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`; }
function date(value) { return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
function hotkeyText(value) { return value.replace('Control', 'Ctrl').replaceAll('+', ' + '); }
function active() { return ['starting', 'recording', 'transcribing', 'polishing', 'inserting'].includes(data.state.stage); }
function navigate(page) {
  if (!['dictation', 'history', 'connections', 'settings'].includes(page)) return;
  currentPage = page;
  document.querySelectorAll('.page').forEach(node => node.classList.toggle('hidden', node.id !== `page-${page}`));
  document.querySelectorAll('[data-page]').forEach(node => { node.classList.toggle('active', node.dataset.page === page); node.setAttribute('aria-current', node.dataset.page === page ? 'page' : 'false'); });
  $('main').scrollTop = 0;
  if (page === 'settings') fillSettings();
  if (page === 'history') renderHistory();
  if (page === 'connections') renderConnections();
}
document.addEventListener('click', action(async event => {
  const nav = event.target.closest('[data-page],[data-go]'); if (nav) navigate(nav.dataset.page || nav.dataset.go);
  const windowAction = event.target.closest('[data-window]'); if (windowAction) await call('window', windowAction.dataset.window);
}));
$('account-button').onclick = () => navigate('connections');
document.querySelector('.wordmark').onclick = event => { event.preventDefault(); navigate('dictation'); };
const bars = Array.from({ length: 49 }, (_, i) => { const node = document.createElement('i'); $('waveform').append(node); node.style.setProperty('--height', (.3 + Math.pow(Math.sin(i * 1.37), 2) * (1 - Math.abs(i - 24) / 30) * 3.4).toFixed(2)); return node; });
let meterTick = 0;
function setLevel(level) {
  meterTick += 1;
  for (let i = 0; i < bars.length; i++) {
    const envelope = Math.max(.15, 1 - Math.abs(i - 24) / 27);
    const height = .35 + level * 10 * envelope * (.4 + .6 * Math.abs(Math.sin(i * .89 + meterTick * .43)));
    bars[i].style.setProperty('--height', Math.min(7.5, height).toFixed(2));
  }
}
function renderState() {
  const state = data.state, stage = state.stage, connection = data.connections.find(c => c.id === data.activeId);
  const labels = { idle: 'READY WHEN YOU ARE', starting: 'OPENING MICROPHONE', recording: 'LISTENING', transcribing: 'TRANSCRIBING', polishing: 'FINDING THE RIGHT WORDS', inserting: 'INSERTING YOUR WORDS', done: 'THOUGHTFULLY PUT', error: 'LET’S TRY THAT AGAIN', cancelled: 'CANCELLED' };
  const titles = { idle: 'A thought, out loud.', starting: 'One quiet moment.', recording: 'Go on. I’m listening.', transcribing: 'Hearing every word.', polishing: 'A little more polished.', inserting: 'Right where you need it.', done: 'Your words, well put.', error: 'Your thought isn’t lost.', cancelled: 'Whenever you’re ready.' };
  const descriptions = { idle: 'From your voice to wherever you’re writing.', starting: 'Waiting for your microphone to be ready.', recording: `Writing in ${state.override || data.settings.outputLanguage || 'English'}${data.settings.spokenLanguage && !state.override ? ' · or say another language' : ''}.`, transcribing: 'Turning your recording into a faithful transcript.', polishing: 'Keeping your meaning. Smoothing the edges.', inserting: 'Checking the original destination before pasting.', done: state.result?.language ? `Finished in ${state.result.language}.` : 'Ready for your next thought.', error: 'Check the message below, then try again.', cancelled: 'Nothing was inserted into your other app.' };
  $('recording-label').innerHTML = `<span class="status-dot"></span>${labels[stage] || labels.idle}`;
  $('instrument-title').textContent = stage === 'error' && !state.canRetry ? 'Let’s check the microphone.' : titles[stage] || titles.idle;
  $('instrument-description').textContent = descriptions[stage] || descriptions.idle;
  $('instrument').classList.toggle('recording', stage === 'recording');
  $('instrument').classList.toggle('processing', ['starting', 'transcribing', 'polishing', 'inserting'].includes(stage));
  $('record-button').disabled = active() && stage !== 'recording';
  $('record-button-label').textContent = stage === 'recording' ? 'Finish dictation' : active() ? 'Working on it…' : connection ? 'Start dictation' : 'Connect a provider';
  $('record-button').querySelector('[data-icon]').innerHTML = icon(stage === 'recording' ? 'stop' : connection ? 'mic' : 'plus');
  $('cancel-button').classList.toggle('hidden', !active());
  $('language-hints').classList.toggle('hidden', !data.settings.languageKeys);
  $('output-language').disabled = active() && stage !== 'recording';
  $('output-language').value = state.override || '';
  $('output-language').options[0].textContent = `${data.settings.outputLanguage || 'English'} · default`;
  $('smart-language-label').innerHTML = `${icon('spark')}Spoken language cues ${data.settings.spokenLanguage ? 'on' : 'off'}`;
  $('operation-message').classList.toggle('hidden', !state.message);
  $('operation-message').classList.toggle('error', stage === 'error');
  $('operation-message').replaceChildren();
  if (state.message) { const span = document.createElement('span'); span.textContent = state.message; $('operation-message').append(span); if (stage === 'error') { const button = document.createElement('button'); button.className = 'text-button'; button.textContent = state.canRetry ? 'Retry this dictation' : 'Try recording again'; button.onclick = action(() => call(state.canRetry ? 'retry' : 'recording:toggle')); $('operation-message').append(button); } }
  $('footer-status').textContent = active() ? (labels[stage] || '') : state.message || 'Ready when you are.';
  $('record-key').textContent = hotkeyText(data.settings.hotkey);
  $('sidebar-hotkey').innerHTML = data.settings.hotkey.split('+').map(part => `<kbd>${esc(part === 'Control' ? 'Ctrl' : part)}</kbd>`).join('<span>+</span>');
  $('connection-status').innerHTML = `<span class="status-dot"></span>${connection ? connection.verifiedAt ? 'Connected · text verified' : 'Connection saved · untested' : 'Connect to get started'}`;
  $('quick-connect').classList.toggle('hidden', !!connection);
  $('account-label').textContent = connection?.name || 'Make a connection';
  $('account-subtitle').textContent = connection ? connection.type === 'antigravity' ? 'Google account · experimental' : 'Direct API connection' : 'Bring your preferred AI';
  $('history-count').textContent = data.history.length;
  $('version').textContent = `v${data.version || '0.1.0'}`;
  if (!active()) setLevel(.05);
  renderLatest();
}
function resultMarkup(entry, tab) {
  return `<div class="result-meta"><span class="badge">${esc(entry.language || 'English')}</span><span>${esc(date(entry.createdAt))}</span>${entry.duration ? `<span>${time(entry.duration)} recording</span>` : ''}${entry.elapsed ? `<span>${(entry.elapsed / 1000).toFixed(1)}s processing</span>` : ''}</div>${entry.uncertain?.length ? `<div class="uncertain-note">Review unclear speech: ${esc(entry.uncertain.join(' · '))}</div>` : ''}<div class="result-text" dir="auto">${esc(tab === 'transcript' ? entry.transcript : entry.text)}</div>`;
}
function latest() { return data.state.result || data.history.find(e => e.status === 'success'); }
function renderLatest() {
  const entry = latest();
  if (!entry) { $('latest-content').innerHTML = `<div class="empty-latest"><span class="empty-icon">${icon('type')}</span><div><strong>Your first dictation starts here.</strong><p>${data.connections.length ? 'Start a recording, or polish a thought you’ve already written.' : 'Add your preferred connection. Your words will be waiting here.'}</p></div></div>`; return; }
  $('latest-content').innerHTML = `${resultMarkup(entry, latestTab)}<div class="result-actions"><div class="result-tabs"><button class="result-tab ${latestTab === 'text' ? 'selected' : ''}" data-latest-tab="text">Polished</button><button class="result-tab ${latestTab === 'transcript' ? 'selected' : ''}" data-latest-tab="transcript">Original</button></div><div class="result-actions-right"><button class="text-button" id="retry-latest">${icon('refresh')}Rework</button><button class="button secondary small" id="copy-latest">${icon('copy')}Copy text</button></div></div>`;
  $('latest-content').querySelectorAll('[data-latest-tab]').forEach(button => button.onclick = () => { latestTab = button.dataset.latestTab; renderLatest(); });
  $('copy-latest').onclick = action(async () => { await call('copy', latestTab === 'transcript' ? entry.transcript : entry.text); toast('Copied to your clipboard.'); });
  $('retry-latest').onclick = action(() => call('text:process', entry.transcript));
}
function renderHistory() {
  const query = $('history-search').value.normalize('NFKC').toLocaleLowerCase(), filter = $('history-filter').value;
  const entries = data.history.filter(e => (filter === 'all' || (filter === 'failed' ? ['failed', 'cancelled'].includes(e.status) : e.status === filter)) && `${e.text} ${e.transcript} ${e.language} ${e.connection}`.normalize('NFKC').toLocaleLowerCase().includes(query));
  if (!entries.length) { $('history-body').innerHTML = `<div class="history-empty">${icon('history')}<h2>${data.history.length ? 'No matching thoughts.' : 'Room for your next thought.'}</h2><p>${data.history.length ? 'Try another search or filter.' : 'Your dictations appear here as you use Sotto. Search the original transcript or the finished words.'}</p>${!data.history.length ? '<button class="button primary small" data-go="dictation">Start a dictation</button>' : ''}</div>`; return; }
  if (!entries.some(e => e.id === selectedHistory)) selectedHistory = entries[0].id;
  const entry = entries.find(e => e.id === selectedHistory);
  $('history-body').innerHTML = `<div class="history-list" aria-label="Dictation history">${entries.map(e => `<button class="history-entry ${selectedHistory === e.id ? 'selected' : ''}" data-history="${esc(e.id)}"><strong dir="auto">${esc(e.text || e.transcript || (e.status === 'processing' ? 'Processing recording…' : 'Recording needs a retry'))}</strong><small><span>${esc(date(e.createdAt))}</span><span>·</span><span>${esc(e.status === 'success' ? e.language : e.status)}</span></small></button>`).join('')}</div><article class="history-detail"><h2>${entry.status === 'success' ? 'A thought, saved.' : entry.status === 'processing' ? 'Working on your recording.' : 'Your recording is safe.'}</h2>${entry.status === 'success' ? resultMarkup(entry, historyTab) : `<p class="form-message">${esc(entry.error || 'Your provider is processing this dictation.')}</p>${entry.transcript ? `<div class="result-text" dir="auto">${esc(entry.transcript)}</div>` : ''}`}<div class="result-actions"><div class="result-tabs">${entry.status === 'success' ? `<button class="result-tab ${historyTab === 'text' ? 'selected' : ''}" data-history-tab="text">Polished</button><button class="result-tab ${historyTab === 'transcript' ? 'selected' : ''}" data-history-tab="transcript">Original</button>` : ''}</div>${entry.text ? `<button class="button secondary small" id="copy-history">${icon('copy')}Copy</button>` : ''}</div><div class="detail-footer">${entry.hasAudio ? `<button class="text-button" id="play-history">${icon('play')}Listen</button>` : ''}${entry.hasAudio || entry.transcript ? `<button class="text-button" id="retry-history">${icon('refresh')}Rework</button>` : ''}<button class="text-button delete-entry" id="delete-history">${icon('trash')}Delete</button></div><p class="field-help">${esc(entry.connection || '')}${entry.model ? ` · ${esc(entry.model)}` : ''}</p></article>`;
  $('history-body').querySelectorAll('[data-history]').forEach(button => button.onclick = () => { selectedHistory = button.dataset.history; historyTab = 'text'; renderHistory(); });
  $('history-body').querySelectorAll('[data-history-tab]').forEach(button => button.onclick = () => { historyTab = button.dataset.historyTab; renderHistory(); });
  if ($('copy-history')) $('copy-history').onclick = action(async () => { await call('copy', historyTab === 'transcript' ? entry.transcript : entry.text); toast('Copied to your clipboard.'); });
  if ($('retry-history')) $('retry-history').onclick = action(async () => { navigate('dictation'); await call('retry', entry.id); });
  $('delete-history').onclick = action(async () => { await call('history:delete', entry.id); toast('Dictation and its recording deleted.'); });
  if ($('play-history')) $('play-history').onclick = action(async () => { const bytes = await call('history:audio', entry.id); if (playbackUrl) URL.revokeObjectURL(playbackUrl); playbackUrl = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' })); $('audio-player').src = playbackUrl; await $('audio-player').play(); toast('Playing your saved recording.'); });
}
$('history-search').oninput = renderHistory; $('history-filter').onchange = renderHistory;
$('export-history').onclick = action(async () => { if (await call('history:export')) toast('History exported.'); });

function renderConnections() {
  if (!data.connections.length) $('connection-list').innerHTML = `<div class="connection-placeholder"><span class="provider-icon">${icon('plug')}</span><div><h2>One connection. A lot less typing.</h2><p>Add a Gemini key, use a compatible API, or try connecting your Google account below.</p></div></div>`;
  else $('connection-list').innerHTML = data.connections.map(c => `<article class="connection-row"><span class="provider-icon">${icon(c.type === 'antigravity' ? 'globe' : c.type === 'gemini' ? 'spark' : 'plug')}</span><div class="connection-info"><h2>${esc(c.name)}${c.id === data.activeId ? '<span class="badge">Selected</span>' : ''}</h2><p>${esc(c.model || 'Select a model')}${c.verifiedAt ? ` · Text verified${c.latency ? ` · ${(c.latency / 1000).toFixed(1)}s` : ''}` : ' · Access untested'}${c.experimental ? ' · Experimental' : ''}</p></div><div class="connection-actions"><button class="text-button" data-test="${esc(c.id)}" ${connectionBusy.has(c.id) || !c.model ? 'disabled' : ''}>${icon('check')}${connectionBusy.has(c.id) ? 'Testing…' : 'Test'}</button>${c.id !== data.activeId ? `<button class="button secondary small" data-select="${esc(c.id)}">Use</button>` : ''}<button class="icon-button" data-edit="${esc(c.id)}" aria-label="Edit ${esc(c.name)}">${icon('edit')}</button><button class="icon-button" data-remove="${esc(c.id)}" aria-label="Remove ${esc(c.name)}">${icon('trash')}</button></div></article>`).join('');
  $('connection-list').querySelectorAll('[data-select]').forEach(button => button.onclick = action(() => call('connection:select', button.dataset.select)));
  $('connection-list').querySelectorAll('[data-remove]').forEach(button => button.onclick = action(() => call('connection:delete', button.dataset.remove)));
  $('connection-list').querySelectorAll('[data-edit]').forEach(button => button.onclick = action(async () => {
    const c = data.connections.find(item => item.id === button.dataset.edit);
    if (c.type === 'antigravity') { const list = await busy(button, '…', () => call('connection:models', c.id)); if (!list.length) throw new Error('Google returned no available Flash models.'); const chosen = list.find(m => /flash-lite/i.test(m.id)) || list[0]; await call('connection:model', { connectionId: c.id, model: chosen.id }); toast(`Selected ${chosen.id}. Test to verify access.`); }
    else openApi(c);
  }));
  $('connection-list').querySelectorAll('[data-test]').forEach(button => button.onclick = action(async () => {
    const connectionId = button.dataset.test; connectionBusy.add(connectionId); renderConnections();
    try { const result = await call('connection:test', connectionId); toast(`Text connection verified in ${(result.latency / 1000).toFixed(1)}s. Audio will be checked on your first dictation.`); }
    finally { connectionBusy.delete(connectionId); renderConnections(); }
  }));
}
function apiType(type) {
  $('api-type').value = type;
  document.querySelectorAll('[data-api-type]').forEach(button => button.classList.toggle('selected', button.dataset.apiType === type));
  for (const id of ['transcription-model-field', 'no-key-field', 'compatible-help']) $(id).classList.toggle('hidden', type !== 'compatible');
  $('gemini-key-link').classList.toggle('hidden', type !== 'gemini');
}
function openApi(connection) {
  navigate('connections'); $('api-form').classList.remove('hidden'); $('api-form').reset();
  $('api-id').value = connection?.id || ''; apiType(connection?.type || 'gemini');
  $('api-name').value = connection?.name || 'My Gemini'; $('api-url').value = connection?.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  $('api-model').value = connection?.model || ''; $('api-transcription').value = connection?.transcriptionModel || 'whisper-1';
  $('api-no-key').checked = !!connection?.allowNoKey; $('api-key').value = ''; $('api-key').type = 'password';
  $('api-key').placeholder = connection ? 'Leave blank to keep your saved key' : 'Paste your API key';
  $('api-form-heading').textContent = connection ? 'Edit API connection' : 'Add an API connection';
  $('api-form-message').textContent = ''; $('models-list').replaceChildren(); $('api-name').focus(); $('api-form').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
for (const id of ['add-api', 'quick-connect']) $(id).onclick = () => openApi();
$('close-api-form').onclick = () => { $('api-key').value = ''; $('api-form').classList.add('hidden'); };
document.querySelectorAll('[data-api-type]').forEach(button => button.onclick = () => { apiType(button.dataset.apiType); $('api-url').value = button.dataset.apiType === 'gemini' ? 'https://generativelanguage.googleapis.com/v1beta' : ''; $('api-name').value = button.dataset.apiType === 'gemini' ? 'My Gemini' : 'My API'; $('api-model').value = ''; });
$('toggle-key').onclick = () => { $('api-key').type = $('api-key').type === 'password' ? 'text' : 'password'; $('toggle-key').setAttribute('aria-label', $('api-key').type === 'password' ? 'Show API key' : 'Hide API key'); };
async function saveApi() {
  const connection = await call('connection:save', { id: $('api-id').value, name: $('api-name').value, type: $('api-type').value, baseUrl: $('api-url').value, apiKey: $('api-key').value, model: $('api-model').value, transcriptionModel: $('api-transcription').value, allowNoKey: $('api-no-key').checked });
  $('api-id').value = connection.id; $('api-key').value = ''; $('api-key').placeholder = 'Leave blank to keep your saved key';
  return connection;
}
$('api-form').onsubmit = action(async event => { event.preventDefault(); await busy($('save-api'), 'Saving…', async () => { const c = await saveApi(); $('api-form-message').textContent = c.model ? 'Saved. Test the connection above to verify model access.' : 'Saved. Discover models, choose one, then save again.'; toast('Connection saved securely.'); }); });
$('discover-models').onclick = action(async () => { if (!$('api-form').reportValidity()) return; await busy($('discover-models'), 'Finding models…', async () => {
  const connection = await saveApi(); const list = await call('connection:models', connection.id);
  $('models-list').innerHTML = list.map(m => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('');
  const recommended = list.find(m => /flash-lite/i.test(m.id)) || list.find(m => /flash/i.test(m.id)) || list[0];
  if (!$('api-model').value && recommended) { $('api-model').value = recommended.id; await call('connection:model', { connectionId: connection.id, model: recommended.id }); }
  $('api-form-message').textContent = list.length ? `Found ${list.length} models. ${recommended ? `Suggested: ${recommended.id}. ` : ''}Choose a model, then save and test.` : 'No text models were returned. Enter a model ID from your provider.';
}); });
$('api-model').oninput = () => { $('api-form-message').textContent = 'Save your selected model, then test the connection.'; };
$('get-gemini-key').onclick = action(() => call('link', 'gemini'));
$('connect-google').onclick = action(async () => {
  $('cancel-google').classList.remove('hidden'); $('google-message').textContent = 'Finish signing in through your browser. Sotto will then check the account’s model access.';
  try { await busy($('connect-google'), 'Waiting for Google…', async () => { const result = await call('google:connect'); $('google-message').textContent = result.warning; }); }
  catch (e) { $('google-message').textContent = e.message; }
  finally { $('cancel-google').classList.add('hidden'); }
});
$('cancel-google').onclick = action(() => call('google:cancel'));

const booleanSettings = ['languageKeys', 'spokenLanguage', 'autoPaste', 'saveHistory', 'keepAudio', 'startHidden'];
async function fillSettings() {
  for (const name of booleanSettings) $(`setting-${name}`).checked = !!data.settings[name];
  for (const name of ['hotkey', 'cleanup', 'transcription', 'whisperExecutable', 'whisperModel', 'extraInstructions']) $(`setting-${name}`).value = data.settings[name] || '';
  $('setting-language').value = data.settings.outputLanguage || 'English';
  $('whisper-settings').classList.toggle('hidden', data.settings.transcription !== 'local');
  try { const devices = await navigator.mediaDevices.enumerateDevices(); $('setting-microphone').innerHTML = '<option value="">System default</option>' + devices.filter(d => d.kind === 'audioinput' && d.deviceId !== 'default').map((d, i) => `<option value="${esc(d.deviceId)}">${esc(d.label || `Microphone ${i + 1}`)}</option>`).join(''); $('setting-microphone').value = data.settings.microphone || ''; } catch {}
}
$('setting-transcription').onchange = () => $('whisper-settings').classList.toggle('hidden', $('setting-transcription').value !== 'local');
document.querySelectorAll('[data-browse]').forEach(button => button.onclick = action(async () => { const value = await call('file:choose', button.dataset.browse); if (value) $(button.dataset.browse === 'executable' ? 'setting-whisperExecutable' : 'setting-whisperModel').value = value; }));
$('whisper-link').onclick = action(() => call('link', 'whisper'));
$('settings-form').onsubmit = action(async event => { event.preventDefault(); const settings = { ...data.settings }; for (const name of booleanSettings) settings[name] = $(`setting-${name}`).checked; for (const name of ['hotkey', 'cleanup', 'transcription', 'whisperExecutable', 'whisperModel', 'extraInstructions', 'microphone']) settings[name] = $(`setting-${name}`).value; settings.outputLanguage = $('setting-language').value; await busy(event.submitter, 'Saving…', async () => { await call('settings:save', settings); $('settings-message').textContent = 'Preferences saved.'; toast('Your preferences are saved.'); }); });
$('record-button').onclick = action(async () => { if (!data.activeId) { navigate('connections'); return; } await call('recording:toggle'); });
$('cancel-button').onclick = action(() => call('recording:cancel'));
$('output-language').onchange = action(() => call('language', $('output-language').value));
$('polish-text').onclick = action(async () => { if (!data.activeId) { navigate('connections'); toast('Add a connection first.'); return; } await busy($('polish-text'), 'Polishing…', () => call('text:process', $('typed-input').value)); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && active()) call('recording:cancel').catch(e => toast(e.message)); });
setInterval(() => { if (data.state.stage === 'recording') $('timer').textContent = time((Date.now() - data.state.startedAt) / 1000); else if (!active()) $('timer').textContent = '00:00'; }, 250);

let recorder = null, recordingToken = 0;
async function beginRecording({ settings }) {
  const token = ++recordingToken;
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: settings.microphone ? { exact: settings.microphone } : undefined, channelCount: 1, echoCancellation: true, noiseSuppression: true }, video: false });
    if (token !== recordingToken) { stream.getTracks().forEach(track => track.stop()); return; }
    const context = new AudioContext(); await context.resume();
    const source = context.createMediaStreamSource(stream), processor = context.createScriptProcessor(4096, 1, 1), mute = context.createGain(); mute.gain.value = 0;
    const chunks = [], started = performance.now(); let meterAt = 0, totalSamples = 0;
    processor.onaudioprocess = event => {
      const samples = new Float32Array(event.inputBuffer.getChannelData(0)); chunks.push(samples); totalSamples += samples.length;
      if (performance.now() - meterAt > 100) { meterAt = performance.now(); let sum = 0; for (const value of samples) sum += value * value; const level = Math.min(1, Math.sqrt(sum / samples.length) * 5); setLevel(level); call('recording:level', level).catch(() => {}); }
      if ((performance.now() - started) > 180000 && data.state.stage === 'recording') call('recording:toggle').catch(() => {});
    };
    source.connect(processor); processor.connect(mute); mute.connect(context.destination);
    recorder = { context, source, processor, mute, stream, chunks, started, count: () => totalSamples };
    await call('recording:ready');
  } catch (e) { stream?.getTracks().forEach(track => track.stop()); if (token === recordingToken) await call('recording:error', e.name === 'NotAllowedError' ? 'Microphone access was denied. Allow Sotto to use your microphone in Windows Settings, then retry.' : e.name === 'NotFoundError' || e.name === 'OverconstrainedError' ? 'That microphone is unavailable. Choose System default in Settings and check your microphone.' : 'Could not open the microphone. Check your audio device and try again.'); }
}
function encodeWav(chunks, length, sourceRate) {
  const input = new Float32Array(length); let at = 0; for (const chunk of chunks) { input.set(chunk, at); at += chunk.length; }
  const rate = 16000, ratio = sourceRate / rate, count = Math.floor(length / ratio), buffer = new ArrayBuffer(44 + count * 2), view = new DataView(buffer);
  const ascii = (offset, value) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
  ascii(0, 'RIFF'); view.setUint32(4, 36 + count * 2, true); ascii(8, 'WAVE'); ascii(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); ascii(36, 'data'); view.setUint32(40, count * 2, true);
  for (let i = 0; i < count; i++) { const start = Math.floor(i * ratio), end = Math.min(length, Math.max(start + 1, Math.floor((i + 1) * ratio))); let sum = 0; for (let j = start; j < end; j++) sum += input[j]; const sample = Math.max(-1, Math.min(1, sum / (end - start))); view.setInt16(44 + i * 2, sample < 0 ? sample * 32768 : sample * 32767, true); }
  return buffer;
}
async function stopRecording(discard) {
  ++recordingToken;
  const current = recorder; recorder = null;
  if (!current) return;
  current.processor.onaudioprocess = null; current.source.disconnect(); current.processor.disconnect(); current.mute.disconnect(); current.stream.getTracks().forEach(track => track.stop());
  const rate = current.context.sampleRate; await current.context.close(); setLevel(.05);
  if (discard) return;
  const duration = (performance.now() - current.started) / 1000;
  if (duration < .3 || current.count() < rate * .2) { await call('recording:error', 'That recording was too short. Speak for a moment before finishing.'); return; }
  try { await call('recording:audio', { bytes: encodeWav(current.chunks, current.count(), rate), duration }); }
  catch (e) { await call('recording:error', e.message); }
}
async function start() {
  mountIcons();
  if (!bridge) { const notice = document.createElement('div'); notice.className = 'preview-notice'; notice.textContent = 'Interface preview · Open the desktop app for recording, API connections and cursor insertion.'; document.body.prepend(notice); renderState(); renderConnections(); return; }
  bridge.on('data', snapshot => { data = snapshot; renderState(); if (currentPage === 'history') renderHistory(); if (currentPage === 'connections') renderConnections(); });
  bridge.on('state', state => { data.state = state; renderState(); });
  bridge.on('notice', toast); bridge.on('navigate', navigate);
  bridge.on('recording:begin', args => beginRecording(args));
  bridge.on('recording:stop', () => stopRecording(false));
  bridge.on('recording:cancel', () => stopRecording(true));
  data = await call('snapshot'); renderState(); renderConnections();
}
start().catch(e => toast(e.message));
