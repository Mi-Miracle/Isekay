// Хроніки Дивосвіту v4 — Estate scenes: your house and your own lands open as separate hand-drawn pixel maps.
// House: cottage that grows with upgrades, garden beds with growing crops, chest, well, forge, stable, pets & family walking.
// Land: a village with your manor, every building you constructed, empty lots to build, fields, peasants, soldiers, walls.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = () => ISK.ui, D = () => ISK.data, SP = () => ISK.sprites, PL = () => ISK.player, GM = () => ISK.game, A = () => ISK.audio;
  const T = 32, COLS = 30, ROWS = 17;
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
  function emoji(g, e, x, y, size = 20) { g.font = `${size}px "Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, x, y); }

  // ---- scene layouts: list of clickable objects {x,y,w,h, draw(g), click(), hint} ----
  function houseScene() {
    const G = UI().G, p = G.player, Hh = p.house, U = Hh.upgrades; const objs = [];
    const HL = GM().houseLevel(Hh), lvl = HL * 3; const s = season(); const HLD = D().HOUSE_LEVELS[HL];
    const hw = [4, 4, 5, 6, 6][HL], hh = [3, 4, 4, 5, 5][HL];
    objs.push({ x: 12, y: 3, w: hw, h: hh, hint: `${HLD.icon} ${HLD.name} — кімнати, прибудови, перебудова`, draw: (g) => { building(g, 12, 3, hw, hh, lvl >= 6 ? '#7a2a3a' : '#b84a2a', s === 3 ? '#efe6da' : '#e8d8b8', { chimney: true, label: HLD.name + ' · мій дім', night: false }); if (U.kitchen) smoke(g, (12 + hw * 0.72) * T + 4, 3 * T + 10); }, click: () => ISK.panels.house() });
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

  // ---- walkers: hero, pets, companions, family, peasants ----
  function makeWalkers(kind, bid) {
    const G = UI().G, p = G.player; const out = [{ who: 'hero', sprite: SP().hero(p), x: 15 * T, y: 11 * T, tx: 15 * T, ty: 11 * T, size: 40, speed: 2.4 }];
    const add = (sprite, size, label) => out.push({ sprite, size, label, x: (4 + Math.random() * 22) * T, y: (8 + Math.random() * 6) * T, tx: 0, ty: 0, speed: 0.6 + Math.random() * 0.6, wander: true });
    if (p.activePet >= 0 && p.pets[p.activePet]) add(SP().forPet(p.pets[p.activePet].key), 26, p.pets[p.activePet].name);
    for (const c of p.party) add(SP().forCompanion(c), 36, c.name);
    if (p.spouse) add(SP().npc('sp' + p.spouse.portrait, { female: p.spouse.female, crown: p.spouse.kind === 'noble' }), 36, '💞 ' + p.spouse.name.split(',')[0]);
    for (const c of p.children) add(SP().npc('ch' + c.name + c.born, { female: c.female }), 24, c.name);
    if (kind === 'land') { const LL = GM().landState(G, bid); for (let i = 0; i < Math.min(14, 3 + Math.floor(LL.pop / 15)); i++) add(SP().npc('peasant' + bid + i, { body: ['#8a6a3a', '#6a7a4a', '#9a5a3a'][i % 3], hat: i % 2 ? '#c8a050' : null }), 30, null); if (p.army) for (let i = 0; i < Math.min(6, ISK.life.armyCount(p) / 5); i++) add(SP().npc('sold' + i, { body: '#5a6a8a', weapon: 'spear', hat: '#8a8a94' }), 32, null); }
    return out;
  }

  // ---- open / loop ----
  function open(kind, bid) {
    const G = UI().G; const p = G.player;
    if (kind === 'house' && (!p.house || p.location !== 'b:' + p.house.barony)) return UI().toast('Твій дім в іншому місці.', 'bad');
    if (kind === 'land' && !p.holdings.includes(bid)) return UI().toast('Це не твої землі.', 'bad');
    close();
    const root = document.createElement('div'); root.id = 'estate';
    const cv = document.createElement('canvas'); cv.width = COLS * T; cv.height = ROWS * T; cv.className = 'estate-cv';
    const bar = UI().h('div', { class: 'estate-bar' },
      UI().h('div', { class: 'estate-title' }, kind === 'house' ? `🏡 Садиба · ${G.world.baronies[p.house.barony].name}` : `🏰 Мої землі · ${G.world.baronies[bid].name}`),
      UI().h('div', { class: 'spacer' }),
      kind === 'house' ? UI().h('button', { class: 'btn small', onclick: () => ISK.panels.house() }, '🏡 Кімнати') : UI().h('button', { class: 'btn small', onclick: () => ISK.panels.land(bid) }, '📜 Керування'),
      UI().h('button', { class: 'btn small', onclick: () => ISK.panels2.army() }, '⚔️ Військо'),
      UI().h('button', { class: 'btn small', onclick: () => ISK.panels2.family() }, '💞 Родина'),
      UI().h('button', { class: 'btn small primary', onclick: close }, '🗺️ На мапу світу'));
    const hint = UI().h('div', { class: 'estate-hint' }, 'Клікай по будівлях і грядках. Герой ходить туди, куди клікнеш.');
    root.append(bar, cv, hint); document.body.appendChild(root);
    st = { kind, bid, cv, g: cv.getContext('2d'), objs: [], walkers: makeWalkers(kind, bid), t: 0, hint, raf: 0 };
    st.g.imageSmoothingEnabled = false;
    const toCell = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * cv.width, y: (e.clientY - r.top) / r.height * cv.height }; };
    cv.addEventListener('mousemove', (e) => { const m = toCell(e); const o = st.objs.find((ob) => ob.w && m.x >= ob.x * T && m.x < (ob.x + ob.w) * T && m.y >= ob.y * T && m.y < (ob.y + ob.h) * T); hint.textContent = o && o.hint ? o.hint : 'Клікай по будівлях і грядках. Герой ходить туди, куди клікнеш.'; cv.style.cursor = o && o.click ? 'pointer' : 'default'; });
    cv.addEventListener('click', (e) => { const m = toCell(e); const hero = st.walkers[0]; hero.tx = m.x - 20; hero.ty = m.y - 30; const o = st.objs.find((ob) => ob.w && ob.click && m.x >= ob.x * T && m.x < (ob.x + ob.w) * T && m.y >= ob.y * T && m.y < (ob.y + ob.h) * T); if (o) { A().play('click'); o.click(); } });
    cv.addEventListener('contextmenu', (e) => { e.preventDefault(); const m = toCell(e); const o = st.objs.find((ob) => ob.w && ob.click && m.x >= ob.x * T && m.x < (ob.x + ob.w) * T && m.y >= ob.y * T && m.y < (ob.y + ob.h) * T); ISK.panels2.contextMenu(e.clientX, e.clientY, [o ? { icon: '👆', label: o.hint || 'Відкрити', fn: o.click } : null, { icon: '🗺️', label: 'На мапу світу', fn: close }]); });
    A().setMood(kind === 'house' ? 'home' : 'town');
    const loop = (now) => { if (!st) return; st.t = now; frame(); st.raf = requestAnimationFrame(loop); };
    st.raf = requestAnimationFrame(loop);
    UI().inEstate = true;
  }
  function frame() {
    const g = st.g, s = season();
    st.objs = st.kind === 'house' ? houseScene() : landScene(st.bid);
    drawGround(g, s, st.kind);
    // draw objects sorted by y
    for (const o of st.objs.slice().sort((a, b) => a.y + a.h - (b.y + b.h))) o.draw && o.draw(g);
    // walkers
    for (const w of st.walkers) {
      if (w.wander && (Math.hypot(w.tx - w.x, w.ty - w.y) < 4 || !w.tx)) { w.tx = (3 + Math.random() * 24) * T; w.ty = (8 + Math.random() * 6) * T; }
      const dx = w.tx - w.x, dy = w.ty - w.y, d = Math.hypot(dx, dy);
      if (d > 2) { w.x += dx / d * w.speed; w.y += dy / d * w.speed; w.dir = dx < 0 ? -1 : 1; w.walk = (w.walk || 0) + 0.2; }
      const bob = d > 2 ? Math.abs(Math.sin(w.walk)) * 3 : 0;
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(w.x + w.size / 2, w.y + w.size - 2, w.size / 3, 4, 0, 0, 7); g.fill();
      g.save(); if (w.dir < 0) { g.translate(w.x + w.size, 0); g.scale(-1, 1); g.drawImage(w.sprite, 0, w.y - bob, w.size, w.size); } else g.drawImage(w.sprite, w.x, w.y - bob, w.size, w.size); g.restore();
      if (w.label) { g.font = '600 10px "Segoe UI"'; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,.55)'; const tw = g.measureText(w.label).width + 6; g.fillRect(w.x + w.size / 2 - tw / 2, w.y - 14, tw, 13); g.fillStyle = '#fff'; g.fillText(w.label, w.x + w.size / 2, w.y - 4); }
    }
    // season overlay
    if (s === 3) { for (let i = 0; i < 60; i++) { const x = (hash(i, 1) % (COLS * T) + st.t / 20 * ((i % 3) + 1)) % (COLS * T); const y = (hash(i, 2) % (ROWS * T) + st.t / 12 * ((i % 4) + 1)) % (ROWS * T); g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(x, y, 3, 3); } }
    const env = ISK.life.environment(UI().G);
    if (env.weatherKey === 'rain' || env.weatherKey === 'storm') { g.strokeStyle = 'rgba(170,200,255,.5)'; g.lineWidth = 1; for (let i = 0; i < 90; i++) { const x = (hash(i, 5) % (COLS * T) + st.t / 3) % (COLS * T); const y = (hash(i, 6) % (ROWS * T) + st.t / 1.5) % (ROWS * T); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 10); g.stroke(); } }
    g.font = '700 13px "Segoe UI"'; g.fillStyle = 'rgba(10,12,20,.7)'; g.fillRect(COLS * T - 230, 6, 222, 24); g.fillStyle = '#fff'; g.textAlign = 'right'; g.fillText(`${env.season.icon} ${env.season.name} · ${env.weather.icon} ${env.weather.name} · ${GM().dateStr(UI().G.time)}`, COLS * T - 14, 23);
  }
  function close() { if (!st && !document.getElementById('estate')) return; if (st) cancelAnimationFrame(st.raf); st = null; const el = document.getElementById('estate'); if (el) el.remove(); if (UI()) { UI().inEstate = false; UI().refresh(); } }
  ISK.estate = { open, close, isOpen: () => !!st };
})();
