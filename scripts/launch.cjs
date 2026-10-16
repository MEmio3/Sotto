const { spawn } = require('node:child_process');
const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(require('electron'), ['.'], { cwd: require('node:path').join(__dirname, '..'), env, stdio: 'inherit', windowsHide: true });
child.on('exit', code => process.exit(code || 0));
child.on('error', error => { process.stderr.write(error.message + '\n'); process.exit(1); });
