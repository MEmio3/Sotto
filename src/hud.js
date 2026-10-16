const $ = id => document.getElementById(id);
const capsule = document.querySelector('.capsule');
const bars = [...document.querySelectorAll('.wave i')];
const svg = body => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const symbols = {
  stop: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>',
  copy: svg('<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V3H3v12h5"/>'),
  open: svg('<path d="M5 12h14m-6-6 6 6-6 6"/>'),
  check: svg('<path d="m5 12 4 4L19 6"/>'),
  warning: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01"/>'),
  pause: svg('<path d="M9 6v12m6-12v12"/>')
};
let last = {}, tick = 0;
function clock() {
  const seconds = Math.max(0, Math.floor((Date.now() - (last.startedAt || Date.now())) / 1000));
  $('elapsed').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
function render(state) {
  last = state; capsule.dataset.stage = state.stage;
  const listening = state.stage === 'recording';
  const final = ['done', 'error', 'cancelled'].includes(state.stage);
  const language = state.result?.language || state.effectiveLanguage || 'English';
  const labels = { starting: 'Getting ready', recording: 'Listening', transcribing: 'Transcribing', polishing: 'Polishing', inserting: 'Inserting', done: state.result?.insertion === 'inserted' ? 'Inserted' : 'Ready to copy', error: 'Needs attention', cancelled: 'Cancelled' };
  $('label').textContent = labels[state.stage] || 'Sotto';
  $('language').textContent = language;
  $('language').title = `${language} · ${state.writingModeLabel || 'Precise'}`;
  $('elapsed').classList.toggle('hidden', !listening);
  $('key-hint').classList.toggle('hidden', !(listening && state.languageKeys));
  $('language').classList.toggle('hidden', !listening && state.stage !== 'done');
  let note = '';
  if (listening && !state.languageKeys) note = state.spokenLanguage ? 'Spoken cues on' : 'Speak naturally';
  else if (state.stage === 'starting') note = 'Opening your microphone';
  else if (state.stage === 'transcribing') note = 'Turning speech into text';
  else if (state.stage === 'polishing') note = `${state.writingModeLabel || 'Precise'} writing`;
  else if (state.stage === 'inserting') note = 'At your original cursor';
  else if (state.stage === 'done') note = state.result?.uncertain?.length ? 'Review a few words' : state.result?.insertion === 'inserted' ? 'At your cursor' : 'Your words are ready';
  else if (state.stage === 'error') note = /usage limit|quota/i.test(state.message || '') ? 'Provider limit reached' : /microphone/i.test(state.message || '') ? 'Check your microphone' : state.canRetry ? 'Saved and ready to retry' : 'Open Sotto for details';
  else if (state.stage === 'cancelled') note = 'Nothing was inserted';
  $('note').textContent = note;
  $('note').classList.toggle('hidden', !note);
  $('detail').title = state.message || '';
  $('finish').classList.toggle('hidden', !listening && !['done', 'error'].includes(state.stage));
  $('cancel').classList.toggle('hidden', state.stage === 'inserting');
  const primaryLabel = listening ? 'Finish dictation' : state.stage === 'done' ? 'Copy your words' : 'Open Sotto';
  $('finish').setAttribute('aria-label', primaryLabel);
  $('finish').title = listening ? `${primaryLabel} (${(state.hotkey || 'Control+P').replace('Control', 'Ctrl').replaceAll('+', ' + ')})` : primaryLabel;
  $('finish').innerHTML = listening ? symbols.stop : state.stage === 'done' ? symbols.copy : symbols.open;
  $('cancel').setAttribute('aria-label', final ? 'Dismiss recorder' : 'Cancel dictation');
  $('cancel').title = final ? 'Dismiss recorder' : 'Cancel dictation';
  document.querySelector('.signal-symbol').innerHTML = state.stage === 'done' ? symbols.check : state.stage === 'error' ? symbols.warning : symbols.pause;
  clock();
}
window.sotto.on('state', render);
window.sotto.call('snapshot').then(response => { const state = response.value?.state; if (response.ok && state?.stage && state.stage !== 'idle') render(state); });
window.sotto.on('level', value => {
  if (last.stage !== 'recording') return;
  tick++;
  const level = Math.max(0, Math.min(1, Number(value) || 0));
  bars.forEach((node, i) => {
    const envelope = .45 + .55 * (1 - Math.abs(i - 4) / 4);
    const height = 3 + 23 * level * envelope * (.4 + .6 * Math.abs(Math.sin(i * 1.31 + tick * .57)));
    node.style.setProperty('--height', (height / 4).toFixed(2));
  });
});
$('finish').onclick = async () => {
  if (last.stage === 'recording') return window.sotto.call('recording:toggle');
  if (last.stage === 'done' && last.result?.text) {
    const response = await window.sotto.call('copy', last.result.text);
    if (response.ok) { $('label').textContent = 'Copied'; $('note').textContent = 'Paste wherever you’re writing'; $('finish').innerHTML = symbols.check; }
  } else window.sotto.call('window', 'show');
};
$('cancel').onclick = () => window.sotto.call(['done', 'error', 'cancelled'].includes(last.stage) ? 'hud:hide' : 'recording:cancel');
setInterval(clock, 250);
