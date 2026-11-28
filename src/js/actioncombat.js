// Хроніки Дивосвіту v5 — екшен-бій на арені в реальному часі (у дусі Hades): WASD-рух, комбо з 3 ударів,
// заряджений важкий удар, перекат з невразливістю, парирування (відбиває навіть стріли), навички на Q/E/R,
// ульта на F, зілля на H. Вороги підсвічують атаки червоними зонами; боси мають фази. Відчуття удару:
// хітстоп, тремтіння екрана, відкидання, білий спалах, іскри, цифри шкоди, сповільнення на ідеальному ухилянні.
// Нагороди/поразку рахує той самий рушій, що й покроковий бій (ISK.combat + ISK.combatUI.settle).
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = () => ISK.ui; const PL = () => ISK.player; const A = () => ISK.audio; const SP = () => ISK.sprites; const C = () => ISK.combat;
  const W = 960, H = 540, PAD = 40;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); };
  const EM = '"Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const FONT = (px, w = 800) => `${w} ${px}px "Segoe UI",system-ui,sans-serif`;

  const BIOME = {
    plains: ['#4f7a3e', '#5d8a48', '#3e6230'], forest: ['#2f5a2c', '#3a6a34', '#244a22'], hills: ['#5e7a44', '#6c8a50', '#4a6236'],
    mountain: ['#5a5a62', '#6a6a72', '#46464e'], desert: ['#c8a868', '#d4b678', '#b0904e'], snow: ['#d8e4ee', '#e8f0f6', '#b8c8d8'],
    swamp: ['#3e5238', '#4a6040', '#2e3e2a'], sea: ['#2a5a7a', '#326a8a', '#1e4a66'], dungeon: ['#3a3440', '#463e4e', '#2a2430'],
    ash: ['#3a2a26', '#4a3430', '#2a1c1a'], jungle: ['#2a5a30', '#346a38', '#1e4624'], tundra: ['#9aaab0', '#aab8be', '#84949a'],
  };
  const BOSS_LINES = ['Ти розізлив мене! Тепер — ДРУГА ФАЗА!', 'Ти навіть не моя фінальна форма… а, ні, це вона.', 'Мій бос буде дуже незадоволений!', 'Час для музики з органом!', 'Ха! Це була лише розминка… для мене… так.'];
  const PARRY_LINES = ['ПАРИРУВАННЯ!', 'НЕ СЬОГОДНІ!', 'ВІДБИТО!', 'ТАК І ЗАДУМАНО!'];
  const DODGE_LINES = ['ІДЕАЛЬНО!', 'МАТРИЦЯ!', 'НІНДЗЯ!', 'ЗАНАДТО ПОВІЛЬНО!'];

  function archOf(e) {
    if (e.boss) return 'boss';
    const k = e.key;
    if (/harpy|imp|pixie|ghost|naga|vampire|wisp|mage|cultist/.test(k)) return 'ranged';
    if (/wolf|rabbit|scorpion|wyvern|drake|spider|salamander/.test(k)) return 'charger';
    if (/golem|troll|orc|treant|yeti|mummy|icegolem|demon/.test(k)) return 'brute';
    if (/slime|jelly|ooze/.test(k)) return 'slime';
    return 'melee';
  }
  const ARCH = {
    melee: { spd: 100, range: 70, wind: 0.55, act: 0.12, rec: 0.55, mult: 0.9, cd: 1.2 },
    charger: { spd: 85, range: 230, wind: 0.65, act: 0.38, rec: 0.75, mult: 1.0, cd: 1.6 },
    brute: { spd: 58, range: 95, wind: 0.95, act: 0.14, rec: 0.95, mult: 1.5, cd: 1.8, armor: true },
    ranged: { spd: 80, range: 320, wind: 0.6, act: 0.1, rec: 0.7, mult: 0.75, cd: 1.6 },
    slime: { spd: 70, range: 140, wind: 0.7, act: 0.14, rec: 0.6, mult: 0.85, cd: 1.3 },
    boss: { spd: 75, range: 160, wind: 0.85, act: 0.16, rec: 0.75, mult: 1.0, cd: 0.9, armor: true },
  };
  const LONG = ['spear', 'halberd', 'rapier', 'greatsword', 'scythe'];
  const SHORT = ['dagger', 'knuckles', 'claws'];
  const RANGED = ['bow', 'crossbow'];

  // білий силует для спалаху при ударі
  const whiteCache = new Map();
  function whiteOf(cv) {
    let w = whiteCache.get(cv); if (w) return w;
    w = document.createElement('canvas'); w.width = cv.width; w.height = cv.height; const g = w.getContext('2d');
    g.drawImage(cv, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#fff'; g.fillRect(0, 0, w.width, w.height);
    whiteCache.set(cv, w); return w;
  }

  // v5.2: чемпіони — рідкісні вороги з модифікаторами й кращим лутом
  const CHAMPS = {
    fiery: { name: 'Вогняний', icon: '🔥', col: '#ff7a30' },
    swift: { name: 'Швидкий', icon: '💨', col: '#7cf0ff' },
    split: { name: 'Розщеплювач', icon: '🧬', col: '#9af06a' },
    iron: { name: 'Залізний', icon: '🛡️', col: '#c0c8d8' },
    vampire: { name: 'Вампір', icon: '🩸', col: '#ff4070' },
  };
  const CHAMP_CHANCE = { easy: 0.04, normal: 0.08, hard: 0.12, hell: 0.17 };
  function makeChampion(e) {
    const key = Object.keys(CHAMPS)[Math.floor(Math.random() * 5)]; const C0 = CHAMPS[key];
    e.champion = key; e.name = `${C0.name} ${e.name}`; const k = key === 'iron' ? 2.2 : 1.5;
    e.maxHp = Math.round(e.maxHp * k); e.hp = e.maxHp; e.atk = Math.round(e.atk * 1.15); e.shieldMax = (e.shieldMax || 0) + (key === 'iron' ? 2 : 1); e.shield = e.shieldMax;
  }

  // hp — множник здоров'я ворогів, dmg — їхньої шкоди, aggr — агресії (швидкість, частота атак, коротший замах)
  const ARENA_DIFF = {
    easy: { hp: 1.4, dmg: 1.0, aggr: 0.9 },
    normal: { hp: 1.9, dmg: 1.4, aggr: 1.25 },
    hard: { hp: 2.2, dmg: 1.7, aggr: 1.45 },
    hell: { hp: 2.6, dmg: 2.0, aggr: 1.7 },
  };

  function run(enemies, opts = {}) {
    return new Promise((resolve) => {
      const G = UI().G; const p = G.player;
      UI().inCombat = true; A().setMood(enemies.some((e) => e.boss) ? 'boss' : 'battle'); p.stat.battles++;
      // у реальному часі б'єш частіше, ніж у покроковому бою, тож на арені вороги міцніші
      // v5.1: окреме налаштування арени за складністю — вороги міцніші, б'ють сильніше й частіше
      const AR = ARENA_DIFF[ISK.difficulty] || ARENA_DIFF.normal;
      for (const e of enemies) if (!e._arena) {
        e._arena = true; const k = AR.hp * (e.boss ? 0.85 : 1); e.hp = Math.round(e.hp * k); e.maxHp = Math.round(e.maxHp * k);
        if (!e.boss && !e.champion && !opts.noChampions && Math.random() < (CHAMP_CHANCE[ISK.difficulty] || 0.08) + (e.elite ? 0.06 : 0)) makeChampion(e);
      }
      const b = C().startBattle(p, enemies, opts);
      let d = PL().derived(p);
      const bot = !!globalThis.ISK_ACTIONBOT;

      // ---------- DOM ----------
      const root = document.createElement('div'); root.className = 'acombat';
      const cv = document.createElement('canvas'); root.appendChild(cv); document.body.appendChild(root);
      const g = cv.getContext('2d');
      let scale = 1, ox = 0, oy = 0;
      function resize() {
        const dpr = window.devicePixelRatio || 1; cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
        scale = Math.min(cv.width / W, cv.height / H); ox = (cv.width - W * scale) / 2; oy = (cv.height - H * scale) / 2;
      }
      resize(); addEventListener('resize', resize);

      // ---------- фон ----------
      const pal = BIOME[opts.biome] || BIOME.plains;
      const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
      (function paintBg() {
        const q = bg.getContext('2d'); q.fillStyle = pal[0]; q.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += 24) for (let x = 0; x < W; x += 24) if (Math.random() < 0.35) { q.fillStyle = Math.random() < 0.5 ? pal[1] : pal[2]; q.fillRect(x + rnd(0, 12), y + rnd(0, 12), rnd(6, 14), rnd(4, 8)); }
        for (let i = 0; i < 40; i++) { q.fillStyle = 'rgba(0,0,0,.12)'; q.beginPath(); q.ellipse(rnd(0, W), rnd(0, H), rnd(6, 16), rnd(3, 8), 0, 0, 7); q.fill(); }
        q.strokeStyle = 'rgba(0,0,0,.35)'; q.lineWidth = 6; q.strokeRect(PAD - 10, PAD - 10, W - 2 * PAD + 20, H - 2 * PAD + 20);
        const v = q.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); q.fillStyle = v; q.fillRect(0, 0, W, H);
      })();

      // ---------- сутності ----------
      const heroSpr = SP().hero(p);
      const P = { x: W * 0.25, y: H / 2, kx: 0, ky: 0, r: 16, face: 0, st: 'idle', t: 0, step: 0, comboT: 0, inv: 0, sta: 100, staT: 0, flash: 0, charge: 0, rollDir: 0, hitSet: null, hurtT: 0, trail: [] };
      const E = [];
      function addEnemy(e, x, y, mini) {
        const arch = archOf(e); const A0 = ARCH[arch];
        const ent = { e, arch, A: A0, x, y, r: e.boss ? 30 : mini ? 10 : 17, st: 'idle', t: rnd(0.3, 1.0), stun: 0, flash: 0, kx: 0, ky: 0, mini: !!mini, spr: SP().forEnemy(e), size: e.boss ? 84 : mini ? 30 : 48, aim: 0, tele: null, phase: 1, pat: 0, hop: 0, brokenT: 0, speedMul: e.elite ? 1.15 : 1 };
        if (e.champion === 'swift') ent.speedMul *= 1.5;
        if (e.champion === 'iron') ent.A = { ...A0, armor: true };
        ent.face = Math.PI;
        E.push(ent); return ent;
      }
      enemies.forEach((e, i) => addEnemy(e, W * 0.68 + (i % 2) * 70, H / 2 + (i - (enemies.length - 1) / 2) * 90));
      // v5.2: ролі в групі — щитоносець (блокує удари спереду) і цілитель (лікує своїх, якщо не перебити)
      if (E.length >= 2 && !E.some((x) => x.e.boss)) {
        const pool = E.filter((x) => !x.mini);
        const sh = pool.find((x) => x.arch === 'melee' || x.arch === 'brute');
        if (sh && Math.random() < 0.5) { sh.role = 'shield'; sh.A = { ...sh.A, spd: sh.A.spd * 0.8, armor: true }; sh.e.name = `${sh.e.name}-щитоносець`; sh.e.maxHp = Math.round(sh.e.maxHp * 1.2); sh.e.hp = sh.e.maxHp; }
        const hl = pool.find((x) => x !== sh && x.role !== 'shield');
        if (hl && Math.random() < 0.45) { hl.role = 'healer'; hl.arch = 'ranged'; hl.A = { ...ARCH.ranged, cd: 1.4 }; hl.e.name = `${hl.e.name}-цілитель`; }
      }
      let dmgTaken = 0;
      // v5.2: рейтинг бою S/A/B/C — за отриману шкоду, швидкість і комбо; множить досвід і золото
      function rankNow() {
        const par = 18 + enemies.length * 12 + (enemies.some((e) => e.boss) ? 45 : 0); const lost = dmgTaken / Math.max(1, d.maxHp);
        const pts = (lost < 0.1 ? 3 : lost < 0.3 ? 2 : lost < 0.6 ? 1 : 0) + (time < par ? 2 : time < par * 1.6 ? 1 : 0) + (b.maxCombo >= 10 ? 1 : 0);
        b.rank = pts >= 5 ? 'S' : pts >= 4 ? 'A' : pts >= 2 ? 'B' : 'C'; b.rankMul = { S: 1.5, A: 1.25, B: 1, C: 0.85 }[b.rank];
        return b.rank;
      }
      const allies = b.allies.filter((a) => a.kind !== 'player' && a.alive).map((a, i) => ({ a, x: P.x - 40, y: P.y + (i ? 40 : -40) * (1 + Math.floor(i / 2)), t: 1 + i * 0.4, healT: 4, spr: a.kind === 'pet' ? SP().forPet(a.ref.key) : SP().forCompanion(a.ref) }));
      const proj = [], parts = [], floats = [], rings = [];
      let shake = 0, hitstop = 0, slow = 0, flashScr = 0, flashCol = '#fff', chain = 0, chainT = 0, time = 0, potionCd = 0, banner = null, over = null, endT = 0, paused = false, ultT = 0;
      const cds = {};
      const skills = PL().knownSkills(p).filter((s) => s.power || s.heal || (s.effect && s.effect.buff)).sort((a, z) => (z.power || 0) * (z.hits || 1) - (a.power || 0) * (a.hits || 1)).slice(0, 3);
      const SKEYS = ['Q', 'E', 'R'];
      const wt = d.weapon ? d.weapon.wtype : null;
      const reach = LONG.includes(wt) ? 92 : SHORT.includes(wt) ? 56 : 72;
      const shooter = RANGED.includes(wt); const caster = !!(d.weapon && d.weapon.matk && wt !== 'lute');
      const phys = (d.weapon && C().WEAPON_DTYPE[wt]) || (d.blunt ? 'blunt' : 'slash');
      const boss = E.find((x) => x.e.boss);
      banner = { text: boss ? `👑 ${boss.e.name}` : opts.arena ? '🏟️ АРЕНА!' : opts.horde ? '🔥 ОРДА!' : enemies.length > 1 ? `⚔️ Ворогів: ${enemies.length}` : `⚔️ ${enemies[0].name}`, t: 2.2, col: boss ? '#ff6a7a' : '#ffe08a' };
      if (boss) UI().cutin(boss.e.name.toUpperCase(), boss.e.line || 'БОС', '#ff5c6c');

      // ---------- ввід ----------
      const keys = new Set(); const mouse = { x: W / 2, y: H / 2, l: false, r: false }; const buf = { act: null, t: 0 };
      const press = (act) => { buf.act = act; buf.t = 0.25; };
      function onKey(ev) {
        if (over) return;
        const k = ev.key.toLowerCase(); const c = ev.code;
        if (!['F11', 'F12'].includes(c)) ev.stopPropagation(); // гарячі клавіші мапи не спрацьовують під час бою
        if (ev.type === 'keydown') {
          if (c === 'Escape') { ev.preventDefault(); togglePause(); return; }
          if (paused) return;
          keys.add(c);
          if (ev.repeat) return;
          if (c === 'Space') { ev.preventDefault(); press('roll'); }
          else if (c === 'ShiftLeft' || c === 'ShiftRight') press('parry');
          else if (c === 'KeyJ') press('light');
          else if (c === 'KeyK') keys.add('heavy');
          else if (c === 'KeyQ') press('s0'); else if (c === 'KeyE') press('s1'); else if (c === 'KeyR') press('s2');
          else if (c === 'KeyF') press('ult'); else if (c === 'KeyH' || k === '1') press('potion');
          if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(c)) ev.preventDefault();
        } else { keys.delete(c); if (c === 'KeyK') { keys.delete('heavy'); if (P.st === 'charge') releaseHeavy(); } }
      }
      function toArena(ev) { const r = cv.getBoundingClientRect(); const dpr = cv.width / r.width; return { x: ((ev.clientX - r.left) * dpr - ox) / scale, y: ((ev.clientY - r.top) * dpr - oy) / scale }; }
      function onMouse(ev) {
        const m = toArena(ev); mouse.x = m.x; mouse.y = m.y;
        if (paused || over) return;
        if (ev.type === 'mousedown') { if (ev.button === 0) { mouse.l = true; press('light'); } if (ev.button === 2) { mouse.r = true; keys.add('heavy'); } }
        if (ev.type === 'mouseup') { if (ev.button === 0) mouse.l = false; if (ev.button === 2) { mouse.r = false; keys.delete('heavy'); if (P.st === 'charge') releaseHeavy(); } }
      }
      const noCtx = (ev) => ev.preventDefault();
      addEventListener('keydown', onKey, true); addEventListener('keyup', onKey, true);
      cv.addEventListener('mousedown', onMouse); addEventListener('mouseup', onMouse); addEventListener('mousemove', onMouse); cv.addEventListener('contextmenu', noCtx);

      // ---------- меню паузи ----------
      let pauseEl = null;
      function togglePause() {
        if (pauseEl) { pauseEl.remove(); pauseEl = null; paused = false; return; }
        paused = true; const h = UI().h;
        pauseEl = h('div', { class: 'acombat-pause' }, h('div', { class: 'ap-box' },
          h('div', { class: 'ap-title' }, '⏸️ Пауза'),
          h('div', { class: 'ap-help' }, 'WASD — рух · ЛКМ / J — комбо (3 удари) · ПКМ / K (затиснути) — важкий удар\nПробіл — перекат (невразливість) · Shift — парирування (відбиває й стріли!)\nQ / E / R — навички · F — ульта · H — зілля · Esc — пауза\n\nПорада: червона зона = зараз вдарить. Ухилися в останню мить — сповільнення часу!'),
          h('div', { class: 'row', style: { gap: '8px', justifyContent: 'center' } },
            h('button', { class: 'btn primary', onclick: () => togglePause() }, '▶️ Продовжити'),
            opts.noFlee ? null : h('button', { class: 'btn', onclick: () => { togglePause(); finish('flee'); } }, '🏃 Втекти'))));
        root.appendChild(pauseEl);
      }

      // ---------- ефекти ----------
      function burst(x, y, col, n = 10, sp = 220) { for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), s = rnd(sp * 0.3, sp); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.25, 0.55), max: 0.55, col, sz: rnd(2, 5) }); } }
      function floater(x, y, text, col = '#fff', size = 18, life = 0.9) { floats.push({ x: x + rnd(-8, 8), y, text, col, size, life, max: life }); }
      function bigText(text, col = '#ffe08a', t = 1.1) { banner = { text, t, col, big: true }; }
      function kick(st, sh) { hitstop = Math.max(hitstop, st); shake = Math.max(shake, sh); }
      const atkMul = () => (b.buffs.atk ? 1 + b.buffs.atk.amt : 1) * (p.cheat === 'berserk' && p.hp < d.maxHp * 0.4 ? 1.4 : 1);

      // ---------- шкода ворогам ----------
      function syncCombo() { b.combo = 1 + Math.min(5, Math.floor(chain / 6)); b.maxCombo = Math.max(b.maxCombo, chain); }
      function breakNow(x, counted) {
        const e = x.e; e.shield = 0; e.broken = 2; x.brokenT = 4; x.stun = Math.max(x.stun, 2.4); x.st = 'stun'; x.tele = null; if (!counted) { b.breaks++; b.limit = Math.min(100, b.limit + 15); }
        floater(x.x, x.y - x.size * 0.7, '💥 ЗЛАМ!', '#7cd8ff', 26, 1.2); burst(x.x, x.y, '#7cd8ff', 22, 320); kick(0.14, 10); A().play('clang');
      }
      function damage(x, raw, o = {}) {
        const e = x.e; if (e.hp <= 0) return 0;
        if (x.role === 'shield' && x.st !== 'stun' && !e.broken && !o.pierce && !o.shieldHit && x.st !== 'dead') {
          const fr = o.from || P;
          if (angDiff(Math.atan2(fr.y - x.y, fr.x - x.x), x.face) < 1.15) { raw *= 0.12; if (!o.quiet && Math.random() < 0.6) floater(x.x, x.y - x.size * 0.75, '🛡️ БЛОК! Зайди збоку', '#9ad8ff', 13, 0.6); burst(x.x + Math.cos(x.face) * 18, x.y + Math.sin(x.face) * 18 - 14, '#9ad8ff', 5, 160); A().play('clang'); }
        }
        if (x.kind === 'heal' && x.st === 'windup') { x.st = 'recover'; x.t = 0.9; x.tele = null; floater(x.x, x.y - x.size * 0.8, '✋ ПЕРЕРВАНО!', '#ffe08a', 16, 0.9); }
        const ev = []; const wasBroken = e.broken;
        const crit = o.crit !== undefined ? o.crit : Math.random() < (d.crit + (b.buffs.crit ? b.buffs.crit.amt : 0)) / 100;
        const dmg = C().hitEnemy(b, e, raw, { crit, phys: o.phys || phys, elem: o.elem, pierce: o.pierce, execute: o.execute }, ev, o.by || 'player');
        const evd = ev.find((q) => q.kind === 'dmg');
        if (ev.some((q) => q.kind === 'break') || (!wasBroken && e.broken)) breakNow(x, true);
        else if (o.shieldHit && !e.broken && e.hp > 0) { e.shield = Math.max(0, e.shield - 1); floater(x.x, x.y - x.size * 0.5, '🛡️-1', '#9ad8ff', 14); if (e.shield === 0) breakNow(x); }
        x.flash = 0.1;
        if (!x.A.armor || x.st === 'stun') { const a = Math.atan2(x.y - P.y, x.x - P.x); const kb = (o.kb || 120) * (x.A.armor ? 0.4 : 1); x.kx += Math.cos(a) * kb; x.ky += Math.sin(a) * kb; if (x.st === 'windup' && o.stagger) { x.st = 'recover'; x.t = 0.35; x.tele = null; } }
        const col = evd && evd.weak ? '#ffb347' : crit ? '#ffe04a' : evd && evd.resist ? '#a0a0b0' : '#fff';
        floater(x.x, x.y - x.size * 0.55, (crit ? '💥' : '') + dmg + (evd && evd.weak ? '!' : ''), col, crit ? 26 : 19);
        if (evd && evd.weak && !o.quiet) floater(x.x, x.y - x.size * 0.85, 'СЛАБКІСТЬ', '#ffb347', 12, 0.7);
        burst(x.x, x.y, crit ? '#ffe04a' : '#fff', crit ? 14 : 7, crit ? 300 : 200);
        kick(crit ? 0.09 : 0.055, crit ? 7 : 3.5); A().play(crit ? 'crit' : 'hit');
        if (o.by !== 'ally') { chain++; chainT = 2.6; syncCombo(); b.limit = Math.min(100, b.limit + (o.limit || 3)); }
        if (e.hp <= 0) onKill(x);
        return dmg;
      }
      function onKill(x) {
        x.st = 'dead'; x.t = 0.5; x.tele = null; burst(x.x, x.y, '#ffffff', 26, 360); floater(x.x, x.y - 20, '💀', '#fff', 26, 1);
        if (x.e.champion === 'split' && !x.mini) for (let i = 0; i < 2; i++) { const m = C().makeEnemy(x.e.key, Math.max(1, x.e.lvl - 2)); m.maxHp = Math.round(x.e.maxHp * 0.25); m.hp = m.maxHp; m.name = 'Уламок чемпіона'; const n = addEnemy(m, x.x + (i ? 24 : -24), x.y, true); n.size = 36; n.r = 13; n.kx = (i ? 1 : -1) * 280; n.t = 0.7; }
        if (x.arch === 'slime' && !x.mini && !x.e.elite) for (let i = 0; i < 2; i++) { const m = C().makeEnemy(x.e.key, Math.max(1, x.e.lvl - 3)); m.maxHp = Math.round(m.maxHp * 0.3); m.hp = m.maxHp; m.name = 'Слимачок'; m.shield = m.shieldMax = 1; const n = addEnemy(m, x.x + (i ? 20 : -20), x.y, true); n.kx = (i ? 1 : -1) * 260; n.t = 0.8; }
        if (!E.some((q) => q.e.hp > 0)) { over = 'win'; endT = 1.6; slow = 1.0; const rk = rankNow(); bigText(`${['ПЕРЕМОГА!', 'K.O.!', 'НАСТУПНИЙ!', 'ЛЕГЕНДАРНО (ЛОКАЛЬНО)!'][Math.floor(Math.random() * 4)]}  РАНГ ${rk}`, { S: '#ffe08a', A: '#9af0b0', B: '#9ad8ff', C: '#c0c0c0' }[rk], 1.6); kick(0.2, 12); }
      }

      // ---------- шкода гравцю ----------
      function hurtPlayer(raw, src, o = {}) {
        if (over) return 'none';
        if (P.st === 'parry' && P.t > 0.13 && !o.unblockable) return 'parry';
        if (P.inv > 0) {
          if (P.st === 'roll' && P.t > 0.16 && !P.perfect) { P.perfect = true; slow = 0.55; P.sta = Math.min(100, P.sta + 30); b.limit = Math.min(100, b.limit + 10); floater(P.x, P.y - 40, DODGE_LINES[Math.floor(Math.random() * 4)], '#7cf0ff', 18, 0.9); A().play('magic'); }
          return 'dodge';
        }
        let dmg = Math.max(1, Math.round(C().mitig(raw * AR.dmg, d.def, false) * rnd(0.9, 1.1)));
        p.hp = Math.max(0, p.hp - dmg); P.inv = 0.38; dmgTaken += dmg;
        const ch = src && (src.e ? src : src.src); const cm = ch && ch.e && ch.e.champion;
        if (cm === 'fiery') { P.burn = { t: 3, dps: Math.max(2, dmg * 0.12) }; floater(P.x, P.y - 60, '🔥 ГОРИШ!', '#ff7a30', 14, 0.7); }
        if (cm === 'vampire' && ch.e.hp > 0) { const hh = Math.round(dmg * 0.6); ch.e.hp = Math.min(ch.e.maxHp, ch.e.hp + hh); floater(ch.x, ch.y - ch.size * 0.7, '🩸+' + hh, '#ff4070', 14, 0.7); } P.flash = 0.15; P.hurtT = 0.22; flashScr = 0.18; flashCol = '#ff3040';
        if (src) { const a = Math.atan2(P.y - src.y, P.x - src.x); P.kx = Math.cos(a) * 260; P.ky = Math.sin(a) * 260; }
        if (P.st !== 'roll') { P.st = 'idle'; P.t = 0; }
        floater(P.x, P.y - 42, '-' + dmg, '#ff5a6a', 22); burst(P.x, P.y, '#ff4050', 10, 220); kick(0.07, 8); A().play('hurt');
        chain = 0; syncCombo(); b.limit = Math.min(100, b.limit + 3);
        if (p.hp <= 0) {
          if (b.art && b.art.revive && !b.undyingUsed) { b.undyingUsed = true; p.hp = Math.round(d.maxHp * 0.3); P.inv = 2; bigText('✨ АРТЕФАКТ ВОСКРЕСІННЯ!', '#9af0b0', 1.4); A().play('heal'); }
          else { over = 'lose'; endT = 1.6; slow = 1.2; bigText('ТИ ВПАВ…', '#ff6a7a', 1.6); }
        }
        return 'hit';
      }
      function parried(x) {
        P.t = 0; P.st = 'idle'; P.inv = 0.3; b.limit = Math.min(100, b.limit + 15); slow = 0.35;
        floater(P.x, P.y - 46, PARRY_LINES[Math.floor(Math.random() * PARRY_LINES.length)], '#ffe08a', 22, 1); burst((P.x + x.x) / 2, (P.y + x.y) / 2, '#ffe08a', 24, 360); kick(0.16, 9); A().play('clang');
        x.tele = null; x.st = 'stun'; x.stun = x.e.boss ? 1.1 : 1.6;
        if (!x.e.broken) { x.e.shield = Math.max(0, x.e.shield - 1); if (x.e.shield === 0) breakNow(x); }
      }

      // ---------- дії гравця ----------
      function swing(mult, half, range, o = {}) {
        const hit = new Set();
        rings.push({ x: P.x, y: P.y, a: P.face, half, r: range, life: 0.14, max: 0.14, col: o.col || '#ffffff' });
        for (const x of E) if (x.e.hp > 0 && !hit.has(x) && dist(P, x) < range + x.r && angDiff(Math.atan2(x.y - P.y, x.x - P.x), P.face) < half) { hit.add(x); damage(x, (caster ? d.matk : d.atk) * atkMul() * mult, { ...o, elem: o.elem || (caster ? 'magic' : null) }); }
        // відбиття ворожих снарядів ударом
        for (const q of proj) if (q.side === 'enemy' && Math.hypot(q.x - P.x, q.y - P.y) < range && angDiff(Math.atan2(q.y - P.y, q.x - P.x), P.face) < half) { q.side = 'player'; q.vx *= -1.3; q.vy *= -1.3; q.dmg = d.atk * 0.8; q.col = '#ffe08a'; q.hit = new Set(); floater(q.x, q.y, 'ВІДБИТО', '#ffe08a', 12, 0.6); }
        A().play('miss');
      }
      function shoot(mult, o = {}) {
        const sp = o.sp || 560;
        for (let i = 0; i < (o.n || 1); i++) { const a = P.face + (i - ((o.n || 1) - 1) / 2) * 0.12; proj.push({ x: P.x + Math.cos(a) * 20, y: P.y + Math.sin(a) * 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: o.r || 7, side: 'player', dmg: (o.magic ? d.matk : d.atk) * atkMul() * mult, elem: o.elem, life: 1.3, col: o.col || (o.magic ? '#c89aff' : '#f0e0b0'), pierce: o.pierce, hit: new Set(), limit: o.limit || 3 }); }
        A().play(o.magic ? 'magic' : 'miss');
      }
      function doLight() {
        if (P.sta < 6) { floater(P.x, P.y - 40, 'Видихся!', '#aaa', 13, 0.6); return; }
        P.sta -= 7; P.staT = 0.45;
        P.step = P.comboT > 0 ? (P.step % 3) + 1 : 1; P.comboT = 0.75; P.st = 'attack'; P.t = P.step === 3 ? 0.36 : 0.22; P.did = false;
        const lunge = P.step === 3 ? 170 : 90; P.kx += Math.cos(P.face) * lunge; P.ky += Math.sin(P.face) * lunge;
      }
      function lightHit() {
        const m = P.step === 3 ? 1.0 : 0.55;
        if (shooter) shoot(m * 0.9, { n: P.step === 3 ? 3 : 1, pierce: P.step === 3, phys: 'pierce', limit: 3 });
        else if (caster) { swing(m * 0.6, 0.9, reach * 0.8, { limit: 2 }); shoot(m * 0.8, { magic: true, elem: 'magic', r: P.step === 3 ? 12 : 8, pierce: P.step === 3 }); }
        else swing(m, P.step === 3 ? 1.25 : 0.95, reach + (P.step === 3 ? 14 : 0), { kb: P.step === 3 ? 360 : 140, stagger: true, limit: P.step === 3 ? 6 : 3 });
      }
      function releaseHeavy() {
        const c = clamp(P.charge / 0.6, 0, 1); P.charge = 0; P.st = 'attack'; P.t = 0.3; P.did = true; P.step = 0; P.comboT = 0;
        P.sta -= 18; P.staT = 0.6; P.kx += Math.cos(P.face) * 220; P.ky += Math.sin(P.face) * 220;
        if (shooter) shoot(1.2 + 1.3 * c, { r: 10, pierce: true, sp: 820, limit: 8 });
        else swing(1.3 + 1.3 * c, 1.45, reach + 26 + c * 20, { kb: 460, stagger: true, shieldHit: c > 0.6, limit: 8, col: c > 0.6 ? '#ffe08a' : '#fff', crit: c >= 1 ? true : undefined });
        if (c >= 1) { floater(P.x, P.y - 44, 'ПОВНИЙ ЗАРЯД!', '#ffe08a', 15, 0.7); kick(0.08, 9); }
      }
      function doRoll() {
        if (P.sta < 18) { floater(P.x, P.y - 40, 'Видихся!', '#aaa', 13, 0.6); return; }
        P.sta -= 22; P.staT = 0.6; P.perfect = false;
        const mv = moveVec(); P.rollDir = mv.x || mv.y ? Math.atan2(mv.y, mv.x) : P.face;
        P.st = 'roll'; P.t = 0.3; P.inv = 0.26; A().play('step');
      }
      function doParry() { if (P.sta < 10) return; P.sta -= 12; P.staT = 0.5; P.st = 'parry'; P.t = 0.3; rings.push({ x: P.x, y: P.y, a: 0, half: Math.PI, r: 34, life: 0.17, max: 0.17, col: '#ffe08a' }); }
      function doSkill(i) {
        const sk = skills[i]; if (!sk) return;
        if (cds[sk.id] > 0) { floater(P.x, P.y - 40, 'Перезарядка…', '#aaa', 13, 0.5); return; }
        if (p.mp < sk.mp) { floater(P.x, P.y - 40, 'Мало мани!', '#7aa8ff', 14, 0.6); A().play('error'); return; }
        p.mp -= sk.mp; cds[sk.id] = 1.6 + (sk.cd || 0) * 1.6;
        bigText(`${sk.icon} ${sk.name}`, '#c8b0ff', 0.9); P.st = 'cast'; P.t = 0.25; A().play('magic');
        const magic = sk.scale === 'int'; const statAtk = sk.scale === 'luk' ? d.atk * (0.6 + d.s.luk / 40) : magic ? d.matk : d.atk;
        if (sk.heal) { const base = sk.scale === 'vit' ? d.s.vit * 5 + p.level * 5 : d.matk * 1.3; const amt = Math.round(base * sk.heal * rnd(0.9, 1.1)); const before = p.hp; p.hp = Math.min(d.maxHp, p.hp + amt); floater(P.x, P.y - 44, '+' + (p.hp - before), '#6af0a0', 22); burst(P.x, P.y, '#6af0a0', 18); A().play('heal'); }
        if (sk.effect && sk.effect.buff) { b.buffs[sk.effect.buff] = { amt: sk.effect.amt, sec: 3 + sk.effect.turns * 2.5 }; floater(P.x, P.y - 58, '⬆️ ' + sk.name, '#c8b0ff', 14); }
        if (!sk.power) return;
        const raw = statAtk * sk.power * atkMul() * 0.85; const elem = sk.elem || (magic ? 'magic' : null);
        const stunFx = sk.effect && ['stun', 'freeze'].includes(sk.effect.status) ? sk.effect.chance || 0.5 : 0;
        const hitOne = (x, k) => { damage(x, raw, { elem, pierce: sk.pierce, execute: sk.execute, crit: Math.random() < (d.crit + (sk.critBonus || 0)) / 100, kb: 200, stagger: true, limit: 4, quiet: k > 0 }); if (stunFx && Math.random() < stunFx && x.e.hp > 0) { x.stun = 1.4; x.st = 'stun'; x.tele = null; floater(x.x, x.y - x.size, sk.effect.status === 'freeze' ? '❄️ ЗАМОРОЖЕНО' : '💫 ОГЛУШЕНО', '#9ad8ff', 13); } if (sk.drain) p.hp = Math.min(d.maxHp, p.hp + Math.round(raw * sk.drain * 0.3)); };
        if (sk.target === 'all') {
          if (magic) { const tx = clamp(mouse.x, PAD, W - PAD), ty = clamp(mouse.y, PAD, H - PAD); rings.push({ x: tx, y: ty, a: 0, half: Math.PI, r: 140, life: 0.35, max: 0.35, col: elemCol(elem), fill: true }); for (const x of E) if (x.e.hp > 0 && Math.hypot(x.x - tx, x.y - ty) < 140 + x.r) for (let k = 0; k < (sk.hits || 1); k++) hitOne(x, k); kick(0.1, 12); }
          else { rings.push({ x: P.x, y: P.y, a: 0, half: Math.PI, r: 135, life: 0.3, max: 0.3, col: '#fff', fill: true }); for (const x of E) if (x.e.hp > 0 && dist(P, x) < 135 + x.r) for (let k = 0; k < (sk.hits || 1); k++) hitOne(x, k); kick(0.1, 10); }
        } else if (magic || shooter) {
          const n = Math.min(8, sk.hits || 1);
          for (let k = 0; k < n; k++) setTimeout(() => { if (!over) proj.push({ x: P.x, y: P.y, vx: Math.cos(P.face) * 640, vy: Math.sin(P.face) * 640, r: n > 1 ? 7 : 13, side: 'player', dmg: raw, elem, life: 1.2, col: elemCol(elem), hit: new Set(), skill: true, limit: 4 }); }, k * 70);
        } else {
          // ривок-розріз уперед крізь ворогів
          const len = 190, sx = P.x, sy = P.y; P.x = clamp(P.x + Math.cos(P.face) * len, PAD, W - PAD); P.y = clamp(P.y + Math.sin(P.face) * len, PAD, H - PAD); P.inv = Math.max(P.inv, 0.3);
          rings.push({ line: true, x: sx, y: sy, x2: P.x, y2: P.y, life: 0.25, max: 0.25, col: '#fff' });
          for (const x of E) if (x.e.hp > 0 && segDist(x, sx, sy, P.x, P.y) < 40 + x.r) for (let k = 0; k < (sk.hits || 1); k++) hitOne(x, k);
          kick(0.1, 10);
        }
      }
      function elemCol(el) { return { fire: '#ff7a3a', ice: '#8ad8ff', light: '#fff07a', holy: '#fff2c0', dark: '#a070ff', magic: '#c89aff' }[el] || '#ffffff'; }
      function segDist(pt, x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; const l = dx * dx + dy * dy || 1; const t = clamp(((pt.x - x1) * dx + (pt.y - y1) * dy) / l, 0, 1); return Math.hypot(pt.x - (x1 + t * dx), pt.y - (y1 + t * dy)); }
      function doUlt() {
        if (b.limit < 100) { floater(P.x, P.y - 40, `Ульта ${Math.floor(b.limit)}%`, '#ff9ad8', 13, 0.6); return; }
        b.limit = 0; ultT = 0.9; UI().cutin(p.name.toUpperCase(), '«СИЛА ПРОТАГОНІСТА!!!»', '#ff7eb6'); A().play('crit'); flashScr = 0.5; flashCol = '#ffffff';
        setTimeout(() => {
          if (over === 'lose') return;
          for (const x of E) if (x.e.hp > 0) { damage(x, Math.max(d.atk, d.matk) * 4.2 * atkMul() * 0.8, { crit: true, pierce: true, kb: 500, limit: 0 }); if (x.e.hp > 0 && !x.e.broken) breakNow(x); }
          const before = p.hp; p.hp = Math.min(d.maxHp, p.hp + Math.round(d.maxHp * 0.2)); if (p.hp > before) floater(P.x, P.y - 50, '+' + (p.hp - before), '#6af0a0', 22);
          kick(0.25, 18);
        }, 700);
      }
      function doPotion() {
        if (potionCd > 0) return;
        const id = ['potion_l', 'potion_m', 'potion_s', 'elixir'].find((k) => PL().hasItem(p, k) && PL().item(k) && PL().item(k).use && PL().item(k).use.hp);
        if (!id) { floater(P.x, P.y - 40, 'Нема зілля 😭', '#aaa', 14, 0.7); A().play('error'); return; }
        PL().removeItem(p, id); const before = p.hp; p.hp = Math.min(d.maxHp, p.hp + PL().item(id).use.hp); potionCd = 7;
        floater(P.x, P.y - 44, `${PL().item(id).icon} +${p.hp - before}`, '#6af0a0', 20); burst(P.x, P.y, '#6af0a0', 14); A().play('heal');
      }
      function moveVec() {
        let x = 0, y = 0;
        if (keys.has('KeyW') || keys.has('ArrowUp')) y--; if (keys.has('KeyS') || keys.has('ArrowDown')) y++;
        if (keys.has('KeyA') || keys.has('ArrowLeft')) x--; if (keys.has('KeyD') || keys.has('ArrowRight')) x++;
        const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l };
      }

      // ---------- ШІ ворогів ----------
      function startAttack(x) {
        const A0 = x.A; const pm = x.phase > 1 ? 0.78 : 1;
        x.aim = Math.atan2(P.y - x.y, P.x - x.x); x.st = 'windup';
        if (x.arch === 'boss') {
          const pats = x.phase > 1 ? ['slam3', 'cone', 'charge', 'ring', 'summon', 'cone'] : ['cone', 'slam', 'charge', 'ring'];
          const pat = pats[x.pat++ % pats.length];
          if (pat === 'summon' && E.filter((q) => q.mini && q.e.hp > 0).length >= 2) return startAttack(x);
          x.kind = pat;
          x.t = x.tw = (pat === 'ring' ? 0.8 : pat === 'charge' ? 0.75 : pat === 'summon' ? 0.9 : 0.85) * pm / Math.sqrt(AR.aggr);
          if (pat === 'cone') x.tele = { type: 'cone', r: 170, half: 1.05 };
          else if (pat === 'slam' || pat === 'slam3') { x.tele = { type: 'circle', cx: P.x, cy: P.y, r: 95 }; x.slams = pat === 'slam3' ? 2 : 0; }
          else if (pat === 'charge') x.tele = { type: 'line', len: 380, w: 56 };
          else if (pat === 'ring') x.tele = { type: 'circle', cx: x.x, cy: x.y, r: 60, ring: true };
          else x.tele = { type: 'circle', cx: x.x, cy: x.y, r: 50, ring: true };
          return;
        }
        if (x.role === 'healer') {
          const hurt = E.filter((q) => q !== x && q.e.hp > 0 && q.e.hp < q.e.maxHp * 0.85);
          if (hurt.length) { x.kind = 'heal'; x.t = x.tw = 1.1; x.tele = { type: 'circle', cx: x.x, cy: x.y, r: 46, ring: true, col: 'heal' }; floater(x.x, x.y - x.size * 0.8, '✨ Лікує! Перебий!', '#6af0a0', 13, 0.8); return; }
        }
        x.kind = x.arch; x.t = x.tw = A0.wind * (x.e.elite ? 0.85 : 1) / Math.sqrt(AR.aggr) * (x.enraged ? 0.85 : 1);
        if (x.arch === 'melee') x.tele = { type: 'cone', r: 82, half: 0.75 };
        else if (x.arch === 'brute') x.tele = { type: 'circle', cx: x.x, cy: x.y, r: 105 };
        else if (x.arch === 'charger') x.tele = { type: 'line', len: 260, w: 40 };
        else if (x.arch === 'slime') x.tele = { type: 'circle', cx: P.x, cy: P.y, r: 58 };
        else x.tele = { type: 'line', len: 420, w: 10, thin: true };
      }
      function activate(x) {
        const A0 = x.A; const mult = A0.mult * (x.phase > 1 ? 1.15 : 1); const raw = x.e.atk * mult * (x.mini ? 0.5 : 1);
        if (x.kind === 'heal') {
          for (const q of E) if (q.e.hp > 0 && q.st !== 'dead' && Math.hypot(q.x - x.x, q.y - x.y) < 320) { const hh = Math.round(q.e.maxHp * 0.18); q.e.hp = Math.min(q.e.maxHp, q.e.hp + hh); floater(q.x, q.y - q.size * 0.6, '+' + hh, '#6af0a0', 16); burst(q.x, q.y, '#6af0a0', 10, 160); }
          rings.push({ x: x.x, y: x.y, a: 0, half: Math.PI, r: 320, life: 0.4, max: 0.4, col: '#6af0a0' }); A().play('heal');
          x.tele = null; x.st = 'recover'; x.t = 1.2; return;
        }
        x.st = 'active'; x.t = x.kind === 'charge' || x.kind === 'charger' ? 0.38 : A0.act; x.didHit = false;
        const T = x.tele;
        const tryHit = (inside, o) => { if (!inside) return; const r = hurtPlayer(raw * (o || 1), x); if (r === 'parry') parried(x); };
        if (T && T.type === 'cone') {
          tryHit(dist(P, x) < T.r + P.r && angDiff(Math.atan2(P.y - x.y, P.x - x.x), x.aim) < T.half); rings.push({ x: x.x, y: x.y, a: x.aim, half: T.half, r: T.r, life: 0.15, max: 0.15, col: '#ff5060' }); A().play('miss');
          // еліта й розлючені б'ють подвійним замахом — не розслабляйся після першого
          if (x.arch === 'melee' && !x.followUp && (x.e.elite || x.enraged || Math.random() < 0.3 * AR.aggr)) { x.followUp = true; x.st = 'windup'; x.t = x.tw = 0.32; x.aim = Math.atan2(P.y - x.y, P.x - x.x); x.tele = { type: 'cone', r: 92, half: 0.8 }; return; }
          x.followUp = false;
        }
        else if (T && T.type === 'circle' && !T.ring) {
          if (x.kind === 'slime') { x.x = T.cx; x.y = T.cy; }
          tryHit(Math.hypot(P.x - T.cx, P.y - T.cy) < T.r + P.r * 0.5); rings.push({ x: T.cx, y: T.cy, a: 0, half: Math.PI, r: T.r, life: 0.25, max: 0.25, col: '#ff8060', fill: true }); burst(T.cx, T.cy, '#c8a070', 16, 260); kick(0.03, x.e.boss ? 10 : 6); A().play('hurt');
          if (x.slams > 0) { x.slams--; x.st = 'windup'; x.t = x.tw = 0.45; x.tele = { type: 'circle', cx: P.x, cy: P.y, r: 95 }; return; }
        }
        else if (T && T.type === 'line' && !T.thin) { x.dash = { vx: Math.cos(x.aim) * (T.len / 0.38), vy: Math.sin(x.aim) * (T.len / 0.38), raw }; A().play('step'); }
        else if (T && T.thin) { const n = x.e.elite || x.enraged ? 3 : 1; for (let i = 0; i < n; i++) { const a = x.aim + (i - (n - 1) / 2) * 0.22; proj.push({ x: x.x, y: x.y, vx: Math.cos(a) * 360, vy: Math.sin(a) * 360, r: 8, side: 'enemy', dmg: raw, life: 2.2, col: '#ff6a9a', src: x }); } A().play('magic'); }
        else if (x.kind === 'ring') { const n = x.phase > 1 ? 18 : 12; for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + rnd(0, 0.2); proj.push({ x: x.x, y: x.y, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, r: 9, side: 'enemy', dmg: raw * 0.6, life: 3, col: '#ff4070', src: x }); } A().play('magic'); kick(0.02, 6); }
        else if (x.kind === 'summon') { const key = ['goblin', 'skeleton', 'imp', 'slime'][Math.floor(Math.random() * 4)]; for (let i = 0; i < 2; i++) { const m = C().makeEnemy(key, Math.max(1, x.e.lvl - 4)); m.maxHp = Math.round(m.maxHp * 0.45); m.hp = m.maxHp; m.name = 'Прислужник'; const n = addEnemy(m, x.x + (i ? 60 : -60), x.y + 40, true); n.t = 0.6; burst(n.x, n.y, '#a070ff', 16); } floater(x.x, x.y - 70, '«Прислужники, до мене!»', '#ff9aa8', 15, 1.2); }
        x.tele = null;
      }
      function updEnemy(x, dt) {
        x.flash = Math.max(0, x.flash - dt);
        x.x += x.kx * dt; x.y += x.ky * dt; x.kx *= Math.pow(0.0015, dt); x.ky *= Math.pow(0.0015, dt);
        if (x.brokenT > 0 && (x.brokenT -= dt) <= 0) { x.e.broken = 0; x.e.shield = x.e.shieldMax; floater(x.x, x.y - x.size * 0.6, '🛡️ Щит відновлено', '#9ad8ff', 12); }
        if (x.st === 'dead') { x.t -= dt; return; }
        if (x.e.boss && x.phase === 1 && x.e.hp < x.e.maxHp * 0.5) {
          x.phase = 2; x.speedMul = 1.3; x.st = 'stun'; x.stun = 1.2; x.tele = null; x.e.broken = 0; x.e.shield = x.e.shieldMax; x.brokenT = 0;
          UI().cutin('ФАЗА 2', BOSS_LINES[Math.floor(Math.random() * BOSS_LINES.length)], '#ff3050'); flashScr = 0.4; flashCol = '#ff2040'; kick(0.2, 14); A().play('war');
        }
        if (!x.enraged && !x.mini && !x.e.boss && enemies.length > 1 && !E.some((q) => q !== x && q.e.hp > 0)) { x.enraged = true; floater(x.x, x.y - x.size * 0.7, '😡 ЛЮТЬ!', '#ff5050', 16, 1); flashScr = 0.12; flashCol = '#ff2020'; }
        if (x.st === 'stun') { if ((x.stun -= dt) <= 0) { x.st = 'idle'; x.t = 0.4; } return; }
        const dx = P.x - x.x, dy = P.y - x.y, dd = Math.hypot(dx, dy) || 1; const A0 = x.A;
        { const want = Math.atan2(dy, dx); let df = want - x.face; while (df > Math.PI) df -= 6.283; while (df < -Math.PI) df += 6.283; const tr = (x.role === 'shield' ? 2.0 : 9) * dt; x.face += Math.max(-tr, Math.min(tr, df)); } const spd = A0.spd * x.speedMul * (0.8 + 0.2 * AR.aggr) * (x.enraged ? 1.25 : 1);
        if (x.st === 'idle' || x.st === 'chase') {
          x.st = 'chase'; x.t -= dt;
          if (x.arch === 'ranged') { const want = dd < 200 ? -1 : dd > 300 ? 1 : 0; const side = Math.sin(time * 1.3 + x.r) * 0.6; x.x += (dx / dd * want - dy / dd * side) * spd * dt; x.y += (dy / dd * want + dx / dd * side) * spd * dt; }
          else if (x.arch === 'slime') { x.hop = (x.hop + dt * 3) % 1; if (dd > 50) { const s = Math.sin(x.hop * Math.PI); x.x += dx / dd * spd * 1.6 * s * dt; x.y += dy / dd * spd * 1.6 * s * dt; } }
          else if (dd > A0.range * 0.7) { x.x += dx / dd * spd * dt; x.y += dy / dd * spd * dt; }
          // не злипатися в купу
          for (const o of E) if (o !== x && o.st !== 'dead') { const ex = x.x - o.x, ey = x.y - o.y, ed = Math.hypot(ex, ey) || 1, mn = x.r + o.r + 6; if (ed < mn) { x.x += ex / ed * (mn - ed) * 0.5; x.y += ey / ed * (mn - ed) * 0.5; } }
          if (x.t <= 0 && dd < A0.range + 20 && !over) startAttack(x);
        } else if (x.st === 'windup') {
          x.t -= dt;
          if (x.tele && (x.tele.type === 'cone' || x.tele.type === 'line') && x.t > x.tw * 0.3) x.aim = Math.atan2(P.y - x.y, P.x - x.x); // доводка прицілу на початку замаху
          if (x.t <= 0) activate(x);
        } else if (x.st === 'active') {
          x.t -= dt;
          if (x.dash) { x.x += x.dash.vx * dt; x.y += x.dash.vy * dt; if (!x.didHit && dist(P, x) < x.r + P.r + 4) { x.didHit = true; const r = hurtPlayer(x.dash.raw, x); if (r === 'parry') { parried(x); x.dash = null; } } }
          if (x.t <= 0) { x.dash = null; x.st = 'recover'; x.t = A0.rec * (x.phase > 1 ? 0.75 : 1) / AR.aggr; }
        } else if (x.st === 'recover') { x.t -= dt; if (x.t <= 0) { x.st = 'chase'; x.t = A0.cd * rnd(0.6, 1.2) * (x.phase > 1 ? 0.7 : 1) / AR.aggr * (x.enraged ? 0.7 : 1); } }
        x.x = clamp(x.x, PAD + x.r, W - PAD - x.r); x.y = clamp(x.y, PAD + x.r, H - PAD - x.r);
      }

      // ---------- бот для автотесту ----------
      function botThink() {
        const tgt = E.filter((x) => x.e.hp > 0).sort((a, z) => dist(P, a) - dist(P, z))[0]; if (!tgt) return;
        for (const k of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) keys.delete(k);
        mouse.x = tgt.x; mouse.y = tgt.y;
        const danger = E.find((x) => x.st === 'windup' && x.t < 0.2 && dist(P, x) < 200);
        if (danger && P.sta > 25) { keys.add(P.y > danger.y ? 'KeyS' : 'KeyW'); press('roll'); return; }
        if (b.limit >= 100) { press('ult'); return; }
        if (p.hp < d.maxHp * 0.35) press('potion');
        if (dist(P, tgt) > reach * 0.85 && !shooter && !caster) { if (tgt.x > P.x + 10) keys.add('KeyD'); if (tgt.x < P.x - 10) keys.add('KeyA'); if (tgt.y > P.y + 10) keys.add('KeyS'); if (tgt.y < P.y - 10) keys.add('KeyW'); }
        else { const i = skills.findIndex((s) => s.power && !(cds[s.id] > 0) && p.mp >= s.mp); press(i >= 0 && Math.random() < 0.3 ? 's' + i : 'light'); }
      }

      // ---------- головний цикл ----------
      function update(dt) {
        time += dt;
        if (bot && !over && Math.floor(time * 10) !== Math.floor((time - dt) * 10)) botThink();
        d = PL().derived(p);
        buf.t -= dt; potionCd = Math.max(0, potionCd - dt); for (const k in cds) cds[k] = Math.max(0, cds[k] - dt);
        for (const k of Object.keys(b.buffs)) if (b.buffs[k] && b.buffs[k].sec !== undefined && (b.buffs[k].sec -= dt) <= 0) delete b.buffs[k];
        if ((chainT -= dt) <= 0 && chain) { chain = 0; syncCombo(); }
        p.mp = Math.min(d.maxMp, p.mp + d.maxMp * (p.cheat === 'mana' ? 0.03 : 0.012) * dt);
        if (b.art && b.art.regen) p.hp = Math.min(d.maxHp, p.hp + d.maxHp * 0.006 * dt);
        if ((P.staT -= dt) <= 0) P.sta = Math.min(100, P.sta + 42 * dt);
        if (P.burn && !over) { P.burn.t -= dt; p.hp = Math.max(1, p.hp - P.burn.dps * dt); if (Math.random() < 0.3) burst(P.x, P.y - 10, '#ff7a30', 1, 80); if (P.burn.t <= 0) P.burn = null; }
        P.inv = Math.max(0, P.inv - dt); P.flash = Math.max(0, P.flash - dt); P.comboT -= dt; P.hurtT -= dt;
        // ціль погляду — курсор
        if (!over) P.face = Math.atan2(mouse.y - P.y, mouse.x - P.x);
        // стан гравця
        const canAct = !over && ultT <= 0 && (P.st === 'idle' || P.st === 'move' || (P.st === 'attack' && P.t < 0.09));
        if (canAct && buf.t > 0 && buf.act) {
          const a = buf.act; buf.act = null;
          if (a === 'light') doLight(); else if (a === 'roll') doRoll(); else if (a === 'parry') doParry(); else if (a === 'ult') doUlt(); else if (a === 'potion') doPotion(); else if (a[0] === 's') doSkill(+a[1]);
        } else if (!over && buf.act === 'roll' && buf.t > 0 && (P.st === 'attack' || P.st === 'cast') && P.t < 0.2) { buf.act = null; doRoll(); } // перекат скасовує відновлення
        if (canAct && keys.has('heavy') && P.sta > 18 && P.st !== 'charge') { P.st = 'charge'; P.charge = 0; }
        if (P.st === 'charge') { P.charge += dt; if (!keys.has('heavy') || P.charge > 1.2) releaseHeavy(); }
        else if (P.st === 'attack') { P.t -= dt; if (!P.did && P.t < (P.step === 3 ? 0.24 : 0.15)) { P.did = true; lightHit(); } if (P.t <= 0) P.st = 'idle'; }
        else if (P.st === 'roll') { P.t -= dt; const sp = 560 * (0.4 + P.t / 0.3 * 0.8); P.x += Math.cos(P.rollDir) * sp * dt; P.y += Math.sin(P.rollDir) * sp * dt; P.trail.push({ x: P.x, y: P.y, life: 0.2 }); if (P.t <= 0) P.st = 'idle'; }
        else if (P.st === 'parry' || P.st === 'cast') { P.t -= dt; if (P.t <= 0) P.st = 'idle'; }
        if ((P.st === 'idle' || P.st === 'move' || P.st === 'charge') && !over && ultT <= 0) {
          const mv = moveVec(); const sp = (P.st === 'charge' ? 95 : 230) * (1 + d.s.agi * 0.004);
          P.x += mv.x * sp * dt; P.y += mv.y * sp * dt; P.st = P.st === 'charge' ? 'charge' : mv.x || mv.y ? 'move' : 'idle';
          if ((mv.x || mv.y) && Math.random() < dt * 4) A().play('step');
        }
        P.x += (P.kx || 0) * dt; P.y += (P.ky || 0) * dt; P.kx = (P.kx || 0) * Math.pow(0.0008, dt); P.ky = (P.ky || 0) * Math.pow(0.0008, dt);
        P.x = clamp(P.x, PAD + P.r, W - PAD - P.r); P.y = clamp(P.y, PAD + P.r, H - PAD - P.r);
        for (const t of P.trail) t.life -= dt; while (P.trail.length && P.trail[0].life <= 0) P.trail.shift();
        if (ultT > 0) ultT -= dt;
        // вороги
        for (const x of E) updEnemy(x, dt);
        for (let i = E.length - 1; i >= 0; i--) if (E[i].st === 'dead' && E[i].t <= 0) E.splice(i, 1);
        // союзники
        for (const a of allies) {
          const tx = P.x - Math.cos(P.face) * 50 + (a === allies[0] ? 0 : 30), ty = P.y - Math.sin(P.face) * 50 + (allies.indexOf(a) % 2 ? 36 : -36);
          a.x += (tx - a.x) * Math.min(1, dt * 3); a.y += (ty - a.y) * Math.min(1, dt * 3);
          if ((a.t -= dt) <= 0) {
            a.t = 1.5 + Math.random() * 0.6;
            const tgt = E.filter((x) => x.e.hp > 0).sort((q, z) => dist(a, q) - dist(a, z))[0];
            if (tgt && dist(a, tgt) < 340 && a.a.atk) { proj.push({ x: a.x, y: a.y, vx: (tgt.x - a.x) / dist(a, tgt) * 520, vy: (tgt.y - a.y) / dist(a, tgt) * 520, r: 6, side: 'player', dmg: a.a.atk * 0.7, life: 1, col: '#9af0c0', hit: new Set(), ally: true }); }
          }
          if (a.a.heal && (a.healT -= dt) <= 0) { a.healT = 5; const before = p.hp; p.hp = Math.min(d.maxHp, p.hp + Math.round(a.a.heal)); if (p.hp > before) floater(P.x, P.y - 40, `🐾 +${p.hp - before}`, '#6af0a0', 15); }
        }
        // снаряди
        for (const q of proj) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
          if (q.x < PAD || q.x > W - PAD || q.y < PAD || q.y > H - PAD) q.life = 0;
          if (q.side === 'enemy') { if (Math.hypot(q.x - P.x, q.y - P.y) < q.r + P.r) { const r = hurtPlayer(q.dmg, q); if (r === 'parry') { q.side = 'player'; q.vx *= -1.4; q.vy *= -1.4; q.dmg = d.atk * 1.2; q.col = '#ffe08a'; q.hit = new Set(); P.st = 'idle'; floater(P.x, P.y - 46, 'ВІДБИТО!', '#ffe08a', 20); kick(0.1, 6); A().play('clang'); } else if (r !== 'dodge') q.life = 0; } }
          else for (const x of E) if (x.e.hp > 0 && !(q.hit || (q.hit = new Set())).has(x) && Math.hypot(q.x - x.x, q.y - x.y) < q.r + x.r) { q.hit.add(x); damage(x, q.dmg, { elem: q.elem, by: q.ally ? 'ally' : 'player', kb: 90, limit: q.limit || 3, quiet: q.ally, from: q }); if (!q.pierce) { q.life = 0; break; } }
          if (Math.random() < 0.5) parts.push({ x: q.x, y: q.y, vx: 0, vy: 0, life: 0.18, max: 0.18, col: q.col, sz: q.r * 0.6 });
        }
        for (let i = proj.length - 1; i >= 0; i--) if (proj[i].life <= 0) proj.splice(i, 1);
        for (const q of parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.9; q.vy *= 0.9; q.life -= dt; }
        for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
        for (const f of floats) { f.y -= 40 * dt; f.life -= dt; }
        for (let i = floats.length - 1; i >= 0; i--) if (floats[i].life <= 0) floats.splice(i, 1);
        for (const r of rings) r.life -= dt; for (let i = rings.length - 1; i >= 0; i--) if (rings[i].life <= 0) rings.splice(i, 1);
      }

      // ---------- малювання ----------
      function drawSpr(spr, x, y, size, flip, white, alpha = 1) {
        g.save(); g.globalAlpha = alpha; g.translate(x, y); if (flip) g.scale(-1, 1);
        g.drawImage(white ? whiteOf(spr) : spr, -size / 2, -size + 6, size, size); g.restore();
      }
      function shadow(x, y, r) { g.fillStyle = 'rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(x, y + 6, r * 1.1, r * 0.45, 0, 0, 7); g.fill(); }
      function drawTele(x) {
        const T = x.tele; if (!T) return; const k = 1 - clamp(x.t / (x.tw || 1), 0, 1);
        const hc = T.col === 'heal';
        g.save(); g.fillStyle = hc ? 'rgba(60,240,140,.14)' : 'rgba(255,40,60,.16)'; g.strokeStyle = hc ? `rgba(80,255,150,${0.5 + k * 0.5})` : `rgba(255,60,70,${0.5 + k * 0.5})`; g.lineWidth = 2;
        const fill = hc ? `rgba(60,240,140,${0.18 + k * 0.32})` : `rgba(255,40,60,${0.18 + k * 0.32})`;
        if (T.type === 'cone') { g.beginPath(); g.moveTo(x.x, x.y); g.arc(x.x, x.y, T.r, x.aim - T.half, x.aim + T.half); g.closePath(); g.fill(); g.stroke(); g.fillStyle = fill; g.beginPath(); g.moveTo(x.x, x.y); g.arc(x.x, x.y, T.r * k, x.aim - T.half, x.aim + T.half); g.closePath(); g.fill(); }
        else if (T.type === 'circle') { const cx = T.ring ? x.x : T.cx, cy = T.ring ? x.y : T.cy; g.beginPath(); g.arc(cx, cy, T.r, 0, 7); g.fill(); g.stroke(); g.fillStyle = fill; g.beginPath(); g.arc(cx, cy, T.r * k, 0, 7); g.fill(); if (T.ring) { g.strokeStyle = `rgba(255,80,120,${k})`; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, T.r * (1.5 - k * 0.5), 0, 7); g.stroke(); } }
        else if (T.type === 'line') { g.translate(x.x, x.y); g.rotate(x.aim); g.fillRect(0, -T.w / 2, T.len, T.w); g.strokeRect(0, -T.w / 2, T.len, T.w); g.fillStyle = fill; g.fillRect(0, -T.w / 2, T.len * k, T.w); }
        g.restore();
        if (k > 0.75 && !hc) { g.fillStyle = '#ff4050'; g.font = FONT(22, 900); g.textAlign = 'center'; g.fillText('!', x.x, x.y - x.size - 4); }
      }
      function bar(x, y, w, h, v, col, back = 'rgba(0,0,0,.6)') { g.fillStyle = back; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = col; g.fillRect(x, y, w * clamp(v, 0, 1), h); }
      function render() {
        g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#05060c'; g.fillRect(0, 0, cv.width, cv.height);
        const sx = shake ? rnd(-shake, shake) : 0, sy = shake ? rnd(-shake, shake) : 0;
        g.setTransform(scale, 0, 0, scale, ox + sx * scale, oy + sy * scale); g.imageSmoothingEnabled = false;
        g.drawImage(bg, 0, 0);
        for (const x of E) drawTele(x);
        for (const r of rings) {
          const k = r.life / r.max; g.save(); g.globalAlpha = k; g.strokeStyle = r.col; g.fillStyle = r.col;
          if (r.line) { g.lineWidth = 14 * k + 2; g.beginPath(); g.moveTo(r.x, r.y); g.lineTo(r.x2, r.y2); g.stroke(); }
          else if (r.fill) { g.globalAlpha = k * 0.35; g.beginPath(); g.arc(r.x, r.y, r.r * (1.15 - k * 0.15), 0, 7); g.fill(); g.globalAlpha = k; g.lineWidth = 4; g.stroke(); }
          else { g.lineWidth = 10 * k + 2; g.beginPath(); g.arc(r.x, r.y, r.r * (0.85 + (1 - k) * 0.2), r.a - r.half, r.a + r.half); g.stroke(); }
          g.restore();
        }
        // сутності за глибиною
        const list = [...E.map((x) => ({ y: x.y, f: () => drawEnemy(x) })), ...allies.map((a) => ({ y: a.y, f: () => { shadow(a.x, a.y, 10); drawSpr(a.spr, a.x, a.y, 36, mouse.x < a.x); } })), { y: P.y, f: drawPlayer }];
        list.sort((a, z) => a.y - z.y).forEach((o) => o.f());
        for (const q of proj) { g.save(); g.shadowColor = q.col; g.shadowBlur = 14; g.fillStyle = q.col; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(q.x, q.y, q.r * 0.45, 0, 7); g.fill(); g.restore(); }
        for (const q of parts) { g.globalAlpha = clamp(q.life / q.max, 0, 1); g.fillStyle = q.col; g.fillRect(q.x - q.sz / 2, q.y - q.sz / 2, q.sz, q.sz); } g.globalAlpha = 1;
        g.textAlign = 'center';
        for (const f of floats) { const k = f.life / f.max; g.globalAlpha = clamp(k * 2, 0, 1); const s = f.size * (k > 0.85 ? 1 + (k - 0.85) * 3 : 1); g.font = FONT(s, 900); g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.8)'; g.strokeText(f.text, f.x, f.y); g.fillStyle = f.col; g.fillText(f.text, f.x, f.y); } g.globalAlpha = 1;
        if (flashScr > 0) { g.globalAlpha = clamp(flashScr * 2, 0, 0.6); g.fillStyle = flashCol; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
        if (ultT > 0) { g.fillStyle = 'rgba(255,120,200,.12)'; g.fillRect(0, 0, W, H); for (let i = 0; i < 18; i++) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; const a = rnd(0, 6.283); g.beginPath(); g.moveTo(P.x + Math.cos(a) * 60, P.y + Math.sin(a) * 60); g.lineTo(P.x + Math.cos(a) * 700, P.y + Math.sin(a) * 700); g.stroke(); } }
        drawHud();
      }
      function drawPlayer() {
        for (const t of P.trail) drawSpr(heroSpr, t.x, t.y, 48, Math.cos(P.face) < 0, true, t.life * 1.5 * 0.35);
        shadow(P.x, P.y, 14);
        const flip = Math.cos(P.face) < 0; const blink = P.inv > 0 && P.st !== 'roll' && Math.floor(time * 20) % 2;
        g.save();
        if (P.st === 'roll') { g.translate(P.x, P.y - 10); g.rotate((1 - P.t / 0.3) * 6.283 * (flip ? -1 : 1)); g.translate(-P.x, -(P.y - 10)); }
        const bob = P.st === 'move' ? Math.abs(Math.sin(time * 14)) * 3 : 0;
        if (!blink) drawSpr(heroSpr, P.x, P.y - bob, 48, flip, P.flash > 0);
        g.restore();
        // зброя-напрямок
        g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; g.beginPath(); g.arc(P.x, P.y - 14, 30, P.face - 0.25, P.face + 0.25); g.stroke();
        if (P.st === 'charge') { const c = clamp(P.charge / 0.6, 0, 1); g.strokeStyle = c >= 1 ? '#ffe08a' : 'rgba(255,255,255,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(P.x, P.y - 14, 26 + 10 * (1 - c), -1.57, -1.57 + 6.283 * c); g.stroke(); if (c >= 1 && Math.random() < 0.4) burst(P.x, P.y - 14, '#ffe08a', 1, 120); }
        if (P.st === 'parry') { g.strokeStyle = '#ffe08a'; g.lineWidth = 3; g.beginPath(); g.arc(P.x, P.y - 14, 30, 0, 7); g.stroke(); }
      }
      function drawEnemy(x) {
        const e = x.e; const dead = x.st === 'dead';
        shadow(x.x, x.y, x.r);
        const flip = P.x < x.x; const pulse = x.st === 'windup' ? 1 + Math.sin(time * 40) * 0.04 : 1;
        const squash = x.arch === 'slime' && x.st === 'chase' ? Math.sin(x.hop * Math.PI) * 10 : 0;
        g.save(); if (dead) { g.globalAlpha = clamp(x.t * 2, 0, 1); }
        if (x.st === 'stun') { g.translate(x.x, x.y); g.rotate(Math.sin(time * 18) * 0.08); g.translate(-x.x, -x.y); }
        if (e.champion && !dead) { const cc = CHAMPS[e.champion].col; g.save(); g.globalAlpha = 0.35 + Math.sin(time * 6) * 0.15; g.strokeStyle = cc; g.lineWidth = 4; g.beginPath(); g.ellipse(x.x, x.y + 4, x.r * 1.6, x.r * 0.7, 0, 0, 7); g.stroke(); g.restore(); }
        drawSpr(x.spr, x.x, x.y - squash, x.size * pulse, flip, x.flash > 0 || (x.st === 'windup' && x.t < 0.12));
        g.restore();
        if (dead) return;
        if (x.role === 'shield') { g.save(); g.translate(x.x + Math.cos(x.face) * 20, x.y - 14 + Math.sin(x.face) * 20); g.rotate(x.face); g.fillStyle = e.broken || x.st === 'stun' ? 'rgba(120,120,140,.6)' : '#8fb4d8'; g.strokeStyle = '#1a2230'; g.lineWidth = 2; g.fillRect(-4, -16, 8, 32); g.strokeRect(-4, -16, 8, 32); g.restore(); }
        if (x.role === 'healer' || e.champion) { g.font = FONT(14); g.textAlign = 'center'; g.fillText(x.role === 'healer' ? '✚' : CHAMPS[e.champion].icon, x.x, x.y - x.size - 18); }
        if (x.st === 'stun') { g.font = FONT(14); g.textAlign = 'center'; g.fillText(e.broken ? '💥' : '💫', x.x + Math.cos(time * 6) * 14, x.y - x.size - 2); }
        if (e.boss) return;
        const w = x.mini ? 30 : 46, top = x.y - x.size - 8;
        bar(x.x - w / 2, top, w, 5, e.hp / e.maxHp, e.broken ? '#7cd8ff' : e.elite ? '#ffb347' : '#ff5060');
        for (let i = 0; i < e.shieldMax && !x.mini; i++) { g.fillStyle = e.broken ? '#334' : i < e.shield ? '#7cc0ff' : '#334'; g.fillRect(x.x - w / 2 + i * 8, top - 8, 6, 5); }
        if (e.known && e.known.length) { g.font = `11px ${EM}`; g.textAlign = 'left'; g.fillText(e.known.map((k) => C().DTYPES[k]).join(''), x.x + w / 2 + 3, top + 6); }
      }
      function drawHud() {
        g.textAlign = 'left';
        // гравець
        const hx = 16, hy = H - 70;
        g.fillStyle = 'rgba(8,10,22,.72)'; g.fillRect(hx - 6, hy - 22, 270, 82);
        g.font = FONT(13); g.fillStyle = '#ffe08a'; g.fillText(`${p.name} · Рів. ${p.level}`, hx, hy - 7);
        bar(hx, hy, 250, 12, p.hp / d.maxHp, p.hp < d.maxHp * 0.3 ? '#ff4050' : '#4ade80'); g.font = FONT(10, 700); g.fillStyle = '#fff'; g.fillText(`❤ ${Math.ceil(p.hp)}/${d.maxHp}`, hx + 4, hy + 10);
        bar(hx, hy + 17, 250, 9, p.mp / d.maxMp, '#5a8cff'); g.font = FONT(9, 700); g.fillText(`✦ ${Math.floor(p.mp)}/${d.maxMp}`, hx + 4, hy + 25);
        bar(hx, hy + 30, 250, 6, P.sta / 100, P.sta < 20 ? '#a0a0a0' : '#ffd24a');
        bar(hx, hy + 41, 250, 6, b.limit / 100, b.limit >= 100 ? (Math.floor(time * 6) % 2 ? '#ff7eb6' : '#fff') : '#ff7eb6');
        g.font = FONT(9, 700); g.fillStyle = '#ffb8dc'; g.fillText(b.limit >= 100 ? 'УЛЬТА ГОТОВА — тисни F!' : 'ульта', hx + 4, hy + 47);
        // навички
        const slots = [...skills.map((s, i) => ({ key: SKEYS[i], icon: s.icon, cd: cds[s.id] || 0, max: 1.6 + (s.cd || 0) * 1.6, off: p.mp < s.mp })), { key: 'F', icon: '🌟', cd: 0, off: b.limit < 100 }, { key: 'H', icon: '🧪', cd: potionCd, max: 7, off: false }];
        slots.forEach((s, i) => {
          const x = W / 2 - slots.length * 27 + i * 54, y = H - 58;
          g.fillStyle = 'rgba(8,10,22,.8)'; g.fillRect(x, y, 46, 46); g.strokeStyle = s.off ? '#444' : '#8a7cff'; g.lineWidth = 2; g.strokeRect(x, y, 46, 46);
          g.globalAlpha = s.off ? 0.35 : 1; g.font = `24px ${EM}`; g.textAlign = 'center'; g.fillText(s.icon, x + 23, y + 31); g.globalAlpha = 1;
          if (s.cd > 0) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x, y + 46 * (1 - s.cd / s.max), 46, 46 * (s.cd / s.max)); g.font = FONT(13); g.fillStyle = '#fff'; g.fillText(s.cd.toFixed(1), x + 23, y + 28); }
          g.font = FONT(10); g.fillStyle = '#ffe08a'; g.textAlign = 'left'; g.fillText(s.key, x + 3, y + 11);
        });
        // бос
        const bs = E.find((x) => x.e.boss && x.st !== 'dead');
        if (bs) {
          const e = bs.e; g.fillStyle = 'rgba(8,10,22,.75)'; g.fillRect(W / 2 - 260, 10, 520, 40);
          g.font = FONT(14); g.textAlign = 'center'; g.fillStyle = bs.phase > 1 ? '#ff6a7a' : '#ffe08a'; g.fillText(`👑 ${e.name}${bs.phase > 1 ? ' — ФАЗА 2' : ''}`, W / 2, 26);
          bar(W / 2 - 250, 32, 500, 10, e.hp / e.maxHp, e.broken ? '#7cd8ff' : '#ff3050');
          for (let i = 0; i < e.shieldMax; i++) { g.fillStyle = e.broken ? '#334' : i < e.shield ? '#7cc0ff' : '#334'; g.fillRect(W / 2 - 250 + i * 12, 45, 9, 4); }
        }
        // комбо
        if (chain >= 3) { const k = clamp(chainT / 2.6, 0, 1); g.textAlign = 'right'; g.font = FONT(34, 900); g.lineWidth = 5; g.strokeStyle = '#000'; g.globalAlpha = 0.4 + k * 0.6; g.strokeText(`${chain}`, W - 24, 100); g.fillStyle = chain >= 30 ? '#ff7eb6' : chain >= 12 ? '#ffe08a' : '#fff'; g.fillText(`${chain}`, W - 24, 100); g.font = FONT(13); g.fillText(`УДАРІВ · ×${b.combo}`, W - 24, 118); g.globalAlpha = 1; bar(W - 124, 124, 100, 3, k, '#ffe08a'); }
        // банер
        if (banner && banner.t > 0) { g.textAlign = 'center'; g.globalAlpha = clamp(banner.t * 2, 0, 1); g.font = FONT(banner.big ? 40 : 26, 900); g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,.85)'; const y = bs ? 92 : 70; g.strokeText(banner.text, W / 2, y); g.fillStyle = banner.col; g.fillText(banner.text, W / 2, y); g.globalAlpha = 1; }
        // підказка
        if (time < 7 && !over) { g.globalAlpha = clamp(7 - time, 0, 1) * 0.85; g.textAlign = 'center'; g.font = FONT(12, 700); g.fillStyle = '#fff'; g.fillText('WASD рух · ЛКМ комбо · ПКМ (затиснути) важкий · Пробіл перекат · Shift парирування · Q/E/R навички · F ульта · H зілля · Esc пауза', W / 2, H - 104); g.globalAlpha = 1; }
        if (paused) { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, W, H); }
      }

      let last = performance.now(), acc = 0, raf = 0, done = false;
      function frame(now) {
        if (done) return;
        let dt = Math.min(0.1, (now - last) / 1000); last = now;
        if (!paused) {
          if (banner) banner.t -= dt; shake = Math.max(0, shake - dt * 40); flashScr = Math.max(0, flashScr - dt);
          if (hitstop > 0) hitstop -= dt;
          else {
            const ts = slow > 0 ? 0.3 : 1; if (slow > 0) slow -= dt;
            acc += dt * ts; let n = 0;
            while (acc >= 1 / 60 && n++ < 6) { update(1 / 60); acc -= 1 / 60; }
          }
          if (over && (endT -= dt) <= 0) { finish(over); return; }
        }
        render(); raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);

      async function finish(res) {
        if (done) return; done = true; cancelAnimationFrame(raf);
        removeEventListener('keydown', onKey, true); removeEventListener('keyup', onKey, true); removeEventListener('mouseup', onMouse); removeEventListener('mousemove', onMouse); removeEventListener('resize', resize);
        root.remove();
        for (const a of b.allies) if (a.kind === 'comp' && a.ref.hp <= 0) a.ref.hp = 1;
        b.over = res;
        if (res === 'win') {
          if (!b.rank) rankNow();
          b.enemies = b.enemies.filter((e) => e.hp <= 0); C().computeRewards(b, p);
        }
        if (res === 'lose') p.hp = 0;
        await ISK.combatUI.settle(b, opts, resolve);
      }
      // для автотесту
      ISK.actionCombat._live = { P, E, b, finish, state: () => ({ over, enemies: E.length, chain, limit: b.limit }) };
    });
  }

  ISK.actionCombat = { run, archOf };
})();
