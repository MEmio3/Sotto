const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const root = path.join(__dirname, '..');
const directory = path.join(root, '.impeccable', 'review', 'floating');
fs.mkdirSync(directory, { recursive: true });
app.setPath('userData', path.join(root, '.test-data', `hud-preview-${Date.now()}`));
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: Number(process.env.SOTTO_HUD_WIDTH || 438), height: Number(process.env.SOTTO_HUD_HEIGHT || 104), frame: false, transparent: true, show: false, webPreferences: { preload: path.join(root, 'electron', 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });
  ipcMain.handle('snapshot', () => ({ ok: true, value: { state: {}, settings: {} } }));
  const calls = [];
  for (const channel of ['recording:toggle', 'recording:cancel', 'hud:hide', 'copy', 'window']) ipcMain.handle(channel, (_event, ...args) => { calls.push({ channel, args }); return { ok: true }; });
  win.webContents.on('console-message', (_event, ...args) => process.stderr.write(args.join(' ') + '\n'));
  await win.loadFile(path.join(root, 'src', 'hud.html'));
  await win.webContents.executeJavaScript('document.fonts.ready');
  await win.webContents.capturePage();
  const stages = [
    { stage: 'recording', effectiveLanguage: 'English', languageKeys: true, startedAt: Date.now() - 12000 },
    { stage: 'recording', effectiveLanguage: 'Bangla', languageKeys: false, spokenLanguage: true, startedAt: Date.now() - 34000 },
    { stage: 'polishing', effectiveLanguage: 'English' },
    { stage: 'done', message: 'Inserted at your cursor.', result: { text: 'A thought, well put.', insertion: 'inserted', language: 'English' } },
    { stage: 'error', message: 'Your provider usage limit was reached. Your recording is saved for retry.' },
    { stage: 'recording', effectiveLanguage: 'Same as speech', languageKeys: true, startedAt: Date.now() - 99000 },
    { stage: 'done', message: 'Some speech was unclear. Review your text before copying.', result: { text: 'A thought to review.', insertion: 'copy', language: 'English', uncertain: ['A name was unclear'] } }
  ];
  for (let i = 0; i < stages.length; i++) {
    win.webContents.send('state', stages[i]);
    for (let attempt = 0; attempt < 4; attempt++) { await new Promise(resolve => setTimeout(resolve, 50)); if (await win.webContents.executeJavaScript(`document.querySelector('.capsule').dataset.stage===${JSON.stringify(stages[i].stage)}`)) break; win.webContents.send('state', stages[i]); }
    for (let n = 0; n < 12; n++) { win.webContents.send('level', stages[i].stage === 'recording' ? .45 + .22 * Math.sin(n) : 0); await new Promise(resolve => setTimeout(resolve, 25)); }
    const metrics = await win.webContents.executeJavaScript(`({overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,detail:document.getElementById('detail')?.textContent,buttons:[...document.querySelectorAll('button')].filter(n=>getComputedStyle(n).display!=='none').map(n=>({label:n.getAttribute('aria-label'),width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height}))})`);
    fs.writeFileSync(path.join(directory, `${process.env.SOTTO_HUD_PREFIX || 'preview'}-${i + 1}.png`), (await win.webContents.capturePage()).toPNG());
    fs.writeFileSync(path.join(directory, `${process.env.SOTTO_HUD_PREFIX || 'preview'}-${i + 1}.json`), JSON.stringify(metrics, null, 2));
  }
  const assert = require('node:assert/strict');
  const setState = async state => { win.webContents.send('state', state); await new Promise(resolve => setTimeout(resolve, 35)); };
  await setState(stages[0]); await win.webContents.executeJavaScript(`document.getElementById('finish').click()`); await new Promise(resolve => setTimeout(resolve, 35)); assert.equal(calls.pop().channel, 'recording:toggle');
  await setState(stages[2]); await win.webContents.executeJavaScript(`document.getElementById('cancel').click()`); await new Promise(resolve => setTimeout(resolve, 35)); assert.equal(calls.pop().channel, 'recording:cancel');
  await setState(stages[3]); await win.webContents.executeJavaScript(`document.getElementById('finish').click()`); await new Promise(resolve => setTimeout(resolve, 35)); assert.deepEqual(calls.pop(), { channel: 'copy', args: ['A thought, well put.'] }); assert.equal(await win.webContents.executeJavaScript(`document.getElementById('label').textContent`), 'Copied');
  await win.webContents.executeJavaScript(`document.getElementById('cancel').click()`); await new Promise(resolve => setTimeout(resolve, 35)); assert.equal(calls.pop().channel, 'hud:hide');
  await setState(stages[4]); await win.webContents.executeJavaScript(`document.getElementById('finish').click()`); await new Promise(resolve => setTimeout(resolve, 35)); assert.deepEqual(calls.pop(), { channel: 'window', args: ['show'] });
  await setState(stages[0]); win.webContents.send('level', 1); await new Promise(resolve => setTimeout(resolve, 150));
  assert.ok(await win.webContents.executeJavaScript(`(()=>{const bounds=document.querySelector('.signal').getBoundingClientRect();return [...document.querySelectorAll('.wave i')].every(n=>{const r=n.getBoundingClientRect();return r.top>=bounds.top&&r.bottom<=bounds.bottom})})()`));
  fs.writeFileSync(path.join(directory, 'actions.json'), JSON.stringify({ ok: true, finish: true, cancel: true, copy: true, dismiss: true, open: true, boundedWaveform: true }, null, 2));
  process.stdout.write(`Floating preview saved in ${directory}\n`); app.quit();
}).catch(error => { process.stderr.write(error.stack + '\n'); app.exit(1); });
