const { spawn } = require('node:child_process');
const path = require('node:path');
const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(require('electron'), [path.join(__dirname, 'hud-preview.cjs')], { cwd: path.join(__dirname, '..'), env, windowsHide: true, stdio: 'inherit' });
child.on('exit', code => process.exit(code || 0));
child.on('error', error => { process.stderr.write(error.message + '\n'); process.exit(1); });
