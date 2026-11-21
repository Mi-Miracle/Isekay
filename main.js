// Electron entry point for "Ісекай: Хроніки Ельдорії"
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const selftest = process.argv.includes('--selftest');
const shotDir = process.env.ISEKAY_SHOTS || path.join(app.getPath('temp'), 'isekay-shots');
let win;

function createWindow() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 1280, minHeight: 720,
    backgroundColor: '#0c0f1a', title: 'Ісекай: Хроніки Ельдорії',
    icon: path.join(__dirname, 'build', 'icon.png'),
    show: false, autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.once('ready-to-show', () => { win.show(); if (!selftest) win.maximize(); });
  win.loadFile(path.join(__dirname, 'src', 'index.html'), selftest ? { search: 'selftest=1' } : undefined);
  win.webContents.on('console-message', (_e, level, msg) => { if (selftest && level >= 2) console.log('[renderer]', msg); });
}

ipcMain.handle('isekay:quit', () => app.quit());
ipcMain.handle('isekay:fullscreen', () => { if (win) win.setFullScreen(!win.isFullScreen()); });
ipcMain.handle('isekay:shot', async (_e, name) => {
  if (!selftest) return false;
  fs.mkdirSync(shotDir, { recursive: true });
  const img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(shotDir, `${name}.png`), img.toPNG());
  return true;
});
ipcMain.handle('isekay:report', (_e, rep) => {
  if (!selftest) return;
  fs.mkdirSync(shotDir, { recursive: true });
  fs.writeFileSync(path.join(shotDir, 'report.json'), JSON.stringify(rep, null, 2));
  console.log('SELFTEST REPORT', JSON.stringify(rep));
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
