// Character voices v3: offline neural Ukrainian voice-over (Piper TTS, voices Mykyta / Tetiana / Lada, downloaded once),
// with fallbacks: anime "babble" blips or the system uk-UA voice.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const native = globalThis.isekayNative || null;
  const S = { mode: native && native.tts ? 'neural' : 'blip', volume: 0.6, v: 3 };
  try { const saved = JSON.parse(localStorage.getItem('dyvo_voice') || '{}'); if (saved.v === 3) Object.assign(S, saved); else if (saved.volume !== undefined) S.volume = Math.max(0.5, saved.volume); } catch (e) { /* ignore */ }
  const save = () => { try { localStorage.setItem('dyvo_voice', JSON.stringify(S)); } catch (e) { /* ignore */ } };

  // speaker → voice profile (g: gender, p: pitch shift, r: rate)
  // g: m | f | f2 (second female voice), pr: playback pitch/speed, sp: synthesis length scale
  const PROFILES = {
    'Богиня Люмі': { g: 'f', pr: 1.07, sp: 0.95, base: 820, wave: 'sine', spread: 220 },
    'Оповідач': { g: 'm', pr: 0.97, sp: 1.02, base: 260, wave: 'triangle', spread: 60 },
    'Місцевий дід': { g: 'm', pr: 0.9, sp: 1.12, base: 170, wave: 'sawtooth', spread: 40 },
    '???': { g: 'm', pr: 0.85, sp: 1.1, base: 120, wave: 'square', spread: 30 },
    'Володар Демонів Малдраґор': { g: 'm', pr: 0.78, sp: 1.15, base: 95, wave: 'sawtooth', spread: 25 },
    'Мірра': { g: 'f2', pr: 1.04, sp: 0.95 }, 'Ти': { g: 'm', pr: 1, sp: 1 },
  };
  const FEMALE_END = /(а|я|ія|ель|іль)$/i;
  function hash(str) { let h = 0; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
  const IDS = { 'Богиня Люмі': 'lumi', 'Оповідач': 'narrator', 'Місцевий дід': 'oldman', 'Володар Демонів Малдраґор': 'demonlord', '???': 'demonlord', 'Мірра': 'mirra', 'Ти': 'player' };
  const VOICE_LIST = [
    { id: 'lumi', name: 'Богиня Люмі', icon: '🌸', speaker: 'Богиня Люмі', g: 'f', sample: 'Привіт, герою! Це я, твоя найкраща богиня. Ну, єдина. Але найкраща!' },
    { id: 'narrator', name: 'Оповідач', icon: '📖', speaker: 'Оповідач', g: 'm', sample: 'І так почалася нова глава. Герой ще не знав, що на нього чекає слиз.' },
    { id: 'oldman', name: 'Сільський дід', icon: '👴', speaker: 'Місцевий дід', g: 'm', sample: 'О, ще один з неба впав! В мої часи герої ходили пішки.' },
    { id: 'demonlord', name: 'Володар Демонів', icon: '😈', speaker: 'Володар Демонів Малдраґор', g: 'm', sample: 'Я — Малдраґор! Тремтіть, смертні! І не забудьте витерти ноги.' },
    { id: 'mirra', name: 'Мірра з гільдії', icon: '📋', speaker: 'Мірра', g: 'f2', sample: 'Вітаю в гільдії! Заповніть, будь ласка, сорок сім анкет.' },
    { id: 'player', name: 'Головний герой', icon: '⭐', speaker: 'Ти', g: 'm', sample: 'Я не збираюся програвати. Принаймні до обіду.' },
    { id: 'npc_m', name: 'Чоловіки (лорди, НПС, герої)', icon: '🧔', speaker: 'Барон Альберт', g: 'm', sample: 'Ласкаво просимо до мого замку! Не чіпай вази.' },
    { id: 'npc_f', name: 'Жінки (леді, НПС, героїні)', icon: '👩', speaker: 'Графиня Злата', g: 'f', sample: 'Мандрівнику, ти якраз вчасно. У мене є для тебе завдання.' },
  ];
  S.custom = S.custom || {};
  function idFor(name, g) { return IDS[name] || (g === 'f' || g === 'f2' ? 'npc_f' : 'npc_m'); }
  function profileFor(name, gender) {
    const pr = PROFILES[name];
    const h = hash(name);
    const g = gender || (pr && pr.g) || (FEMALE_END.test(String(name).split(' ')[0]) ? 'f' : 'm');
    const out = {
      g: g === 'f' && !(pr && pr.g) && h % 2 ? 'f2' : g, pr: (pr && pr.pr) || 0.93 + (h % 15) / 100, sp: (pr && pr.sp) || 0.92 + ((h >> 4) % 18) / 100,
      base: (pr && pr.base) || (g === 'f' ? 420 : 180) + (h % 200), wave: (pr && pr.wave) || ['sine', 'triangle', 'square'][h % 3], spread: (pr && pr.spread) || 60 + (h % 80),
    };
    const c = S.custom[idFor(name, out.g)];
    if (c) { if (IDS[name]) { out.pr = c.pr; out.sp = c.sp; } else { out.pr *= c.pr; out.sp *= c.sp; } out.base *= c.pr; }
    return out;
  }
  function getCustom(id) {
    if (S.custom[id]) return S.custom[id];
    const v = VOICE_LIST.find((x) => x.id === id); const pr = v && PROFILES[v.speaker];
    return IDS[v && v.speaker] && pr ? { pr: pr.pr || 1, sp: pr.sp || 1 } : { pr: 1, sp: 1 };
  }
  function setCustom(id, val) { S.custom[id] = val; save(); }
  function resetCustom(id) { delete S.custom[id]; save(); }

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
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(S.volume * 0.12, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.09);
  }

  // ---- neural voice-over ----
  let audioEl = null, reqId = 0, failures = 0;
  function neural(name, text, gender) {
    if (!native || !native.tts) return false;
    const pr = profileFor(name, gender); const my = ++reqId;
    stop(true);
    if (!S.installed) return false;
    native.tts({ text, gender: pr.g, speed: pr.sp }).then((res) => {
      if (my !== reqId) return;
      if (!res || !res.audio) { failures++; if (failures >= 3 && S.mode === 'neural') { S.mode = 'blip'; if (ISK.ui && ISK.ui.toast) ISK.ui.toast('🔇 Нейроозвучка не відповідає — вмикаю аніме-голоси.', 'bad', 5000); } return; }
      failures = 0;
      audioEl = new Audio('data:audio/wav;base64,' + res.audio); audioEl.volume = Math.min(1, S.volume);
      audioEl.preservesPitch = false; audioEl.playbackRate = pr.pr;
      audioEl.play().catch(() => { /* ignore */ });
    }).catch(() => { failures++; });
    return true;
  }
  function ukVoice() {
    if (!('speechSynthesis' in window)) return null;
    return speechSynthesis.getVoices().find((v) => /^uk/i.test(v.lang)) || null;
  }
  function say(name, text, gender) {
    if (S.volume <= 0) return false;
    if (S.mode === 'neural') return neural(name, text, gender);
    if (S.mode !== 'tts') return false;
    const v = ukVoice(); if (!v) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/[«»*()]/g, ''));
      u.voice = v; u.lang = v.lang; u.volume = Math.min(1, S.volume * 1.5);
      const pr = profileFor(name, gender); u.pitch = Math.max(0.2, Math.min(2, pr.base / 300)); u.rate = Math.max(0.5, Math.min(2, 1.05 / pr.sp));
      speechSynthesis.speak(u); return true;
    } catch (e) { return false; }
  }
  function stop(keepReq) {
    if (!keepReq) reqId++;
    try { if (audioEl) { audioEl.pause(); audioEl = null; } } catch (e) { /* ignore */ }
    try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  }
  function setMode(m) { S.mode = m; failures = 0; save(); }
  // install / status of the offline neural voice
  S.installed = false;
  async function refreshStatus() { if (!native || !native.voiceStatus) return { available: false }; const st = await native.voiceStatus(); S.installed = !!st.installed; S.available = !!st.available; return st; }
  async function install(onProgress) {
    if (!native || !native.voiceInstall) return { error: 'Недоступно' };
    if (onProgress && native.onVoiceProgress && !install.bound) { install.bound = true; native.onVoiceProgress((v) => install.cb && install.cb(v)); }
    install.cb = onProgress;
    const r = await native.voiceInstall(); await refreshStatus(); if (r && r.ok) setMode('neural'); return r;
  }
  refreshStatus().catch(() => { /* ignore */ });
  function setVolume(v) { S.volume = v; if (audioEl) audioEl.volume = v; save(); }
  // blips still play while the neural voice isn't installed
  const blipOrig = blip;
  function blip2(name, ch) { if (S.mode === 'neural' && !S.installed) { const m = S.mode; S.mode = 'blip'; blipOrig(name, ch); S.mode = m; return; } blipOrig(name, ch); }
  ISK.voice = { blip: blip2, say, stop, setMode, setVolume, settings: S, hasTTS: () => !!ukVoice(), hasNeural: () => !!(native && native.voiceInstall), install, refreshStatus, speaking: () => !!(audioEl && !audioEl.paused), voiceList: () => VOICE_LIST, getCustom, setCustom, resetCustom };
})();
