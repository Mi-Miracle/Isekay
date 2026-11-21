// Procedural soundtrack v3: a small step-sequencer composer with several themed tracks
// (title, field, town, tavern, dungeon, battle, boss, demon + v4: home, winter, desert, sea, festival, sad, forest, naval). No audio files — everything is synthesized live.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const N = (semi) => 440 * Math.pow(2, (semi - 9) / 12); // semitone from C4 → Hz
  const SCALE = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11] };
  // chords as scale degrees (0-based); progression per 1 bar
  const TRACKS = {
    title: { bpm: 128, key: 10, scale: 'major', prog: [[0, 4, 5, 3], [0, 4, 5, 3], [5, 3, 0, 4], [5, 3, 4, 4]], lead: 'square', pad: 'sawtooth', drums: 'rock', melody: 0.85, octave: 1, swing: 0 },
    field: { bpm: 98, key: 7, scale: 'major', prog: [[0, 3, 4, 0], [5, 3, 1, 4]], lead: 'triangle', pad: 'sine', drums: 'soft', melody: 0.6, octave: 1, swing: 0.1 },
    town: { bpm: 118, key: 2, scale: 'major', prog: [[0, 4, 0, 4], [3, 0, 4, 0]], lead: 'square', pad: 'triangle', drums: 'polka', melody: 0.8, octave: 1, swing: 0 },
    tavern: { bpm: 132, key: 9, scale: 'dorian', prog: [[0, 0, 6, 6], [0, 0, 4, 4]], lead: 'sawtooth', pad: 'triangle', drums: 'polka', melody: 0.9, octave: 1, swing: 0.15 },
    dark: { bpm: 72, key: 9, scale: 'minor', prog: [[0, 5, 3, 4], [0, 5, 6, 4]], lead: 'sine', pad: 'sawtooth', drums: 'slow', melody: 0.35, octave: 0, swing: 0 },
    battle: { bpm: 150, key: 4, scale: 'harm', prog: [[0, 5, 6, 4], [0, 3, 6, 4]], lead: 'sawtooth', pad: 'square', drums: 'battle', melody: 0.9, octave: 1, swing: 0 },
    boss: { bpm: 164, key: 2, scale: 'harm', prog: [[0, 1, 0, 6], [0, 5, 4, 4]], lead: 'square', pad: 'sawtooth', drums: 'battle', melody: 1, octave: 1, swing: 0 },
    home: { bpm: 84, key: 5, scale: 'major', prog: [[0, 5, 3, 4], [0, 2, 3, 4]], lead: 'triangle', pad: 'sine', drums: 'soft', melody: 0.55, octave: 1, swing: 0.18 },
    winter: { bpm: 76, key: 1, scale: 'minor', prog: [[0, 5, 2, 6], [0, 3, 4, 4]], lead: 'sine', pad: 'triangle', drums: 'slow', melody: 0.5, octave: 1, swing: 0 },
    desert: { bpm: 104, key: 4, scale: 'harm', prog: [[0, 1, 0, 1], [0, 6, 5, 4]], lead: 'square', pad: 'sine', drums: 'polka', melody: 0.75, octave: 1, swing: 0.08 },
    sea: { bpm: 112, key: 7, scale: 'dorian', prog: [[0, 6, 3, 0], [0, 6, 4, 4]], lead: 'triangle', pad: 'sawtooth', drums: 'polka', melody: 0.85, octave: 1, swing: 0.22 },
    festival: { bpm: 140, key: 0, scale: 'major', prog: [[0, 3, 4, 0], [0, 3, 4, 4]], lead: 'square', pad: 'triangle', drums: 'rock', melody: 1, octave: 1, swing: 0.1 },
    sad: { bpm: 64, key: 9, scale: 'minor', prog: [[0, 5, 3, 6], [0, 5, 4, 4]], lead: 'sine', pad: 'sine', drums: 'slow', melody: 0.4, octave: 1, swing: 0 },
    forest: { bpm: 90, key: 2, scale: 'dorian', prog: [[0, 3, 0, 6], [0, 3, 4, 4]], lead: 'triangle', pad: 'sine', drums: 'soft', melody: 0.65, octave: 1, swing: 0.12 },
    naval: { bpm: 156, key: 9, scale: 'minor', prog: [[0, 5, 6, 4], [0, 5, 3, 4]], lead: 'sawtooth', pad: 'square', drums: 'battle', melody: 0.9, octave: 1, swing: 0 },
    demon: { bpm: 84, key: 4, scale: 'phrygian', prog: [[0, 1, 0, 6], [0, 1, 3, 1]], lead: 'sawtooth', pad: 'sawtooth', drums: 'slow', melody: 0.5, octave: 0, swing: 0 },
  };
  const DRUMS = {
    rock: { k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
    soft: { k: 'x.......x.......', s: '........x.......', h: '..x...x...x...x.' },
    polka: { k: 'x...x...x...x...', s: '..x...x...x...x.', h: '................' },
    slow: { k: 'x...............', s: '........x.......', h: '....x.......x...' },
    battle: { k: 'x..x..x.x..x..x.', s: '....x.......x..x', h: 'xxxxxxxxxxxxxxxx' },
  };

  let ctx = null, out = null, timer = null, track = null, cur = null, step = 0, nextTime = 0, seed = 1;
  function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  function voice(freq, t, dur, type, vol, opts = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain(); let node = o;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (opts.vibrato) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.5; lg.gain.value = freq * 0.006; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.1); }
    if (opts.cutoff) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(opts.cutoff, t); f.Q.value = 0.7; o.connect(f); node = f; }
    const a = opts.attack || 0.01, r = opts.release || 0.08;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.setValueAtTime(vol, t + Math.max(a, dur - r)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + r);
    node.connect(g); g.connect(out); o.start(t); o.stop(t + dur + r + 0.05);
  }
  function noise(t, dur, vol, type, freq) {
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = buf; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t);
  }
  function kick(t) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.2); }

  // build a melody for a section: a motif of 8 steps repeated with variation, following chord tones
  function compose(T) {
    const sc = SCALE[T.scale]; const motif = [];
    for (let i = 0; i < 16; i++) motif.push(rand() < T.melody * (i % 4 === 0 ? 1 : 0.6) ? Math.floor(rand() * 5) - 1 : null);
    return { sc, motif, rhythm: motif.map(() => (rand() < 0.25 ? 2 : 1)) };
  }

  function schedule() {
    const T = cur; const spb = 60 / T.bpm / 4; // 16th note
    while (nextTime < ctx.currentTime + 0.2) {
      const bar = Math.floor(step / 16), s16 = step % 16; const sec = T.prog[Math.floor(bar / 4) % T.prog.length]; const deg = sec[bar % 4];
      const sc = track.sc; const rootSemi = T.key + sc[deg % 7] + (deg >= 7 ? 12 : 0);
      const t = nextTime + (s16 % 2 ? T.swing * spb : 0);
      // pad chord on the bar
      if (s16 === 0) for (const d of [0, 2, 4]) { const semi = T.key + sc[(deg + d) % 7] + Math.floor((deg + d) / 7) * 12 - 12; voice(N(semi), t, spb * 15, T.pad, 0.035, { cutoff: 1400, attack: 0.08, release: 0.3 }); }
      // bass
      const bassPat = T.drums === 'polka' ? [0, 8] : T.drums === 'battle' ? [0, 3, 6, 8, 11, 14] : [0, 6, 8, 12];
      if (bassPat.includes(s16)) voice(N(rootSemi - 24 + (T.drums === 'polka' && s16 === 8 ? 7 : 0)), t, spb * (T.drums === 'battle' ? 1.6 : 3), T.drums === 'battle' ? 'sawtooth' : 'triangle', 0.13, { cutoff: 700 });
      // arpeggio / off-beat chords for some styles
      if (T.drums === 'polka' && s16 % 4 === 2) for (const d of [2, 4]) voice(N(T.key + sc[(deg + d) % 7] + Math.floor((deg + d) / 7) * 12), t, spb * 1.2, 'square', 0.025, { cutoff: 2200 });
      if ((T.drums === 'rock' || T.drums === 'soft') && s16 % 2 === 0) { const d = [0, 2, 4, 2][(s16 / 2) % 4]; voice(N(T.key + sc[(deg + d) % 7] + Math.floor((deg + d) / 7) * 12 + 12), t, spb * 1.5, 'triangle', 0.028, { cutoff: 3000 }); }
      // lead melody (chord-aware)
      const m = track.motif[s16];
      if (m !== null && m !== undefined && !(bar % 8 === 7 && s16 > 8)) {
        const vary = bar % 2 === 1 && s16 >= 8 ? 1 : 0;
        const d2 = deg + [0, 2, 4, 5, 7][((m + vary) % 5 + 5) % 5];
        const semi = T.key + sc[d2 % 7] + Math.floor(d2 / 7) * 12 + 12 * T.octave;
        voice(N(semi), t, spb * (track.rhythm[s16] + 0.2), T.lead, T.lead === 'sine' ? 0.07 : 0.045, { vibrato: true, cutoff: T.lead === 'sawtooth' ? 2600 : 4200, attack: 0.015, release: 0.1 });
      }
      // drums
      const D = DRUMS[T.drums];
      if (D.k[s16] === 'x') kick(t);
      if (D.s[s16] === 'x') noise(t, 0.14, 0.22, 'bandpass', 1800);
      if (D.h[s16] === 'x') noise(t, 0.04, 0.05, 'highpass', 7000);
      if (bar % 4 === 3 && s16 >= 12 && T.drums !== 'slow') noise(t, 0.08, 0.12, 'bandpass', 1200 + s16 * 120); // fill
      nextTime += spb; step++;
    }
  }

  function play(name, audioCtx, dest) {
    ctx = audioCtx; out = dest;
    if (!TRACKS[name]) name = 'field';
    if (cur === TRACKS[name] && timer) return;
    stop();
    cur = TRACKS[name]; seed = 1 + Object.keys(TRACKS).indexOf(name) * 977 + Math.floor(Date.now() / 600000) % 5; track = compose(cur);
    step = 0; nextTime = ctx.currentTime + 0.08;
    timer = setInterval(schedule, 40);
  }
  function stop() { if (timer) clearInterval(timer); timer = null; cur = null; }
  ISK.music = { play, stop, TRACKS, current: () => cur };
})();
