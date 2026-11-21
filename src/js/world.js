// Дивосвіт world generation v2: several continents, islands, demon continent, Empire with vassal kingdoms,
// feudal regions (kingdom → duchy → county → barony), special zones, roads, sea routes, dungeons.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const { RNG, noise, names } = ISK;

  const W = 320, H = 220;
  const T = { DEEP: 0, SEA: 1, BEACH: 2, PLAINS: 3, FOREST: 4, HILLS: 5, MOUNTAIN: 6, PEAK: 7, DESERT: 8, TUNDRA: 9, SWAMP: 10, ASH: 11, JUNGLE: 12 };
  const TERRAIN_INFO = {
    0: { name: 'Глибоке море', cost: Infinity }, 1: { name: 'Море', cost: Infinity }, 2: { name: 'Узбережжя', cost: 1.2 },
    3: { name: 'Рівнини', cost: 1 }, 4: { name: 'Ліс', cost: 2 }, 5: { name: 'Пагорби', cost: 3 }, 6: { name: 'Гори', cost: 8 },
    7: { name: 'Снігові піки', cost: 14 }, 8: { name: 'Пустеля', cost: 2.5 }, 9: { name: 'Тундра', cost: 2.2 }, 10: { name: 'Болото', cost: 4 },
    11: { name: 'Пекельні пустища', cost: 3 }, 12: { name: 'Хащі', cost: 3 },
  };

  Object.assign(names.CULTURES, {
    fey: { pre: ['Фіа', 'Люм', 'Пікс', 'Сільв', 'Тінк', 'Ефі', 'Мелі', 'Оріа'], mid: ['лі', 'ра', 'ні', 'ве'], suf: ['лея', 'андра', 'вель', 'ріна', 'мерія', 'тіль'] },
    beast: { pre: ['Гарр', 'Ррак', 'Мяу', 'Кіцу', 'Вовк', 'Шерст', 'Ікл', 'Тигр'], mid: ['а', 'о', 'ур', 'ер'], suf: ['ленд', 'тан', 'гор', 'кай', 'нор', 'рат'] },
    orc: { pre: ['Грок', 'Мор', 'Зуг', 'Ург', 'Гаш', 'Бруг', 'Кра', 'Тох'], mid: ['ар', 'у', 'ог'], suf: ['-тар', 'ґаш', 'збуг', 'мор', 'дар', 'нак'] },
    steppe: { pre: ['Ак', 'Кара', 'Тен', 'Ял', 'Сар', 'Кий', 'Бат', 'Ордж'], mid: ['ан', 'и', 'ур'], suf: ['стан', 'ган', 'ли', 'тау', 'кент', 'сай'] },
    sea: { pre: ['Корал', 'Хвил', 'Солон', 'Перл', 'Бриз', 'Якор', 'Мар', 'Остр'], mid: ['е', 'и', 'ов'], suf: ['порт', 'гавань', 'мор', 'бухта', 'мис', 'рив'] },
    demon: { pre: ['Мал', 'Гор', 'Баал', 'Азг', 'Ніх', 'Морг', 'Зал', 'Інф'], mid: ['ер', 'о', 'аз', 'ул'], suf: ['гул', 'рот', 'дум', 'фер', 'гор', 'намор', 'тракс'] },
  });

  class MinHeap {
    constructor() { this.a = []; }
    get size() { return this.a.length; }
    push(item, pri) { const a = this.a; a.push([pri, item]); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
    pop() {
      const a = this.a; const top = a[0]; const last = a.pop();
      if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } }
      return top[1];
    }
  }
  const idx = (x, y) => y * W + x;
  const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const isLand = (t) => t >= T.BEACH;

  const CONTINENTS = [
    { key: 'mid', name: 'Серединні Землі', cx: 0.37, cy: 0.54, rx: 0.27, ry: 0.36 },
    { key: 'east', name: 'Сходосвіт', cx: 0.79, cy: 0.64, rx: 0.13, ry: 0.23 },
    { key: 'north', name: 'Крижані Землі', cx: 0.58, cy: 0.12, rx: 0.13, ry: 0.08 },
    { key: 'demon', name: 'Демонія', cx: 0.9, cy: 0.17, rx: 0.075, ry: 0.12 },
  ];

  function genTerrain(seed) {
    const height = new Float32Array(W * H), moist = new Float32Array(W * H), terrain = new Uint8Array(W * H);
    const cont = new Int8Array(W * H).fill(-1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const nx = x / W, ny = y / H; const i = idx(x, y);
      let best = 0, bc = -1;
      CONTINENTS.forEach((c, ci) => {
        const dx = (nx - c.cx) / c.rx, dy = (ny - c.cy) / c.ry;
        const warp = (noise.fbm(x / 30 + ci * 13, y / 30, seed + 71 + ci, 3) - 0.5) * 0.9;
        const d = Math.sqrt(dx * dx + dy * dy) + warp;
        const v = Math.max(0, 1 - d * d);
        if (v > best) { best = v; bc = ci; }
      });
      let h = noise.fbm(x / 34, y / 34, seed, 6) * 0.55;
      const ridge = 1 - Math.abs(noise.fbm(x / 20 + 50, y / 20, seed + 7, 4) * 2 - 1);
      h += ridge * 0.22 + best * 0.62;
      const isl = noise.fbm(x / 9 + 400, y / 9, seed + 99, 3);
      if (best < 0.15 && isl > 0.73) h += (isl - 0.73) * 4.2;
      const ex = Math.min(x, W - 1 - x, y, H - 1 - y);
      if (ex < 6) h -= (6 - ex) * 0.05;
      height[i] = h; moist[i] = noise.fbm(x / 28 + 300, y / 28, seed + 33, 4); cont[i] = best > 0.04 ? bc : -1;
    }
    const sorted = Array.from(height).sort((a, b) => a - b);
    const SEA = sorted[Math.floor(sorted.length * 0.64)];
    const land = sorted.filter((v) => v >= SEA);
    const q = (f) => land[Math.min(land.length - 1, Math.floor(land.length * f))];
    const HILL = q(0.8), MOUNT = q(0.9), PEAK = q(0.975);
    for (let i = 0; i < W * H; i++) {
      const h = height[i], m = moist[i], lat = Math.floor(i / W) / H;
      let t;
      if (h < SEA - 0.07) t = T.DEEP; else if (h < SEA) t = T.SEA; else if (h < SEA + 0.012) t = T.BEACH;
      else if (h > PEAK) t = T.PEAK; else if (h > MOUNT) t = T.MOUNTAIN; else if (h > HILL) t = T.HILLS;
      else if (lat < 0.2 && m < 0.66) t = T.TUNDRA;
      else if (lat > 0.72 && m < 0.47) t = T.DESERT;
      else if (lat > 0.66 && m > 0.6) t = T.JUNGLE;
      else if (m > 0.64 && h < SEA + 0.07) t = T.SWAMP;
      else if (m > 0.52) t = T.FOREST; else t = T.PLAINS;
      if (cont[i] === 3 && t >= T.BEACH && t !== T.PEAK) t = h > MOUNT ? T.MOUNTAIN : T.ASH;
      terrain[i] = t;
    }
    return { height, moist, terrain, cont, SEA, HILL, MOUNT, PEAK };
  }

  function components(terrain) {
    const comp = new Int32Array(W * H).fill(-1); const sizes = []; let c = 0;
    for (let i = 0; i < W * H; i++) {
      if (comp[i] !== -1 || !isLand(terrain[i])) continue;
      const st = [i]; comp[i] = c; let n = 0;
      while (st.length) { const k = st.pop(); n++; const x = k % W, y = (k / W) | 0; for (const [dx, dy] of DIRS4) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = idx(xx, yy); if (comp[j] === -1 && isLand(terrain[j])) { comp[j] = c; st.push(j); } } }
      sizes.push(n); c++;
    }
    return { comp, sizes };
  }

  function genRivers(rng, terrain, height) {
    const river = new Uint8Array(W * H); const src = [];
    for (let i = 0; i < W * H; i++) if (terrain[i] === T.MOUNTAIN || terrain[i] === T.HILLS) src.push(i);
    rng.shuffle(src); let made = 0;
    for (const s of src) {
      if (made >= 26) break;
      let k = s, steps = 0; const path = []; const vis = new Set();
      while (steps++ < 500) {
        path.push(k); vis.add(k); if (!isLand(terrain[k])) break;
        const x = k % W, y = (k / W) | 0; let bj = -1, bh = height[k] + 0.004;
        for (const [dx, dy] of DIRS4) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = idx(xx, yy); if (vis.has(j)) continue; const hj = height[j] + rng.float(0, 0.003); if (hj < bh) { bh = hj; bj = j; } }
        if (bj < 0) { path.length = 0; break; }
        if (river[bj]) { path.push(bj); break; }
        k = bj;
      }
      if (path.length > 16) { for (const p of path) if (isLand(terrain[p])) river[p] = 1; made++; }
    }
    return river;
  }
  const cellCost = (terrain, river, i) => TERRAIN_INFO[terrain[i]].cost + (river[i] ? 3 : 0);

  const AS = { g: new Float32Array(W * H), came: new Int32Array(W * H), stamp: new Uint32Array(W * H), gen: 1 };
  function astar(terrain, river, roadMask, from, to, opts = {}) {
    const gen = ++AS.gen; const g = AS.g, came = AS.came, stamp = AS.stamp;
    const heap = new MinHeap(); const tx = to % W, ty = (to / W) | 0;
    g[from] = 0; came[from] = -1; stamp[from] = gen; heap.push(from, 0);
    const water = !!opts.water; let found = from === to, guard = 0;
    while (heap.size && guard++ < 80000) {
      const k = heap.pop(); if (k === to) { found = true; break; }
      const x = k % W, y = (k / W) | 0;
      for (const [dx, dy] of DIRS8) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = idx(xx, yy); const tj = terrain[j]; let c;
        if (water) { if (isLand(tj) && j !== to) continue; c = tj === T.DEEP ? 1 : 1.3; }
        else { if (!isLand(tj)) continue; if (opts.noAsh && tj === T.ASH && j !== to) continue; c = roadMask[j] ? 0.35 : cellCost(terrain, river, j); }
        const ng = g[k] + c * (dx && dy ? 1.414 : 1);
        if (stamp[j] !== gen || ng < g[j]) { stamp[j] = gen; g[j] = ng; came[j] = k; heap.push(j, ng + Math.hypot(xx - tx, yy - ty) * (water ? 1 : 0.6)); }
      }
    }
    if (!found) return null;
    const path = [to]; let k = to; while (k !== from) { k = came[k]; if (k < 0) return null; path.push(k); }
    return { path: path.reverse(), cost: g[to] };
  }

  function partition(rng, nodes, k, adj, pos) {
    const set = new Set(nodes); const seeds = [rng.pick(nodes)];
    while (seeds.length < k && seeds.length < nodes.length) {
      let best = null, bd = -1;
      for (const n of nodes) { if (seeds.includes(n)) continue; let md = Infinity; for (const s of seeds) { const dx = pos[n].x - pos[s].x, dy = pos[n].y - pos[s].y; md = Math.min(md, dx * dx + dy * dy); } md *= 0.85 + rng.next() * 0.3; if (md > bd) { bd = md; best = n; } }
      seeds.push(best);
    }
    const group = new Map(), dist = new Map(), heap = new MinHeap();
    seeds.forEach((s, gi) => { dist.set(s, 0); heap.push([s, gi], 0); });
    while (heap.size) {
      const [n, gi] = heap.pop(); if (group.has(n)) continue; group.set(n, gi);
      for (const m of adj[n]) { if (!set.has(m) || group.has(m)) continue; const nd = dist.get(n) + Math.hypot(pos[n].x - pos[m].x, pos[n].y - pos[m].y); if (!dist.has(m) || nd < dist.get(m)) { dist.set(m, nd); heap.push([m, gi], nd); } }
    }
    for (const n of nodes) if (!group.has(n)) { let bg = 0, bd = Infinity; seeds.forEach((s, gi) => { const d = Math.hypot(pos[n].x - pos[s].x, pos[n].y - pos[s].y); if (d < bd) { bd = d; bg = gi; } }); group.set(n, bg); }
    const out = seeds.map(() => []); for (const [n, g] of group) out[g].push(n);
    return { groups: out, seeds };
  }

  const SETTLEMENT = {
    capital: { name: 'Столиця', icon: '🏰', services: ['guild', 'tavern', 'shop', 'smith', 'alchemist', 'trainer', 'temple', 'arena', 'court', 'market', 'stable', 'estate', 'magic'] },
    city: { name: 'Місто', icon: '🏯', services: ['guild', 'tavern', 'shop', 'smith', 'alchemist', 'trainer', 'temple', 'market', 'stable', 'estate', 'court', 'magic'] },
    fortress: { name: 'Фортеця', icon: '🏛️', services: ['tavern', 'shop', 'smith', 'trainer', 'stable'] },
    town: { name: 'Містечко', icon: '🏘️', services: ['guild', 'tavern', 'shop', 'smith', 'alchemist', 'temple', 'estate', 'stable'] },
    village: { name: 'Село', icon: '🏡', services: ['tavern', 'shop', 'elder'] },
    port: { name: 'Порт', icon: '⚓', services: ['tavern', 'shop', 'market', 'alchemist', 'harbor', 'estate'] },
    mine: { name: 'Шахтарське селище', icon: '⛏️', services: ['tavern', 'shop', 'smith', 'elder'] },
    hellfort: { name: 'Пекельна твердиня', icon: '🏯', services: [] },
  };

  const REALM_COLORS = ['#e8b931', '#c0392b', '#2e86de', '#27ae60', '#8e44ad', '#e67e22', '#16a085', '#d35400', '#2980b9', '#c2185b', '#7cb342', '#6d4c41', '#00acc1', '#5e35b1', '#f06292', '#9e9d24', '#546e7a', '#ff8a65', '#26a69a', '#ab47bc'];

  const CULT_REALM = {
    imperial: { title: 'Імперія', ruler: 'Імператор', rulerF: 'Імператриця', race: 'люди', motto: 'Порядок понад усе. Особливо понад обід.' },
    north: { title: 'Королівство', ruler: 'Ярл-король', rulerF: 'Ярл-королева', race: 'нордлінги', motto: 'Холодно, але ми не скаржимось. Ну, трохи.' },
    elven: { title: 'Ельфійське королівство', ruler: 'Король', rulerF: 'Королева', race: 'ельфи', motto: 'Ми старші за ваші проблеми.' },
    desert: { title: 'Султанат', ruler: 'Султан', rulerF: 'Султана', race: 'люди пісків', motto: 'Пісок усюди. Навіть там, де не треба.' },
    eastern: { title: 'Сьоґунат', ruler: 'Сьоґун', rulerF: 'Сьоґун', race: 'люди сходу', motto: 'Честь, чай і раптові драматичні паузи.' },
    slavic: { title: 'Королівство', ruler: 'Король', rulerF: 'Королева', race: 'люди', motto: 'Борщ — це стратегічний ресурс.' },
    dwarven: { title: 'Підгірне королівство', ruler: 'Тан-король', rulerF: 'Тан-королева', race: 'гноми', motto: 'Копай глибше. Завжди глибше.' },
    fey: { title: 'Королівство фей', ruler: 'Король фей', rulerF: 'Королева фей', race: 'феї та ельфи', motto: 'Усе блищить. Навіть податки.' },
    beast: { title: 'Королівство звіролюдів', ruler: 'Вождь-король', rulerF: 'Вождиня-королева', race: 'звіролюди', motto: 'Мур. Тобто — слава!' },
    orc: { title: 'Орча держава', ruler: 'Верховний вождь', rulerF: 'Верховна вождиня', race: 'орки', motto: 'Бити — це теж дипломатія.' },
    steppe: { title: 'Ханат', ruler: 'Хан', rulerF: 'Ханша', race: 'степовики', motto: 'Кінь — найкращий друг. Другий — теж кінь.' },
    sea: { title: 'Морська республіка', ruler: 'Дож', rulerF: 'Догаресса', race: 'мореплавці', motto: 'Хто володіє морем — той мокрий.' },
    demon: { title: 'Темне царство', ruler: 'Володар Демонів', rulerF: 'Володарка Демонів', race: 'демони', motto: 'Темрява. Вогонь. Знижки на душі.' },
  };

  const LANDMARKS = [
    { key: 'deathforest', name: 'Ліс Смерті', icon: '🌲', terr: [T.FOREST, T.JUNGLE], color: [40, 10, 60], monsters: ['zombie', 'ghost', 'wolf', 'spider', 'treant'], lvl: 8, dungeon: 'spider', desc: 'Дерева тут шепочуть. Переважно образи.' },
    { key: 'boneplains', name: 'Поля Скелетів', icon: '☠️', terr: [T.PLAINS, T.DESERT], color: [215, 215, 195], monsters: ['skeleton', 'skeleton', 'ghost', 'zombie'], lvl: 6, dungeon: 'crypt', desc: 'Тут колись була велика битва. Учасники досі не розійшлися.' },
    { key: 'despair', name: 'Болото Відчаю', icon: '🐸', terr: [T.SWAMP, T.FOREST], color: [60, 90, 30], monsters: ['slime', 'naga', 'zombie', 'troll'], lvl: 7, dungeon: 'slime', desc: 'Пахне так, що відчай — найменша з проблем.' },
    { key: 'crystal', name: 'Кришталеві Пагорби', icon: '💎', terr: [T.HILLS, T.MOUNTAIN], color: [150, 220, 255], monsters: ['golem', 'golem', 'harpy', 'spider'], lvl: 11, dungeon: 'crystal', desc: 'Усе сяє. Голови теж болять від сяйва.' },
    { key: 'bonedesert', name: 'Пустеля Тисячі Кісток', icon: '🦴', terr: [T.DESERT], color: [240, 200, 130], monsters: ['scorpion', 'skeleton', 'naga', 'mummy'], lvl: 12, dungeon: 'ruins', desc: 'Тисяча кісток. Хтось рахував. Йому стало погано.' },
    { key: 'dragonridge', name: 'Драконячий Хребет', icon: '🐉', terr: [T.MOUNTAIN, T.HILLS, T.PEAK], color: [180, 60, 30], monsters: ['wyvern', 'harpy', 'golem', 'drake'], lvl: 18, dungeon: 'dragon', desc: 'Дракони тут гніздяться. І дуже не люблять туристів.' },
    { key: 'feygrove', name: 'Зачарований Гай Фей', icon: '🧚', terr: [T.FOREST, T.JUNGLE, T.PLAINS], color: [255, 120, 220], monsters: ['pixie', 'treant', 'rabbit', 'pixie'], lvl: 9, dungeon: 'fey', desc: 'Феї милі. До першого жарту про їхній зріст.' },
    { key: 'frost', name: 'Вічна Мерзлота', icon: '❄️', terr: [T.TUNDRA, T.HILLS], color: [220, 240, 255], monsters: ['yeti', 'wolf', 'ghost', 'icegolem'], lvl: 14, dungeon: 'ice', desc: 'Тут навіть зілля замерзає. І хоробрість.' },
    { key: 'volcano', name: 'Вулкан Пекельний Зуб', icon: '🌋', terr: [T.MOUNTAIN, T.HILLS], color: [255, 80, 20], monsters: ['imp', 'golem', 'drake', 'salamander'], lvl: 20, dungeon: 'volcano', desc: 'Гаряче. Дуже. Не бери шоколадку.' },
    { key: 'graveyard', name: 'Цвинтар Героїв-Невдах', icon: '🪦', terr: [T.PLAINS, T.HILLS], color: [120, 120, 140], monsters: ['ghost', 'skeleton', 'zombie'], lvl: 4, dungeon: 'crypt', desc: 'Тут лежать ісекайники, які не дочитали туторіал.' },
    { key: 'banditwoods', name: 'Розбійницькі Хащі', icon: '🗡️', terr: [T.FOREST, T.HILLS], color: [90, 60, 40], monsters: ['bandit', 'bandit', 'wolf', 'orc'], lvl: 5, dungeon: 'bandit', desc: 'Кругом розбійники. Романтика.' },
  ];

  const DTYPES = {
    goblin: { name: 'Гоблінська нора', icon: '👺', terr: [T.FOREST, T.HILLS, T.PLAINS] },
    crypt: { name: 'Склеп', icon: '💀', terr: [T.PLAINS, T.SWAMP, T.TUNDRA] },
    slime: { name: 'Слизова печера', icon: '🟢', terr: [T.SWAMP, T.FOREST, T.JUNGLE] },
    ruins: { name: 'Руїни храму', icon: '🏚️', terr: [T.DESERT, T.JUNGLE, T.PLAINS] },
    mine: { name: 'Покинута шахта', icon: '🕳️', terr: [T.HILLS, T.MOUNTAIN, T.TUNDRA] },
    tower: { name: 'Вежа мага-відлюдника', icon: '🗼', terr: [T.HILLS, T.FOREST, T.BEACH] },
    dragon: { name: 'Лігво дракона', icon: '🐉', terr: [T.MOUNTAIN, T.HILLS] },
    beast: { name: 'Звірине лігво', icon: '🐺', terr: [T.FOREST, T.TUNDRA, T.JUNGLE] },
    spider: { name: 'Павучі нори', icon: '🕷️', terr: [T.FOREST, T.JUNGLE] },
    bandit: { name: 'Розбійницький табір', icon: '⛺', terr: [T.FOREST, T.HILLS, T.PLAINS] },
    fey: { name: 'Лабіринт фей', icon: '🍄', terr: [T.FOREST, T.JUNGLE] },
    crystal: { name: 'Кришталеві печери', icon: '💎', terr: [T.HILLS, T.MOUNTAIN] },
    ice: { name: 'Крижана гробниця', icon: '🧊', terr: [T.TUNDRA, T.MOUNTAIN] },
    volcano: { name: 'Жерло вулкана', icon: '🌋', terr: [T.MOUNTAIN, T.HILLS] },
    pirate: { name: 'Піратська печера', icon: '🏴‍☠️', terr: [T.BEACH, T.PLAINS, T.JUNGLE, T.FOREST] },
    sunken: { name: 'Затонулий храм', icon: '🔱', terr: [T.BEACH, T.SWAMP] },
    hellgate: { name: 'Пекельна брама', icon: '🔥', terr: [T.ASH] },
  };

  function generateWorld(seed) {
    const t0 = Date.now();
    const rng = new RNG(seed);
    const TG = genTerrain(seed);
    const { height, terrain, cont } = TG;
    const { comp, sizes } = components(terrain);
    const river = genRivers(rng, terrain, height);

    const cand = [];
    for (let i = 0; i < W * H; i++) { const t = terrain[i]; if (!isLand(t) || t === T.PEAK || t === T.MOUNTAIN || sizes[comp[i]] < 40) continue; cand.push(i); }
    rng.shuffle(cand);
    const minD = 8; const baronyCells = []; const grid = new Map();
    for (const c of cand) {
      const x = c % W, y = (c / W) | 0, gx = (x / 9) | 0, gy = (y / 9) | 0; let ok = true;
      for (let ox = -1; ox <= 1 && ok; ox++) for (let oy = -1; oy <= 1 && ok; oy++) { const L = grid.get((gx + ox) + ',' + (gy + oy)); if (!L) continue; for (const o of L) if (Math.hypot(o % W - x, ((o / W) | 0) - y) < minD) { ok = false; break; } }
      if (!ok) continue;
      baronyCells.push(c); const k = gx + ',' + gy; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(c);
    }
    const cellBarony = new Int16Array(W * H).fill(-1); const dist = new Float32Array(W * H).fill(Infinity); const heap = new MinHeap();
    baronyCells.forEach((c, bi) => { dist[c] = 0; cellBarony[c] = bi; heap.push(c, 0); });
    while (heap.size) {
      const k = heap.pop(); const x = k % W, y = (k / W) | 0;
      for (const [dx, dy] of DIRS4) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = idx(xx, yy); if (!isLand(terrain[j]) || comp[j] !== comp[k]) continue; const nd = dist[k] + Math.min(cellCost(terrain, river, j), 9); if (nd < dist[j] && nd < 28) { dist[j] = nd; cellBarony[j] = cellBarony[k]; heap.push(j, nd); } }
    }
    const nB = baronyCells.length; const pos = baronyCells.map((c) => ({ x: c % W, y: (c / W) | 0 }));
    const adjS = Array.from({ length: nB }, () => new Set()); const area = new Array(nB).fill(0);
    const tcount = Array.from({ length: nB }, () => ({})); const coastal = new Array(nB).fill(false); const hasRiver = new Array(nB).fill(false);
    for (let i = 0; i < W * H; i++) {
      const b = cellBarony[i]; if (b < 0) continue;
      area[b]++; tcount[b][terrain[i]] = (tcount[b][terrain[i]] || 0) + 1; if (river[i]) hasRiver[b] = true;
      const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of DIRS4) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = idx(xx, yy); const bj = cellBarony[j]; if (bj >= 0 && bj !== b) adjS[b].add(bj); if (!isLand(terrain[j])) coastal[b] = true; }
    }
    const adj = adjS.map((s) => [...s]);
    const landOf = baronyCells.map((c) => comp[c]);
    const contOf = baronyCells.map((c) => cont[c]);

    const byLand = new Map();
    for (let b = 0; b < nB; b++) { if (!byLand.has(landOf[b])) byLand.set(landOf[b], []); byLand.get(landOf[b]).push(b); }
    const lands = [...byLand.entries()].map(([lid, bs]) => {
      const cnt = {}; for (const b of bs) cnt[contOf[b]] = (cnt[contOf[b]] || 0) + 1;
      return { lid, bs, cont: +Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0] };
    }).sort((a, b) => b.bs.length - a.bs.length);
    const realmGroups = []; const used = new Set();
    const contLand = (ck) => lands.filter((L) => L.cont === ck && !used.has(L.lid)).sort((a, b) => b.bs.length - a.bs.length)[0];
    const demonL = contLand(3); if (demonL) { used.add(demonL.lid); realmGroups.push({ bs: demonL.bs, kind: 'demon', culture: 'demon' }); }
    const mainL = contLand(0) || lands.find((L) => !used.has(L.lid)); used.add(mainL.lid);
    const mainCount = Math.min(13, Math.max(4, Math.floor(mainL.bs.length / 9)));
    let mp = null;
    for (let a = 0; a < 30; a++) { const p = partition(rng, mainL.bs, mainCount, adj, pos); const ok = Math.min(...p.groups.map((g) => g.length)) >= mainL.bs.length / mainCount * 0.45; if (!mp || ok) mp = p; if (ok) break; }
    let mcx = 0, mcy = 0; for (const b of mainL.bs) { mcx += pos[b].x; mcy += pos[b].y; } mcx /= mainL.bs.length; mcy /= mainL.bs.length;
    const order = mp.groups.map((g, gi) => { let sx = 0, sy = 0; for (const b of g) { sx += pos[b].x; sy += pos[b].y; } return { gi, d: Math.hypot(sx / g.length - mcx, sy / g.length - mcy) }; }).sort((a, b) => a.d - b.d);
    const indepSet = new Set(order.slice(-(mainCount >= 8 ? 2 : 1)).map((o) => o.gi));
    const vassalCultures = rng.shuffle(['slavic', 'elven', 'dwarven', 'north', 'beast', 'fey', 'steppe', 'orc', 'sea', 'eastern', 'slavic', 'elven']);
    if (!vassalCultures.slice(0, 3).includes('slavic')) vassalCultures.unshift('slavic');
    const indepCultures = rng.shuffle(['orc', 'steppe', 'desert', 'north']);
    let vc = 0, ic = 0;
    order.forEach((o, rank) => {
      const g = mp.groups[o.gi];
      if (rank === 0) realmGroups.push({ bs: g, kind: 'empire', culture: 'imperial' });
      else if (indepSet.has(o.gi)) realmGroups.push({ bs: g, kind: 'kingdom', culture: indepCultures[ic++ % indepCultures.length] });
      else realmGroups.push({ bs: g, kind: 'vassal', culture: vassalCultures[vc++ % vassalCultures.length] });
    });
    const eastL = contLand(1);
    if (eastL) { used.add(eastL.lid); const k = Math.max(1, Math.min(3, Math.floor(eastL.bs.length / 10))); const ep = partition(rng, eastL.bs, k, adj, pos); const cs = rng.shuffle(['eastern', 'desert', 'sea']); ep.groups.forEach((g, i) => realmGroups.push({ bs: g, kind: 'kingdom', culture: cs[i % 3] })); }
    const northL = contLand(2);
    if (northL) { used.add(northL.lid); realmGroups.push({ bs: northL.bs, kind: 'kingdom', culture: 'north' }); }
    const realmOfB = new Array(nB).fill(-1);
    realmGroups.forEach((rg, ri) => rg.bs.forEach((b) => { realmOfB[b] = ri; }));
    for (const L of lands) {
      if (used.has(L.lid)) continue; used.add(L.lid);
      if (L.bs.length >= 12) { const ri = realmGroups.length; realmGroups.push({ bs: L.bs, kind: 'kingdom', culture: 'sea' }); L.bs.forEach((b) => { realmOfB[b] = ri; }); continue; }
      const c0 = L.bs[0]; let best = -1, bd = Infinity;
      for (let b = 0; b < nB; b++) if (realmOfB[b] >= 0 && realmGroups[realmOfB[b]].kind !== 'demon') { const d = Math.hypot(pos[b].x - pos[c0].x, pos[b].y - pos[c0].y); if (d < bd) { bd = d; best = b; } }
      const ri = realmOfB[best]; for (const b of L.bs) { realmGroups[ri].bs.push(b); realmOfB[b] = ri; }
    }

    const realms = [], duchies = [], counties = [], baronies = [];
    for (let b = 0; b < nB; b++) baronies.push({ id: b, cell: baronyCells[b], x: pos[b].x, y: pos[b].y, adj: adj[b], area: area[b], coastal: coastal[b], river: hasRiver[b], terrain: tcount[b], land: landOf[b], cont: contOf[b], county: -1, duchy: -1, realm: -1, owner: -1, occ: -1, type: 'village', name: '', dev: 1, fort: 1 });
    const usedNames = new Set();
    const uname = (culture) => { let n = names.makeName(rng, culture), t = 0; while (usedNames.has(n) && t++ < 30) n = names.makeName(rng, culture); if (usedNames.has(n)) n += ' ' + ['Нижній', 'Верхній', 'Старий', 'Новий', 'Малий'][usedNames.size % 5]; usedNames.add(n); return n; };
    const empireId = realmGroups.findIndex((g) => g.kind === 'empire');
    realmGroups.forEach((rg, ri) => {
      const cr = CULT_REALM[rg.culture];
      let sx = 0, sy = 0; for (const b of rg.bs) { sx += pos[b].x; sy += pos[b].y; } sx /= rg.bs.length; sy /= rg.bs.length;
      const mg = rg.bs.filter((b) => landOf[b] === landOf[rg.bs[0]]);
      const capital = (mg.length ? mg : rg.bs).slice().sort((a, b) => Math.hypot(pos[a].x - sx, pos[a].y - sy) - Math.hypot(pos[b].x - sx, pos[b].y - sy))[0];
      const rname = uname(rg.culture);
      const title = cr.title;
      realms.push({
        id: ri, name: rname, culture: rg.culture, title, fullName: `${title} ${rname}`, rulerTitle: cr.ruler, rulerTitleF: cr.rulerF, race: cr.race, motto: cr.motto,
        color: rg.kind === 'demon' ? '#5a0f14' : REALM_COLORS[ri % REALM_COLORS.length], capital, isEmpire: rg.kind === 'empire', isDemon: rg.kind === 'demon',
        liege: rg.kind === 'vassal' ? empireId : -1, kind: rg.kind, duchies: [], continent: contOf[capital],
      });
      const dp = partition(rng, rg.bs, Math.max(1, Math.round(rg.bs.length / 8)), adj, pos);
      dp.groups.forEach((dg, di) => {
        if (!dg.length) return;
        const did = duchies.length; const seat = dg.includes(capital) ? capital : dp.seeds[di];
        duchies.push({ id: did, name: uname(rg.culture), realm: ri, seat, counties: [], baronies: dg.slice() });
        realms[ri].duchies.push(did);
        const cp = partition(rng, dg, Math.max(1, Math.round(dg.length / 3)), adj, pos);
        cp.groups.forEach((cg, ci) => {
          if (!cg.length) return;
          const cid = counties.length; const cseat = cg.includes(seat) ? seat : cp.seeds[ci];
          counties.push({ id: cid, name: uname(rg.culture), duchy: did, realm: ri, seat: cseat, baronies: cg.slice() });
          duchies[did].counties.push(cid);
          for (const b of cg) { const B = baronies[b]; B.county = cid; B.duchy = did; B.realm = ri; B.owner = ri; B.name = uname(rg.culture); }
        });
      });
    });
    if (empireId >= 0) realms[empireId].vassals = realms.filter((r) => r.liege === empireId).map((r) => r.id);

    for (const B of baronies) {
      const R = realms[B.realm], C = counties[B.county], Dd = duchies[B.duchy];
      const hills = (B.terrain[T.HILLS] || 0) + (B.terrain[T.MOUNTAIN] || 0);
      const border = B.adj.some((n) => baronies[n].realm !== B.realm);
      if (R.isDemon) { B.type = R.capital === B.id ? 'capital' : 'hellfort'; B.dev = rng.int(3, 6); B.fort = R.capital === B.id ? 6 : 4; }
      else if (R.capital === B.id) { B.type = 'capital'; B.dev = rng.int(8, 10); B.fort = R.isEmpire ? 6 : 5; }
      else if (Dd.seat === B.id) { B.type = 'city'; B.dev = rng.int(5, 8); B.fort = 4; }
      else if (C.seat === B.id) { B.type = border || rng.chance(0.35) ? 'fortress' : 'town'; B.dev = rng.int(3, 6); B.fort = B.type === 'fortress' ? 5 : 3; }
      else if (border && rng.chance(0.25)) { B.type = 'fortress'; B.dev = rng.int(2, 4); B.fort = 4; }
      else if (B.coastal && rng.chance(0.45)) { B.type = 'port'; B.dev = rng.int(3, 5); B.fort = 2; }
      else if (hills > B.area * 0.25 && rng.chance(0.6)) { B.type = 'mine'; B.dev = rng.int(2, 4); B.fort = 1; }
      else { B.type = 'village'; B.dev = rng.int(1, 3); B.fort = 1; }
      B.resources = {
        herbs: ((B.terrain[T.FOREST] || 0) + (B.terrain[T.PLAINS] || 0) * 0.5 + (B.terrain[T.SWAMP] || 0) + (B.terrain[T.JUNGLE] || 0)) / B.area,
        ore: (hills * 1.5 + (B.terrain[T.TUNDRA] || 0) * 0.3 + (B.terrain[T.ASH] || 0)) / B.area,
        fish: B.coastal ? 1 : B.river ? 0.7 : 0.15,
      };
    }
    for (const [, bs] of byLand) {
      if (bs.some((b) => baronies[b].coastal && ['port', 'capital', 'city', 'hellfort'].includes(baronies[b].type))) continue;
      const c = bs.filter((b) => baronies[b].coastal && baronies[b].type !== 'capital').sort((a, b) => baronies[a].dev - baronies[b].dev)[0];
      if (c !== undefined) { baronies[c].type = realms[baronies[c].realm].isDemon ? 'hellfort' : 'port'; baronies[c].dev = Math.max(baronies[c].dev, 3); }
    }
    for (const B of baronies) B.isPort = B.coastal && ['port', 'capital', 'city', 'hellfort'].includes(B.type);

    // ---- landmarks ----
    const cellLandmark = new Int8Array(W * H).fill(-1); const landmarks = [];
    const mainLids = new Set([mainL.lid, eastL && eastL.lid, northL && northL.lid].filter((x) => x !== undefined && x !== null));
    for (const LM of rng.shuffle(LANDMARKS.slice())) {
      const cs = []; for (let i = 0; i < W * H; i += 3) if (LM.terr.includes(terrain[i]) && mainLids.has(comp[i]) && cellLandmark[i] < 0) cs.push(i);
      rng.shuffle(cs);
      const c = cs.find((i) => landmarks.every((l) => Math.hypot(l.x - i % W, l.y - ((i / W) | 0)) > 26));
      if (c === undefined) continue;
      const x = c % W, y = (c / W) | 0, r = rng.int(7, 11);
      const L = { ...LM, terr: undefined, id: landmarks.length, x, y, r }; landmarks.push(L);
      for (let yy = Math.max(0, y - r - 3); yy < Math.min(H, y + r + 3); yy++) for (let xx = Math.max(0, x - r - 3); xx < Math.min(W, x + r + 3); xx++) {
        const i = idx(xx, yy); if (!isLand(terrain[i])) continue;
        if (Math.hypot(xx - x, yy - y) + noise.fbm(xx / 5, yy / 5, seed + L.id, 2) * 5 - 2.5 < r) cellLandmark[i] = L.id;
      }
    }

    // ---- roads ----
    const roadMask = new Uint8Array(W * H); const roads = []; const edgeSet = new Set();
    const ek = (a, b) => (a < b ? a + '-' + b : b + '-' + a);
    const tierOf = (b) => ({ capital: 4, city: 3, town: 2, fortress: 2, port: 2 }[baronies[b].type] || 1);
    const edges = [];
    for (const [, bs] of byLand) {
      const inT = new Set([bs[0]]); const eh = new MinHeap();
      const pushE = (b) => { for (const m of adj[b]) if (!inT.has(m)) eh.push([b, m], Math.hypot(pos[b].x - pos[m].x, pos[b].y - pos[m].y)); };
      pushE(bs[0]);
      while (eh.size) { const [a, b] = eh.pop(); if (inT.has(b)) continue; inT.add(b); edges.push([a, b]); pushE(b); }
    }
    for (let a = 0; a < nB; a++) for (const b of adj[a]) if (a < b && Math.hypot(pos[a].x - pos[b].x, pos[a].y - pos[b].y) < 12 && rng.chance(0.4)) edges.push([a, b]);
    edges.sort((e1, e2) => (tierOf(e2[0]) + tierOf(e2[1])) - (tierOf(e1[0]) + tierOf(e1[1])));
    for (const [a, b] of edges) {
      const k = ek(a, b); if (edgeSet.has(k)) continue;
      const res = astar(terrain, river, roadMask, baronyCells[a], baronyCells[b], {});
      if (!res) continue;
      edgeSet.add(k);
      const major = tierOf(a) >= 2 && tierOf(b) >= 2;
      for (const c of res.path) roadMask[c] = Math.max(roadMask[c], major ? 2 : 1);
      roads.push({ a, b, path: res.path, cost: travelCost(terrain, river, res.path, roadMask), major });
    }
    for (const [, bs] of byLand) {
      for (let guard = 0; guard < 40; guard++) {
        const nb = new Map(bs.map((b) => [b, []])); for (const r of roads) if (nb.has(r.a) && nb.has(r.b)) { nb.get(r.a).push(r.b); nb.get(r.b).push(r.a); }
        const seen = new Set([bs[0]]); const st = [bs[0]]; while (st.length) { const u = st.pop(); for (const v of nb.get(u)) if (!seen.has(v)) { seen.add(v); st.push(v); } }
        const lone = bs.find((b) => !seen.has(b)); if (lone === undefined) break;
        let best = -1, bd = Infinity; for (const b of seen) { const d = Math.hypot(pos[b].x - pos[lone].x, pos[b].y - pos[lone].y); if (d < bd) { bd = d; best = b; } }
        const res = astar(terrain, river, roadMask, baronyCells[lone], baronyCells[best], {});
        if (!res) break;
        for (const c of res.path) roadMask[c] = Math.max(roadMask[c], 1);
        roads.push({ a: lone, b: best, path: res.path, cost: travelCost(terrain, river, res.path, roadMask), major: false });
      }
    }

    // ---- sea routes ----
    const ports = baronies.filter((B) => B.isPort);
    const waterNear = (cell) => { const x = cell % W, y = (cell / W) | 0; let best = -1, bd = Infinity; for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = idx(xx, yy); if (!isLand(terrain[j])) { const d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = j; } } } return best; };
    const seaRoutes = []; const seaSet = new Set();
    const addSea = (A, B) => {
      const k = ek(A.id, B.id); if (seaSet.has(k)) return true;
      const wa = waterNear(A.cell), wb = waterNear(B.cell); if (wa < 0 || wb < 0) return false;
      const res = astar(terrain, river, roadMask, wa, wb, { water: true }); if (!res) return false;
      seaSet.add(k); seaRoutes.push({ a: A.id, b: B.id, path: [A.cell, ...res.path, B.cell], cost: res.path.length * 0.3, sea: true });
      return true;
    };
    const landIds = [...byLand.keys()]; const connected = new Set([mainL.lid]);
    for (let guard = 0; connected.size < landIds.length && guard < 200; guard++) {
      let best = null, bd = Infinity;
      for (const A of ports) { if (!connected.has(A.land)) continue; for (const B of ports) { if (connected.has(B.land)) continue; const d = Math.hypot(A.x - B.x, A.y - B.y); if (d < bd) { bd = d; best = [A, B]; } } }
      if (!best) break;
      addSea(best[0], best[1]); connected.add(best[1].land);
    }
    for (const A of ports) {
      const others = ports.filter((B) => B.land !== A.land).sort((p, q) => Math.hypot(p.x - A.x, p.y - A.y) - Math.hypot(q.x - A.x, q.y - A.y));
      if (others[0] && Math.hypot(others[0].x - A.x, others[0].y - A.y) < 70 && rng.chance(0.6)) addSea(A, others[0]);
    }
    for (const A of ports) for (const B of ports) if (A.id < B.id && A.land === B.land && Math.hypot(A.x - B.x, A.y - B.y) > 45 && Math.hypot(A.x - B.x, A.y - B.y) < 80 && rng.chance(0.08)) addSea(A, B);

    // ---- dungeons ----
    const dungeons = [];
    const placeDungeon = (type, cell, extra = {}) => { const dt = DTYPES[type]; dungeons.push({ id: dungeons.length, type, icon: dt.icon, baseName: dt.name, cell, x: cell % W, y: (cell / W) | 0, barony: cellBarony[cell], tier: 1, final: false, relic: false, ...extra }); };
    const freeCell = (i, minDist) => !roadMask[i] && dungeons.every((d) => Math.hypot(d.x - i % W, d.y - ((i / W) | 0)) > minDist) && (cellBarony[i] < 0 || Math.hypot(baronies[cellBarony[i]].x - i % W, baronies[cellBarony[i]].y - ((i / W) | 0)) > 3);
    for (const L of landmarks) {
      const cs = []; for (let i = 0; i < W * H; i++) if (cellLandmark[i] === L.id && terrain[i] !== T.PEAK) cs.push(i);
      rng.shuffle(cs); const c = cs.find((i) => freeCell(i, 6)); if (c !== undefined) placeDungeon(L.dungeon, c, { landmark: L.id });
    }
    const demonRealm = realms.find((r) => r.isDemon);
    if (demonL && demonRealm) {
      const cs = []; for (let i = 0; i < W * H; i++) if (comp[i] === demonL.lid && terrain[i] === T.ASH) cs.push(i);
      const dcap = baronyCells[demonRealm.capital];
      cs.sort((a, b) => Math.hypot(a % W - dcap % W, ((a / W) | 0) - ((dcap / W) | 0)) - Math.hypot(b % W - dcap % W, ((b / W) | 0) - ((dcap / W) | 0)));
      const fc = cs.find((i) => freeCell(i, 2) && Math.hypot(i % W - dcap % W, ((i / W) | 0) - ((dcap / W) | 0)) > 3);
      if (fc !== undefined) placeDungeon('hellgate', fc, { final: true, baseName: 'Цитадель Володаря Демонів', icon: '🌋' });
      rng.shuffle(cs); let n = 0; for (const c of cs) { if (n >= 3) break; if (freeCell(c, 10)) { placeDungeon('hellgate', c); n++; } }
    }
    const gcand = []; for (let i = 0; i < W * H; i++) if (isLand(terrain[i]) && terrain[i] !== T.PEAK && terrain[i] !== T.ASH && sizes[comp[i]] >= 6) gcand.push(i);
    rng.shuffle(gcand);
    for (const c of gcand) {
      if (dungeons.length >= 58) break;
      if (!freeCell(c, 12)) continue;
      const t = terrain[c]; const small = sizes[comp[c]] < 40;
      const opts = Object.entries(DTYPES).filter(([k, d]) => k !== 'hellgate' && d.terr.includes(t) && (small ? ['pirate', 'sunken', 'tower', 'ruins'].includes(k) : k !== 'pirate' || rng.chance(0.3)));
      if (!opts.length) continue;
      placeDungeon(rng.pick(opts)[0], c, small ? { island: true } : {});
    }

    // ---- start & danger ----
    const vassals = realms.filter((r) => r.kind === 'vassal');
    const startRealm = (vassals.find((r) => r.culture === 'slavic') || vassals[0] || realms.find((r) => !r.isDemon)).id;
    const sc = baronies.filter((B) => B.owner === startRealm && B.type === 'village');
    const startB = (sc.length ? rng.pick(sc) : baronies.find((B) => B.owner === startRealm)).id;
    const S0 = baronies[startB];
    let maxD = 1; for (const B of baronies) { B.distStart = Math.hypot(B.x - S0.x, B.y - S0.y) * (B.land === S0.land ? 1 : 1.35); if (!realms[B.realm].isDemon) maxD = Math.max(maxD, B.distStart); }
    for (const B of baronies) {
      let lvl = 1 + Math.floor(Math.min(1, B.distStart / maxD) * 26);
      if (B.type === 'capital' || B.type === 'city') lvl = Math.max(1, lvl - 2);
      const lm = cellLandmark[B.cell] >= 0 ? landmarks[cellLandmark[B.cell]] : null; if (lm) lvl = Math.max(lvl, lm.lvl);
      if (realms[B.realm].isDemon) lvl = 30 + rng.int(0, 5);
      B.danger = lvl;
    }
    for (const Dg of dungeons) {
      const dd = Math.hypot(Dg.x - S0.x, Dg.y - S0.y) * (comp[Dg.cell] === comp[S0.cell] ? 1 : 1.35);
      Dg.tier = Math.min(5, 1 + Math.floor(Math.min(1, dd / maxD) * 5.2));
      if (Dg.landmark !== undefined) Dg.tier = Math.min(5, Dg.tier + 1);
      Dg.level = Math.max(1, Math.round(Dg.tier * 5 - 3 + rng.int(-1, 2)));
      if (Dg.landmark !== undefined) Dg.level = Math.max(Dg.level, landmarks[Dg.landmark].lvl + 2);
      if (Dg.type === 'hellgate') { Dg.tier = 6; Dg.level = Dg.final ? 36 : 30 + rng.int(0, 3); }
      Dg.floors = Dg.final ? 5 : 1 + Math.min(4, Dg.tier);
    }
    const relicC = dungeons.filter((d) => !d.final && d.type !== 'hellgate' && d.tier >= 3).sort((a, b) => b.tier - a.tier);
    rng.shuffle(relicC.slice(0, 10)).slice(0, 3).forEach((d, i) => { d.relic = true; d.relicIndex = i; });
    const easiest = dungeons.filter((d) => !d.final && !d.relic && comp[d.cell] === comp[S0.cell]).sort((a, b) => Math.hypot(a.x - S0.x, a.y - S0.y) - Math.hypot(b.x - S0.x, b.y - S0.y))[0];
    if (easiest) { easiest.tier = 1; easiest.level = 2; easiest.floors = 2; }
    for (const Dg of dungeons) {
      const R = Dg.barony >= 0 ? realms[baronies[Dg.barony].realm] : null;
      Dg.name = Dg.final ? Dg.baseName : Dg.landmark !== undefined ? `${Dg.baseName} (${landmarks[Dg.landmark].name})` : `${Dg.baseName} ${names.makeName(rng, R ? R.culture : 'sea')}`;
    }

    // ---- trails / sea links for dungeons ----
    const trails = [];
    for (const Dg of dungeons) {
      const sameLand = baronies.filter((B) => B.land === comp[Dg.cell]);
      if (sameLand.length) {
        const best = sameLand.reduce((a, b) => (Math.hypot(a.x - Dg.x, a.y - Dg.y) < Math.hypot(b.x - Dg.x, b.y - Dg.y) ? a : b));
        const res = astar(terrain, river, roadMask, best.cell, Dg.cell, {});
        if (res) { Dg.link = best.id; trails.push({ dungeon: Dg.id, b: best.id, path: res.path, cost: travelCost(terrain, river, res.path, roadMask), kind: 'trail' }); continue; }
      }
      const port = ports.filter((p) => !realms[p.realm].isDemon).sort((a, b) => Math.hypot(a.x - Dg.x, a.y - Dg.y) - Math.hypot(b.x - Dg.x, b.y - Dg.y))[0];
      const wa = port ? waterNear(port.cell) : -1, wb = waterNear(Dg.cell);
      const res = wa >= 0 && wb >= 0 ? astar(terrain, river, roadMask, wa, wb, { water: true }) : null;
      if (res) { Dg.link = port.id; trails.push({ dungeon: Dg.id, b: port.id, path: [port.cell, ...res.path, Dg.cell], cost: res.path.length * 0.3, kind: 'sea' }); }
      else Dg.unreachable = true;
    }
    const remap = new Map(); const kept = dungeons.filter((d) => !d.unreachable);
    kept.forEach((d, i) => { remap.set(d.id, i); d.id = i; });
    const trails2 = trails.filter((t) => remap.has(t.dungeon)).map((t) => ({ ...t, dungeon: remap.get(t.dungeon) }));

    const graph = {};
    const addEdge = (u, v, path, cost, kind) => { (graph[u] = graph[u] || []).push({ to: v, path, cost, kind }); (graph[v] = graph[v] || []).push({ to: u, path: path.slice().reverse(), cost, kind }); };
    for (const r of roads) addEdge('b:' + r.a, 'b:' + r.b, r.path, r.cost, r.major ? 'major' : 'road');
    for (const s of seaRoutes) addEdge('b:' + s.a, 'b:' + s.b, s.path, s.cost, 'sea');
    for (const t of trails2) addEdge('b:' + t.b, 'd:' + t.dungeon, t.path, t.cost, t.kind);

    return {
      seed, W, H, terrain, height, river, roadMask, cellBarony, cellLandmark, comp, cont,
      SEA: TG.SEA, HILL: TG.HILL, MOUNT: TG.MOUNT, PEAK: TG.PEAK,
      baronies, counties, duchies, realms, roads, seaRoutes, trails: trails2, dungeons: kept, landmarks,
      continents: CONTINENTS.map((c, i) => ({ ...c, id: i, x: c.cx * W, y: c.cy * H })), graph,
      startBarony: startB, startRealm, empireId, demonId: realms.findIndex((r) => r.isDemon), genMs: Date.now() - t0,
    };
  }

  function travelCost(terrain, river, path, roadMask) {
    let c = 0;
    for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i]; const diag = (a % W !== b % W) && (((a / W) | 0) !== ((b / W) | 0)) ? 1.414 : 1; c += (roadMask[b] ? 0.5 : Math.min(isLand(terrain[b]) ? cellCost(terrain, river, b) : 1, 6) * 0.6) * diag; }
    return c;
  }

  function findRoute(world, from, to, opts = {}) {
    if (from === to) return { nodes: [from], legs: [], cost: 0 };
    const dist = { [from]: 0 }, prev = {}; const heap = new MinHeap(); heap.push(from, 0);
    while (heap.size) {
      const u = heap.pop(); if (u === to) break;
      for (const e of world.graph[u] || []) {
        if (opts.noSea && e.kind === 'sea') continue;
        const nd = dist[u] + e.cost;
        if (dist[e.to] === undefined || nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = { u, e }; heap.push(e.to, nd); }
      }
    }
    if (dist[to] === undefined) return null;
    const legs = [], nodes = [to]; let k = to;
    while (k !== from) { const p = prev[k]; legs.push(p.e); nodes.push(p.u); k = p.u; }
    return { nodes: nodes.reverse(), legs: legs.reverse(), cost: dist[to] };
  }

  function nodeXY(world, node) { const [kind, id] = node.split(':'); const o = kind === 'b' ? world.baronies[+id] : world.dungeons[+id]; return { x: o.x, y: o.y }; }
  function landmarkAt(world, cell) { const l = world.cellLandmark[cell]; return l >= 0 ? world.landmarks[l] : null; }

  ISK.world = { generateWorld, findRoute, nodeXY, landmarkAt, W, H, T, TERRAIN_INFO, SETTLEMENT, MinHeap, astar, LANDMARKS, DTYPES, isLand };
})();
