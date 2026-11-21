// Character voices: anime-style "babble" blips per speaker (always works offline) + optional system TTS (uk-UA) if installed.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const S = { mode: 'blip', volume: 0.35 };
  try { Object.assign(S, JSON.parse(localStorage.getItem('dyvo_voice') || '{}')); } catch (e) { /* ignore */ }
  const save = () => { try { localStorage.setItem('dyvo_voice', JSON.stringify(S)); } catch (e) { /* ignore */ } };

  const PROFILES = {
    'Богиня Люмі': { base: 820, wave: 'sine', spread: 220 },
    'Оповідач': { base: 260, wave: 'triangle', spread: 60 },
    'Місцевий дід': { base: 170, wave: 'sawtooth', spread: 40 },
    '???': { base: 120, wave: 'square', spread: 30 },
    'Володар Демонів Малдраґор': { base: 95, wave: 'sawtooth', spread: 25 },
  };
  function profileFor(name) {
    if (PROFILES[name]) return PROFILES[name];
    let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return { base: 180 + (h % 380), wave: ['sine', 'triangle', 'square'][h % 3], spread: 60 + (h % 80) };
  }
  let last = 0;
  function blip(name, ch) {
    if (S.mode !== 'blip' || S.volume <= 0) return;
    if (!/[а-яіїєґa-z0-9]/i.test(ch || 'a')) return;
    const now = performance.now(); if (now - last < 55) return; last = now;
    const ctx = ISK.audio && ISK.audio.ensure(); if (!ctx) return;
    const pr = profileFor(name); const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    const vowel = 'аеиіоуяюєїaeiou'.includes((ch || '').toLowerCase());
    o.type = pr.wave; o.frequency.setValueAtTime(pr.base + (Math.random() - 0.5) * pr.spread + (vowel ? pr.spread * 0.4 : 0), t);
    o.frequency.exponentialRampToValueAtTime(pr.base * 0.85, t + 0.07);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(S.volume * 0.18, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.09);
  }
  function ukVoice() {
    if (!('speechSynthesis' in window)) return null;
    return speechSynthesis.getVoices().find((v) => /^uk/i.test(v.lang)) || null;
  }
  function say(name, text) {
    if (S.mode !== 'tts') return false;
    const v = ukVoice(); if (!v) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[«»*()]/g, ''));
      u.voice = v; u.lang = v.lang; u.volume = Math.min(1, S.volume * 2.5);
      const pr = profileFor(name); u.pitch = Math.max(0.2, Math.min(2, pr.base / 300)); u.rate = 1.05;
      speechSynthesis.speak(u); return true;
    } catch (e) { return false; }
  }
  function stop() { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
  function setMode(m) { S.mode = m; save(); }
  function setVolume(v) { S.volume = v; save(); }
  ISK.voice = { blip, say, stop, setMode, setVolume, settings: S, hasTTS: () => !!ukVoice() };
})();
