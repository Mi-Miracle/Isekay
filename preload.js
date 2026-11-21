const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('isekayNative', {
  quit: () => ipcRenderer.invoke('isekay:quit'),
  toggleFullscreen: () => ipcRenderer.invoke('isekay:fullscreen'),
  shot: (name) => ipcRenderer.invoke('isekay:shot', name),
  report: (r) => ipcRenderer.invoke('isekay:report', r),
  version: () => ipcRenderer.invoke('dyvo:version'),
  checkUpdate: () => ipcRenderer.invoke('dyvo:check-update'),
  installUpdate: (info) => ipcRenderer.invoke('dyvo:install-update', info),
  open: (url) => ipcRenderer.invoke('dyvo:open', url),
  onUpdateProgress: (fn) => ipcRenderer.on('dyvo:update-progress', (_e, v) => fn(v)),
  onUpdateError: (fn) => ipcRenderer.on('dyvo:update-error', (_e, v) => fn(v)),
});
