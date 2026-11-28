// v5.8: рушій локацій — мапа міста/села (заклади як будівлі), подвір'я, дім зсередини (кімнати), власні землі; камера за героєм, WASD, підхід до об'єктів.
// Хроніки Дивосвіту v4 — Estate scenes: your house and your own lands open as separate hand-drawn pixel maps.
// House: cottage that grows with upgrades, garden beds with growing crops, chest, well, forge, stable, pets & family walking.
// Land: a village with your manor, every building you constructed, empty lots to build, fields, peasants, soldiers, walls.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = () => ISK.ui, D = () => ISK.data, SP = () => ISK.sprites, PL = () => ISK.player, GM = () => ISK.game, A = () => ISK.audio;
  const T = 32; let COLS = 30, ROWS = 17;
  let st = null;

  function hash(a, b) { let h = (a * 374761393 + b * 668265263) >>> 0; h = ((h ^ (h >> 13)) * 1274126177) >>> 0; return (h ^ (h >> 16)) >>> 0; }
  const season = () => { const G = UI().G; return ISK.life ? ISK.life.environment(G).seasonIdx : 1; };

  // ---- tile painting ----
  function grassColor(x, y, s) {
    const v = hash(x, y) % 4;
    if (s === 3) return ['#e8eef6', '#dde6f2', '#f2f6fb', '#d4dfec'][v];
    if (s === 2) return ['#7a9a3a', '#8aa040', '#9a8a3a', '#6e8e36'][v];
    return ['#5fae4a', '#55a344', '#68b552', '#4e9a40'][v];
  }
  function drawGround(g, s, kind) {
    if (kind === 'home') return homeGround(g, s);
    if (kind === 'town') return townGround(g, s);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      g.fillStyle = grassColor(x, y, s); g.fillRect(x * T, y * T, T, T);
      const r = hash(x + 7, y + 3) % 9;
      if (r === 0 && s !== 3) { g.fillStyle = s === 2 ? '#c06a2a' : '#ffe36e'; g.fillRect(x * T + 8, y * T + 10, 3, 3); g.fillRect(x * T + 20, y * T + 22, 3, 3); }
      if (r === 1) { g.fillStyle = s === 3 ? '#c8d4e4' : '#3e8a36'; g.fillRect(x * T + 14, y * T + 6, 2, 6); g.fillRect(x * T + 11, y * T + 9, 8, 2); }
    }
    // path
    g.fillStyle = s === 3 ? '#c4b8a4' : '#c9a66b';
    const py = kind === 'land' ? 8 : 11;
    for (let x = 0; x < COLS; x++) { g.fillRect(x * T, py * T + 6, T, T - 12); if (hash(x, 99) % 3 === 0) { g.fillStyle = '#a8864e'; g.fillRect(x * T + 6, py * T + 12, 4, 3); g.fillStyle = s === 3 ? '#c4b8a4' : '#c9a66b'; } }
    if (kind === 'land') for (let y = 0; y < ROWS; y++) g.fillRect(15 * T + 6, y * T, T - 12, T);
    // trees around edges
    for (let x = 0; x < COLS; x++) for (const y of [0, ROWS - 1]) if (hash(x, y) % 3 === 0) tree(g, x * T, y * T, s);
    for (let y = 1; y < ROWS - 1; y++) for (const x of [0, COLS - 1]) if (hash(x, y) % 2 === 0) tree(g, x * T, y * T, s);
  }
  function tree(g, x, y, s) {
    g.fillStyle = '#5a3a1e'; g.fillRect(x + 13, y + 18, 6, 12);
    const leaf = s === 3 ? '#f4f8fc' : s === 2 ? '#d07a2a' : '#2e7a32';
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + 16, y + 29, 12, 4, 0, 0, 7); g.fill();
    g.fillStyle = leaf; g.beginPath(); g.arc(x + 16, y + 13, 12, 0, 7); g.fill();
    g.fillStyle = s === 3 ? '#ffffff' : s === 2 ? '#e8a040' : '#3e9a42'; g.beginPath(); g.arc(x + 12, y + 9, 6, 0, 7); g.fill();
  }
  // generic pixel building: w,h in tiles; roof colour; label emoji
  function building(g, tx, ty, w, hh, roof, wall, opts = {}) {
    const x = tx * T, y = ty * T, W = w * T, H = hh * T;
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x + 6, y + H - 4, W, 10);
    g.fillStyle = wall; g.fillRect(x + 4, y + H * 0.42, W - 8, H * 0.58);
    g.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < W - 8; i += 8) g.fillRect(x + 4 + i, y + H * 0.42, 1, H * 0.58);
    // roof
    g.fillStyle = roof; g.beginPath(); g.moveTo(x - 2, y + H * 0.46); g.lineTo(x + W / 2, y + 2); g.lineTo(x + W + 2, y + H * 0.46); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(x + W / 2, y + 2); g.lineTo(x + W + 2, y + H * 0.46); g.lineTo(x + W / 2 + 6, y + H * 0.46); g.closePath(); g.fill();
    g.strokeStyle = '#1a1410'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 2, y + H * 0.46); g.lineTo(x + W / 2, y + 2); g.lineTo(x + W + 2, y + H * 0.46); g.stroke(); g.strokeRect(x + 4, y + H * 0.42, W - 8, H * 0.58);
    // door & windows
    g.fillStyle = '#5a3a1e'; g.fillRect(x + W / 2 - 7, y + H - 22, 14, 22); g.fillStyle = '#f2c94c'; g.fillRect(x + W / 2 + 3, y + H - 12, 2, 2);
    const glow = opts.night ? '#ffd36e' : '#9ad0ff';
    for (let i = 0; i < Math.max(1, w - 1); i++) { const wx = x + 12 + i * ((W - 24) / Math.max(1, w - 1)) - (w > 1 ? 0 : -W / 2 + 18); if (Math.abs(wx + 6 - (x + W / 2)) < 14) continue; g.fillStyle = '#1a1410'; g.fillRect(wx - 1, y + H * 0.55 - 1, 14, 12); g.fillStyle = glow; g.fillRect(wx, y + H * 0.55, 12, 10); g.fillStyle = '#1a1410'; g.fillRect(wx + 5, y + H * 0.55, 2, 10); }
    if (opts.chimney) { g.fillStyle = '#7a6a5a'; g.fillRect(x + W * 0.72, y + H * 0.12, 9, H * 0.22); }
    if (opts.banner) { g.fillStyle = '#1a1410'; g.fillRect(x + W / 2 - 1, y - 20, 2, 24); g.fillStyle = opts.banner; g.beginPath(); g.moveTo(x + W / 2 + 1, y - 20); g.lineTo(x + W / 2 + 16 + Math.sin(st.t / 300) * 2, y - 15); g.lineTo(x + W / 2 + 1, y - 10); g.fill(); }
    if (opts.icon) { g.font = '18px "Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(opts.icon, x + W / 2, y + H * 0.3); }
    if (opts.label) { g.font = '700 11px "Segoe UI",sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(10,12,20,.75)'; const tw = g.measureText(opts.label).width + 8; g.fillRect(x + W / 2 - tw / 2, y + H + 4, tw, 15); g.fillStyle = '#fff'; g.fillText(opts.label, x + W / 2, y + H + 12); }
  }
  function tag(g, text, cx, y) { g.font = '700 11px "Segoe UI",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(10,12,20,.75)'; const tw = g.measureText(text).width + 8; g.fillRect(cx - tw / 2, y - 8, tw, 15); g.fillStyle = '#fff'; g.fillText(text, cx, y); }
  function emoji(g, e, x, y, size = 20) { g.font = `${size}px "Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, x, y); }

  // ---- scene layouts: list of clickable objects {x,y,w,h, draw(g), click(), hint} ----
  function houseScene() {
    const G = UI().G, p = G.player, Hh = p.house, U = Hh.upgrades; const objs = [];
    const HL = GM().houseLevel(Hh), lvl = HL * 3; const s = season(); const HLD = D().HOUSE_LEVELS[HL];
    const hw = [4, 4, 5, 6, 6][HL], hh = [3, 4, 4, 5, 5][HL];
    objs.push({ x: 12, y: 3, w: hw, h: hh, hint: `${HLD.icon} ${HLD.name} — увійти в дім (кімнати)`, draw: (g) => { building(g, 12, 3, hw, hh, lvl >= 6 ? '#7a2a3a' : '#b84a2a', s === 3 ? '#efe6da' : '#e8d8b8', { chimney: true, label: HLD.name + ' · мій дім', night: false }); if (U.kitchen) smoke(g, (12 + hw * 0.72) * T + 4, 3 * T + 10); }, click: () => go('home') });
    // garden beds
    Hh.plots.forEach((pl, i) => {
      const gx = 3 + (i % 4) * 2, gy = 3 + Math.floor(i / 4) * 2;
      objs.push({ x: gx, y: gy, w: 2, h: 2, hint: pl.seed ? (pl.ready ? `🌾 Дозріло: ${PL().item(D().CROPS[pl.seed].crop).name} — клікни, щоб зібрати` : `🌱 Росте: ${PL().item(D().CROPS[pl.seed].crop).name} (${Math.max(0, Math.ceil(pl.readyDay - G.time))} дн.)`) : '🟫 Порожня грядка — посадити', draw: (g) => bed(g, gx, gy, pl, G, s), click: () => {
        if (pl.ready) { const r = GM().harvest(G, i, 1); if (r) { A().play('coin'); UI().toast(`🌾 Зібрано: ${PL().item(r.crop).name} ×${r.n}`, 'good'); } return; }
        if (!pl.seed) { const seeds = Object.keys(D().CROPS).filter((k) => p.inventory[k]); if (!seeds.length) return UI().toast('Немає насіння. Купи на ринку!', 'bad'); const ok = GM().plant(G, i, seeds[0]); if (!ok) UI().toast('Не вдалося посадити', 'bad'); else { A().play('click'); UI().toast(`🌱 Посаджено: ${PL().item(seeds[0]).name}`, 'good'); } }
      } });
    });
    if (U.garden || Hh.plots.length) objs.push({ x: 3, y: 2, w: 8, h: 1, hint: '🌻 Город', draw: (g) => { g.font = '700 12px Georgia'; g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(s === 3 ? '❄️ Город (зимою не росте)' : '🌻 Город', 3 * T + 4, 2 * T + 22); }, click: () => ISK.panels.house() });
    if (U.chest) objs.push({ x: 19, y: 6, w: 1, h: 1, hint: '🧰 Скриня', draw: (g) => { g.fillStyle = '#7a4a1e'; g.fillRect(19 * T + 4, 6 * T + 12, 24, 16); g.fillStyle = '#f2c94c'; g.fillRect(19 * T + 4, 6 * T + 18, 24, 2); g.fillRect(19 * T + 14, 6 * T + 16, 4, 6); g.strokeStyle = '#1a1410'; g.strokeRect(19 * T + 4, 6 * T + 12, 24, 16); }, click: () => ISK.panels.house() });
    objs.push({ x: 21, y: 7, w: 1, h: 1, hint: '🪣 Криниця — відпочити й відновити сили', draw: (g) => { g.fillStyle = '#8a8a94'; g.beginPath(); g.ellipse(21 * T + 16, 7 * T + 22, 13, 7, 0, 0, 7); g.fill(); g.fillStyle = '#3a6ab0'; g.beginPath(); g.ellipse(21 * T + 16, 7 * T + 21, 9, 4, 0, 0, 7); g.fill(); g.fillStyle = '#5a3a1e'; g.fillRect(21 * T + 3, 7 * T + 2, 3, 20); g.fillRect(21 * T + 26, 7 * T + 2, 3, 20); g.fillStyle = '#b84a2a'; g.fillRect(21 * T, 7 * T, 32, 5); }, click: () => { const p2 = UI().G.player; p2.hp = PL().maxHp(p2); p2.mp = PL().maxMp(p2); UI().showNews(GM().passTime(UI().G, 0.5)); A().play('heal'); UI().toast('💧 Холодна водиця з криниці. Сили відновлено!', 'good'); UI().refresh(); } });
    if (U.forge) objs.push({ x: 23, y: 3, w: 3, h: 3, hint: '⚒️ Домашня кузня', draw: (g) => { building(g, 23, 3, 3, 3, '#4a4a54', '#9a8a7a', { icon: '⚒️', label: 'Кузня', chimney: true }); smoke(g, 25.2 * T, 3 * T + 8, '#ff9a40'); }, click: () => ISK.panels.house() });
    if (U.lab) objs.push({ x: 23, y: 9, w: 3, h: 3, hint: '⚗️ Алхімічна лабораторія', draw: (g) => building(g, 23, 9, 3, 3, '#4a2a7a', '#d8d0e8', { icon: '⚗️', label: 'Лабораторія' }), click: () => ISK.panels.house() });
    if (U.incubator) objs.push({ x: 18, y: 9, w: 1, h: 1, hint: '🥚 Інкубатор', draw: (g) => { g.fillStyle = '#c8a06a'; g.fillRect(18 * T + 2, 9 * T + 14, 28, 14); emoji(g, '🥚', 18 * T + 16, 9 * T + 12 + Math.sin(st.t / 200) * 1.5, 18); }, click: () => ISK.panels.house() });
    if (U.trophy) objs.push({ x: 21, y: 10, w: 1, h: 2, hint: '🏆 Кімната трофеїв', draw: (g) => { g.fillStyle = '#9a9aa8'; g.fillRect(21 * T + 6, 11 * T + 10, 20, 22); emoji(g, '🏆', 21 * T + 16, 10 * T + 24, 22); }, click: () => ISK.panels.house() });
    if (U.cathouse) objs.push({ x: 0, y: 13, w: 1, h: 1, hint: '🐈 Котячий будиночок (коти щасливі)', draw: (g) => { building(g, 0, 13, 1, 1, '#ff7eb6', '#ffe4f0', {}); for (let c = 0; c < U.cathouse; c++) emoji(g, '🐈', 0 * T + 30 + c * 14 + Math.sin(st.t / 500 + c) * 6, 13 * T + 28 + c * 4, 16); }, click: () => UI().toast('🐈 Мяу. (Перекладач: «Ти нам більше не потрібен, у нас є будиночок».)') });
    if (p.mount && p.mount !== 'feet') objs.push({ x: 26, y: 12, w: 3, h: 3, hint: `🐴 Стайня — ${D().MOUNTS[p.mount].name}`, draw: (g) => { building(g, 26, 12, 3, 3, '#8a5a2a', '#c8a06a', { label: 'Стайня' }); emoji(g, D().MOUNTS[p.mount].icon, 27.5 * T, 13.5 * T + Math.sin(st.t / 400) * 2, 26); }, click: () => ISK.panels.party() });
    // v5.5: ферма та нові прибудови
    const critters = (ic, x0, y0, w0, h0, n) => (g) => { for (let i = 0; i < n; i++) { const ph = st.t / (900 + i * 170) + i * 1.7; emoji(g, ic, (x0 + 0.5 + (Math.sin(ph) * 0.5 + 0.5) * (w0 - 1)) * T, (y0 + 0.6 + (Math.cos(ph * 1.3) * 0.5 + 0.5) * (h0 - 1)) * T, 15); } };
    const pen = (x0, y0, w0, h0) => (g) => { g.fillStyle = '#8a6a3a'; g.fillRect(x0 * T, y0 * T, w0 * T, 3); g.fillRect(x0 * T, (y0 + h0) * T - 3, w0 * T, 3); g.fillRect(x0 * T, y0 * T, 3, h0 * T); g.fillRect((x0 + w0) * T - 3, y0 * T, 3, h0 * T); };
    const lv = (k) => U[k] || 0; const stars = (k) => '★'.repeat(lv(k));
    const FARM = [
      ['coop', 27, 3, 2, 2, '🐔', '#c8a06a'], ['cowshed', 26, 6, 3, 2, '🐄', '#8a5a3a'], ['sheepfold', 27, 9, 2, 2, '🐑', '#9a8a6a'],
    ];
    for (const [k, x0, y0, w0, h0, ic, col] of FARM) if (lv(k)) objs.push({ x: x0, y: y0, w: w0, h: h0, hint: `${D().HOUSE_UPGRADES[k].icon} ${D().HOUSE_UPGRADES[k].name} ${stars(k)} — продукти йдуть у комору`, draw: (g) => { g.fillStyle = 'rgba(120,90,40,.25)'; g.fillRect(x0 * T, y0 * T, w0 * T, h0 * T); pen(x0, y0, w0, h0)(g); critters(ic, x0, y0, w0, h0, 1 + lv(k))(g); }, click: () => ISK.panels.house() });
    if (lv('apiary')) objs.push({ x: 20, y: 12, w: 1, h: 1, hint: `🐝 Пасіка ${stars('apiary')}`, draw: (g) => { for (let i = 0; i < lv('apiary'); i++) { g.fillStyle = '#d8a030'; g.fillRect(20 * T + 4 + i * 9, 12 * T + 14, 8, 14); } for (let i = 0; i < 4; i++) emoji(g, '🐝', 20 * T + 16 + Math.sin(st.t / 150 + i * 2) * 14, 12 * T + 8 + Math.cos(st.t / 130 + i) * 8, 9); }, click: () => ISK.panels.house() });
    if (lv('orchard')) objs.push({ x: 12, y: 11, w: 3, h: 2, hint: `🍎 Фруктовий сад ${stars('orchard')}`, draw: (g) => { for (let i = 0; i < 1 + lv('orchard'); i++) { tree(g, (12 + (i % 3)) * T, (11 + Math.floor(i / 3) * 0.9) * T, s); if (s !== 3) emoji(g, '🍎', (12 + (i % 3)) * T + 20, (11 + Math.floor(i / 3) * 0.9) * T + 8, 10); } }, click: () => ISK.panels.house() });
    if (lv('pond')) objs.push({ x: 15, y: 12, w: 2, h: 2, hint: `🎣 Рибний ставок ${stars('pond')}`, draw: (g) => { g.fillStyle = s === 3 ? '#cfe4f2' : '#3a7ac0'; g.beginPath(); g.ellipse(16 * T, 13 * T, T * 0.95, T * 0.7, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(15.6 * T, 12.6 * T, 14, 2); if (s !== 3) emoji(g, '🐟', 16 * T + Math.sin(st.t / 600) * 18, 13 * T + 4, 11); }, click: () => ISK.panels.house() });
    if (lv('greenhouse')) objs.push({ x: 22, y: 13, w: 3, h: 2, hint: `🪴 Теплиця ${stars('greenhouse')} — город росте і взимку`, draw: (g) => { g.fillStyle = 'rgba(190,240,255,.55)'; g.fillRect(22 * T + 2, 13 * T + 4, 3 * T - 4, 2 * T - 8); g.strokeStyle = '#e8f8ff'; g.lineWidth = 2; for (let i = 0; i <= 3; i++) { g.beginPath(); g.moveTo((22 + i) * T, 13 * T + 4); g.lineTo((22 + i) * T, 15 * T - 4); g.stroke(); } emoji(g, '🌿', 23.5 * T, 14 * T, 16); }, click: () => ISK.panels.house() });
    if (lv('training')) objs.push({ x: 17, y: 12, w: 2, h: 2, hint: `🎯 Тренувальний двір ${stars('training')} — загін тренується щодня`, draw: (g) => { g.fillStyle = '#c8b080'; g.fillRect(17 * T + 4, 12 * T + 4, 2 * T - 8, 2 * T - 8); emoji(g, '🎯', 17.5 * T, 12.6 * T, 18); emoji(g, '🗡️', 18.4 * T + Math.sin(st.t / 200) * 3, 13.4 * T, 14); }, click: () => ISK.panels.house() });
    if (lv('irrigation')) objs.push({ x: 0, y: 0, w: 0, h: 0, draw: (g) => { g.strokeStyle = 'rgba(90,160,230,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(2.5 * T, 3 * T); g.lineTo(2.5 * T, 14.5 * T); g.stroke(); } });
    if (lv('library')) objs.push({ x: 0, y: 0, w: 0, h: 0, draw: (g) => emoji(g, '📚', 12 * T + 8, 3 * T + 6, 16) });
    { const I = GM().houseInfo(UI().G); objs.push({ x: 19, y: 3, w: 2, h: 2, hint: `🏚️ Комора ${stars('storehouse')}: ${I.stored}/${I.storeCap} — клікни, щоб забрати продукти`, draw: (g) => { building(g, 19, 3, 2, 2, '#6a4a2a', '#b89a70', { label: 'Комора' }); if (I.stored) { const b = Math.sin(st.t / 250) * 2; g.fillStyle = I.stored >= I.storeCap ? '#ff6a6a' : '#ffd76e'; g.beginPath(); g.arc(20.6 * T, 3 * T + b, 11, 0, 7); g.fill(); g.fillStyle = '#1a1410'; g.font = '700 11px "Segoe UI"'; g.textAlign = 'center'; g.fillText(String(I.stored), 20.6 * T, 3 * T + 4 + b); } }, click: () => { if (!I.stored) { UI().toast('🏚️ Комора порожня. Будуй курник, корівник, пасіку…', ''); return; } const r = GM().collectStore(UI().G); A().play('coin'); UI().toast('🧺 ' + Object.entries(r).map(([id, n]) => `${PL().item(id).icon}×${n}`).join(' '), 'good', 3000); } }); }
    // fence
    objs.push({ x: 0, y: 0, w: 0, h: 0, draw: (g) => { g.fillStyle = '#8a6a3a'; for (let x = 2; x < 27; x++) { g.fillRect(x * T + 4, 15 * T + 6, 4, 18); } g.fillRect(2 * T, 15 * T + 10, 25 * T, 3); g.fillRect(2 * T, 15 * T + 18, 25 * T, 3); } });
    return objs;
  }
  function bed(g, gx, gy, pl, G, s) {
    const x = gx * T + 4, y = gy * T + 4, W = 2 * T - 8;
    g.fillStyle = s === 3 ? '#b8a898' : '#6a4422'; g.fillRect(x, y, W, W); g.fillStyle = s === 3 ? '#d8ccc0' : '#7e522a'; for (let i = 0; i < 4; i++) g.fillRect(x + 4, y + 6 + i * 14, W - 8, 4);
    if (!pl.seed) return;
    const total = D().CROPS[pl.seed].days; const left = Math.max(0, pl.readyDay - G.time); const stage = pl.ready ? 3 : left > total * 0.66 ? 0 : left > total * 0.33 ? 1 : 2;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      const cx = x + 10 + j * 26, cy = y + 10 + i * 14;
      if (stage === 0) { g.fillStyle = '#9ad06a'; g.fillRect(cx, cy, 3, 3); }
      else if (stage === 1) { g.fillStyle = '#5fae4a'; g.fillRect(cx, cy - 4, 2, 6); g.fillRect(cx - 3, cy - 2, 8, 2); }
      else if (stage === 2) { g.fillStyle = '#3e8a36'; g.fillRect(cx - 1, cy - 8, 3, 10); g.fillRect(cx - 5, cy - 5, 12, 3); }
      else { emoji(g, PL().item(D().CROPS[pl.seed].crop).icon, cx + 2, cy - 3, 13); }
    }
    if (pl.ready) { g.strokeStyle = `rgba(255,230,110,${0.5 + Math.sin(st.t / 200) * 0.4})`; g.lineWidth = 3; g.strokeRect(x - 2, y - 2, W + 4, W + 4); }
  }
  function smoke(g, x, y, col) { for (let i = 0; i < 4; i++) { const k = ((st.t / 900 + i / 4) % 1); g.fillStyle = col ? `rgba(255,154,64,${0.5 * (1 - k)})` : `rgba(230,230,240,${0.55 * (1 - k)})`; g.beginPath(); g.arc(x + Math.sin(k * 6 + i) * 6, y - k * 40, 4 + k * 8, 0, 7); g.fill(); } }

  // v5.6: 12 ділянок навколо резиденції; будівлі стають на ділянки в порядку будівництва
  const LOT_POS = [[2, 2], [5, 2], [8, 2], [20, 2], [23, 2], [26, 2], [2, 11], [5, 11], [8, 11], [20, 11], [23, 11], [26, 11]];
  const BCOL = { farm: ['#c89a3a', '#f0dca0'], mine: ['#5a5a64', '#9a8a7a'], market: ['#3a6ab0', '#e8d8b8'], walls: ['#7a7a84', '#b8b0a0'], barracks: ['#8a1a2a', '#b8a890'], tavern: ['#8a5a2a', '#e0c890'], temple: ['#f2f2ff', '#d8d0e8'], statue: ['#c0c0cc', '#e0e0e8'],
    houses: ['#a0522d', '#e8d0a8'], granary: ['#b8862a', '#e8d8a0'], sawmill: ['#6a4a2a', '#c8a070'], quarry: ['#7a7a80', '#b0aaa0'], school: ['#2a5a8a', '#e8e0d0'], watchtower: ['#5a5a64', '#a8a098'] };
  function castle(g, tier, col) {
    const W0 = [3, 4, 5, 6, 7][tier], H0 = [3, 3, 4, 4, 5][tier], x0 = 15 - Math.floor(W0 / 2), y0 = 2 + (5 - H0);
    if (tier >= 4) { g.fillStyle = '#3a6ac0'; g.fillRect((x0 - 1.4) * T, (y0 + H0) * T - 2, (W0 + 2.8) * T, 8); }
    if (tier >= 1) { g.fillStyle = tier >= 2 ? '#8a8a94' : '#8a6a3a'; g.fillRect((x0 - 1) * T, (y0 + H0) * T - 6, (W0 + 2) * T, 8); }
    building(g, x0, y0, W0, H0, tier >= 3 ? '#4a4a5a' : '#6a2a4a', tier >= 2 ? '#b8b0a8' : '#d8ccb8', { banner: col, label: D().LAND_TIERS[tier].name, chimney: tier < 3 });
    if (tier >= 2) for (const tx of [x0 - 0.6, x0 + W0 - 0.4]) { g.fillStyle = '#9a9aa4'; g.fillRect(tx * T, (y0 - 0.5) * T, T, (H0 + 0.5) * T); g.fillStyle = '#7a7a84'; for (let k = 0; k < 3; k++) g.fillRect(tx * T + k * 12, (y0 - 0.8) * T, 8, 10); }
    if (tier >= 4) { emoji(g, '👻', (x0 + W0 - 0.3) * T, (y0 + 0.4) * T + Math.sin(st.t / 700) * 4, 14); }
    return { x0, y0, W0, H0 };
  }
  function landScene(bid) {
    const G = UI().G, p = G.player, B = G.world.baronies[bid], L = GM().landState(G, bid); const objs = []; const s = season(); const I = GM().landInfo(G, bid);
    const col = G.world.realms[B.owner].color;
    { const W0 = [3, 4, 5, 6, 7][L.tier], H0 = [3, 3, 4, 4, 5][L.tier], x0 = 15 - Math.floor(W0 / 2), y0 = 2 + (5 - H0);
      objs.push({ x: x0, y: y0, w: W0, h: H0, hint: `${I.T.icon} ${I.T.name} — керування землями, розбудова`, draw: (g) => castle(g, L.tier, col), click: () => ISK.panels.land(bid) }); }
    for (let li = 0; li < LOT_POS.length; li++) {
      const [x, y] = LOT_POS[li]; const k = L.order[li];
      if (li >= I.lots) { objs.push({ x, y, w: 3, h: 3, hint: `🔒 Ділянка відкриється після розбудови резиденції`, draw: (g) => { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x * T + 8, y * T + 8, 3 * T - 16, 3 * T - 16); emoji(g, '🔒', x * T + 48, y * T + 48, 18); }, click: () => ISK.panels.land(bid, 'main') }); continue; }
      if (!k) { objs.push({ x, y, w: 3, h: 3, hint: '➕ Вільна ділянка — збудуй щось', draw: (g) => { g.setLineDash([6, 5]); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.strokeRect(x * T + 8, y * T + 8, 3 * T - 16, 3 * T - 16); g.setLineDash([]); emoji(g, '➕', x * T + 48, y * T + 48, 20); }, click: () => ISK.panels.land(bid, 'build') }); continue; }
      const lvl = L.buildings[k] || 0; const LB = D().LAND_BUILDINGS[k];
      objs.push({ x, y, w: 3, h: 3, hint: `${LB.icon} ${LB.name} ${'★'.repeat(lvl)} — ${LB.desc}`, draw: (g) => {
        if (k === 'farm') { field(g, x, y, s, lvl); g.font = '700 11px "Segoe UI"'; g.textAlign = 'center'; g.fillStyle = 'rgba(10,12,20,.75)'; const lb = `${LB.name} ${'★'.repeat(lvl)}`; const tw = g.measureText(lb).width + 8; g.fillRect(x * T + 48 - tw / 2, (y + 3) * T + 4, tw, 15); g.fillStyle = '#fff'; g.fillText(lb, x * T + 48, (y + 3) * T + 12); return; }
        if (k === 'statue') { g.fillStyle = '#9a9aa8'; g.fillRect(x * T + 28, y * T + 60, 40, 30); g.drawImage(SP().hero(p), x * T + 24, y * T + 2, 48, 60); return; }
        if (k === 'quarry') { g.fillStyle = '#8a8a90'; g.beginPath(); g.ellipse(x * T + 48, y * T + 52, 40, 30, 0, 0, 7); g.fill(); g.fillStyle = '#6a6a70'; g.beginPath(); g.ellipse(x * T + 48, y * T + 56, 26, 18, 0, 0, 7); g.fill(); emoji(g, '⛏️', x * T + 48 + Math.sin(st.t / 180) * 6, y * T + 46, 16); }
        else if (k === 'watchtower') { g.fillStyle = '#8a8a94'; g.fillRect(x * T + 34, y * T + 10, 28, 78); g.fillStyle = '#6a6a74'; for (let q = 0; q < 3; q++) g.fillRect(x * T + 32 + q * 11, y * T + 4, 8, 8); g.fillStyle = col; g.fillRect(x * T + 47, y * T - 10, 14, 9); }
        else building(g, x, y, 3, 3, BCOL[k][0], BCOL[k][1], { icon: LB.icon, label: `${LB.name} ${'★'.repeat(lvl)}` });
        if (k === 'mine') { g.fillStyle = '#1a1410'; g.fillRect(x * T + 34, y * T + 70, 28, 20); }
        if (k === 'sawmill') emoji(g, '🪵', x * T + 18, y * T + 84 + Math.sin(st.t / 300) * 2, 14);
        if (k === 'quarry' || k === 'watchtower') { g.font = '700 11px "Segoe UI"'; g.textAlign = 'center'; g.fillStyle = 'rgba(10,12,20,.75)'; const lb = `${LB.name} ${'★'.repeat(lvl)}`; const tw = g.measureText(lb).width + 8; g.fillRect(x * T + 48 - tw / 2, (y + 3) * T + 4, tw, 15); g.fillStyle = '#fff'; g.fillText(lb, x * T + 48, (y + 3) * T + 12); }
      }, click: () => ISK.panels.land(bid, 'build') });
    }
    // хатки жителів у центрі: що більше людей — то більше хат
    const huts = Math.min(10, Math.ceil(L.pop / 18));
    objs.push({ x: 0, y: 0, w: 0, h: 0, draw: (g) => { for (let i = 0; i < huts; i++) { const hx = 11 + (i % 5) * 1.6, hy = 9.2 + Math.floor(i / 5) * 2.2; g.fillStyle = '#a0522d'; g.beginPath(); g.moveTo(hx * T, (hy + 0.5) * T); g.lineTo((hx + 0.6) * T, hy * T); g.lineTo((hx + 1.2) * T, (hy + 0.5) * T); g.fill(); g.fillStyle = '#e8d0a8'; g.fillRect(hx * T + 4, (hy + 0.5) * T, 1.2 * T - 8, 0.7 * T); g.fillStyle = '#5a3a1e'; g.fillRect((hx + 0.5) * T, (hy + 0.8) * T, 7, 0.4 * T); } } });
    // склад
    const stored = Object.values(L.store).reduce((a, b) => a + b, 0);
    if (stored) objs.push({ x: 18, y: 7, w: 1, h: 1, hint: `📦 Склад: ${stored} — клікни, щоб забрати`, draw: (g) => { emoji(g, '📦', 18 * T + 16, 7 * T + 16, 22); const b = Math.sin(st.t / 250) * 2; g.fillStyle = '#ffd76e'; g.beginPath(); g.arc(18 * T + 28, 7 * T + b, 10, 0, 7); g.fill(); g.fillStyle = '#1a1410'; g.font = '700 10px "Segoe UI"'; g.textAlign = 'center'; g.fillText(String(stored), 18 * T + 28, 7 * T + 4 + b); }, click: () => { const r = GM().collectLand(G, bid); A().play('coin'); UI().toast('📦 ' + Object.entries(r).map(([id, n]) => `${PL().item(id).icon}×${n}`).join(' '), 'good'); } });
    if ((L.buildings.walls) || L.tier >= 2) objs.push({ x: 0, y: 0, w: 0, h: 0, draw: (g) => { g.fillStyle = '#8a8a94'; g.fillRect(T, T - 6, (COLS - 2) * T, 10); g.fillRect(T, (ROWS - 1) * T - 4, (COLS - 2) * T, 10); g.fillRect(T - 6, T, 10, (ROWS - 2) * T); g.fillRect((COLS - 1) * T - 4, T, 10, (ROWS - 2) * T); g.fillStyle = '#6a6a74'; for (let x = 1; x < COLS - 1; x += 1) { g.fillRect(x * T, T - 12, 14, 6); } } });
    objs.push({ x: 0, y: 0, w: 0, h: 0, draw: (g) => { g.font = '700 13px "Segoe UI"'; g.fillStyle = 'rgba(10,12,20,.7)'; g.fillRect(8, ROWS * T - 30, 560, 24); g.fillStyle = L.loyalty < 30 || I.foodProd < L.pop ? '#ff8a9a' : '#c8ffc8'; g.textAlign = 'left'; g.fillText(`👥 ${L.pop}/${I.housing} · 🍞 ${I.foodProd - L.pop >= 0 ? '+' : ''}${I.foodProd - L.pop} · лояльність ${Math.round(L.loyalty)}% · дохід ${GM().landIncome(G, bid)}🪙/день · податок ${['низький', 'середній', 'високий'][L.tax]}`, 16, ROWS * T - 14); } });
    return objs;
  }
  function field(g, x, y, s, lvl = 1) {
    for (let j = 0; j < 6; j++) { g.fillStyle = s === 3 ? '#e8e0d4' : s === 2 ? '#d8b040' : j % 2 ? '#8aa83a' : '#b8c84a'; g.fillRect(x * T + 4, y * T + 6 + j * 15, 3 * T - 8, 13); }
    if (s !== 3) for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) { g.fillStyle = s === 2 ? '#f2c94c' : '#4e8a30'; g.fillRect(x * T + 10 + i * 14, y * T + 8 + j * 15 + Math.sin(st.t / 400 + i + j) * 1, 3, 7); }
    g.fillStyle = '#8a6a3a'; g.fillRect(x * T + 2, y * T + 2, 3 * T - 4, 3); g.fillRect(x * T + 2, y * T + 94, 3 * T - 4, 3);
    emoji(g, '🧑‍🌾', x * T + 20 + (st.t / 60 % 60), y * T + 50, 16); if (lvl > 1) emoji(g, '🐄', x * T + 76, y * T + 74, 16);
  }

  // ================= v5.8: інтер'єр дому — кімнати як окрема локація =================
  function homeRooms() {
    const p = UI().G.player, H = p.house, U = H.upgrades; const HL = GM().houseLevel(H);
    const rooms = [];
    if (HL >= 1 || U.bed) rooms.push({ id: 'bed', name: 'Спальня', icon: '🛏️', floor: '#8a5a3a' });
    if (U.kitchen) rooms.push({ id: 'kitchen', name: 'Кухня', icon: '🍳', floor: '#9a8a7a' });
    if (U.library) rooms.push({ id: 'library', name: 'Бібліотека', icon: '📚', floor: '#6a4a3a' });
    if (U.trophy) rooms.push({ id: 'trophy', name: 'Кімната трофеїв', icon: '🏆', floor: '#5a4a6a' });
    if (U.storehouse || Object.values(D().HOUSE_UPGRADES).some((X, i) => X.farm && U[Object.keys(D().HOUSE_UPGRADES)[i]])) rooms.push({ id: 'store', name: 'Комора', icon: '🏚️', floor: '#7a6a4a' });
    if (U.incubator) rooms.push({ id: 'nest', name: 'Інкубаторна', icon: '🥚', floor: '#8a6a4a' });
    if (HL >= 3) rooms.push({ id: 'study', name: 'Кабінет', icon: '🖋️', floor: '#5a3a2a' });
    return rooms;
  }
  function homeSize() { const n = Math.max(1, homeRooms().length); return [Math.max(22, 2 + n * 6), 16]; }
  function homeGround(g, s) {
    const rooms = homeRooms(); const n = rooms.length; const HL = GM().houseLevel(UI().G.player.house);
    g.fillStyle = '#1a1410'; g.fillRect(0, 0, COLS * T, ROWS * T);
    const plank = ['#a0703e', '#9a6a3a', '#a87846', '#946436'];
    // вітальня (низ) — дошки; кімнати (верх) — свої підлоги
    for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) { g.fillStyle = plank[(hash(x >> 1, y) + (x & 1)) % 4]; g.fillRect(x * T, y * T, T, T); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x * T, y * T + T - 2, T, 2); if ((x + y * 3) % 4 === 0) g.fillRect(x * T + T - 1, y * T, 1, T); }
    const rw = (COLS - 2) / Math.max(1, n);
    rooms.forEach((R0, i) => { const x0 = 1 + i * rw; g.fillStyle = R0.floor; g.globalAlpha = 0.55; g.fillRect(x0 * T, T, rw * T, 6 * T); g.globalAlpha = 1; });
    // килим у вітальні
    g.fillStyle = HL >= 3 ? '#8a1a2a' : '#6a3a5a'; g.fillRect((COLS / 2 - 3) * T, 9.5 * T, 6 * T, 3.5 * T); g.strokeStyle = '#e8c070'; g.lineWidth = 3; g.strokeRect((COLS / 2 - 3) * T + 6, 9.5 * T + 6, 6 * T - 12, 3.5 * T - 12);
    // стіни
    const wall = (x, y, w, h) => { g.fillStyle = '#d8c8a8'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, y + h - 4, w, 4); };
    wall(0, 0, COLS * T, T); wall(0, (ROWS - 1) * T, COLS * T, T); wall(0, 0, T * 0.5, ROWS * T); wall((COLS - 0.5) * T, 0, T * 0.5, ROWS * T);
    // стіна між кімнатами й вітальнею з дверима в кожну кімнату
    rooms.forEach((R0, i) => { const x0 = 1 + i * rw; wall(x0 * T, 7 * T, rw * T, T * 0.6); g.fillStyle = plank[1]; g.fillRect((x0 + rw / 2 - 0.8) * T, 7 * T, 1.6 * T, T * 0.6); if (i) wall(x0 * T - 6, T, 10, 6.6 * T);
      g.font = '700 12px "Segoe UI"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(10,12,20,.7)'; const lb = `${R0.icon} ${R0.name}`; const tw = g.measureText(lb).width + 10; g.fillRect((x0 + rw / 2) * T - tw / 2, T + 4, tw, 17); g.fillStyle = '#fff'; g.fillText(lb, (x0 + rw / 2) * T, T + 13); });
    // вхідні двері
    g.fillStyle = '#5a3a1e'; g.fillRect((COLS / 2 - 1) * T, (ROWS - 1) * T, 2 * T, T); g.fillStyle = '#f2c94c'; g.fillRect((COLS / 2 + 0.6) * T, (ROWS - 0.5) * T, 4, 4);
    // вікна у верхній стіні
    for (let x = 2; x < COLS - 2; x += 4) { g.fillStyle = '#1a1410'; g.fillRect(x * T + 4, 4, T - 8, T - 10); g.fillStyle = s === 3 ? '#e8f0ff' : '#9ad0ff'; g.fillRect(x * T + 6, 6, T - 12, T - 14); }
  }
  function homeScene() {
    const G = UI().G, p = G.player, H = p.house, U = H.upgrades; const objs = []; const rooms = homeRooms(); const rw = (COLS - 2) / Math.max(1, rooms.length);
    const tab = (id) => { ISK.panels.house(); setTimeout(() => document.querySelector(`.tabs button[data-id="${id}"]`)?.click(), 20); };
    const sleep = () => { if (!U.bed) { UI().toast('🛏️ Ліжка ще нема — купи його в «Прибудовах».', 'bad'); tab('home'); return; } p.hp = PL().maxHp(p); p.mp = PL().maxMp(p); for (const c of p.party) c.hp = undefined; UI().showNews(GM().passTime(G, 1)); const rs = GM().sleepAtHome(G); ISK.panels.autosave(); A().play('heal'); UI().toast('😴 Найкращий сон — удома. (Автозбереження)' + (rs ? ` · Виспався: +20% досвіду ще на ${rs} перемог` : ''), 'good', 4000); };
    const furn = (x, y, w, h, hint, draw, click) => objs.push({ x, y, w, h, hint, draw, click });
    rooms.forEach((R0, i) => {
      const x0 = 1 + i * rw, cx = x0 + rw / 2;
      if (R0.id === 'bed') {
        furn(cx - 1.2, 2.2, 2.4, 3, U.bed ? `🛏️ Ліжко ${'★'.repeat(U.bed)} — поспати (повне здоров'я, автозбереження)` : '🛏️ Тут буде ліжко', (g) => { const x = (cx - 1.2) * T, y = 2.2 * T; g.fillStyle = '#5a3a1e'; g.fillRect(x, y, 2.4 * T, 3 * T); g.fillStyle = U.bed >= 2 ? '#c84a6a' : '#6a7ab0'; g.fillRect(x + 6, y + 20, 2.4 * T - 12, 3 * T - 26); g.fillStyle = '#f4f0e6'; g.fillRect(x + 10, y + 6, 2.4 * T - 20, 16); if (U.bed >= 3) emoji(g, '✨', x + 2.2 * T, y + 6, 12); }, sleep);
        furn(x0 + 0.4, 2.4, 1, 1, '🕯️ Тумбочка', (g) => { g.fillStyle = '#7a4a1e'; g.fillRect((x0 + 0.4) * T + 4, 2.4 * T + 8, 22, 20); emoji(g, '🕯️', (x0 + 0.9) * T, 2.4 * T + 4, 14); });
      } else if (R0.id === 'kitchen') {
        furn(cx - 1.5, 2, 3, 1.6, '🍳 Піч — готувати страви', (g) => { const x = (cx - 1.5) * T, y = 2 * T; g.fillStyle = '#5a5a64'; g.fillRect(x, y, 3 * T, 1.6 * T); g.fillStyle = '#2a2a30'; g.fillRect(x + 10, y + 12, 3 * T - 20, 20); g.fillStyle = `rgba(255,${120 + Math.sin(st.t / 120) * 40},40,.9)`; g.fillRect(x + 14, y + 22, 3 * T - 28, 8); emoji(g, '🍲', x + 1.5 * T, y + 4, 16); }, () => ISK.panels.cooking());
        furn(cx - 1, 4.3, 2, 1.2, '🔪 Стіл', (g) => { g.fillStyle = '#8a5a2a'; g.fillRect((cx - 1) * T, 4.3 * T, 2 * T, 1.2 * T); emoji(g, '🥕', (cx - 0.4) * T, 4.8 * T, 13); emoji(g, '🍞', (cx + 0.4) * T, 4.8 * T, 13); });
      } else if (R0.id === 'library') {
        for (let k = 0; k < 3; k++) furn(x0 + 0.3 + k * (rw - 0.6) / 3, 2, (rw - 0.6) / 3 - 0.1, 1.4, `📚 Бібліотека ${'★'.repeat(U.library)} — більше досвіду за перемоги`, (g) => { const x = (x0 + 0.3 + k * (rw - 0.6) / 3) * T, W = ((rw - 0.6) / 3 - 0.1) * T; g.fillStyle = '#5a3a1e'; g.fillRect(x, 2 * T, W, 1.4 * T); for (let j = 0; j < 8; j++) { g.fillStyle = ['#b03a3a', '#3a6ab0', '#3a8a4a', '#c8a040'][(j + k) % 4]; g.fillRect(x + 3 + j * (W - 6) / 8, 2 * T + 4 + (j % 2) * 3, (W - 6) / 8 - 1, 16); g.fillRect(x + 3 + j * (W - 6) / 8, 2 * T + 24, (W - 6) / 8 - 1, 14); } }, () => tab('home'));
        furn(cx - 0.6, 4.3, 1.2, 1.2, '🪑 Читальне крісло', (g) => { g.fillStyle = '#7a2a3a'; g.fillRect((cx - 0.6) * T, 4.3 * T, 1.2 * T, 1.2 * T); emoji(g, '📖', cx * T, 4.6 * T, 14); });
      } else if (R0.id === 'trophy') {
        furn(cx - 1.5, 2.2, 3, 2.4, '🏆 Трофеї — твої досягнення', (g) => { const x = (cx - 1.5) * T; g.fillStyle = '#9a9aa8'; g.fillRect(x, 4 * T, 3 * T, 0.6 * T); ['🏆', '🐉', '⚔️'].forEach((e, k) => emoji(g, e, x + (0.5 + k) * T, 3.5 * T, 22)); g.fillStyle = '#c8a040'; g.fillRect(x + 4, 2.2 * T, 3 * T - 8, 6); }, () => ISK.panels.achievements());
      } else if (R0.id === 'store') {
        const I = GM().houseInfo(G);
        furn(cx - 1.5, 2.2, 3, 2.4, `🏚️ Комора: ${I.stored}/${I.storeCap} — забрати продукти`, (g) => { for (let k = 0; k < 4; k++) { const x = (cx - 1.4 + (k % 2) * 1.5) * T, y = (2.4 + Math.floor(k / 2) * 1.2) * T; g.fillStyle = '#7a4a1e'; g.beginPath(); g.ellipse(x + 20, y + 16, 16, 18, 0, 0, 7); g.fill(); g.fillStyle = '#4a2a10'; g.fillRect(x + 4, y + 8, 32, 3); g.fillRect(x + 4, y + 22, 32, 3); } if (I.stored) { g.fillStyle = '#ffd76e'; g.beginPath(); g.arc((cx + 1.4) * T, 2.3 * T + Math.sin(st.t / 250) * 2, 10, 0, 7); g.fill(); g.fillStyle = '#1a1410'; g.font = '800 10px "Segoe UI"'; g.textAlign = 'center'; g.fillText(String(I.stored), (cx + 1.4) * T, 2.3 * T + 1); } },
          () => { const I2 = GM().houseInfo(G); if (!I2.stored) { UI().toast('🏚️ Комора порожня.', ''); return; } const r = GM().collectStore(G); A().play('coin'); UI().toast('🧺 Забрано: ' + Object.entries(r).map(([id, n]) => `${PL().item(id).icon}×${n}`).join(' '), 'good', 3500); });
      } else if (R0.id === 'nest') {
        furn(cx - 1, 2.6, 2, 1.6, '🥚 Інкубатор', (g) => { g.fillStyle = '#c8a06a'; g.fillRect((cx - 1) * T, 3.2 * T, 2 * T, T); emoji(g, '🥚', cx * T, 3 * T + Math.sin(st.t / 200) * 2, 22); }, () => tab('home'));
      } else if (R0.id === 'study') {
        furn(cx - 1.2, 2.4, 2.4, 1.4, '🖋️ Письмовий стіл — збереження гри', (g) => { g.fillStyle = '#5a3a1e'; g.fillRect((cx - 1.2) * T, 2.4 * T, 2.4 * T, 1.4 * T); emoji(g, '📜', (cx - 0.4) * T, 2.8 * T, 14); emoji(g, '🖋️', (cx + 0.4) * T, 2.8 * T, 14); }, () => ISK.panels.save());
      }
    });
    // вітальня
    furn(1.4, 9, 2.4, 2.6, '🔥 Камін — затишно', (g) => { const x = 1.4 * T, y = 9 * T; g.fillStyle = '#8a8a94'; g.fillRect(x, y, 2.4 * T, 2.6 * T); g.fillStyle = '#2a2a30'; g.fillRect(x + 14, y + 26, 2.4 * T - 28, 2.6 * T - 34); for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(255,${140 + k * 40},40,${0.7 + Math.sin(st.t / 90 + k) * 0.2})`; g.beginPath(); g.ellipse(x + 1.2 * T + (k - 1) * 9, y + 2.2 * T - 8 - Math.abs(Math.sin(st.t / 140 + k)) * 8, 6, 12, 0, 0, 7); g.fill(); } });
    furn(COLS / 2 - 1.5, 10.3, 3, 1.8, '🍽️ Обідній стіл', (g) => { const x = (COLS / 2 - 1.5) * T, y = 10.3 * T; g.fillStyle = '#7a4a1e'; g.fillRect(x, y, 3 * T, 1.8 * T); g.fillStyle = '#f4f0e6'; g.fillRect(x + 8, y + 8, 3 * T - 16, 1.8 * T - 16); emoji(g, '🍲', x + 1.5 * T, y + 0.9 * T, 18); });
    furn(COLS - 4.6, 9.2, 2.6, 1.6, '📜 Дошка господаря — прибудови, перебудова, город, ферма', (g) => { const x = (COLS - 4.6) * T, y = 9.2 * T; g.fillStyle = '#6a4a2a'; g.fillRect(x, y, 2.6 * T, 1.6 * T); g.fillStyle = '#e8d8b0'; g.fillRect(x + 6, y + 6, 2.6 * T - 12, 1.6 * T - 12); g.font = '700 11px "Segoe UI"'; g.fillStyle = '#3a2a1a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('📜 Прибудови', x + 1.3 * T, y + 0.8 * T); }, () => ISK.panels.house());
    if (U.chest) furn(COLS - 4, 12, 1.4, 1, '🧰 Скриня — сховати речі', (g) => { const x = (COLS - 4) * T, y = 12 * T; g.fillStyle = '#7a4a1e'; g.fillRect(x, y + 6, 1.4 * T, T - 6); g.fillStyle = '#f2c94c'; g.fillRect(x, y + 14, 1.4 * T, 3); g.fillRect(x + 0.7 * T - 3, y + 12, 6, 8); }, () => tab('chest'));
    furn(COLS / 2 - 1, ROWS - 1, 2, 1, '🚪 Вийти на подвір\'я', () => {}, () => go('house'));
    return objs;
  }

  // ================= v5.8: мапа поселення — заклади як будівлі =================
  const TOWN_SIZE = { village: [34, 20], mine: [34, 20], hellfort: [34, 20], town: [42, 24], fortress: [40, 24], port: [42, 26], city: [50, 28], capital: [56, 30] };
  const SCOL = { guild: ['#2a4a8a', '#e8dcc0'], tavern: ['#8a4a1a', '#e0c890'], shop: ['#3a7a3a', '#e8d8b8'], smith: ['#4a4a54', '#9a8a7a'], alchemist: ['#5a2a7a', '#d8d0e8'], trainer: ['#8a2a1a', '#d8c8a8'], temple: ['#dcdcf0', '#e8e4d8'], arena: ['#9a6a3a', '#d8c098'], court: ['#7a1a3a', '#c8b8a8'], stable: ['#7a5a2a', '#c8a06a'], estate: ['#a0522d', '#f0e0c0'], magic: ['#2a2a6a', '#c8c8f0'], elder: ['#6a4a2a', '#d8c098'], carto: ['#6a5a3a', '#e8dcc0'], portal: ['#3a2a6a', '#d0c8f0'], tower: ['#6a6a74', '#b0aaa0'], lords: ['#5a1a4a', '#d8c8b8'], myhouse: ['#b84a2a', '#e8d8b8'], colosseum: ['#c8a070', '#f0e0c0'], myland: ['#6a2a4a', '#d8ccb8'], house: ['#8a5a3a', '#e0d0b0'] };
  function townLayout(bid) {
    const G = UI().G, w = G.world, B = w.baronies[bid], p = G.player; const stype = ISK.world.SETTLEMENT[B.type] || ISK.world.SETTLEMENT.village;
    const demon = ISK.politics.isDemon(G.P, B.owner); const [cols, rows] = TOWN_SIZE[B.type] || TOWN_SIZE.village;
    const port = B.type === 'port'; const walled = ['city', 'capital', 'fortress', 'hellfort'].includes(B.type);
    const my = Math.floor((port ? rows - 5 : rows) / 2), mx = Math.floor(cols / 2);
    const items = [];
    for (const sv of stype.services) if (sv !== 'harbor') items.push({ key: sv, icon: UI().SVC[sv].icon, name: UI().SVC[sv].name, act: () => ISK.panels.openService(sv, B) });
    if (p.house && p.house.barony === B.id) items.unshift({ key: 'myhouse', icon: '🏡', name: 'Мій дім', act: () => go('house') });
    if (p.holdings.includes(B.id)) items.unshift({ key: 'myland', icon: '🏰', name: 'Мої землі', act: () => go('land', B.id) });
    if (!demon && ['capital', 'city', 'town', 'port', 'fortress'].includes(B.type)) items.push({ key: 'carto', icon: '🗺️', name: 'Картограф', act: () => ISK.panels.cartographer(B.id) });
    if (!demon && stype.services.includes('guild')) items.push({ key: 'portal', icon: '🌀', name: 'Портал гільдії', act: () => ISK.nav.portals() });
    if (!demon && GM().hasTower(B)) items.push({ key: 'tower', icon: '🗼', name: 'Оглядова вежа', act: () => ISK.nav.tower(B.id), tall: true });
    if (!demon && B.type === 'capital' && ISK.extrasUI) items.unshift({ key: 'colosseum', icon: '🏟️', name: 'Колізей', act: () => ISK.extrasUI.colosseum(B) });
    if (!demon && ISK.life && ISK.life.lordsAt(G, B.id).length && !stype.services.includes('court')) items.push({ key: 'lords', icon: '👑', name: 'Двір лордів', act: () => ISK.panels2.lords(B.id) });
    // ділянки вздовж вулиць, ближчі до площі — першими
    const lots = []; const LW = 4, LH = 3;
    for (let yy = my - LH - 1; yy >= 2; yy -= LH + 2) for (let xx = 2; xx + LW <= cols - 2; xx += LW + 1) lots.push([xx, yy]);
    for (let yy = my + 2; yy + LH <= (port ? rows - 6 : rows - 2); yy += LH + 2) for (let xx = 2; xx + LW <= cols - 2; xx += LW + 1) lots.push([xx, yy]);
    const free = lots.filter(([x, y]) => !(x + LW > mx - 1 && x < mx + 2) && !(Math.abs(x + LW / 2 - mx) < 5.5 && Math.abs(y + LH / 2 - my) < 4));
    free.sort((a, b) => Math.hypot(a[0] + 2 - mx, (a[1] + 1.5 - my) * 1.4) - Math.hypot(b[0] + 2 - mx, (b[1] + 1.5 - my) * 1.4));
    const placed = items.slice(0, free.length).map((it, i) => ({ ...it, x: free[i][0], y: free[i][1], w: LW, h: LH }));
    const homes = free.slice(items.length).filter((_, i) => hash(bid, i) % 3 !== 0).map(([x, y], i) => ({ key: 'house', x: x + 0.5, y: y + 0.5, w: 3, h: 2.5, seed: i }));
    return { cols, rows, mx, my, port, walled, placed, homes, gate: port ? [0, my] : [mx, rows - 1], demon, B };
  }
  function townGround(g, s) {
    const L = st.town; const road = s === 3 ? '#c8c0b4' : '#b8a888', stone = s === 3 ? '#d4ccc0' : '#a89a80';
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { g.fillStyle = grassColor(x, y, s); g.fillRect(x * T, y * T, T, T); }
    const cob = (x, y) => { g.fillStyle = (x + y) % 2 ? road : stone; g.fillRect(x * T, y * T, T, T); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x * T + (hash(x, y) % 20), y * T + (hash(y, x) % 20), 8, 6); };
    for (let x = 0; x < COLS; x++) { cob(x, L.my); cob(x, L.my + 1); }
    for (let y = 0; y < (L.port ? ROWS - 4 : ROWS); y++) { cob(L.mx, y); cob(L.mx + 1, y); }
    for (const b of L.placed.concat(L.homes)) for (let x = Math.floor(b.x + b.w / 2); x <= Math.floor(b.x + b.w / 2); x++) for (let y = Math.ceil(b.y + b.h); y < (b.y + b.h < L.my ? L.my : b.y + b.h + 2); y++) { g.fillStyle = road; g.fillRect(x * T + 8, y * T, T - 16, T); }
    for (const b of L.placed.concat(L.homes)) if (b.y > L.my) for (let y = L.my + 2; y < Math.floor(b.y); y++) { g.fillStyle = road; g.fillRect(Math.floor(b.x + b.w / 2) * T + 8, y * T, T - 16, T); }
    // площа
    for (let y = L.my - 2; y <= L.my + 3; y++) for (let x = L.mx - 4; x <= L.mx + 5; x++) cob(x, y);
    const fx = (L.mx + 1) * T, fy = (L.my + 1) * T;
    if (['capital', 'city', 'town', 'port'].includes(L.B.type)) { g.fillStyle = '#8a8a94'; g.beginPath(); g.arc(fx, fy, 38, 0, 7); g.fill(); g.fillStyle = s === 3 ? '#dfeefc' : '#4a8ad0'; g.beginPath(); g.arc(fx, fy, 30, 0, 7); g.fill(); g.fillStyle = '#b8b8c4'; g.fillRect(fx - 5, fy - 26, 10, 26); g.fillStyle = 'rgba(200,230,255,.8)'; for (let k = 0; k < 6; k++) { const a = k + st.t / 400; g.beginPath(); g.arc(fx + Math.cos(a) * 12, fy - 22 + Math.abs(Math.sin(st.t / 200 + k)) * 14, 2.5, 0, 7); g.fill(); } }
    else { g.fillStyle = '#7a7a84'; g.beginPath(); g.arc(fx, fy, 22, 0, 7); g.fill(); g.fillStyle = '#2a4a7a'; g.beginPath(); g.arc(fx, fy, 15, 0, 7); g.fill(); g.fillStyle = '#5a3a1e'; g.fillRect(fx - 20, fy - 30, 4, 26); g.fillRect(fx + 16, fy - 30, 4, 26); g.fillRect(fx - 20, fy - 32, 40, 5); }
    // море й причали
    if (L.port) { for (let y = ROWS - 4; y < ROWS; y++) for (let x = 0; x < COLS; x++) { g.fillStyle = (x + y + Math.floor(st.t / 600)) % 3 ? '#2e6aa8' : '#3a78b8'; g.fillRect(x * T, y * T, T, T); }
      for (const dx of [-8, 0, 8]) { g.fillStyle = '#7a5a3a'; g.fillRect((L.mx + dx) * T, (ROWS - 4) * T, 2 * T, 3 * T); g.fillStyle = 'rgba(0,0,0,.2)'; for (let k = 0; k < 6; k++) g.fillRect((L.mx + dx) * T, (ROWS - 4) * T + k * 16, 2 * T, 2); }
      emoji(g, '⛵', (L.mx - 7) * T, (ROWS - 1.2) * T + Math.sin(st.t / 500) * 3, 34); emoji(g, '🚢', (L.mx + 9) * T, (ROWS - 1.4) * T + Math.sin(st.t / 600 + 1) * 3, 40); }
    // дерева по краях
    for (let x = 0; x < COLS; x++) if (hash(x, 1) % 3 === 0 && Math.abs(x - L.mx) > 1) tree(g, x * T, 0, s);
    if (!L.port) for (let x = 0; x < COLS; x++) if (hash(x, 2) % 3 === 0 && Math.abs(x - L.mx) > 1) tree(g, x * T, (ROWS - 1) * T - 6, s);
    // мури
    if (L.walled) { g.fillStyle = L.B.type === 'hellfort' ? '#3a1a1a' : '#8a8a94'; const wb = (x, y, w, h) => g.fillRect(x, y, w, h); wb(T * 0.6, T * 0.6, (COLS - 1.2) * T, 12); if (!L.port) { wb(T * 0.6, (ROWS - 1) * T, (L.mx - 0.6) * T, 12); wb((L.mx + 2) * T, (ROWS - 1) * T, (COLS - L.mx - 2.6) * T, 12); } wb(T * 0.6, T * 0.6, 12, (L.my - 0.6) * T); wb(T * 0.6, (L.my + 2) * T, 12, (ROWS - L.my - (L.port ? 6 : 2.4)) * T); wb((COLS - 0.6) * T - 12, T * 0.6, 12, (ROWS - (L.port ? 5 : 1.2)) * T);
      g.fillStyle = 'rgba(0,0,0,.2)'; for (let x = 1; x < COLS - 1; x++) g.fillRect(x * T, T * 0.6 - 6, 12, 8); }
  }
  function townScene() {
    const L = st.town, G = UI().G, s = season(), col = L.B.owner >= 0 ? G.world.realms[L.B.owner].color : '#888'; const objs = [];
    for (const b of L.placed) {
      const [roof, wall] = SCOL[b.key] || SCOL.house;
      if (b.key === 'market') { objs.push({ ...b, hint: `${b.icon} ${b.name} — торгівля`, draw: (g) => { for (let k = 0; k < 3; k++) { const x = (b.x + k * 1.35) * T + 2, y = (b.y + 0.8) * T; g.fillStyle = '#7a5a3a'; g.fillRect(x + 4, y + 20, 34, 26); for (let j = 0; j < 4; j++) { g.fillStyle = j % 2 ? '#fff' : ['#d04a4a', '#3a7ad0', '#e0a030'][k]; g.fillRect(x + j * 10, y, 10, 22); } emoji(g, ['🍎', '🧀', '🐟'][k], x + 20, y + 34, 14); } g.font = '700 11px "Segoe UI"'; g.textAlign = 'center'; g.fillStyle = 'rgba(10,12,20,.75)'; const tw = g.measureText(b.name).width + 8; g.fillRect((b.x + b.w / 2) * T - tw / 2, (b.y + b.h) * T + 4, tw, 15); g.fillStyle = '#fff'; g.fillText(b.name, (b.x + b.w / 2) * T, (b.y + b.h) * T + 12); }, click: b.act }); continue; }
      if (b.key === 'colosseum') { objs.push({ ...b, hint: `${b.icon} ${b.name} — турніри гладіаторів і ставки`, draw: (g) => { const cx = (b.x + 2) * T, cy = (b.y + 1.6) * T; g.fillStyle = '#8a7a6a'; g.beginPath(); g.ellipse(cx, cy, 2.1 * T, 1.6 * T, 0, 0, 7); g.fill(); g.fillStyle = '#c8b89a'; g.beginPath(); g.ellipse(cx, cy, 1.85 * T, 1.38 * T, 0, 0, 7); g.fill(); g.fillStyle = '#6a5a4a'; for (let q = 0; q < 16; q++) { const a = q / 16 * Math.PI * 2; g.fillRect(cx + Math.cos(a) * 1.95 * T - 3, cy + Math.sin(a) * 1.47 * T - 6, 6, 10); } g.fillStyle = '#e0c890'; g.beginPath(); g.ellipse(cx, cy, 1.1 * T, 0.75 * T, 0, 0, 7); g.fill(); emoji(g, '🏟️', cx, cy, 24); g.fillStyle = '#c0303a'; g.fillRect(cx - 2, cy - 1.6 * T - 18, 3, 18); g.fillRect(cx + 1, cy - 1.6 * T - 18, 12, 7); tag(g, b.name, (b.x + b.w / 2) * T, (b.y + b.h) * T + 12); }, click: b.act }); continue; }
      if (b.key === 'arena') { objs.push({ ...b, hint: `${b.icon} ${b.name}`, draw: (g) => { const cx = (b.x + 2) * T, cy = (b.y + 1.6) * T; g.fillStyle = '#b89a6a'; g.beginPath(); g.ellipse(cx, cy, 2 * T, 1.5 * T, 0, 0, 7); g.fill(); g.fillStyle = '#d8c098'; g.beginPath(); g.ellipse(cx, cy, 1.3 * T, 0.9 * T, 0, 0, 7); g.fill(); emoji(g, '⚔️', cx, cy, 20); tag(g, b.name, (b.x + b.w / 2) * T, (b.y + b.h) * T + 12); }, click: b.act }); continue; }
      if (b.key === 'tower') { objs.push({ ...b, hint: `${b.icon} ${b.name} — оглянути околиці`, draw: (g) => { const x = (b.x + 1.3) * T; g.fillStyle = '#8a8a94'; g.fillRect(x, (b.y - 0.2) * T, 1.4 * T, (b.h + 0.2) * T); g.fillStyle = '#5a5a64'; g.fillRect(x + 14, (b.y + b.h - 0.8) * T, 16, 0.8 * T); g.fillStyle = '#6a6a74'; for (let q = 0; q < 3; q++) g.fillRect(x + q * 16, (b.y - 0.5) * T, 10, 12); g.fillStyle = col; g.fillRect(x + 20, (b.y - 1.1) * T, 16, 12); tag(g, b.name, (b.x + b.w / 2) * T, (b.y + b.h) * T + 12); }, click: b.act }); continue; }
      objs.push({ ...b, hint: `${b.icon} ${b.name} — підійти й увійти`, draw: (g) => { building(g, b.x, b.y, b.w, b.h, roof, wall, { icon: b.icon, label: b.name, chimney: ['smith', 'tavern', 'myhouse', 'house', 'elder'].includes(b.key), banner: ['guild', 'court', 'lords', 'myland'].includes(b.key) ? col : null }); if (b.key === 'smith') smoke(g, (b.x + b.w * 0.75) * T, (b.y + 0.4) * T, '#ff9a40'); if (b.key === 'portal') { g.strokeStyle = `rgba(170,120,255,${0.5 + Math.sin(st.t / 200) * 0.3})`; g.lineWidth = 3; g.beginPath(); g.arc((b.x + b.w / 2) * T, (b.y + 0.2) * T, 12 + Math.sin(st.t / 150) * 3, 0, 7); g.stroke(); } }, click: b.act });
    }
    for (const b of L.homes) objs.push({ ...b, hint: '🏠 Будинок містян', draw: (g) => { const pal = [['#a0522d', '#e8d0a8'], ['#6a4a8a', '#e0d8c8'], ['#3a6a5a', '#e8e0c8'], ['#8a3a2a', '#d8c8a8']][hash(b.seed, L.B.id) % 4]; building(g, b.x, b.y, b.w, b.h, pal[0], pal[1], { chimney: b.seed % 2 === 0 }); } });
    // герої поруч
    (G.P.heroes || []).filter((x) => x.alive && !x.joined && x.node === L.B.id && !(x.path && x.path.length)).slice(0, 4).forEach((hh, i) => { const x = L.mx - 3 + i * 2.2, y = L.my + 2.6; objs.push({ x, y, w: 1, h: 1.3, hint: `${hh.icon} ${hh.name}, рів. ${hh.lvl} — поговорити`, draw: (g) => { g.drawImage(SP().npc('hero' + hh.id, { weapon: 'sword' }), x * T - 4, y * T - 8, 40, 40); g.font = '600 10px "Segoe UI"'; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,.6)'; const lb = `${hh.icon} ${hh.name.split(' ')[0]}`; const tw = g.measureText(lb).width + 6; g.fillRect(x * T + 16 - tw / 2, y * T - 22, tw, 13); g.fillStyle = '#ffe9a8'; g.fillText(lb, x * T + 16, y * T - 15); }, click: () => ISK.panels.heroTalk(hh.id) }); });
    // ворота
    const [gx, gy] = L.gate;
    objs.push({ x: L.port ? 0 : gx, y: L.port ? gy : gy, w: L.port ? 1 : 2, h: L.port ? 2 : 1, hint: '🚪 Ворота — вийти на мапу світу', draw: (g) => { const x = (L.port ? 0 : gx) * T, y = gy * T; if (L.walled) { g.fillStyle = '#6a6a74'; g.fillRect(x - (L.port ? 0 : 10), y - 18, L.port ? T : 2 * T + 20, 18); } emoji(g, '🚪', x + (L.port ? T / 2 : T), y + (L.port ? T : T / 2), 22); g.font = '700 11px "Segoe UI"'; g.textAlign = 'center'; g.fillStyle = 'rgba(10,12,20,.75)'; g.fillRect(x + (L.port ? 2 : T - 28), y - (L.port ? -2 * T - 4 : 34), 56, 15); g.fillStyle = '#fff'; g.fillText('Вихід', x + (L.port ? 30 : T), y - (L.port ? -2 * T - 12 : 26)); }, click: () => close() });
    // кнопка «околиці»: угіддя, полювання — біля воріт
    objs.push({ x: (L.port ? 1.4 : gx + 2.4), y: (L.port ? gy - 1.6 : gy - 1.2), w: 1, h: 1, hint: '🌲 Стовп-покажчик: угіддя поруч, полювання', draw: (g) => { const x = (L.port ? 1.4 : gx + 2.4) * T, y = (L.port ? gy - 1.6 : gy - 1.2) * T; g.fillStyle = '#6a4a2a'; g.fillRect(x + 14, y, 4, T); g.fillStyle = '#c8a06a'; g.fillRect(x, y + 2, T, 10); emoji(g, '🌲', x + 16, y + 7, 10); }, click: () => { const sp = ISK.panels.spotsNear; const B = L.B; const n = (G.world.graph['b:' + B.id] || []).filter((e) => e.to[0] === 'r' && G.discovered[e.to]).length; if (n) sp(B.id); else ISK.panels.explore(); } });
    return objs;
  }

  // ---- walkers: hero, pets, companions, family, peasants, townsfolk ----
  function wanderPoint(kind) {
    if (kind === 'town') { const L = st.town; return Math.random() < 0.5 ? [(1 + Math.random() * (COLS - 3)) * T, (L.my + Math.random() * 1.2) * T] : [(L.mx + Math.random()) * T, (2 + Math.random() * ((L.port ? ROWS - 6 : ROWS - 3))) * T]; }
    if (kind === 'home') return [(2 + Math.random() * (COLS - 5)) * T, (8.4 + Math.random() * 5) * T];
    return [(3 + Math.random() * 24) * T, (8 + Math.random() * 6) * T];
  }
  function makeWalkers(kind, bid) {
    const G = UI().G, p = G.player;
    const start = kind === 'town' ? (st.town.port ? [2.4 * T, (st.town.my) * T] : [(st.town.mx + 0.5) * T, (ROWS - 3.4) * T]) : kind === 'home' ? [(COLS / 2 - 0.6) * T, (ROWS - 2.6) * T] : [15 * T, 11 * T];
    const out = [{ who: 'hero', sprite: SP().hero(p), x: start[0], y: start[1], tx: start[0], ty: start[1], size: 40, speed: 1.8 }];
    const add = (sprite, size, label) => { const [x, y] = wanderPoint(kind); out.push({ sprite, size, label, x, y, tx: 0, ty: 0, speed: 0.6 + Math.random() * 0.6, wander: true }); };
    if (kind !== 'town') {
      if (p.activePet >= 0 && p.pets[p.activePet]) add(SP().forPet(p.pets[p.activePet].key), 26, p.pets[p.activePet].name);
      if (p.spouse) add(SP().npc('sp' + p.spouse.portrait, { female: p.spouse.female, crown: p.spouse.kind === 'noble' }), 36, '💞 ' + p.spouse.name.split(',')[0]);
      for (const c of p.children) add(SP().npc('ch' + c.name + c.born, { female: c.female }), 24, c.name);
    }
    if (kind !== 'home') for (const c of p.party) add(SP().forCompanion(c), 36, c.name);
    if (kind === 'town') { if (p.activePet >= 0 && p.pets[p.activePet]) add(SP().forPet(p.pets[p.activePet].key), 26, p.pets[p.activePet].name); const n = { village: 5, mine: 5, town: 9, port: 10, fortress: 8, city: 14, capital: 18 }[st.town.B.type] || 5; for (let i = 0; i < n; i++) add(SP().npc('tf' + bid + i, { female: i % 2 === 1, body: ['#8a6a3a', '#3a5a8a', '#7a3a5a', '#4a7a4a', '#9a8a6a'][i % 5], hat: i % 3 === 0 ? '#5a3a1a' : null, weapon: st.town.walled && i % 4 === 0 ? 'spear' : undefined }), 32, null); }
    if (kind === 'land') { const LL = GM().landState(G, bid); for (let i = 0; i < Math.min(14, 3 + Math.floor(LL.pop / 15)); i++) add(SP().npc('peasant' + bid + i, { body: ['#8a6a3a', '#6a7a4a', '#9a5a3a'][i % 3], hat: i % 2 ? '#c8a050' : null }), 30, null); if (p.army) for (let i = 0; i < Math.min(6, ISK.life.armyCount(p) / 5); i++) add(SP().npc('sold' + i, { body: '#5a6a8a', weapon: 'spear', hat: '#8a8a94' }), 32, null); }
    return out;
  }

  // ================= рушій локацій: камера, ходьба, підхід до об'єктів =================
  const TITLES = { house: () => `🏡 Подвір'я · ${UI().G.world.baronies[UI().G.player.house.barony].name}`, home: () => `🛋️ Мій дім · ${D().HOUSE_LEVELS[GM().houseLevel(UI().G.player.house)].name}`, land: (bid) => `🏰 Мої землі · ${UI().G.world.baronies[bid].name}`, town: (bid) => { const B = UI().G.world.baronies[bid]; return `${ISK.world.SETTLEMENT[B.type].icon} ${B.name} · ${ISK.world.SETTLEMENT[B.type].name}`; } };
  // перехід між локаціями (місто → подвір'я → дім) зі збереженням «звідки прийшли»
  function go(kind, bid) { const from = st ? { kind: st.kind, bid: st.bid, from: st.from } : null; open(kind, bid, { from }); }
  function back() { const f = st && st.from; if (f) open(f.kind, f.bid, { from: f.from }); else close(); }
  function open(kind, bid, opts = {}) {
    const G = UI().G; const p = G.player;
    if ((kind === 'house' || kind === 'home') && (!p.house || p.location !== 'b:' + p.house.barony)) return UI().toast('Твій дім в іншому місці.', 'bad');
    if (kind === 'land' && !p.holdings.includes(bid)) return UI().toast('Це не твої землі.', 'bad');
    if (kind === 'town') { bid = bid ?? +p.location.slice(2); if (p.location !== 'b:' + bid) return UI().toast('Спершу дійди до поселення.', 'bad'); }
    if (st) { cancelAnimationFrame(st.raf); window.removeEventListener('keydown', st.kd); window.removeEventListener('keyup', st.ku); }
    const old = document.getElementById('estate'); if (old) old.remove();
    const town = kind === 'town' ? townLayout(bid) : null;
    if (town) { COLS = town.cols; ROWS = town.rows; } else if (kind === 'home') [COLS, ROWS] = homeSize(); else { COLS = 30; ROWS = 17; }
    const root = document.createElement('div'); root.id = 'estate';
    const cv = document.createElement('canvas'); cv.className = 'estate-cv';
    const H = UI().h; const from = opts.from || null;
    const btns = [];
    if (from) btns.push(H('button', { class: 'btn small', onclick: back }, from.kind === 'town' ? '⬅ У місто' : from.kind === 'house' ? '⬅ Подвір\'я' : '⬅ Назад'));
    if (kind === 'house') btns.push(H('button', { class: 'btn small', onclick: () => go('home') }, '🚪 У дім'), H('button', { class: 'btn small', onclick: () => ISK.panels.house() }, '📜 Прибудови'));
    if (kind === 'home') btns.push(H('button', { class: 'btn small', onclick: () => ISK.panels.house() }, '📜 Прибудови'));
    if (kind === 'land') btns.push(H('button', { class: 'btn small', onclick: () => ISK.panels.land(bid) }, '📜 Керування'));
    if (kind === 'town') { const B = UI().G.world.baronies[bid]; btns.push(H('button', { class: 'btn small', onclick: () => ISK.panels.talk(B) }, '💬 Поговорити'), H('button', { class: 'btn small', onclick: () => UI().heroesHere(B) }, '🧭 Герої'), H('button', { class: 'btn small', onclick: () => ISK.panels.campfire() }, '🔥 Табір'), H('button', { class: 'btn small', onclick: () => ISK.panels.waitDays() }, '⏳ Чекати')); }
    btns.push(H('button', { class: 'btn small', onclick: () => ISK.panels2.army() }, '⚔️ Військо'), H('button', { class: 'btn small', onclick: () => ISK.panels2.family() }, '💞 Родина'));
    btns.push(H('button', { class: 'btn small primary', onclick: close }, '🗺️ На мапу світу'));
    const bar = H('div', { class: 'estate-bar' }, H('div', { class: 'estate-title' }, TITLES[kind](bid)), H('div', { class: 'spacer' }), ...btns);
    const DEF_HINT = kind === 'town' ? 'Клікни будівлю — герой підійде й увійде. WASD — ходити, E — увійти поруч, коліщатко — масштаб, Esc — вихід.' : kind === 'home' ? 'Клікай меблі: ліжко — поспати, піч — готувати, комора — забрати продукти. Двері внизу — на подвір\'я.' : 'Клікай по будівлях і грядках — герой підійде. WASD — ходити, E — дія поруч, коліщатко — масштаб.';
    const hint = H('div', { class: 'estate-hint' }, DEF_HINT);
    root.append(bar, cv, hint); document.body.appendChild(root);
    st = { kind, bid, from, cv, g: cv.getContext('2d'), objs: [], t: 0, hint, raf: 0, town, keys: new Set(), cam: { x: 0, y: 0, z: 0 }, pending: null };
    st.walkers = makeWalkers(kind, bid);
    const inObj = (m, ob) => ob.w && m.x >= ob.x * T && m.x < (ob.x + ob.w) * T && m.y >= ob.y * T - 6 && m.y < (ob.y + ob.h) * T;
    const toWorld = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / st.cam.z + st.cam.x, y: (e.clientY - r.top) / st.cam.z + st.cam.y }; };
    const pick = (m) => st.objs.slice().reverse().find((ob) => ob.click && inObj(m, ob)) || null;
    cv.addEventListener('mousemove', (e) => { if (st.drag) { st.cam.x = st.drag.cx - (e.clientX - st.drag.x) / st.cam.z; st.cam.y = st.drag.cy - (e.clientY - st.drag.y) / st.cam.z; st.free = Date.now() + 2500; return; } const m = toWorld(e); const o = st.objs.slice().reverse().find((ob) => ob.hint && inObj(m, ob)); hint.textContent = o ? o.hint : DEF_HINT; cv.style.cursor = o && o.click ? 'pointer' : ''; });
    cv.addEventListener('mousedown', (e) => { if (e.button === 0 && e.ctrlKey) st.drag = { x: e.clientX, y: e.clientY, cx: st.cam.x, cy: st.cam.y }; });
    window.addEventListener('mouseup', () => { if (st) st.drag = null; });
    cv.addEventListener('click', (e) => { if (e.ctrlKey) return; const m = toWorld(e); const o = pick(m); walkTo(o ? (o.x + o.w / 2) * T - 20 : m.x - 20, o ? (o.y + o.h) * T - 30 : m.y - 30, o); });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); const r = cv.getBoundingClientRect(); const sx = e.clientX - r.left, sy = e.clientY - r.top; const wx = sx / st.cam.z + st.cam.x, wy = sy / st.cam.z + st.cam.y; st.cam.z = Math.max(st.zmin, Math.min(3.2, st.cam.z * (e.deltaY < 0 ? 1.12 : 0.89))); st.cam.x = wx - sx / st.cam.z; st.cam.y = wy - sy / st.cam.z; st.free = Date.now() + 1800; }, { passive: false });
    cv.addEventListener('contextmenu', (e) => { e.preventDefault(); const o = pick(toWorld(e)); ISK.panels2.contextMenu(e.clientX, e.clientY, [o ? { icon: '👆', label: o.hint || 'Відкрити', fn: () => walkTo((o.x + o.w / 2) * T - 20, (o.y + o.h) * T - 30, o) } : { icon: '🏡', label: 'Тут нічого', disabled: true }, '-', { icon: '🗺️', label: 'На мапу світу', fn: close }]); });
    st.kd = (e) => { if (!st || e.target.tagName === 'INPUT') return; if (e.key === 'Escape') { if (!UI().closeTop()) (st.from ? back() : close()); e.preventDefault(); return; } if (UI().modalStack.length) return; if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) { st.keys.add(e.code); st.pending = null; e.preventDefault(); } if (e.code === 'KeyE' || e.code === 'Enter') { interactNear(); e.preventDefault(); } };
    st.ku = (e) => { if (st) st.keys.delete(e.code); };
    window.addEventListener('keydown', st.kd); window.addEventListener('keyup', st.ku);
    A().setMood(kind === 'house' || kind === 'home' ? 'home' : 'town');
    const loop = (now) => { if (!st) return; st.t = now; frame(); st.raf = requestAnimationFrame(loop); };
    st.raf = requestAnimationFrame(loop);
    UI().inEstate = true;
  }
  function walkTo(x, y, obj) { const h = st.walkers[0]; h.tx = Math.max(0, Math.min(COLS * T - 40, x)); h.ty = Math.max(0, Math.min(ROWS * T - 40, y)); st.pending = obj && obj.click ? obj : null; st.free = 0; if (obj && obj.click && Math.hypot(h.tx - h.x, h.ty - h.y) < 8) fire(); }
  function fire() { const o = st.pending; st.pending = null; if (!o) return; A().play('click'); o.click(); }
  function interactNear() { const h = st.walkers[0]; let best = null, bd = 2.2 * T; for (const o of st.objs) { if (!o.click || !o.w) continue; const d = Math.hypot((o.x + o.w / 2) * T - (h.x + 20), (o.y + o.h) * T - (h.y + 36)); if (d < bd) { bd = d; best = o; } } if (best) { st.pending = best; fire(); } else UI().toast('Поруч нічого цікавого.', '', 1200); }
  function frame() {
    const cv = st.cv, g = st.g, s = season(); const dpr = window.devicePixelRatio || 1;
    const cw = cv.clientWidth, ch = cv.clientHeight; if (!cw || !ch) return;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    const fit = Math.min(cw / (COLS * T), ch / (ROWS * T)); st.zmin = Math.min(1, fit * 0.95);
    if (!st.cam.z) { st.cam.z = Math.max(fit, Math.min(2, fit * (st.kind === 'town' ? 1.7 : st.kind === 'home' ? 1.15 : 1.35))); const h0 = st.walkers[0]; st.cam.x = h0.x + 20 - cw / st.cam.z / 2; st.cam.y = h0.y + 20 - ch / st.cam.z / 2; }
    st.objs = st.kind === 'house' ? houseScene() : st.kind === 'home' ? homeScene() : st.kind === 'town' ? townScene() : landScene(st.bid);
    // рух героя з клавіатури
    const hero = st.walkers[0];
    if (st.keys.size) { let dx = 0, dy = 0; for (const k of st.keys) { if (k === 'KeyW' || k === 'ArrowUp') dy--; if (k === 'KeyS' || k === 'ArrowDown') dy++; if (k === 'KeyA' || k === 'ArrowLeft') dx--; if (k === 'KeyD' || k === 'ArrowRight') dx++; } const l = Math.hypot(dx, dy) || 1; hero.tx = Math.max(0, Math.min(COLS * T - 40, hero.x + dx / l * 14)); hero.ty = Math.max(0, Math.min(ROWS * T - 40, hero.y + dy / l * 14)); st.free = 0; }
    // камера йде за героєм
    const vw = cw / st.cam.z, vh = ch / st.cam.z;
    if (!st.free || Date.now() > st.free) { const tx = hero.x + 20 - vw / 2, ty = hero.y + 20 - vh / 2; st.cam.x += (tx - st.cam.x) * 0.12; st.cam.y += (ty - st.cam.y) * 0.12; }
    const W = COLS * T, Hh = ROWS * T; st.cam.x = vw >= W ? (W - vw) / 2 : Math.max(0, Math.min(W - vw, st.cam.x)); st.cam.y = vh >= Hh ? (Hh - vh) / 2 : Math.max(0, Math.min(Hh - vh, st.cam.y));
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0c0f1a'; g.fillRect(0, 0, cv.width, cv.height);
    const z = st.cam.z * dpr; g.setTransform(z, 0, 0, z, -st.cam.x * z, -st.cam.y * z); g.imageSmoothingEnabled = false;
    drawGround(g, s, st.kind);
    for (const o of st.objs.slice().sort((a, b) => a.y + a.h - (b.y + b.h))) o.draw && o.draw(g);
    if (st.pending) { const o = st.pending; g.strokeStyle = `rgba(255,223,142,${0.6 + Math.sin(st.t / 150) * 0.3})`; g.lineWidth = 3; g.setLineDash([6, 4]); g.strokeRect(o.x * T - 3, o.y * T - 3, o.w * T + 6, o.h * T + 6); g.setLineDash([]); }
    for (const w of st.walkers) {
      if (w.wander && (Math.hypot(w.tx - w.x, w.ty - w.y) < 4 || !w.tx)) { const [x, y] = wanderPoint(st.kind); w.tx = x; w.ty = y; }
      const dx = w.tx - w.x, dy = w.ty - w.y, d = Math.hypot(dx, dy);
      if (d > 2) { const sp = Math.min(d, w.speed); w.x += dx / d * sp; w.y += dy / d * sp; w.dir = dx < -0.5 ? -1 : dx > 0.5 ? 1 : w.dir; w.walk = (w.walk || 0) + 0.2; }
      const bob = d > 2 ? Math.abs(Math.sin(w.walk)) * 3 : 0;
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(w.x + w.size / 2, w.y + w.size - 2, w.size / 3, 4, 0, 0, 7); g.fill();
      g.save(); if (w.dir < 0) { g.translate(w.x + w.size, 0); g.scale(-1, 1); g.drawImage(w.sprite, 0, w.y - bob, w.size, w.size); } else g.drawImage(w.sprite, w.x, w.y - bob, w.size, w.size); g.restore();
      if (w.label) { g.font = '600 10px "Segoe UI"'; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,.55)'; const tw = g.measureText(w.label).width + 6; g.fillRect(w.x + w.size / 2 - tw / 2, w.y - 14, tw, 13); g.fillStyle = '#fff'; g.fillText(w.label, w.x + w.size / 2, w.y - 4); }
    }
    if (st.pending && Math.hypot(hero.tx - hero.x, hero.ty - hero.y) < 4) fire();
    // season overlay
    if (s === 3 && st.kind !== 'home') { for (let i = 0; i < 60; i++) { const x = (hash(i, 1) % (COLS * T) + st.t / 20 * ((i % 3) + 1)) % (COLS * T); const y = (hash(i, 2) % (ROWS * T) + st.t / 12 * ((i % 4) + 1)) % (ROWS * T); g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(x, y, 3, 3); } }
    const env = ISK.life.environment(UI().G);
    if (st.kind !== 'home' && (env.weatherKey === 'rain' || env.weatherKey === 'storm')) { g.strokeStyle = 'rgba(170,200,255,.5)'; g.lineWidth = 1; for (let i = 0; i < 90; i++) { const x = (hash(i, 5) % (COLS * T) + st.t / 3) % (COLS * T); const y = (hash(i, 6) % (ROWS * T) + st.t / 1.5) % (ROWS * T); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 10); g.stroke(); } }
    // дата — у кутку екрана
    g.setTransform(dpr, 0, 0, dpr, 0, 0); const cwid = st.cv.clientWidth;
    g.font = '700 13px "Segoe UI"'; g.fillStyle = 'rgba(10,12,20,.7)'; g.fillRect(cwid - 238, 6, 230, 24); g.fillStyle = '#fff'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(`${env.season.icon} ${env.season.name} · ${env.weather.icon} ${env.weather.name} · ${GM().dateStr(UI().G.time)}`, cwid - 14, 18);
  }
  function close() { if (!st && !document.getElementById('estate')) return; if (st) { cancelAnimationFrame(st.raf); window.removeEventListener('keydown', st.kd); window.removeEventListener('keyup', st.ku); } st = null; const el = document.getElementById('estate'); if (el) el.remove(); if (UI()) { UI().inEstate = false; UI().refresh(); } }
  ISK.estate = { open, close, go, isOpen: () => !!st, kind: () => (st ? st.kind : null) };
})();
