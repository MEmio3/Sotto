const path = require('node:path');
const { spawn } = require('node:child_process');
const readline = require('node:readline');
class Desktop {
  constructor() { this.pending = new Map(); this.sequence = 0; this.ready = false; this.diagnostics = ''; }
  start() {
    if (process.platform !== 'win32') return;
    let filename = path.join(__dirname, '..', 'native', 'desktop.ps1').replace('app.asar', 'app.asar.unpacked');
    this.child = spawn('powershell.exe', ['-STA', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', filename], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    readline.createInterface({ input: this.child.stdout }).on('line', line => {
      try { const data = JSON.parse(line); if (data.ready) this.ready = true; else { this.pending.get(data.id)?.(data); this.pending.delete(data.id); } } catch {}
    });
    const failed = () => { this.ready = false; for (const done of this.pending.values()) done({ ok: false, error: 'Desktop input is unavailable. Restart Sotto or copy the result.' }); this.pending.clear(); };
    this.child.on('error', failed); this.child.on('exit', failed); this.child.stdin.on('error', failed);
    this.child.stderr.on('data', chunk => { this.diagnostics = (this.diagnostics + chunk.toString()).slice(-1800); });
  }
  call(command, data = {}) {
    if (!this.ready) return Promise.resolve({ ok: false, error: 'Desktop input is still starting. Try again in a moment.' });
    return new Promise(resolve => {
      const id = ++this.sequence;
      const timer = setTimeout(() => { this.pending.delete(id); resolve({ ok: false, error: 'Desktop input timed out. Copy the result from Sotto.' }); }, 10000);
      this.pending.set(id, result => { clearTimeout(timer); resolve(result); });
      this.child.stdin.write(JSON.stringify({ ...data, command, id }) + '\n');
    });
  }
  capture() { return this.call('capture'); }
  insert(target, text) { return this.call('insert', { ...target, text }); }
  close() { this.child?.kill(); }
}
module.exports = { Desktop };
