// v5.4 Екран Глибин і шахт: тайлова мапа на canvas, туман війни, WASD / клік-шлях, Вартові, боси, рудні жили.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = () => ISK.ui, DP = () => ISK.depths, PL = () => ISK.player, GM = () => ISK.game, A = () => ISK.audio;
  const h = (...a) => UI().h(...a);
  const EMO = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  const THEMES = {
    mine: { floor: '#6b5640', floor2: '#614d38', wall: '#140d07', wallTop: '#2b2017', fog: '#07050a' },
    crypt: { floor: '#4a4958', floor2: '#43424f', wall: '#0d0c12', wallTop: '#22202c', fog: '#05050a' },
    slime: { floor: '#2f4436', floor2: '#2a3d30', wall: '#121c16', wallTop: '#1f3326', fog: '#040806' },
    dragon: { floor: '#5c3a30', floor2: '#53342b', wall: '#0e0705', wallTop: '#261510', fog: '#080404' },
    citadel: { floor: '#40232a', floor2: '#381e24', wall: '#14080b', wallTop: '#2c1218', fog: '#070204' },
    def: { floor: '#4b4258', floor2: '#443c50', wall: '#0e0b13', wallTop: '#231d2b', fog: '#06050a' },
  };
  const OBJ = { chest: '💰', mimic: '💰', shrine: '⛲', lore: '📜', merchant: '🧙', trap: '⚠️' };
  const LORE = ['Напис: «Глибше — значить краще. Підпис: гном, який так і не повернувся».', 'Табличка: «Рівень 50. Тут видають безкоштовну каву». Кави немає.', 'Записка: «Вартові охороняють сходи, бо в них ПРОФСПІЛКА».',
    'На стіні подряпано: «Люмі була тут». Поруч сердечко і вантажівка.', 'Щоденник: «День 3. Туман війни — це просто погане освітлення. Чому я ще не купив лампу?»', 'Руни: «Рівень 100 — не кінець. Кінець — це коли закінчились зілля».'];
  let root = null, cv = null, logEl = null, side = null, busy = false, walkAbort = false, zoom = 32, raf = 0, keyH = null;

  // ---------------- вхід ----------------
  async function enter(key) {
    const G = UI().G; const src = DP().srcFor(G, key); const starts = DP().startDepths(G, key);
    let depth = 1;
    if (starts.length > 1) {
      depth = await new Promise((res) => {
        const m = UI().modal({ title: src.kind === 'mine' ? 'Спуск у шахту' : 'Глибини: звідки почати?', icon: src.kind === 'mine' ? '⛏️' : '🕳️', size: 'narrow', onClose: () => res(0),
          body: () => h('div', { class: 'col' }, h('div', { class: 'muted' }, 'Контрольні точки відкриваються після боса кожного 10-го рівня (у шахті — кожні 5 рівнів).'),
            starts.map((d) => h('button', { class: 'btn' + (d === starts[starts.length - 1] ? ' primary' : ''), onclick: () => { const r = d; m.close(); res(r); } }, d === 1 ? '🚪 З самого початку' : `🪜 З рівня ${d}`))) });
      });
      if (!depth) return;
    }
    const lvl = DP().levelAt(src, depth);
    if (src.kind === 'dungeon' && G.player.level + 4 < lvl && !(await UI().confirm(`Монстри там ~${lvl} рівня, а в тебе ${G.player.level}. Люмі вже замовила вінок. Спускаєшся?`, 'Спускаюсь!', 'Ні'))) return;
    DP().enter(G, key, depth);
    UI().inDungeon = true; A().setMood(src.kind === 'mine' ? 'dark' : 'dark'); logEl = null;
    root = h('div', { class: 'depths' }); document.body.appendChild(root); build();
    log(src.kind === 'mine' ? `⛏️ Ти спускаєшся в «${src.name}». Підходь до жил і тисни на них, щоб добувати руду. Шум кирки приманює монстрів!` : `🕳️ Глибини «${src.name}», рівень ${depth}. Знайди сходи вниз 🔽 — їх стереже Вартовий.`);
    keyH = (e) => onKey(e); window.addEventListener('keydown', keyH, true);
    loop();
  }
  function close() {
    cancelAnimationFrame(raf); if (keyH) window.removeEventListener('keydown', keyH, true); keyH = null;
    if (root) root.remove(); root = null; cv = null; UI().inDungeon = false; DP().leave(UI().G); A().setMood('calm'); UI().refresh();
  }
  function log(t) { if (logEl) { logEl.prepend(h('div', null, t)); while (logEl.children.length > 40) logEl.lastChild.remove(); } }

  // ---------------- розмітка ----------------
  function build() {
    root.innerHTML = '';
    cv = h('canvas', { class: 'dp-canvas' }); cv.addEventListener('mousedown', onClick); cv.addEventListener('wheel', (e) => { e.preventDefault(); zoom = Math.max(18, Math.min(56, zoom * (e.deltaY < 0 ? 1.1 : 0.9))); }, { passive: false });
    side = h('div', { class: 'dp-side' }); logEl = logEl || h('div', { class: 'dg-log' });
    root.append(h('div', { class: 'dp-wrap' }, cv), side); renderSide();
  }
  function renderSide() {
    const G = UI().G; if (!side || !G.depth) return; const R = G.depth, L = R.L, p = G.player, d = PL().derived(p);
    side.innerHTML = '';
    const mm = h('canvas', { class: 'dp-mini', width: DP().MW * 4, height: DP().MH * 4 }); drawMini(mm);
    const atStart = R.pos === L.start;
    side.append(
      h('h2', null, `${R.src.icon} ${R.src.name}`),
      h('div', { class: 'gold' }, `${R.src.kind === 'mine' ? '⛏️ Рівень шахти' : '🕳️ Рівень'} ${R.depth}/${R.src.max}${L.isBoss ? ' · 👑 БОС' : ''} · вороги ~${L.lvl}`),
      h('div', { class: 'muted', style: { fontSize: '13px', margin: '4px 0' } }, R.src.kind === 'mine' ? `Жил на рівні: ${L.objs.filter((o) => o.type === 'vein' && !o.done).length} · ⛏️ гірництво ${(p.professions.mining || { lvl: 1 }).lvl}` : (L.sealed ? '🔒 Сходи запечатані — переможи Вартового' : '🔓 Сходи відкриті!')),
      h('div', { class: 'bar hp', style: { margin: '6px 0' } }, h('div', { class: 'fill', style: { width: (p.hp / d.maxHp * 100) + '%' } }), h('span', null, `❤️ ${p.hp}/${d.maxHp}`)),
      h('div', { class: 'bar mp', style: { margin: '6px 0' } }, h('div', { class: 'fill', style: { width: (p.mp / d.maxMp * 100) + '%' } }), h('span', null, `🔷 ${Math.round(p.mp)}/${d.maxMp}`)),
      h('div', { class: 'muted', style: { fontSize: '13px' } }, `🪙 ${Math.floor(p.gold).toLocaleString('uk')} · 🧪 ${(p.inventory.potion_s || 0) + (p.inventory.potion_m || 0) + (p.inventory.potion_l || 0)} · 🌀 ${p.inventory.scroll_teleport || 0}`),
      mm,
      h('div', { class: 'row', style: { marginTop: '8px', flexWrap: 'wrap', gap: '6px' } },
        h('button', { class: 'btn small', onclick: quickPotion }, '🧪 Зілля'), h('button', { class: 'btn small', onclick: () => ISK.panels.open('inventory') }, '🎒'),
        h('button', { class: 'btn small' + (atStart ? ' primary' : ' ghost'), onclick: tryExit, title: 'Вийти можна біля драбини 🪜 або сувоєм повернення' }, atStart ? '🪜 Вийти' : '🌀 Вийти')),
      h('div', { class: 'muted', style: { fontSize: '12px', marginTop: '8px' } }, 'WASD / стрілки — крок · клік — іти туди · коліщатко — масштаб · у жилу — копати · Esc — вийти (біля 🪜)'),
      logEl);
  }
  function drawMini(mm) {
    const G = UI().G, R = G.depth, L = R.L, MW = DP().MW, g = mm.getContext('2d'); const th = THEMES[R.src.kind === 'mine' ? 'mine' : R.src.dtype] || THEMES.def;
    g.fillStyle = '#000'; g.fillRect(0, 0, mm.width, mm.height);
    for (let i = 0; i < L.t.length; i++) { if (!L.seen[i]) continue; g.fillStyle = L.t[i] === DP().T.FLOOR ? th.floor : L.t[i] === DP().T.VEIN ? '#e0b04a' : th.wallTop; g.fillRect((i % MW) * 4, ((i / MW) | 0) * 4, 4, 4); }
    if (L.seen[L.stairs]) { g.fillStyle = L.sealed ? '#ff5a5a' : '#7cd67c'; g.fillRect((L.stairs % MW) * 4 - 1, ((L.stairs / MW) | 0) * 4 - 1, 6, 6); }
    g.fillStyle = '#7cd6ff'; g.fillRect((L.start % MW) * 4, ((L.start / MW) | 0) * 4, 4, 4);
    g.fillStyle = '#ff7eb6'; g.fillRect((R.pos % MW) * 4 - 1, ((R.pos / MW) | 0) * 4 - 1, 6, 6);
  }

  // ---------------- малювання ----------------
  function loop() { if (!root) return; draw(); raf = requestAnimationFrame(loop); }
  function draw() {
    const G = UI().G; if (!cv || !G.depth) return; const R = G.depth, L = R.L, MW = DP().MW, T0 = DP().T;
    const dpr = window.devicePixelRatio || 1; const W = cv.clientWidth, H = cv.clientHeight; if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingEnabled = false;
    const th = THEMES[R.src.kind === 'mine' ? 'mine' : R.src.dtype] || THEMES.def; const S = zoom;
    g.fillStyle = th.fog; g.fillRect(0, 0, W, H);
    const hx = R.pos % MW, hy = (R.pos / MW) | 0; const ox = W / 2 - (hx + 0.5) * S, oy = H / 2 - (hy + 0.5) * S;
    const t = performance.now();
    for (let i = 0; i < L.t.length; i++) {
      if (!L.seen[i]) continue; const x = (i % MW) * S + ox, y = ((i / MW) | 0) * S + oy; if (x < -S || y < -S || x > W || y > H) continue;
      const tt = L.t[i];
      if (tt === T0.FLOOR) { g.fillStyle = ((i % MW) + ((i / MW) | 0)) % 2 ? th.floor : th.floor2; g.fillRect(x, y, S, S); }
      else { g.fillStyle = th.wall; g.fillRect(x, y, S, S); g.fillStyle = th.wallTop; g.fillRect(x + 1, y + 1, S - 2, S * 0.55); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, y + S * 0.55, S, 2); g.fillRect(x + S * 0.5, y, 2, S * 0.55); if (tt === T0.VEIN) { const o = L.objs.find((v) => v.cell === i); g.font = `${S * 0.62}px ${EMO}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o ? PL().item(o.ore).icon : '✨', x + S / 2, y + S / 2); g.fillStyle = `rgba(255,220,120,${0.15 + 0.12 * Math.sin(t / 300 + i)})`; g.fillRect(x, y, S, S); } }
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const emo = (ic, c, k = 0.7, dy = 0) => { const x = (c % MW) * S + ox + S / 2, y = ((c / MW) | 0) * S + oy + S / 2 + dy; g.font = `${S * k}px ${EMO}`; g.fillText(ic, x, y); };
    if (L.seen[L.start]) emo('🪜', L.start);
    if (L.seen[L.stairs]) { emo('🔽', L.stairs); if (L.sealed) emo('🔒', L.stairs, 0.42, -S * 0.3); }
    for (const o of L.objs) { if (o.type === 'vein' || o.done || !L.seen[o.cell] || (o.type === 'trap' && o.hidden)) continue; emo(OBJ[o.type] || '❔', o.cell, 0.66, Math.sin(t / 400 + o.cell) * 1.5); }
    for (const m of L.mobs) {
      if (!DP().visible(R, m.cell)) continue; const x = (m.cell % MW) * S + ox + S / 2, y = ((m.cell / MW) | 0) * S + oy + S / 2;
      if (m.mini || m.boss) { g.strokeStyle = m.boss ? '#ffd76e' : '#ff5a5a'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, S * (m.boss ? 0.62 : 0.5) + Math.sin(t / 200) * 1.5, 0, 7); g.stroke(); }
      emo(m.icon, m.cell, m.boss ? 0.95 : m.mini ? 0.8 : 0.66, Math.sin(t / 250 + m.id) * 1.2);
      if (m.n > 1) { g.font = `700 ${S * 0.3}px sans-serif`; g.fillStyle = '#fff'; g.fillText('×' + m.n, x + S * 0.32, y + S * 0.34); }
    }
    // темрява: бачене, але не видиме зараз
    for (let i = 0; i < L.t.length; i++) { if (!L.seen[i] || DP().visible(R, i)) continue; const x = (i % MW) * S + ox, y = ((i / MW) | 0) * S + oy; if (x < -S || y < -S || x > W || y > H) continue; g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x, y, S, S); }
    const hs = ISK.sprites.hero(UI().G.player); g.drawImage(hs, W / 2 - S * 0.5, H / 2 - S * 0.62 + Math.sin(t / 300) * 1.5, S, S * hs.height / hs.width);
    // м'яке світло смолоскипа
    const grd = g.createRadialGradient(W / 2, H / 2, S * 2, W / 2, H / 2, S * (DP().VIEW + 1.5)); grd.addColorStop(0, 'rgba(255,190,110,0.06)'); grd.addColorStop(1, 'rgba(0,0,0,0.45)'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
  }

  // ---------------- керування ----------------
  const DIRS = { KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0] };
  function onKey(e) {
    if (!root || UI().inCombat || UI().modalStack.length || UI().inMinigame) return;
    if (DIRS[e.code]) { e.preventDefault(); e.stopPropagation(); walkAbort = true; if (!busy) act(...DIRS[e.code]); return; }
    if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); tryExit(); }
    if (e.code === 'KeyQ') { e.stopPropagation(); quickPotion(); }
  }
  async function onClick(e) {
    if (busy || e.button !== 0) return; const G = UI().G, R = G.depth, MW = DP().MW; const rect = cv.getBoundingClientRect();
    const hx = R.pos % MW, hy = (R.pos / MW) | 0; const tx = Math.floor((e.clientX - rect.left - (rect.width / 2 - (hx + 0.5) * zoom)) / zoom), ty = Math.floor((e.clientY - rect.top - (rect.height / 2 - (hy + 0.5) * zoom)) / zoom);
    if (tx < 0 || ty < 0 || tx >= MW || ty >= DP().MH) return; const target = ty * MW + tx;
    const path = DP().pathTo(G, target); if (!path) { A().play('click'); return; }
    walkAbort = false;
    for (const c of path) {
      if (walkAbort || !root || !G.depth) break; const d = c - R.pos; const dx = d === 1 ? 1 : d === -1 ? -1 : 0, dy = d === MW ? 1 : d === -MW ? -1 : 0;
      const seenMobs = R.L.mobs.filter((m) => DP().visible(R, m.cell)).length;
      const ev = await act(dx, dy); if (!ev || ev.type !== 'move') break;
      if (R.L.mobs.filter((m) => DP().visible(R, m.cell)).length > seenMobs) { log('👀 Хтось є попереду. Ти зупиняєшся.'); break; }
      await UI().sleep(70);
    }
  }
  async function act(dx, dy) {
    if (busy) return null; busy = true; const G = UI().G;
    try {
      const ev = DP().step(G, dx, dy);
      if (ev.type !== 'wall') A().play('step');
      await handle(ev);
      if (root) renderSide(); return ev;
    } finally { busy = false; }
  }
  async function handle(ev) {
    const G = UI().G, R = G.depth, p = G.player;
    switch (ev.type) {
      case 'sealed': UI().toast('🔒 Сходи запечатані! Переможи Вартового (червоне коло біля сходів).', 'bad', 3000); A().play('click'); return;
      case 'fight': return fight(ev.mob, ev.ambush, ev.after);
      case 'vein': return mine(ev.obj);
      case 'stairs': return stairs();
      case 'obj': return object(ev.obj);
      default: void p;
    }
  }
  async function fight(mob, ambush, after) {
    const G = UI().G, R = G.depth;
    if (mob.boss) { const B = ISK.data.BOSSES[mob.key] || ISK.data.BOSSES.goblin; await UI().alert(`👑 ${B.name}`, `${B.line}\n\nБос ${R.depth}-го рівня Глибин!`, B.icon); }
    else if (mob.mini) log(`🛡️ Вартовий сходів кидається в бій!`);
    else if (ambush) log(`⚠️ ${mob.icon} напав зненацька!`);
    const r = await ISK.combatUI.run(DP().enemiesFor(G, mob), { biome: R.src.kind === 'mine' ? 'mountain' : R.src.dtype === 'citadel' ? 'ash' : 'dungeon' });
    if (!root) return;
    if (r === 'lose') { close(); return; }
    if (r === 'flee') { log('💨 Ти відступив. Монстр нікуди не подівся.'); return; }
    if (r !== 'win') return;
    const res = DP().killMob(G, mob);
    if (res.unsealed && !mob.boss) { A().play('magic'); log('🔓 Вартовий упав — печатку зі сходів знято!'); UI().toast('🔓 Сходи вниз відкрито!', 'good'); }
    if (mob.boss) {
      UI().cutin(res.conquered ? 'БЕЗОДНЮ ПІДКОРЕНО!' : `БОС ${R.depth}-ГО РІВНЯ ПОВЕРЖЕНО!`, R.src.name, '#ffd76e');
      await UI().alert('Перемога над босом!', `+${res.gold}🪙 · ${PL().item(res.gear).icon} ${PL().item(res.gear).name} · +${res.fame}⭐\n\n🪜 Контрольна точка: тепер можна починати з ${res.checkpoint}-го рівня.${res.conquered ? '\n\n🌑 Ти пройшов усі 100 рівнів! Люмі вже друкує тобі грамоту «Найглибша людина Дивосвіту».' : ''}`, '🏆');
      UI().showNews([]);
    }
    if (after && after.type === 'obj') await object(after.obj);
  }
  async function object(o) {
    const G = UI().G, R = G.depth; const r = DP().openObj(G, o);
    if (r.type === 'chest') { A().play('coin'); const t = Object.entries(r.loot.items).map(([id, n]) => PL().item(id).name + (n > 1 ? ' ×' + n : '')).join(', '); log(`💰 Скриня: +${r.loot.gold}🪙 ${t}`); UI().toast(`💰 +${r.loot.gold} 🪙 ${t ? '· ' + t : ''}`, 'good', 3500); }
    else if (r.type === 'mimic') { await UI().alert('Скриня кусається!', 'Це мімік! Він давно на тебе чекав.', '😱'); const res = await ISK.combatUI.run(r.enemies, { biome: 'dungeon' }); if (res === 'lose') { close(); return; } if (res === 'win') { const l = GM().treasureLoot(G, R.L.lvl + 3, 1); log(`📦 Мімік переможений: +${l.gold}🪙`); } }
    else if (r.type === 'shrine') { A().play('heal'); log('⛲ Святе джерело відновлює сили загону.'); }
    else if (r.type === 'trap') { if (r.dodged) log('⚠️ Ти помітив пастку і спритно переступив!'); else { A().play('hurt'); log(`⚠️ Пастка! −${r.dmg}❤️`); } }
    else if (r.type === 'lore') log('📜 ' + LORE[Math.floor(Math.random() * LORE.length)]);
    else if (r.type === 'merchant') await merchant();
  }
  function merchant() {
    const p = UI().G.player; const offers = [['potion_m', 90], ['potion_l', 220], ['ether', 55], ['scroll_teleport', 120], ['phoenix', 700]].filter(([id]) => PL().item(id));
    return new Promise((res) => {
      const m = UI().modal({ title: 'Глибинний торговець', icon: '🧙', size: 'narrow', onClose: res, body: () => h('div', { class: 'col' }, h('div', { class: 'muted' }, '«Хе-хе. Ціни тут глибокі. Як і кишені.»'),
        offers.map(([id, pr]) => h('button', { class: 'btn', disabled: p.gold < pr, onclick: () => { p.gold -= pr; PL().addItem(p, id); A().play('coin'); UI().toast(`Куплено: ${PL().item(id).name}`, 'good'); m.close(); } }, `${PL().item(id).icon} ${PL().item(id).name} · ${pr}🪙`))) });
    });
  }
  async function mine(o) {
    const G = UI().G; A().play('step'); log('⛏️ Тук-тук…'); await UI().sleep(350);
    const r = DP().mineVein(G, o, 0.4 + Math.random() * 0.5); if (!r) return;
    A().play('coin'); const it = PL().item(r.ore);
    UI().toast(`⛏️ +${r.n} ${it.icon} ${it.name}${r.extra ? ' · 💎 самоцвіт!' : ''}${r.left ? '' : ' · жила вичерпана'}`, 'good', 2600);
    log(`⛏️ ${it.icon} ${it.name} ×${r.n}${r.left ? ` (лишилось ${r.left})` : ' — жила вичерпана'}`);
    if (r.ups && r.ups.length) UI().toast('⛏️ Гірництво підвищено!', 'epic');
    if (r.spawned) log(`👂 Шум кирки щось розбудив у темряві… ${r.spawned.icon}`);
  }
  async function stairs() {
    const G = UI().G, R = G.depth;
    if (R.depth >= R.src.max) { await UI().alert('Дно!', R.src.kind === 'mine' ? 'Глибше копати — лише до ядра світу. Гноми кажуть, там живе дуже сердитий дракон.' : 'Далі — нічого. Лише темрява і відчуття виконаного обов\'язку.', '🌑'); return; }
    const next = R.depth + 1;
    if (!(await UI().confirm(`Спуститися на ${next}-й рівень?${next % 10 === 0 && R.src.kind === 'dungeon' ? ' ⚠️ Там чекає БОС!' : ''}`, 'Вниз!', 'Ще ні'))) return;
    DP().goDown(G, next); A().play('magic');
    log(`🔽 Рівень ${next}. ${next % 10 === 0 && R.src.kind === 'dungeon' ? '👑 Повітря важке — тут бос.' : R.src.kind === 'mine' ? 'Руда тут блищить яскравіше.' : 'Ще глибше. Ще темніше.'}`);
  }
  function quickPotion() {
    const p = UI().G.player;
    for (const id of ['potion_s', 'potion_m', 'potion_l']) if (PL().hasItem(p, id)) { const r = PL().useConsumable(p, id); A().play('heal'); log(`🧪 ${r.text}`); renderSide(); return; }
    UI().toast('Немає зілля здоров\'я!', 'bad');
  }
  async function tryExit() {
    const G = UI().G, R = G.depth, p = G.player; if (busy) return;
    if (R.pos === R.L.start) { if (await UI().confirm('Піднятися на поверхню? Наступного разу почнеш з контрольної точки.', 'Нагору', 'Ще ні')) close(); return; }
    if (PL().hasItem(p, 'scroll_teleport')) { if (await UI().confirm('Використати 🌀 Сувій повернення, щоб вибратися звідси?', 'Так', 'Ні')) { PL().removeItem(p, 'scroll_teleport'); A().play('magic'); close(); } return; }
    UI().toast('🪜 Вийти можна лише біля драбини, з якої прийшов (або сувоєм повернення 🌀).', 'bad', 3200);
  }

  ISK.depthsUI = { enter, close, act, draw, refresh: renderSide, isOpen: () => !!root };
})();
