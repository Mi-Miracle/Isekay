// Хроніки Дивосвіту v4 — anime opening drawn live on canvas: an overworked office worker, truck-kun,
// a portal, the pixel goddess who picked the wrong soul, a very honest status window, and the logo slam.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const SP = () => ISK.sprites;
  const EM = '"Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3));
  const clamp = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);

  // scenes: [start, end] seconds
  const SC = [
    { k: 'presents', a: 0, b: 1.8 },
    { k: 'office', a: 1.8, b: 4.6 },
    { k: 'street', a: 4.6, b: 7.0 },
    { k: 'void', a: 7.0, b: 8.6 },
    { k: 'goddess', a: 8.6, b: 11.6 },
    { k: 'status', a: 11.6, b: 14.2 },
    { k: 'logo', a: 14.2, b: 17.5 },
  ];
  const TOTAL = 17.5;

  function txt(g, s, x, y, size, col, opts = {}) {
    g.font = `${opts.w || 800} ${size}px ${opts.f || '"Segoe UI",sans-serif'}`; g.textAlign = opts.al || 'center'; g.textBaseline = 'middle';
    if (opts.stroke !== false) { g.lineWidth = opts.lw || Math.max(3, size / 7); g.strokeStyle = opts.sc || 'rgba(8,6,16,.9)'; g.strokeText(s, x, y); }
    g.fillStyle = col; g.fillText(s, x, y);
  }
  function bubble(g, s, x, y, size = 20, col = '#1a1020') {
    g.font = `700 ${size}px "Segoe UI",sans-serif`; const w = g.measureText(s).width + 26, h = size + 20;
    g.fillStyle = '#fff'; g.strokeStyle = '#1a1020'; g.lineWidth = 3;
    g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, 14); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x - 10, y + h / 2 - 1); g.lineTo(x - 22, y + h / 2 + 16); g.lineTo(x + 4, y + h / 2 - 1); g.fill(); g.stroke();
    g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y + 1);
  }
  function speedLines(g, W, H, t, col = 'rgba(255,255,255,.55)') {
    g.strokeStyle = col; g.lineWidth = 2;
    for (let i = 0; i < 46; i++) { const a = (i / 46) * Math.PI * 2 + t * 0.3; const r1 = Math.min(W, H) * (0.32 + ((i * 37) % 10) / 40), r2 = Math.max(W, H); g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1); g.lineTo(W / 2 + Math.cos(a) * r2, H / 2 + Math.sin(a) * r2); g.stroke(); }
  }

  let office = null;
  function officeHero() {
    if (office) return office;
    office = SP().hero({ race: 'human', gender: 'm', look: { hair: 1, hairColor: 0, eyes: 0, costume: 'c_school' }, equipment: {}, classes: {} });
    return office;
  }

  function draw(g, W, H, T) {
    const sc = SC.find((s) => T >= s.a && T < s.b) || SC[SC.length - 1]; const lt = T - sc.a, dur = sc.b - sc.a, k = lt / dur;
    g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false;
    const U = Math.min(W / 1280, H / 720);
    if (sc.k === 'presents') {
      g.fillStyle = '#05040a'; g.fillRect(0, 0, W, H);
      const a = Math.sin(clamp(k) * Math.PI);
      g.globalAlpha = a; txt(g, 'MI-MIRACLE ПРЕДСТАВЛЯЄ', W / 2, H / 2 - 10 * U, 30 * U, '#cfc3ff', { f: 'Georgia,serif', w: 600, stroke: false });
      txt(g, 'за участі вантажівки-куна та однієї неуважної богині', W / 2, H / 2 + 30 * U, 15 * U, '#8a82b0', { f: 'Georgia,serif', w: 400, stroke: false }); g.globalAlpha = 1;
    }
    if (sc.k === 'office') {
      // dark office at 3am
      g.fillStyle = '#121626'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#1b2036'; for (let i = 0; i < 6; i++) g.fillRect(i * W / 6 + 10, 60 * U, W / 6 - 20, H * 0.42);
      g.fillStyle = '#ffe9a0'; for (let i = 0; i < 18; i++) if ((i * 7) % 5 === 0) g.fillRect((i % 6) * W / 6 + 30 * U + (i % 3) * 40 * U, 90 * U + Math.floor(i / 6) * 80 * U, 18 * U, 24 * U);
      // desk
      const dy = H * 0.66; g.fillStyle = '#3a2a22'; g.fillRect(W * 0.2, dy, W * 0.6, 22 * U); g.fillRect(W * 0.22, dy + 22 * U, 16 * U, H * 0.3); g.fillRect(W * 0.76, dy + 22 * U, 16 * U, H * 0.3);
      // monitor glow
      const mx = W * 0.5, my = dy - 130 * U; const glow = g.createRadialGradient(mx, my, 10, mx, my, 360 * U); glow.addColorStop(0, 'rgba(120,180,255,.45)'); glow.addColorStop(1, 'rgba(120,180,255,0)'); g.fillStyle = glow; g.fillRect(0, 0, W, H);
      g.fillStyle = '#0a0c14'; g.fillRect(mx - 120 * U, my - 80 * U, 240 * U, 150 * U); g.fillStyle = '#8ac0ff'; g.fillRect(mx - 110 * U, my - 70 * U, 220 * U, 130 * U);
      g.fillStyle = '#ff5c6c'; g.fillRect(mx - 100 * U, my - 60 * U, 200 * U, 22 * U); txt(g, 'ДЕДЛАЙН: ВЧОРА', mx, my - 49 * U, 13 * U, '#fff', { stroke: false });
      g.fillStyle = '#2a4a7a'; for (let i = 0; i < 5; i++) g.fillRect(mx - 100 * U, my - 28 * U + i * 16 * U, (120 + ((i * 53) % 80)) * U, 8 * U);
      g.fillStyle = '#333'; g.fillRect(mx - 10 * U, my + 70 * U, 20 * U, 30 * U);
      // worker (tired bob)
      const hero = officeHero(); const hs = 150 * U; g.drawImage(hero, mx - 260 * U, dy - hs + 10 * U + Math.sin(T * 9) * 2, hs, hs);
      // coffee pile grows
      const cups = Math.min(17, Math.floor(k * 22) + 3); g.font = `${26 * U}px ${EM}`; g.textAlign = 'center';
      for (let i = 0; i < cups; i++) g.fillText('☕', W * 0.66 + (i % 5) * 26 * U, dy - 10 * U - Math.floor(i / 5) * 26 * U);
      txt(g, `☕ × ${cups}`, W * 0.72, dy - 150 * U, 22 * U, '#ffd36e');
      txt(g, '03:47', W * 0.12, 60 * U, 34 * U, '#ff5c6c', { f: 'monospace' });
      if (k > 0.25) bubble(g, k < 0.62 ? 'Ще один звіт… і я піду спати…' : 'Ще одна гра в обідню перерву…', mx - 180 * U, dy - 200 * U, 18 * U);
      if (k > 0.75) txt(g, 'Рівень втоми: 9999', W / 2, H - 50 * U, 22 * U, '#ff9ccc');
    }
    if (sc.k === 'street') {
      // night street, truck approaches, impact
      g.fillStyle = '#1a1838'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffe9a0'; for (let i = 0; i < 40; i++) g.fillRect((i * 97) % W, (i * 53) % (H * 0.4), 2, 2);
      g.fillStyle = '#26243e'; for (let i = 0; i < 9; i++) { const bh = (120 + (i * 71) % 160) * U; g.fillRect(i * W / 9, H * 0.68 - bh, W / 9 - 6, bh); }
      g.fillStyle = '#2e2e38'; g.fillRect(0, H * 0.68, W, H * 0.32); g.fillStyle = '#fff'; for (let i = 0; i < 12; i++) g.fillRect(i * W / 12 + 20, H * 0.82, W / 24, 6 * U);
      const hero = officeHero(); const hs = 130 * U; const walkX = W * 0.42 + k * 60 * U;
      const hitAt = 0.55; const hit = k >= hitAt;
      if (!hit) {
        g.drawImage(hero, walkX, H * 0.7 - hs - Math.abs(Math.sin(T * 8)) * 6 * U, hs, hs);
        g.font = `${34 * U}px ${EM}`; g.fillText('📱', walkX + hs * 0.8, H * 0.7 - hs * 0.55);
        if (k < 0.32) bubble(g, '«Ви звільнені 🙂» — ну класно', walkX + 60 * U, H * 0.7 - hs - 40 * U, 17 * U);
        // headlights & truck
        const tk = clamp((k - 0.25) / (hitAt - 0.25)); const tx = W + 260 * U - tk * (W + 260 * U - walkX - 40 * U);
        const lg = g.createRadialGradient(tx - 40 * U, H * 0.62, 10, tx - 40 * U, H * 0.62, 340 * U); lg.addColorStop(0, `rgba(255,240,180,${0.6 * tk})`); lg.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
        g.save(); g.translate(tx, H * 0.7); g.font = `${170 * U}px ${EM}`; g.textBaseline = 'bottom'; g.textAlign = 'center'; g.fillText('🚚', 0, 0); g.restore();
        if (tk > 0.3) txt(g, 'БІП-БІП!', tx, H * 0.7 - 190 * U, 34 * U, '#ffd36e');
        if (tk > 0.55) txt(g, '!!', walkX + hs / 2, H * 0.7 - hs - 26 * U, 48 * U, '#ff5c6c');
      } else {
        const kk = (k - hitAt) / (1 - hitAt);
        g.fillStyle = `rgba(255,255,255,${1 - kk * 0.7})`; g.fillRect(0, 0, W, H);
        speedLines(g, W, H, T, 'rgba(255,90,120,.6)');
        g.save(); g.translate(W / 2, H / 2); g.rotate(kk * 8); g.drawImage(hero, -hs / 2 - kk * 0, -hs / 2 - kk * 180 * U, hs, hs); g.restore();
        txt(g, 'КРИТИЧНИЙ УДАР!', W / 2, H * 0.22, 64 * U * (1 + Math.sin(kk * 20) * 0.04), '#ff5c6c', { f: 'Georgia,serif', w: 900 });
        txt(g, 'Вантажівка-кун завдає 9999 урону', W / 2, H * 0.22 + 60 * U, 24 * U, '#ffe7a6');
      }
    }
    if (sc.k === 'void') {
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      if (k < 0.45) txt(g, 'GAME OVER?', W / 2, H / 2, 54 * U, '#888', { f: 'monospace', stroke: false });
      else {
        const kk = (k - 0.45) / 0.55;
        for (let r = 0; r < 14; r++) { g.strokeStyle = `hsla(${300 - r * 14 + T * 120},90%,70%,${0.7 - r * 0.04})`; g.lineWidth = 6 * U; g.beginPath(); g.arc(W / 2, H / 2, (20 + r * 26) * U * ease(kk), T * 3 + r, T * 3 + r + Math.PI * 1.4); g.stroke(); }
        txt(g, '…а ось і ні!', W / 2, H * 0.85, 26 * U, '#ffb0e0');
        const hero = officeHero(); const hs = 90 * U * (1 - kk * 0.6); g.save(); g.translate(W / 2, H / 2); g.rotate(T * 6); g.drawImage(hero, -hs / 2, -hs / 2, hs, hs); g.restore();
      }
    }
    if (sc.k === 'goddess') {
      const bg = g.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H * 0.4, Math.max(W, H)); bg.addColorStop(0, '#fff3fb'); bg.addColorStop(0.45, '#d8b8ff'); bg.addColorStop(1, '#5a3a9a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 30; i++) { const x = (i * 131 + T * 30) % W, y = (i * 73 + Math.sin(T + i) * 20) % H; g.fillRect(x, y, 4, 4); }
      const expr = k < 0.38 ? 'happy' : k < 0.7 ? 'shock' : 'wink';
      const gs = 300 * U; const gx = W / 2 - gs / 2, gy = H * 0.12 + Math.sin(T * 2) * 6 * U;
      g.drawImage(SP().goddess(expr), gx, gy, gs, gs);
      if (expr === 'shock') { speedLines(g, W, H, T, 'rgba(255,90,160,.25)'); txt(g, '!?', gx + gs * 0.95, gy + 30 * U, 60 * U, '#ff5c9c'); }
      const line = k < 0.38 ? 'Вітаю, обраний герою! Твоя доля…' : k < 0.7 ? 'Ой. ОЙ. Це не той файл. Я ж замовляла лицаря!' : 'Ну… повернення товару не передбачене. Удачі! ✨';
      g.fillStyle = 'rgba(20,10,40,.85)'; g.beginPath(); g.roundRect(W * 0.12, H * 0.72, W * 0.76, 110 * U, 16 * U); g.fill(); g.strokeStyle = '#ff9ccc'; g.lineWidth = 3; g.stroke();
      txt(g, 'Богиня Люмі', W * 0.12 + 24 * U, H * 0.72 + 22 * U, 18 * U, '#ff9ccc', { al: 'left', stroke: false });
      const shown = line.slice(0, Math.floor(line.length * clamp(((k * 3) % 1) * 1.6 + (k > 0.9 ? 1 : 0))));
      txt(g, shown, W / 2, H * 0.72 + 64 * U, 24 * U, '#fff', { f: 'Georgia,serif', w: 600, stroke: false });
    }
    if (sc.k === 'status') {
      g.fillStyle = '#0b1230'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(111,227,255,.12)'; g.lineWidth = 1; for (let x = 0; x < W; x += 40 * U) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 40 * U) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      const pw = 620 * U, ph = 400 * U, px = W / 2 - pw / 2, py = H / 2 - ph / 2; const op = ease(k * 3);
      g.save(); g.globalAlpha = op; g.translate(W / 2, H / 2); g.scale(0.85 + op * 0.15, 0.85 + op * 0.15); g.translate(-W / 2, -H / 2);
      g.fillStyle = 'rgba(30,60,120,.88)'; g.beginPath(); g.roundRect(px, py, pw, ph, 14 * U); g.fill(); g.strokeStyle = '#6fe3ff'; g.lineWidth = 3; g.stroke();
      txt(g, '— СТАТУС —', W / 2, py + 34 * U, 26 * U, '#6fe3ff', { f: 'monospace' });
      const rows = [['Ім’я', '???'], ['Рівень', '1'], ['Сила', '5'], ['Магія', '5'], ['Удача', '5 (після вантажівки — сумнівно)'], ['Харизма', '−2'], ['Вміння', '«Пережити дедлайн»'], ['Титул', 'Перероджений (випадково)']];
      rows.forEach(([a, b], i) => { if (k * 9 > i + 1) { txt(g, a, px + 40 * U, py + 84 * U + i * 36 * U, 20 * U, '#bfe9ff', { al: 'left', f: 'monospace', stroke: false }); txt(g, b, px + 230 * U, py + 84 * U + i * 36 * U, 20 * U, i === 5 ? '#ff7e9a' : '#fff', { al: 'left', f: 'monospace', stroke: false }); } });
      g.restore();
      if (k > 0.85) txt(g, 'ВСЕ ПО П’ЯТЬ?!', W / 2, py + ph + 40 * U, 44 * U, '#ffd36e', { f: 'Georgia,serif', w: 900 });
    }
    if (sc.k === 'logo') {
      const bg = g.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * 0.7); bg.addColorStop(0, '#2a1650'); bg.addColorStop(1, '#05040a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 80; i++) { const a = i * 2.4 + T, r = ((i * 37) % 100) / 100 * Math.max(W, H) * 0.6 * ease(k * 2); g.fillStyle = `rgba(255,${180 + (i % 60)},230,${0.6 - (i % 5) * 0.1})`; g.fillRect(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r, 3, 3); }
      const s = 1 + (1 - ease(k * 2.5)) * 1.6; g.save(); g.translate(W / 2, H * 0.42); g.scale(s, s);
      g.shadowColor = '#ff7eb6'; g.shadowBlur = 30; txt(g, 'ХРОНІКИ', 0, -40 * U, 76 * U, '#ffe7a6', { f: 'Georgia,serif', w: 900 }); txt(g, 'ДИВОСВІТУ', 0, 46 * U, 96 * U, '#ff9ccc', { f: 'Georgia,serif', w: 900 }); g.shadowBlur = 0; g.restore();
      if (k > 0.35) { g.globalAlpha = ease((k - 0.35) * 3); txt(g, '«Перероджений в іншому світі… знову. Цього разу — з картою.»', W / 2, H * 0.62, 20 * U, '#e9e0ff', { f: 'Georgia,serif', w: 400, stroke: false }); g.globalAlpha = 1; }
      // cast line-up
      if (k > 0.45) {
        const cast = [SP().goddess('wink'), SP().monster('slime'), officeHero(), SP().monster('goblin'), SP().monster('drake')];
        cast.forEach((cv, i) => { const kk = ease((k - 0.45 - i * 0.06) * 4); const cs = 96 * U; const x = W / 2 + (i - 2) * 130 * U - cs / 2; const y = H * 0.7 + (1 - kk) * 200 * U + Math.abs(Math.sin(T * 4 + i)) * -8 * U; g.drawImage(cv, x, y, cs, cs); });
      }
      if (k > 0.8) txt(g, 'Розробник: Mi-Miracle · Twitch: mi_miracle', W / 2, H - 26 * U, 14 * U, 'rgba(255,255,255,.55)', { w: 600, stroke: false });
    }
  }

  // play(container) → Promise; resolves on finish or skip. opts.at: render a single frame at second N (screenshots)
  function play(el, opts = {}) {
    return new Promise((resolve) => {
      el.innerHTML = ''; el.classList.remove('hidden');
      const cv = document.createElement('canvas'); cv.className = 'intro-cv'; el.appendChild(cv);
      const skip = document.createElement('div'); skip.className = 'intro-skip'; skip.textContent = 'клікни або натисни будь-яку клавішу, щоб пропустити'; el.appendChild(skip);
      const g = cv.getContext('2d'); let done = false; const t0 = performance.now();
      const fit = () => { cv.width = el.clientWidth || innerWidth; cv.height = el.clientHeight || innerHeight; };
      fit(); window.addEventListener('resize', fit);
      const finish = () => { if (done) return; done = true; window.removeEventListener('resize', fit); window.removeEventListener('keydown', finish); el.classList.add('fade'); setTimeout(() => { el.classList.add('hidden'); el.classList.remove('fade'); el.innerHTML = ''; resolve(); }, 500); };
      if (opts.at !== undefined) { draw(g, cv.width, cv.height, opts.at); resolve(); return; }
      el.addEventListener('click', finish); window.addEventListener('keydown', finish);
      if (ISK.audio && ISK.audio.play) try { ISK.audio.play('goddess'); } catch (e) { /* audio may be locked */ }
      (function frame() { if (done) return; const T = (performance.now() - t0) / 1000; if (T >= TOTAL) return finish(); draw(g, cv.width, cv.height, T); requestAnimationFrame(frame); })();
    });
  }
  ISK.intro = { play, draw, SC, TOTAL };
})();
