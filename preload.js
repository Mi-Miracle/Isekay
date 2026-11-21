const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('isekayNative', {
  quit: () => ipcRenderer.invoke('isekay:quit'),
  toggleFullscreen: () => ipcRenderer.invoke('isekay:fullscreen'),
  shot: (name) => ipcRenderer.invoke('isekay:shot', name),
  report: (r) => ipcRenderer.invoke('isekay:report', r),
});
