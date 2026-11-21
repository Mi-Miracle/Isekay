// Electron entry point for «Хроніки Дивосвіту» — window, self-test hooks and auto-update from GitHub Releases.
const { app, BrowserWindow, ipcMain, Menu, net, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
let tts = null;
try { tts = require('./tts.js'); } catch (e) { tts = null; }

const REPO = 'Mi-Miracle/Isekay';
const selftest = process.argv.includes('--selftest');
const shotDir = process.env.ISEKAY_SHOTS || path.join(app.getPath('temp'), 'dyvo-shots');
const portableDir = process.env.PORTABLE_EXECUTABLE_DIR || null;
let win, autoUpdater = null;
try { if (!portableDir && app.isPackaged) autoUpdater = require('electron-updater').autoUpdater; } catch (e) { autoUpdater = null; }

function createWindow() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 1280, minHeight: 720, backgroundColor: '#0c0f1a', title: 'Хроніки Дивосвіту',
    icon: path.join(__dirname, 'build', 'icon.png'), show: false, autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.once('ready-to-show', () => { win.show(); if (!selftest) win.maximize(); });
  win.loadFile(path.join(__dirname, 'src', 'index.html'), selftest ? { search: 'selftest=1' } : undefined);
  win.webContents.on('console-message', (_e, level, msg) => { if (selftest && level >= 2) console.log('[renderer]', msg); });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

const send = (ch, data) => { if (win && !win.isDestroyed()) win.webContents.send(ch, data); };
const newer = (a, b) => { const pa = a.split('.').map(Number), pb = b.split('.').map(Number); for (let i = 0; i < 3; i++) { if ((pa[i] || 0) > (pb[i] || 0)) return true; if ((pa[i] || 0) < (pb[i] || 0)) return false; } return false; };

async function latestRelease() {
  const r = await net.fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { 'User-Agent': 'Dyvosvit-Updater', Accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error('GitHub: ' + r.status);
  return r.json();
}

ipcMain.handle('dyvo:version', () => app.getVersion());
ipcMain.handle('dyvo:check-update', async () => {
  if (selftest || !app.isPackaged) return { current: app.getVersion(), available: false, dev: true };
  try {
    const rel = await latestRelease(); const latest = String(rel.tag_name || '').replace(/^v/, '');
    const portable = !!portableDir;
    const asset = (rel.assets || []).find((a) => portable ? /Portable.*\.exe$/i.test(a.name) : /Setup.*\.exe$/i.test(a.name));
    return { current: app.getVersion(), latest, available: newer(latest, app.getVersion()) && !!asset, portable, notes: rel.body || '', url: rel.html_url, asset: asset && { name: asset.name, url: asset.browser_download_url, size: asset.size } };
  } catch (e) { return { current: app.getVersion(), available: false, error: String(e.message || e) }; }
});
ipcMain.handle('dyvo:install-update', async (_e, info) => {
  if (!info || !info.asset) return false;
  if (!portableDir && autoUpdater) {
    autoUpdater.autoDownload = false;
    autoUpdater.on('download-progress', (p) => send('dyvo:update-progress', Math.round(p.percent)));
    autoUpdater.on('update-downloaded', () => { send('dyvo:update-progress', 100); setTimeout(() => autoUpdater.quitAndInstall(true, true), 800); });
    autoUpdater.on('error', (err) => send('dyvo:update-error', String(err)));
    await autoUpdater.checkForUpdates(); await autoUpdater.downloadUpdate(); return true;
  }
  // portable: download the new exe next to the current one and launch it
  const dir = portableDir || path.dirname(process.execPath);
  const target = path.join(dir, info.asset.name);
  const res = await net.fetch(info.asset.url, { headers: { 'User-Agent': 'Dyvosvit-Updater' } });
  if (!res.ok) { send('dyvo:update-error', 'HTTP ' + res.status); return false; }
  const total = +res.headers.get('content-length') || info.asset.size || 0; let got = 0;
  const out = fs.createWriteStream(target + '.part'); const reader = res.body.getReader();
  for (;;) { const { done, value } = await reader.read(); if (done) break; out.write(Buffer.from(value)); got += value.length; if (total) send('dyvo:update-progress', Math.round(got / total * 100)); }
  await new Promise((r) => out.end(r));
  fs.renameSync(target + '.part', target);
  send('dyvo:update-progress', 100);
  // replace the old portable exe after we quit, then start the new one
  const oldExe = process.env.PORTABLE_EXECUTABLE_FILE;
  const script = path.join(app.getPath('temp'), 'dyvo-update.cmd');
  const lines = ['@echo off', 'set n=0', ':loop'];
  if (oldExe && path.resolve(oldExe) !== path.resolve(target)) lines.push(`del /f /q "${oldExe}" >nul 2>&1`, `if not exist "${oldExe}" goto run`, 'set /a n=n+1', 'if %n% geq 40 goto run', 'ping -n 2 127.0.0.1 >nul', 'goto loop');
  lines.push(':run', `start "" "${target}"`, '(goto) 2>nul & del "%~f0"');
  try { fs.writeFileSync(script, lines.join('\r\n')); } catch (e) { /* ignore */ }
  setTimeout(() => {
    try { spawn('cmd.exe', ['/c', script], { detached: true, stdio: 'ignore', windowsHide: true }).unref(); } catch (e) { spawn(target, [], { detached: true, stdio: 'ignore' }).unref(); }
    app.quit();
  }, 900);
  return true;
});
// offline neural voice-over (Piper, downloaded on request)
let voiceEngine = null;
const voice = () => voiceEngine || (voiceEngine = tts ? tts.create(app.getPath('userData'), (u, o) => net.fetch(u, o)) : null);
ipcMain.handle('dyvo:voice-status', () => ({ available: !!tts && process.platform === 'win32', installed: !!(voice() && voice().installed()) }));
ipcMain.handle('dyvo:voice-install', async () => {
  if (!voice()) return { error: 'no engine' };
  try { await voice().install((pct) => send('dyvo:voice-progress', Math.round(pct))); return { ok: true }; } catch (e) { return { error: String(e.message || e) }; }
});
ipcMain.handle('dyvo:tts', async (_e, req) => {
  if (!voice() || !voice().installed()) return { error: 'not installed' };
  try { return { audio: await voice().speak(req || {}) }; } catch (e) { return { error: String(e.message || e) }; }
});
ipcMain.handle('dyvo:open', (_e, url) => shell.openExternal(url));
ipcMain.handle('isekay:quit', () => app.quit());
ipcMain.handle('isekay:fullscreen', () => { if (win) win.setFullScreen(!win.isFullScreen()); });
ipcMain.handle('isekay:shot', async (_e, name) => {
  if (!selftest) return false;
  fs.mkdirSync(shotDir, { recursive: true });
  const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(shotDir, `${name}.png`), img.toPNG()); return true;
});
ipcMain.handle('isekay:report', (_e, rep) => { if (!selftest) return; fs.mkdirSync(shotDir, { recursive: true }); fs.writeFileSync(path.join(shotDir, 'report.json'), JSON.stringify(rep, null, 2)); console.log('SELFTEST REPORT', JSON.stringify(rep)); });

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
