// Neural Ukrainian voice-over via Microsoft Edge "Read aloud" voices (uk-UA Ostap / Polina).
// Runs in the Electron main process; results are cached on disk so each line is synthesized only once.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const CHROMIUM = '130.0.2849.68';
const MAJOR = CHROMIUM.split('.')[0];
const VOICES = {
  m: 'Microsoft Server Speech Text to Speech Voice (uk-UA, OstapNeural)',
  f: 'Microsoft Server Speech Text to Speech Voice (uk-UA, PolinaNeural)',
};
let skew = 0; // seconds, corrected from server Date header on 403

function secMsGec() {
  let t = Math.floor(Date.now() / 1000 + skew) + 11644473600;
  t -= t % 300;
  const ticks = BigInt(t) * 10000000n;
  return crypto.createHash('sha256').update(ticks.toString() + TOKEN, 'ascii').digest('hex').toUpperCase();
}
const uuid = () => crypto.randomUUID().replace(/-/g, '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const stamp = () => new Date().toUTCString().replace('GMT', 'GMT+0000 (Coordinated Universal Time)');

function synthOnce(text, gender, pitch, rate) {
  return new Promise((resolve, reject) => {
    const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TOKEN}&Sec-MS-GEC=${secMsGec()}&Sec-MS-GEC-Version=1-${CHROMIUM}&ConnectionId=${uuid()}`;
    const ws = new WebSocket(url, {
      headers: {
        Pragma: 'no-cache', 'Cache-Control': 'no-cache', Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${MAJOR}.0.0.0 Safari/537.36 Edg/${MAJOR}.0.0.0`,
        'Accept-Encoding': 'gzip, deflate, br', 'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const chunks = []; let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; try { ws.terminate(); } catch (e) { /* */ } reject(new Error('timeout')); } }, 15000);
    ws.on('unexpected-response', (_req, res) => {
      const d = res.headers && res.headers.date ? Date.parse(res.headers.date) : NaN;
      if (!isNaN(d)) skew = (d - Date.now()) / 1000;
      done = true; clearTimeout(timer); reject(Object.assign(new Error('HTTP ' + res.statusCode), { status: res.statusCode }));
    });
    ws.on('error', (e) => { if (!done) { done = true; clearTimeout(timer); reject(e); } });
    ws.on('open', () => {
      ws.send(`X-Timestamp:${stamp()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`);
      const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='uk-UA'><voice name='${VOICES[gender] || VOICES.m}'><prosody pitch='${pitch}' rate='${rate}' volume='+0%'>${esc(text)}</prosody></voice></speak>`;
      ws.send(`X-RequestId:${uuid()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${stamp()}Z\r\nPath:ssml\r\n\r\n${ssml}`);
    });
    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        const buf = Buffer.from(data); const hl = buf.readUInt16BE(0); const head = buf.subarray(2, 2 + hl).toString();
        if (head.includes('Path:audio')) chunks.push(buf.subarray(2 + hl));
      } else if (String(data).includes('Path:turn.end')) {
        done = true; clearTimeout(timer); try { ws.close(); } catch (e) { /* */ }
        const out = Buffer.concat(chunks);
        if (out.length) resolve(out); else reject(new Error('empty audio'));
      }
    });
  });
}

async function synth(text, gender = 'm', pitch = '+0Hz', rate = '+0%') {
  try { return await synthOnce(text, gender, pitch, rate); } catch (e) {
    if (e.status === 403) return synthOnce(text, gender, pitch, rate); // retry with corrected clock skew
    throw e;
  }
}

function makeCache(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { /* */ }
  return async function speak({ text, gender, pitch, rate }) {
    text = String(text || '').replace(/[«»*_~#]/g, '').replace(/\s+/g, ' ').trim().slice(0, 600);
    if (!text) return null;
    const key = crypto.createHash('sha1').update([text, gender, pitch, rate].join('|')).digest('hex');
    const file = path.join(dir, key + '.mp3');
    if (fs.existsSync(file)) return fs.readFileSync(file).toString('base64');
    const buf = await synth(text, gender, pitch || '+0Hz', rate || '+0%');
    try { fs.writeFileSync(file, buf); } catch (e) { /* */ }
    return buf.toString('base64');
  };
}

module.exports = { synth, makeCache, secMsGec };

// CLI smoke test: node tts.js "Привіт, світе"
if (require.main === module) {
  synth(process.argv[2] || 'Вітаю в Дивосвіті! Тебе щойно збила вантажівка.', process.argv[3] || 'f')
    .then((b) => { console.log('TTS OK, bytes:', b.length); if (process.argv[4]) fs.writeFileSync(process.argv[4], b); })
    .catch((e) => { console.log('TTS FAIL:', e.message); process.exitCode = 1; });
}
