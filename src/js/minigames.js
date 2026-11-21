// Profession minigames. Each returns a Promise resolving to a quality score (0 … ~1.2).
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = () => ISK.ui;
  const h = (...a) => ISK.ui.h(...a);
  const A = () => ISK.audio;

  function shell(title, hint, content, onClose) {
    UI().inMinigame = true;
    const res = h('div', { class: 'mg-res' });
    const card = h('div', { class: 'mg-card' }, h('h2', null, title), h('div', { class: 'hint' }, hint), content, res);
    const root = h('div', { class: 'mg' }, card);
    document.body.appendChild(root);
    return {
      root, card, res,
      close(q, text, ms = 1100) {
        res.textContent = text;
        setTimeout(() => { root.remove(); UI().inMinigame = false; onClose && onClose(q); }, ms);
      },
    };
  }

  // Test hook: in self-test mode minigames resolve instantly with a fixed quality
  function auto() { return globalThis.ISK_AUTOPLAY ? Promise.resolve(globalThis.ISK_AUTOPLAY) : null; }

  // 🎣 Fishing: keep the catch zone over the fish (hold space/mouse)
  function fishing(lvl) {
    return auto() || new Promise((resolve) => {
      const W = 120, H = 380;
      const cv = h('canvas', { width: W, height: H });
      const prog = h('div', { class: 'prog', style: { width: '320px', margin: '10px auto' } }, h('div', { style: { width: '0%' } }));
      const s = shell('🎣 Рибалка', 'Тримай ПРОБІЛ або кнопку миші, щоб підняти зелену зону. Тримай рибу в зоні!', h('div', null, cv, prog), resolve);
      const g = cv.getContext('2d');
      const zoneH = 70 + Math.min(50, lvl * 2);
      let zy = H - zoneH, zv = 0, fy = H / 2, fv = 0, catchP = 0.25, hold = false, t0 = performance.now(), last = t0, done = false;
      const fishSpeed = 1.6 + Math.random() * 1.2;
      const fishIcon = ['🐟', '🐠', '🐡', '🦑'][Math.floor(Math.random() * 4)];
      const down = (e) => { if (!e.code || e.code === 'Space') { hold = true; if (e.preventDefault) e.preventDefault(); } };
      const up = (e) => { if (!e.code || e.code === 'Space') hold = false; };
      window.addEventListener('keydown', down); window.addEventListener('keyup', up); cv.addEventListener('mousedown', down); window.addEventListener('mouseup', up);
      A().play('splash');
      function frame(t) {
        if (done) return;
        const dt = Math.min(0.05, (t - last) / 1000); last = t;
        zv += (hold ? -900 : 700) * dt; zv *= 0.92; zy += zv * dt;
        if (zy < 0) { zy = 0; zv = 0; } if (zy > H - zoneH) { zy = H - zoneH; zv = 0; }
        if (Math.random() < 0.03 * fishSpeed) fv = (Math.random() - 0.5) * 520 * fishSpeed;
        fv *= 0.97; fy += fv * dt; if (fy < 15) { fy = 15; fv = Math.abs(fv); } if (fy > H - 15) { fy = H - 15; fv = -Math.abs(fv); }
        const inZone = fy > zy && fy < zy + zoneH;
        catchP += (inZone ? 0.28 : -0.2) * dt;
        catchP = Math.max(0, Math.min(1, catchP));
        prog.firstChild.style.width = (catchP * 100) + '%';
        g.fillStyle = '#123b66'; g.fillRect(0, 0, W, H);
        for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, (i * 53 + t / 20) % H, W, 2); }
        g.fillStyle = inZone ? 'rgba(89,227,154,0.55)' : 'rgba(89,227,154,0.3)'; g.fillRect(10, zy, W - 20, zoneH);
        g.strokeStyle = '#59e39a'; g.lineWidth = 2; g.strokeRect(10, zy, W - 20, zoneH);
        g.font = '30px "Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(fishIcon, W / 2, fy);
        const elapsed = (t - t0) / 1000;
        if (catchP >= 1 || catchP <= 0 || elapsed > 18) {
          done = true; cleanup();
          const q = catchP >= 1 ? 1 + Math.max(0, (12 - elapsed) / 30) : catchP <= 0 ? 0.1 : catchP * 0.8;
          A().play(q >= 1 ? 'coin' : 'error');
          s.close(q, q >= 1 ? '🎉 Спіймано!' : catchP <= 0 ? '💨 Риба зірвалася...' : 'Час вийшов. Щось дрібне все ж клюнуло.');
          return;
        }
        requestAnimationFrame(frame);
      }
      function cleanup() { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('mouseup', up); }
      requestAnimationFrame(frame);
    });
  }

  // ⛏️ Mining: click when the shrinking ring matches the target ring (5 strikes)
  function mining(lvl, opts = {}) {
    return auto() || new Promise((resolve) => {
      const S = 320; const cv = h('canvas', { width: S, height: S });
      const info = h('div', { style: { marginTop: '8px' } }, 'Удари: 0/5');
      const s = shell(opts.title || '⛏️ Видобуток руди', opts.hint || 'Клікай / ПРОБІЛ, коли біле кільце співпаде з золотим.', h('div', null, cv, info), resolve);
      const g = cv.getContext('2d');
      let strikes = 0, score = 0, r = 140, cracks = [], t0 = performance.now(), last = t0, done = false;
      const target = 46; const speed = 120 - Math.min(40, lvl * 1.5);
      function hit() {
        if (done) return;
        const diff = Math.abs(r - target);
        const pts = diff < 6 ? 1.2 : diff < 14 ? 0.85 : diff < 26 ? 0.45 : 0.05;
        score += pts; strikes++;
        A().play(pts > 0.8 ? 'clang' : 'hit');
        for (let i = 0; i < 2 + pts * 4; i++) cracks.push([Math.random() * Math.PI * 2, 20 + Math.random() * 60]);
        info.textContent = `Удари: ${strikes}/5 · ${pts >= 1.2 ? 'ІДЕАЛЬНО!' : pts > 0.8 ? 'Добре' : pts > 0.4 ? 'Так собі' : 'Мимо'}`;
        r = 140;
        if (strikes >= 5) { done = true; cleanup(); const q = score / 5; s.close(q, q > 1 ? '💎 Чудовий видобуток!' : q > 0.6 ? 'Непогано!' : 'Камінь виявився впертим.'); }
      }
      const key = (e) => { if (e.code === 'Space') { e.preventDefault(); hit(); } };
      window.addEventListener('keydown', key); cv.addEventListener('mousedown', hit);
      function cleanup() { window.removeEventListener('keydown', key); }
      function frame(t) {
        if (done) return;
        const dt = (t - last) / 1000; last = t;
        r -= speed * dt; if (r < 10) r = 140;
        g.fillStyle = '#1b1722'; g.fillRect(0, 0, S, S);
        g.fillStyle = '#6b5e55'; g.beginPath(); g.arc(S / 2, S / 2, 80, 0, 7); g.fill();
        g.fillStyle = '#857668'; g.beginPath(); g.arc(S / 2 - 20, S / 2 - 20, 40, 0, 7); g.fill();
        g.strokeStyle = '#2a2220'; g.lineWidth = 2;
        for (const [a, l] of cracks) { g.beginPath(); g.moveTo(S / 2, S / 2); g.lineTo(S / 2 + Math.cos(a) * l, S / 2 + Math.sin(a) * l); g.stroke(); }
        g.strokeStyle = '#f2c45a'; g.lineWidth = 6; g.beginPath(); g.arc(S / 2, S / 2, target, 0, 7); g.stroke();
        g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(S / 2, S / 2, r, 0, 7); g.stroke();
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  // 🌿 Herbs: click glowing herbs, avoid poison mushrooms
  function herbs(lvl) {
    return auto() || new Promise((resolve) => {
      const W = 520, H = 320; const cv = h('canvas', { width: W, height: H });
      const info = h('div', { style: { marginTop: '8px' } }, 'Зібрано: 0');
      const s = shell('🌿 Збір трав', 'Клікай на трави, поки вони не зникли. Не чіпай отруйні гриби 🍄!', h('div', null, cv, info), resolve);
      const g = cv.getContext('2d');
      let items = [], got = 0, bad = 0, t0 = performance.now(), last = t0, done = false, spawned = 0;
      const life = 1.5 + Math.min(1, lvl * 0.05);
      cv.addEventListener('mousedown', (e) => {
        const rc = cv.getBoundingClientRect(); const x = (e.clientX - rc.left) * (W / rc.width), y = (e.clientY - rc.top) * (H / rc.height);
        for (const it of items) {
          if (it.dead || Math.hypot(it.x - x, it.y - y) > 28) continue;
          it.dead = true;
          if (it.poison) { bad++; A().play('error'); } else { got++; A().play('bubble'); }
          info.textContent = `Зібрано: ${got}${bad ? ` · отрута: ${bad}` : ''}`;
          break;
        }
      });
      function frame(t) {
        if (done) return;
        const el = (t - t0) / 1000; last = t;
        if (spawned < 16 && el > spawned * 0.7) {
          spawned++;
          items.push({ x: 40 + Math.random() * (W - 80), y: 40 + Math.random() * (H - 80), born: el, poison: Math.random() < 0.25, icon: ['🌿', '🌸', '🌱', '🍀'][Math.floor(Math.random() * 4)] });
        }
        g.fillStyle = '#2f5a32'; g.fillRect(0, 0, W, H);
        for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(20,50,20,0.5)'; const xx = (i * 97) % W, yy = (i * 53) % H; g.fillRect(xx, yy, 3, 8); }
        for (const it of items) {
          if (it.dead) continue;
          const age = el - it.born; if (age > life) { it.dead = true; continue; }
          const a = 1 - age / life;
          if (!it.poison) { g.beginPath(); g.arc(it.x, it.y, 24, 0, 7); g.fillStyle = `rgba(255,255,180,${0.25 * a})`; g.fill(); }
          g.globalAlpha = Math.min(1, a * 2); g.font = '34px "Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji"'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(it.poison ? '🍄' : it.icon, it.x, it.y); g.globalAlpha = 1;
        }
        if (el > 16 * 0.7 + life + 0.2) {
          done = true; const good = spawned - items.filter((i) => i.poison).length;
          const q = Math.max(0, (got - bad * 1.5) / Math.max(1, good)) * 1.15;
          s.close(q, q > 0.9 ? '🌸 Ідеальний збір!' : q > 0.5 ? 'Непоганий урожай.' : 'Більшість трав утекла. Вони що, бігають?');
          return;
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  // ⚒️ Forge: hit the hot zone with an accelerating hammer pointer (5 strikes)
  function forge(tier) {
    return auto() || new Promise((resolve) => {
      const W = 520, H = 120; const cv = h('canvas', { width: W, height: H });
      const info = h('div', { style: { marginTop: '8px' } }, 'Удари молотом: 0/5');
      const s = shell('⚒️ Ковальня', 'ПРОБІЛ / клік, коли молот над розпеченою зоною. Зона звужується!', h('div', null, cv, info), resolve);
      const g = cv.getContext('2d');
      let x = 0, dir = 1, strikes = 0, score = 0, done = false, last = performance.now(), sparks = [];
      let zoneW = 120 - tier * 10, zoneX = W / 2 - zoneW / 2;
      let speed = 340 + tier * 40;
      function strike() {
        if (done) return;
        const inGold = x > zoneX + zoneW * 0.35 && x < zoneX + zoneW * 0.65;
        const inZone = x > zoneX && x < zoneX + zoneW;
        const pts = inGold ? 1.2 : inZone ? 0.8 : 0.1;
        score += pts; strikes++; A().play('clang');
        for (let i = 0; i < 14; i++) sparks.push({ x, y: 70, vx: (Math.random() - 0.5) * 300, vy: -Math.random() * 300, l: 0.6 });
        info.textContent = `Удари молотом: ${strikes}/5 · ${inGold ? 'ІДЕАЛЬНО!' : inZone ? 'Добре' : 'Криво...'}`;
        zoneW = Math.max(40, zoneW - 12); zoneX = 40 + Math.random() * (W - 80 - zoneW); speed += 40;
        if (strikes >= 5) { done = true; cleanup(); const q = score / 5; s.close(q, q > 1 ? '🔥 Шедевр!' : q > 0.6 ? 'Добротна робота.' : 'Ну... воно тримається купи.'); }
      }
      const key = (e) => { if (e.code === 'Space') { e.preventDefault(); strike(); } };
      window.addEventListener('keydown', key); cv.addEventListener('mousedown', strike);
      function cleanup() { window.removeEventListener('keydown', key); }
      function frame(t) {
        if (done && !sparks.length) return;
        const dt = Math.min(0.05, (t - last) / 1000); last = t;
        if (!done) { x += dir * speed * dt; if (x > W - 10) { x = W - 10; dir = -1; } if (x < 10) { x = 10; dir = 1; } }
        g.fillStyle = '#1a1214'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#3a2a28'; g.fillRect(10, 64, W - 20, 30);
        const grd = g.createLinearGradient(zoneX, 0, zoneX + zoneW, 0);
        grd.addColorStop(0, '#ff5a1f'); grd.addColorStop(0.5, '#ffe9a0'); grd.addColorStop(1, '#ff5a1f');
        g.fillStyle = grd; g.fillRect(zoneX, 64, zoneW, 30);
        g.font = '40px "Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji"'; g.textAlign = 'center'; g.fillText('🔨', x, 52);
        for (const sp of sparks) { sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vy += 600 * dt; sp.l -= dt; g.fillStyle = `rgba(255,200,80,${Math.max(0, sp.l)})`; g.fillRect(sp.x, sp.y, 3, 3); }
        sparks = sparks.filter((s2) => s2.l > 0);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  // ⚗️ Alchemy: repeat the ingredient sequence (Simon)
  function alchemy(rlvl) {
    return auto() || new Promise((resolve) => {
      const icons = [['🌿', '#2f7a3a'], ['🔥', '#9a3a20'], ['💧', '#2a5aa0'], ['✨', '#7a4aa0']];
      const grid = h('div', { class: 'simon' });
      const btns = icons.map(([ic, col], i) => h('button', { style: { background: col }, onclick: () => press(i) }, ic));
      btns.forEach((b) => grid.appendChild(b));
      const info = h('div', null, 'Запам\'ятай послідовність...');
      const s = shell('⚗️ Алхімія', 'Повтори послідовність інгредієнтів. Кожна помилка псує зілля!', h('div', null, grid, info), resolve);
      const len = 4 + Math.min(4, Math.floor(rlvl / 4));
      const seq = Array.from({ length: len }, () => Math.floor(Math.random() * 4));
      let idx = 0, errors = 0, accepting = false;
      (async () => {
        await UI().sleep(500);
        for (const i of seq) { btns[i].classList.add('lit'); A().play('bubble'); await UI().sleep(420); btns[i].classList.remove('lit'); await UI().sleep(160); }
        info.textContent = 'Твоя черга!'; accepting = true;
      })();
      function press(i) {
        if (!accepting) return;
        btns[i].classList.add('lit'); setTimeout(() => btns[i].classList.remove('lit'), 150);
        if (seq[idx] === i) { A().play('bubble'); idx++; }
        else { errors++; A().play('error'); info.textContent = `Помилка! (${errors})`; idx++; }
        if (idx >= seq.length || errors >= 3) {
          accepting = false;
          const q = errors === 0 ? 1.05 : errors === 1 ? 0.7 : errors === 2 ? 0.4 : 0.1;
          s.close(q, q > 1 ? '✨ Ідеальна суміш! (подвійна порція)' : q > 0.5 ? 'Зілля вийшло.' : 'Колба задимілася... пахне шкарпетками.');
        }
      }
    });
  }

  // 🍳 Cooking: arrow-key QTE
  function cooking(rlvl) {
    return auto() || new Promise((resolve) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      const sym = { ArrowUp: '⬆️', ArrowDown: '⬇️', ArrowLeft: '⬅️', ArrowRight: '➡️' };
      const easy = UI().G.player.cheat === 'cook';
      const len = 5 + Math.min(4, Math.floor(rlvl / 4));
      const seq = Array.from({ length: len }, () => keys[Math.floor(Math.random() * 4)]);
      const row = h('div', { class: 'qte' }, seq.map((k) => h('span', null, sym[k])));
      const timer = h('div', { class: 'prog', style: { width: '360px', margin: '0 auto' } }, h('div', { style: { width: '100%' } }));
      const pad = h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '10px' } }, keys.map((k) => h('button', { class: 'btn', onclick: () => press(k) }, sym[k])));
      const s = shell('🍳 Готування', 'Натискай стрілки (або кнопки) у правильному порядку, поки не підгоріло!', h('div', null, row, timer, pad), resolve);
      let idx = 0, err = 0, done = false;
      const total = (easy ? 8 : 5.5) + len * 0.4; const t0 = performance.now();
      row.children[0].classList.add('cur');
      const key = (e) => { if (keys.includes(e.key)) { e.preventDefault(); press(e.key); } };
      window.addEventListener('keydown', key);
      function press(k) {
        if (done) return;
        const el = row.children[idx];
        el.classList.remove('cur');
        if (k === seq[idx]) { el.classList.add('ok'); A().play('bubble'); } else { el.classList.add('bad'); err++; A().play('error'); }
        idx++;
        if (idx < seq.length) row.children[idx].classList.add('cur'); else finish();
      }
      function finish() {
        if (done) return; done = true; window.removeEventListener('keydown', key);
        const missing = seq.length - idx;
        const q = Math.max(0, 1.05 - (err + missing) * (easy ? 0.15 : 0.25));
        s.close(q, q > 1 ? '👨‍🍳 Шедевр кулінарії!' : q > 0.5 ? 'Смачно!' : 'Підгоріло. Але голодний герой з\'їсть усе.');
      }
      (function tick() { if (done) return; const f = 1 - (performance.now() - t0) / 1000 / total; timer.firstChild.style.width = Math.max(0, f * 100) + '%'; if (f <= 0) finish(); else requestAnimationFrame(tick); })();
    });
  }

  // 🗝️ Lockpicking: stop the rotating pick in the sweet spot, 3 pins
  function lockpick(diff = 1) {
    return auto() || new Promise((resolve) => {
      const S = 300; const cv = h('canvas', { width: S, height: S });
      const info = h('div', { style: { marginTop: '8px' } }, 'Штифти: 0/3');
      const s = shell('🗝️ Злам замка', 'ПРОБІЛ / клік, коли відмичка в зеленій зоні. Три штифти — три спроби кожен.', h('div', null, cv, info), resolve);
      const g = cv.getContext('2d');
      let pins = 0, fails = 0, ang = 0, done = false, last = performance.now();
      let zone = Math.random() * Math.PI * 2; const zw = Math.max(0.28, 0.6 - diff * 0.06);
      let speed = 2.6 + diff * 0.3;
      function tryPin() {
        if (done) return;
        let d = Math.abs(((ang - zone) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
        if (d < zw / 2) { pins++; A().play('clang'); zone = Math.random() * Math.PI * 2; speed += 0.6; }
        else { fails++; A().play('error'); }
        info.textContent = `Штифти: ${pins}/3 · промахи: ${fails}`;
        if (pins >= 3 || fails >= 4) { done = true; cleanup(); const q = pins >= 3 ? Math.max(0.6, 1.2 - fails * 0.15) : pins * 0.15; s.close(q, pins >= 3 ? '🔓 Відчинено!' : '🔒 Відмичка зламалася. Скриня відкрилася... ломом.'); }
      }
      const key = (e) => { if (e.code === 'Space') { e.preventDefault(); tryPin(); } };
      window.addEventListener('keydown', key); cv.addEventListener('mousedown', tryPin);
      function cleanup() { window.removeEventListener('keydown', key); }
      function frame(t) {
        if (done) return;
        const dt = (t - last) / 1000; last = t; ang += speed * dt;
        g.fillStyle = '#16121c'; g.fillRect(0, 0, S, S);
        g.fillStyle = '#b08a3a'; g.beginPath(); g.arc(S / 2, S / 2, 110, 0, 7); g.fill();
        g.fillStyle = '#2a2018'; g.beginPath(); g.arc(S / 2, S / 2, 92, 0, 7); g.fill();
        g.strokeStyle = '#59e39a'; g.lineWidth = 14; g.beginPath(); g.arc(S / 2, S / 2, 100, zone - zw / 2, zone + zw / 2); g.stroke();
        g.strokeStyle = '#e8e8f0'; g.lineWidth = 4; g.beginPath(); g.moveTo(S / 2, S / 2); g.lineTo(S / 2 + Math.cos(ang) * 104, S / 2 + Math.sin(ang) * 104); g.stroke();
        for (let i = 0; i < 3; i++) { g.fillStyle = i < pins ? '#59e39a' : '#555'; g.beginPath(); g.arc(S / 2 - 30 + i * 30, S / 2, 9, 0, 7); g.fill(); }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  // 🎲 Tavern dice game
  function dice() {
    const p = UI().G.player;
    const bets = [10, 50, 100];
    const area = h('div', { class: 'qte', style: { fontSize: '54px' } }, h('span', null, '🎲'), h('span', null, '🎲'));
    const npcArea = h('div', { class: 'qte', style: { fontSize: '54px' } }, h('span', null, '🎲'), h('span', null, '🎲'));
    const btns = h('div', { class: 'row', style: { justifyContent: 'center' } });
    const s = shell('🎲 Кості з п\'яничкою Гриньом', '«Хто викине більше — забирає все! Гик!» (Твої кубики зверху, Гриня — знизу)', h('div', null, area, h('div', { class: 'muted' }, '— проти —'), npcArea, btns), () => UI().refresh());
    const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    const render = () => {
      btns.innerHTML = '';
      for (const b of bets) btns.appendChild(h('button', { class: 'btn', disabled: p.gold < b, onclick: () => roll(b) }, `Ставка ${b} 🪙`));
      btns.appendChild(h('button', { class: 'btn ghost', onclick: () => s.close(0, 'Гриня: «Боягуз! Гик!»', 600) }, 'Піти'));
    };
    async function roll(bet) {
      btns.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      let a, c;
      for (let i = 0; i < 10; i++) {
        a = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]; c = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
        area.children[0].textContent = faces[a[0] - 1]; area.children[1].textContent = faces[a[1] - 1];
        npcArea.children[0].textContent = faces[c[0] - 1]; npcArea.children[1].textContent = faces[c[1] - 1];
        A().play('click'); await UI().sleep(70);
      }
      const luck = ISK.player.derived(p).s.luk;
      let sa = a[0] + a[1], sc = c[0] + c[1];
      if (sa < sc && Math.random() < luck * 0.006) { sa = sc + 1; s.res.textContent = '🍀 Удача! Кубик дивом перевернувся!'; await UI().sleep(600); }
      if (sa > sc) { p.gold += bet; p.stat.dice = (p.stat.dice || 0) + 1; A().play('coin'); s.res.textContent = `Ти виграв ${bet} 🪙! (${sa} проти ${sc}) Гриня плаче в кухоль.`; }
      else if (sa < sc) { p.gold -= bet; A().play('error'); s.res.textContent = `Ти програв ${bet} 🪙 (${sa} проти ${sc}). Гриня танцює на столі.`; }
      else s.res.textContent = `Нічия (${sa})! Гриня: «Ще раз! Гик!»`;
      UI().refresh(); render();
    }
    render();
  }

  ISK.minigames = { fishing, mining, herbs, forge, alchemy, cooking, lockpick, dice };
})();
