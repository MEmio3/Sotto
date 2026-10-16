const fs = require('node:fs');
const path = require('node:path');
const { DEFAULT_SETTINGS } = require('./core.cjs');

class Store {
  constructor(directory, secure) {
    this.dir = directory; this.secure = secure;
    fs.mkdirSync(directory, { recursive: true });
    fs.mkdirSync(path.join(directory, 'recordings'), { recursive: true });
    this.config = this.read('settings.json', { settings: {}, connections: [], activeId: null });
    this.config.settings = { ...DEFAULT_SETTINGS, ...this.config.settings };
    this.history = this.read('history.json', []);
    let recovered = false;
    for (const entry of this.history) if (entry.status === 'processing') { entry.status = 'failed'; entry.error = 'Sotto closed before processing finished. Retry your saved recording or transcript.'; recovered = true; }
    if (recovered) this.write('history.json', this.history);
    this.vault = this.read('credentials.json', {});
  }
  read(name, fallback) {
    const filename = path.join(this.dir, name);
    if (!fs.existsSync(filename)) return fallback;
    try { return JSON.parse(fs.readFileSync(filename, 'utf8')); }
    catch { throw new Error(`Could not read ${name}. Your existing file has been preserved at ${filename}.`); }
  }
  write(name, data) {
    const filename = path.join(this.dir, name), temp = `${filename}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(data, null, 2), { mode: 0o600 });
    fs.renameSync(temp, filename);
  }
  save() { this.write('settings.json', this.config); }
  secret(id) {
    const encrypted = this.vault[id];
    if (!encrypted) return {};
    try { return JSON.parse(this.secure.decryptString(Buffer.from(encrypted, 'base64'))); }
    catch { throw new Error('Windows could not unlock this connection. Reconnect or enter your API key again.'); }
  }
  setSecret(id, value) {
    if (!this.secure.isEncryptionAvailable()) throw new Error('Windows credential encryption is unavailable. Credentials were not saved.');
    this.vault[id] = this.secure.encryptString(JSON.stringify(value)).toString('base64');
    this.write('credentials.json', this.vault);
  }
  deleteSecret(id) { delete this.vault[id]; this.write('credentials.json', this.vault); }
  addHistory(entry) { this.history.unshift(entry); this.write('history.json', this.history); }
  updateHistory(id, patch) {
    const entry = this.history.find(e => e.id === id);
    if (!entry) throw new Error('This history entry no longer exists.');
    Object.assign(entry, patch); this.write('history.json', this.history); return entry;
  }
  deleteHistory(id) {
    const entry = this.history.find(e => e.id === id);
    if (entry?.audio) this.deleteAudio(entry.audio);
    this.history = this.history.filter(e => e.id !== id); this.write('history.json', this.history);
  }
  audioPath(name) {
    if (!/^[a-f0-9-]+\.wav$/i.test(name)) throw new Error('Invalid recording filename.');
    return path.join(this.dir, 'recordings', name);
  }
  saveAudio(id, bytes) { const name = `${id}.wav`; fs.writeFileSync(this.audioPath(name), bytes); return name; }
  deleteAudio(name) { const filename = this.audioPath(name); if (fs.existsSync(filename)) fs.unlinkSync(filename); }
  snapshot() { return { ...this.config, history: this.history.map(e => ({ ...e, hasAudio: !!e.audio, audio: undefined })) }; }
}
module.exports = { Store };
