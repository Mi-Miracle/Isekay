// Procedural sound effects and a gentle generative ambient score (WebAudio, no asset files).
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  let ctx = null, master = null, musicGain = null, musicTimer = null;
  const settings = { sfx: 0.5, music: 0.25 };

  function ensure() {
    if (ctx) return ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = settings.sfx; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = settings.music; musicGain.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  function tone(freq, dur, type = 'sine', vol = 0.3, slide = 0, delay = 0, dest) {
    if (!ensure()) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol = 0.2, hp = 800, delay = 0) {
    if (!ensure()) return;
    const t = ctx.currentTime + delay;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = ctx.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }

  const SFX = {
    click: () => tone(660, 0.05, 'triangle', 0.12),
    hover: () => tone(880, 0.03, 'sine', 0.04),
    hit: () => { noise(0.12, 0.25, 900); tone(180, 0.12, 'square', 0.12, -80); },
    crit: () => { noise(0.2, 0.35, 500); tone(240, 0.2, 'sawtooth', 0.18, -150); tone(960, 0.15, 'triangle', 0.12, 0, 0.05); },
    miss: () => tone(500, 0.15, 'sine', 0.1, -300),
    hurt: () => { tone(140, 0.2, 'sawtooth', 0.2, -60); noise(0.1, 0.15, 300); },
    heal: () => { [523, 659, 784].forEach((f, i) => tone(f, 0.25, 'sine', 0.14, 0, i * 0.07)); },
    magic: () => { tone(400, 0.35, 'sine', 0.15, 600); tone(800, 0.3, 'triangle', 0.08, 400, 0.05); },
    coin: () => { tone(988, 0.08, 'square', 0.08); tone(1319, 0.15, 'square', 0.08, 0, 0.07); },
    level: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'triangle', 0.15, 0, i * 0.1)); },
    win: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.14, 0, i * 0.09)); },
    lose: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.45, 'sine', 0.16, 0, i * 0.18)); },
    error: () => tone(160, 0.18, 'square', 0.1),
    step: () => tone(120 + Math.random() * 40, 0.05, 'triangle', 0.05),
    splash: () => noise(0.35, 0.2, 1500),
    clang: () => { tone(1200, 0.25, 'square', 0.08, -200); noise(0.08, 0.2, 3000); },
    bubble: () => tone(300 + Math.random() * 300, 0.12, 'sine', 0.12, 400),
    truck: () => { tone(90, 1.2, 'sawtooth', 0.25, 40); noise(1.0, 0.3, 200); tone(440, 0.4, 'square', 0.15, 0, 0.1); tone(440, 0.4, 'square', 0.15, 0, 0.6); },
    goddess: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.6, 'sine', 0.1, 0, i * 0.12)); },
    war: () => { tone(110, 0.6, 'sawtooth', 0.12); tone(165, 0.6, 'sawtooth', 0.1, 0, 0.15); },
  };

  function play(name) { if (settings.sfx <= 0) return; try { SFX[name] && SFX[name](); } catch (e) { /* ignore */ } }

  // Generative ambient music: slow pentatonic arpeggio over pad chords
  const SCALES = {
    calm: [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3],
    battle: [220, 246.9, 261.6, 329.6, 349.2, 440, 493.9, 523.3],
    dark: [196, 207.7, 261.6, 277.2, 311.1, 392, 415.3, 523.3],
  };
  let mood = 'calm';
  function music(m) {
    mood = m || mood;
    if (!ensure() || musicTimer) return;
    let step = 0;
    musicTimer = setInterval(() => {
      if (settings.music <= 0) return;
      const sc = SCALES[mood];
      const fast = mood === 'battle';
      if (step % (fast ? 8 : 16) === 0) {
        const root = sc[(step / 16 | 0) % 3];
        [root / 2, root * 0.75, root].forEach((f) => tone(f, fast ? 1.6 : 3.4, 'sine', 0.05, 0, 0, musicGain));
      }
      if (Math.random() < (fast ? 0.8 : 0.55)) tone(sc[Math.floor(Math.random() * sc.length)] * (Math.random() < 0.2 ? 2 : 1), fast ? 0.25 : 0.7, 'triangle', 0.05, 0, 0, musicGain);
      step++;
    }, mood === 'battle' ? 190 : 340);
  }
  function setMood(m) { if (m === mood) return; mood = m; if (musicTimer) { clearInterval(musicTimer); musicTimer = null; music(m); } }
  function setVolume(kind, v) {
    settings[kind] = v;
    if (master && kind === 'sfx') master.gain.value = v;
    if (musicGain && kind === 'music') musicGain.gain.value = v;
    try { localStorage.setItem('isekay_audio', JSON.stringify(settings)); } catch (e) { /* ignore */ }
  }
  try { Object.assign(settings, JSON.parse(localStorage.getItem('isekay_audio') || '{}')); } catch (e) { /* ignore */ }

  ISK.audio = { play, music, setMood, setVolume, settings, ensure };
})();
