const { contextBridge, ipcRenderer } = require('electron');
const calls = ['snapshot', 'window', 'recording:toggle', 'recording:cancel', 'recording:ready', 'recording:error', 'recording:audio', 'recording:level', 'language', 'text:process', 'retry', 'settings:save', 'connection:save', 'connection:select', 'connection:delete', 'connection:models', 'connection:model', 'connection:test', 'google:connect', 'google:cancel', 'history:delete', 'history:audio', 'history:export', 'copy', 'file:choose', 'link'];
const events = ['state', 'data', 'notice', 'navigate', 'recording:begin', 'recording:stop', 'recording:cancel', 'level'];
calls.push('hud:hide');
contextBridge.exposeInMainWorld('sotto', {
  call: (channel, ...args) => { if (!calls.includes(channel)) return Promise.reject(new Error('Unknown action.')); return ipcRenderer.invoke(channel, ...args); },
  on: (channel, callback) => { if (!events.includes(channel)) return () => {}; const listener = (_event, value) => callback(value); ipcRenderer.on(channel, listener); return () => ipcRenderer.removeListener(channel, listener); }
});
