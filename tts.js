// Offline neural Ukrainian voice-over using Piper TTS (MIT) + the open "ukrainian_tts" voice (CC0 dataset, 3 speakers:
// Lada, Mykyta, Tetiana). Downloaded once on the player's request into the app's data folder, then works without internet.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn, execFile } = require('child_process');

const PIPER_ZIP = 'https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip';
const MODEL_BASE = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/uk/uk_UA/ukrainian_tts/medium/uk_UA-ukrainian_tts-medium';

function create(baseDir, fetchFn) {
  const dir = path.join(baseDir, 'voice');
  const cacheDir = path.join(dir, 'cache');
  const exe = path.join(dir, 'piper', process.platform === 'win32' ? 'piper.exe' : 'piper');
  const model = path.join(dir, 'uk.onnx'), modelJson = path.join(dir, 'uk.onnx.json');
  let speakers = null, installing = null;

  const installed = () => fs.existsSync(exe) && fs.existsSync(model) && fs.existsSync(modelJson);
  function speakerMap() {
    if (speakers) return speakers;
    try { speakers = JSON.parse(fs.readFileSync(modelJson, 'utf8')).speaker_id_map || {}; } catch (e) { speakers = {}; }
    return speakers;
  }

  async function download(url, file, onProgress, share) {
    const res = await fetchFn(url, { headers: { 'User-Agent': 'Dyvosvit-Game' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} (${path.basename(file)})`);
    const total = +res.headers.get('content-length') || 0; let got = 0;
    const out = fs.createWriteStream(file + '.part'); const reader = res.body.getReader();
    for (;;) { const { done, value } = await reader.read(); if (done) break; out.write(Buffer.from(value)); got += value.length; if (total && onProgress) onProgress(share[0] + (got / total) * (share[1] - share[0])); }
    await new Promise((r) => out.end(r));
    fs.renameSync(file + '.part', file);
  }

  function install(onProgress) {
    if (installed()) return Promise.resolve(true);
    if (installing) return installing;
    installing = (async () => {
      fs.mkdirSync(dir, { recursive: true });
      const zip = path.join(dir, 'piper.zip');
      if (!fs.existsSync(exe)) {
        await download(PIPER_ZIP, zip, onProgress, [0, 25]);
        await new Promise((res, rej) => execFile('tar', ['-xf', zip, '-C', dir], (err) => (err ? rej(err) : res())));
        try { fs.unlinkSync(zip); } catch (e) { /* ignore */ }
      }
      if (!fs.existsSync(modelJson)) await download(MODEL_BASE + '.onnx.json', modelJson, onProgress, [25, 26]);
      if (!fs.existsSync(model)) await download(MODEL_BASE + '.onnx', model, onProgress, [26, 100]);
      speakers = null;
      if (!installed()) throw new Error('Не вдалося розпакувати голосовий рушій');
      return true;
    })().finally(() => { installing = null; });
    return installing;
  }

  // speaker: 'm' | 'f' | 'f2' ; speed: length scale (1 = normal, >1 slower)
  async function speak({ text, gender, speed }) {
    if (!installed()) throw new Error('not installed');
    text = String(text || '').replace(/[«»*_~#()]/g, '').replace(/\s+/g, ' ').trim().slice(0, 500);
    if (!text) return null;
    const map = speakerMap(); const names = Object.keys(map);
    const pick = (n, fb) => (map[n] !== undefined ? map[n] : fb);
    const sid = gender === 'm' ? pick('mykyta', 1) : gender === 'f2' ? pick('lada', 0) : pick('tetiana', names.length > 2 ? 2 : 0);
    const ls = Math.max(0.6, Math.min(1.6, +speed || 1));
    fs.mkdirSync(cacheDir, { recursive: true });
    const key = crypto.createHash('sha1').update([text, sid, ls].join('|')).digest('hex');
    const file = path.join(cacheDir, key + '.wav');
    if (!fs.existsSync(file)) {
      await new Promise((resolve, reject) => {
        const args = ['--model', model, '--output_file', file, '--length_scale', String(ls)];
        if (names.length) args.push('--speaker', String(sid));
        const pr = spawn(exe, args, { cwd: path.dirname(exe), windowsHide: true });
        let err = '';
        pr.stderr.on('data', (d) => { err += d; });
        pr.on('error', reject);
        pr.on('close', (code) => (code === 0 && fs.existsSync(file) ? resolve() : reject(new Error('piper ' + code + ' ' + err.slice(-200)))));
        pr.stdin.end(text + '\n', 'utf8');
      });
    }
    return fs.readFileSync(file).toString('base64');
  }

  return { installed, install, speak, dir };
}

module.exports = { create };
