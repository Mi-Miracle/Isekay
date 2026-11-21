// World generation: terrain, rivers, feudal hierarchy (baronies → counties → duchies → realms), roads, dungeons.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const { RNG, noise, names } = ISK;

  const W = 220, H = 150;
  const T = {
    DEEP: 0, SEA: 1, BEACH: 2, PLAINS: 3, FOREST: 4, HILLS: 5, MOUNTAIN: 6, PEAK: 7,
    DESERT: 8, TUNDRA: 9, SWAMP: 10, ASH: 11, JUNGLE: 12,
  };
  const TERRAIN_INFO = {
    0: { name: 'Глибоке море', cost: Infinity }, 1: { name: 'Море', cost: Infinity },
    2: { name: 'Узбережжя', cost: 1.2 }, 3: { name: 'Рівнини', cost: 1 }, 4: { name: 'Ліс', cost: 2 },
    5: { name: 'Пагорби', cost: 3 }, 6: { name: 'Гори', cost: 8 }, 7: { name: 'Снігові піки', cost: 14 },
    8: { name: 'Пустеля', cost: 2.5 }, 9: { name: 'Тундра', cost: 2.2 }, 10: { name: 'Болото', cost: 4 },
    11: { name: 'Попелища Демонів', cost: 3 }, 12: { name: 'Хащі', cost: 3 },
  };

  class MinHeap {
    constructor() { this.a = []; }
    get size() { return this.a.length; }
    push(item, pri) {
      const a = this.a; a.push([pri, item]);
      let i = a.length - 1;
      while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
    }
    pop() {
      const a = this.a; const top = a[0]; const last = a.pop();
      if (a.length) {
        a[0] = last; let i = 0;
        for (;;) {
          const l = 2 * i + 1, r = l + 1; let m = i;
          if (l < a.length && a[l][0] < a[m][0]) m = l;
          if (r < a.length && a[r][0] < a[m][0]) m = r;
          if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m;
        }
      }
      return top[1];
    }
  }

  const idx = (x, y) => y * W + x;
  const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function genTerrain(seed) {
    const height = new Float32Array(W * H);
    const moist = new Float32Array(W * H);
    const terrain = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const nx = x / W - 0.5, ny = y / H - 0.5;
        const d = Math.sqrt(nx * nx * 1.15 + ny * ny * 1.9) * 2;
        let h = noise.fbm(x / 38, y / 38, seed, 6);
        const ridge = 1 - Math.abs(noise.fbm(x / 22 + 50, y / 22, seed + 7, 4) * 2 - 1);
        h = h * 0.75 + ridge * 0.3;
        h = h - Math.pow(d, 2.4) * 0.55 + 0.08;
        height[idx(x, y)] = h;
        moist[idx(x, y)] = noise.fbm(x / 30 + 300, y / 30, seed + 33, 4);
      }
    }
    const SEA = 0.42;
    for (let i = 0; i < W * H; i++) {
      const h = height[i], m = moist[i];
      const y = Math.floor(i / W);
      const lat = y / H; // 0 north, 1 south
      let t;
      if (h < SEA - 0.08) t = T.DEEP;
      else if (h < SEA) t = T.SEA;
      else if (h < SEA + 0.018) t = T.BEACH;
      else if (h > 0.78) t = T.PEAK;
      else if (h > 0.67) t = T.MOUNTAIN;
      else if (h > 0.6) t = T.HILLS;
      else {
        if (lat < 0.2 && m < 0.62) t = T.TUNDRA;
        else if (lat > 0.72 && m < 0.48) t = T.DESERT;
        else if (lat > 0.7 && m > 0.62) t = T.JUNGLE;
        else if (m > 0.64 && h < SEA + 0.08) t = T.SWAMP;
        else if (m > 0.52) t = T.FOREST;
        else t = T.PLAINS;
      }
      terrain[i] = t;
    }
    return { height, moist, terrain, SEA };
  }

  function isLand(t) { return t >= T.BEACH; }

  function largestLandmass(terrain) {
    const comp = new Int32Array(W * H).fill(-1);
    let best = -1, bestSize = 0, c = 0;
    for (let i = 0; i < W * H; i++) {
      if (comp[i] !== -1 || !isLand(terrain[i])) continue;
      const stack = [i]; comp[i] = c; let size = 0;
      while (stack.length) {
        const k = stack.pop(); size++;
        const x = k % W, y = (k / W) | 0;
        for (const [dx, dy] of DIRS4) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const j = idx(xx, yy);
          if (comp[j] === -1 && isLand(terrain[j])) { comp[j] = c; stack.push(j); }
        }
      }
      if (size > bestSize) { bestSize = size; best = c; }
      c++;
    }
    const main = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) if (comp[i] === best) main[i] = 1;
    return main;
  }

  function genRivers(rng, terrain, height, main) {
    const river = new Uint8Array(W * H);
    const sources = [];
    for (let i = 0; i < W * H; i++) if (main[i] && (terrain[i] === T.MOUNTAIN || terrain[i] === T.HILLS)) sources.push(i);
    rng.shuffle(sources);
    let made = 0;
    for (const s of sources) {
      if (made >= 14) break;
      let k = s, steps = 0; const path = [];
      const visited = new Set();
      while (steps++ < 400) {
        path.push(k); visited.add(k);
        if (!isLand(terrain[k])) break;
        const x = k % W, y = (k / W) | 0;
        let bestJ = -1, bestH = height[k] + 0.004;
        for (const [dx, dy] of DIRS4) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const j = idx(xx, yy);
          if (visited.has(j)) continue;
          const hj = height[j] + rng.float(0, 0.003);
          if (hj < bestH) { bestH = hj; bestJ = j; }
        }
        if (bestJ < 0) { path.length = 0; break; }
        if (river[bestJ]) { path.push(bestJ); break; }
        k = bestJ;
      }
      if (path.length > 14) {
        for (const p of path) if (isLand(terrain[p])) river[p] = 1;
        made++;
      }
    }
    return river;
  }

  function cellCost(terrain, river, i) {
    const c = TERRAIN_INFO[terrain[i]].cost;
    return river[i] ? c + 3 : c;
  }

  // Partition graph nodes into k contiguous groups (weighted multi-source Dijkstra over the graph).
  function partition(rng, nodes, k, adj, pos, weightFn) {
    const set = new Set(nodes);
    const seeds = [];
    seeds.push(rng.pick(nodes));
    while (seeds.length < k && seeds.length < nodes.length) {
      let best = null, bd = -1;
      for (const n of nodes) {
        if (seeds.includes(n)) continue;
        let md = Infinity;
        for (const s of seeds) { const dx = pos[n].x - pos[s].x, dy = pos[n].y - pos[s].y; md = Math.min(md, dx * dx + dy * dy); }
        md *= 0.85 + rng.next() * 0.3;
        if (md > bd) { bd = md; best = n; }
      }
      seeds.push(best);
    }
    const group = new Map();
    const dist = new Map();
    const heap = new MinHeap();
    seeds.forEach((s, gi) => { dist.set(s, 0); heap.push([s, gi], 0); });
    while (heap.size) {
      const [n, gi] = heap.pop();
      if (group.has(n)) continue;
      group.set(n, gi);
      const w = weightFn ? weightFn(gi) : 1;
      for (const m of adj[n]) {
        if (!set.has(m) || group.has(m)) continue;
        const step = Math.hypot(pos[n].x - pos[m].x, pos[n].y - pos[m].y) / w;
        const nd = dist.get(n) + step;
        if (!dist.has(m) || nd < dist.get(m)) { dist.set(m, nd); heap.push([m, gi], nd); }
      }
    }
    for (const n of nodes) {
      if (group.has(n)) continue;
      let bg = 0, bd = Infinity;
      seeds.forEach((s, gi) => { const dx = pos[n].x - pos[s].x, dy = pos[n].y - pos[s].y; const d = dx * dx + dy * dy; if (d < bd) { bd = d; bg = gi; } });
      group.set(n, bg);
    }
    const out = seeds.map(() => []);
    for (const [n, g] of group) out[g].push(n);
    return { groups: out, seeds };
  }

  function astar(terrain, river, roadMask, from, to, allowAsh = true) {
    const g = new Float32Array(W * H).fill(Infinity);
    const came = new Int32Array(W * H).fill(-1);
    const heap = new MinHeap();
    const tx = to % W, ty = (to / W) | 0;
    g[from] = 0; heap.push(from, 0);
    while (heap.size) {
      const k = heap.pop();
      if (k === to) break;
      const x = k % W, y = (k / W) | 0;
      for (const [dx, dy] of DIRS8) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = idx(xx, yy);
        if (!isLand(terrain[j])) continue;
        if (!allowAsh && terrain[j] === T.ASH) continue;
        const diag = dx && dy ? 1.414 : 1;
        let c = roadMask[j] ? 0.35 : cellCost(terrain, river, j);
        const ng = g[k] + c * diag;
        if (ng < g[j]) {
          g[j] = ng; came[j] = k;
          const h = Math.hypot(xx - tx, yy - ty) * 0.35;
          heap.push(j, ng + h);
        }
      }
    }
    if (came[to] === -1 && from !== to) return null;
    const path = [to]; let k = to;
    while (k !== from) { k = came[k]; path.push(k); }
    path.reverse();
    return { path, cost: g[to] };
  }

  const SETTLEMENT = {
    capital: { name: 'Столиця', icon: '🏰', services: ['guild', 'tavern', 'shop', 'smith', 'alchemist', 'trainer', 'temple', 'arena', 'court', 'market'] },
    city: { name: 'Місто', icon: '🏯', services: ['guild', 'tavern', 'shop', 'smith', 'alchemist', 'trainer', 'temple', 'market'] },
    town: { name: 'Містечко', icon: '🏘️', services: ['guild', 'tavern', 'shop', 'smith', 'alchemist', 'temple'] },
    castle: { name: 'Замок', icon: '🏛️', services: ['tavern', 'shop', 'smith', 'trainer'] },
    village: { name: 'Село', icon: '🏡', services: ['tavern', 'shop'] },
    port: { name: 'Порт', icon: '⚓', services: ['tavern', 'shop', 'market', 'alchemist'] },
    mine: { name: 'Шахтарське селище', icon: '⛏️', services: ['tavern', 'shop', 'smith'] },
  };

  const REALM_COLORS = ['#d4a72c', '#c0392b', '#2e86de', '#27ae60', '#8e44ad', '#e67e22', '#16a085'];

  function generateWorld(seed) {
    const t0 = Date.now();
    const rng = new RNG(seed);
    const { height, moist, terrain } = genTerrain(seed);
    const main = largestLandmass(terrain);
    let mainCount = 0, cx = 0, cy = 0;
    for (let i = 0; i < W * H; i++) if (main[i]) { mainCount++; cx += i % W; cy += (i / W) | 0; }
    cx /= mainCount; cy /= mainCount;

    // Demon wastes: far corner of the continent
    let far = 0, fd = -1;
    for (let i = 0; i < W * H; i++) {
      if (!main[i]) continue;
      const x = i % W, y = (i / W) | 0;
      const d = (x - cx) * 0.8 - (y - cy) * 1.2 + rng.float(0, 2); // prefer north-east
      if (d > fd) { fd = d; far = i; }
    }
    const wx = far % W, wy = (far / W) | 0;
    const wasteR = 17;
    for (let i = 0; i < W * H; i++) {
      if (!main[i]) continue;
      const x = i % W, y = (i / W) | 0;
      const d = Math.hypot(x - wx, y - wy) + noise.fbm(x / 6, y / 6, seed + 9, 2) * 6;
      if (d < wasteR && terrain[i] !== T.PEAK) terrain[i] = T.ASH;
    }

    const river = genRivers(rng, terrain, height, main);

    // ---- Barony seeds (Poisson-ish) ----
    const candidates = [];
    for (let i = 0; i < W * H; i++) {
      if (!main[i]) continue;
      const t = terrain[i];
      if (t === T.ASH || t === T.PEAK || t === T.MOUNTAIN) continue;
      candidates.push(i);
    }
    rng.shuffle(candidates);
    const minD = 7.2;
    const baronyCells = [];
    const grid = new Map();
    const gkey = (x, y) => ((x / 8) | 0) + ',' + ((y / 8) | 0);
    for (const c of candidates) {
      const x = c % W, y = (c / W) | 0;
      let ok = true;
      const gx = (x / 8) | 0, gy = (y / 8) | 0;
      for (let ox = -1; ox <= 1 && ok; ox++) for (let oy = -1; oy <= 1 && ok; oy++) {
        const list = grid.get((gx + ox) + ',' + (gy + oy));
        if (!list) continue;
        for (const o of list) { if (Math.hypot(o % W - x, ((o / W) | 0) - y) < minD) { ok = false; break; } }
      }
      if (!ok) continue;
      baronyCells.push(c);
      const k = gkey(x, y); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(c);
    }

    // ---- Assign cells to baronies via Dijkstra flood ----
    const cellBarony = new Int16Array(W * H).fill(-1);
    const dist = new Float32Array(W * H).fill(Infinity);
    const heap = new MinHeap();
    baronyCells.forEach((c, bi) => { dist[c] = 0; cellBarony[c] = bi; heap.push(c, 0); });
    while (heap.size) {
      const k = heap.pop();
      const x = k % W, y = (k / W) | 0;
      for (const [dx, dy] of DIRS4) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = idx(xx, yy);
        if (!main[j] || terrain[j] === T.ASH) continue;
        const nd = dist[k] + Math.min(cellCost(terrain, river, j), 9);
        if (nd < dist[j] && nd < 26) { dist[j] = nd; cellBarony[j] = cellBarony[k]; heap.push(j, nd); }
      }
    }

    const nB = baronyCells.length;
    const pos = baronyCells.map((c) => ({ x: c % W, y: (c / W) | 0 }));
    const adjSets = Array.from({ length: nB }, () => new Set());
    const area = new Array(nB).fill(0);
    const terrainCount = Array.from({ length: nB }, () => ({}));
    const coastal = new Array(nB).fill(false);
    for (let i = 0; i < W * H; i++) {
      const b = cellBarony[i];
      if (b < 0) continue;
      area[b]++;
      terrainCount[b][terrain[i]] = (terrainCount[b][terrain[i]] || 0) + 1;
      const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of DIRS4) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = idx(xx, yy);
        const bj = cellBarony[j];
        if (bj >= 0 && bj !== b) { adjSets[b].add(bj); }
        if (!isLand(terrain[j])) coastal[b] = true;
      }
    }
    const adj = adjSets.map((s) => [...s]);
    const hasRiver = new Array(nB).fill(false);
    for (let i = 0; i < W * H; i++) if (river[i] && cellBarony[i] >= 0) hasRiver[cellBarony[i]] = true;

    // ---- Realms: 1 empire + 6 kingdoms ----
    const all = [...Array(nB).keys()];
    let realmPart = null;
    for (let attempt = 0; attempt < 40; attempt++) {
      const p = partition(rng, all, 7, adj, pos, (gi) => (gi === 0 ? 1.45 : 1 + (gi % 3) * 0.06));
      const sz = p.groups.map((g) => g.length);
      const avgK = (nB - sz[0]) / 6;
      const ok = Math.min(...sz.slice(1)) >= avgK * 0.6 && sz[0] >= Math.max(...sz.slice(1));
      if (!realmPart || ok) realmPart = p;
      if (ok) break;
    }
    // Decide cultures by geography
    const realmCenters = realmPart.groups.map((g) => {
      let sx = 0, sy = 0; for (const b of g) { sx += pos[b].x; sy += pos[b].y; }
      return { x: sx / g.length, y: sy / g.length };
    });
    const realmOrder = [1, 2, 3, 4, 5, 6];
    const byNorth = [...realmOrder].sort((a, b) => realmCenters[a].y - realmCenters[b].y);
    const cultureOf = {};
    cultureOf[0] = 'imperial';
    cultureOf[byNorth[0]] = 'north';
    cultureOf[byNorth[5]] = 'desert';
    const restCultures = rng.shuffle(['elven', 'eastern', 'slavic', 'dwarven']);
    let rc = 0;
    for (const r of realmOrder) if (!cultureOf[r]) cultureOf[r] = restCultures[rc++];
    // Dwarves love mountains: swap dwarven with the realm that has the most hills
    const hilliness = realmPart.groups.map((g) => g.reduce((s, b) => s + (terrainCount[b][T.HILLS] || 0) + (terrainCount[b][T.MOUNTAIN] || 0) * 2, 0) / g.length);
    let hilly = -1, hv = -1;
    for (const r of realmOrder) if (['elven', 'eastern', 'slavic', 'dwarven'].includes(cultureOf[r]) && hilliness[r] > hv) { hv = hilliness[r]; hilly = r; }
    const dwarfR = realmOrder.find((r) => cultureOf[r] === 'dwarven');
    if (hilly >= 0 && dwarfR !== hilly) { cultureOf[dwarfR] = cultureOf[hilly]; cultureOf[hilly] = 'dwarven'; }

    const CULT_REALM = {
      imperial: { title: 'Імперія', ruler: 'Імператор', rulerF: 'Імператриця', race: 'люди', motto: 'Порядок понад усе. Особливо понад обід.' },
      north: { title: 'Королівство', ruler: 'Ярл-король', rulerF: 'Ярл-королева', race: 'нордлінги', motto: 'Холодно, але ми не скаржимось. Ну, трохи.' },
      elven: { title: 'Ельфійське королівство', ruler: 'Король', rulerF: 'Королева', race: 'ельфи', motto: 'Ми старші за ваші проблеми.' },
      desert: { title: 'Султанат', ruler: 'Султан', rulerF: 'Султана', race: 'люди пісків', motto: 'Пісок усюди. Навіть там, де не треба.' },
      eastern: { title: 'Сьоґунат', ruler: 'Сьоґун', rulerF: 'Сьоґун', race: 'люди сходу', motto: 'Честь, чай і раптові драматичні паузи.' },
      slavic: { title: 'Королівство', ruler: 'Король', rulerF: 'Королева', race: 'люди', motto: 'Борщ — це стратегічний ресурс.' },
      dwarven: { title: 'Підгірне королівство', ruler: 'Тан-король', rulerF: 'Тан-королева', race: 'гноми', motto: 'Копай глибше. Завжди глибше.' },
    };

    const realms = [];
    const duchies = [], counties = [], baronies = [];
    for (let b = 0; b < nB; b++) {
      baronies.push({ id: b, cell: baronyCells[b], x: pos[b].x, y: pos[b].y, adj: adj[b], area: area[b], coastal: coastal[b], terrain: terrainCount[b], county: -1, duchy: -1, realm: -1, owner: -1, type: 'village', name: '', dev: 1, fort: 1 });
    }

    realmPart.groups.forEach((group, ri) => {
      const culture = cultureOf[ri];
      const cr = CULT_REALM[culture];
      // capital = seed
      const capital = realmPart.seeds[ri];
      const rname = names.makeName(rng, culture);
      const realm = {
        id: ri, name: rname, culture, title: cr.title, fullName: `${cr.title} ${rname}`,
        rulerTitle: cr.ruler, rulerTitleF: cr.rulerF, race: cr.race, motto: cr.motto,
        color: REALM_COLORS[ri], capital, isEmpire: ri === 0, duchies: [], dejure: group.slice(),
      };
      realms.push(realm);
      const nDuchy = Math.max(2, Math.round(group.length / (ri === 0 ? 8 : 7)));
      const dp = partition(rng, group, nDuchy, adj, pos);
      // ensure capital duchy seed is capital
      dp.groups.forEach((dg, di) => {
        const duchyId = duchies.length;
        const seat = dg.includes(capital) ? capital : dp.seeds[di];
        const duchy = { id: duchyId, name: names.makeName(rng, culture), realm: ri, seat, counties: [], baronies: dg.slice() };
        duchies.push(duchy); realm.duchies.push(duchyId);
        const nC = Math.max(1, Math.round(dg.length / 3));
        const cp = partition(rng, dg, nC, adj, pos);
        cp.groups.forEach((cg, ci) => {
          const countyId = counties.length;
          const cseat = cg.includes(seat) ? seat : cp.seeds[ci];
          counties.push({ id: countyId, name: names.makeName(rng, culture), duchy: duchyId, realm: ri, seat: cseat, baronies: cg.slice() });
          duchy.counties.push(countyId);
          for (const b of cg) {
            const B = baronies[b];
            B.county = countyId; B.duchy = duchyId; B.realm = ri; B.owner = ri;
            B.name = names.makeName(rng, culture);
          }
        });
      });
    });

    // settlement types
    const usedNames = new Set();
    for (const B of baronies) {
      const R = realms[B.realm], C = counties[B.county], D = duchies[B.duchy];
      const hills = (B.terrain[T.HILLS] || 0) + (B.terrain[T.MOUNTAIN] || 0);
      if (R.capital === B.id) { B.type = 'capital'; B.dev = rng.int(8, 10); B.fort = 5; }
      else if (D.seat === B.id) { B.type = 'city'; B.dev = rng.int(5, 8); B.fort = 4; }
      else if (C.seat === B.id) { B.type = rng.chance(0.5) ? 'town' : 'castle'; B.dev = rng.int(3, 6); B.fort = B.type === 'castle' ? 4 : 3; }
      else if (B.coastal && rng.chance(0.5)) { B.type = 'port'; B.dev = rng.int(3, 5); B.fort = 2; }
      else if (hills > B.area * 0.25 && rng.chance(0.6)) { B.type = 'mine'; B.dev = rng.int(2, 4); B.fort = 1; }
      else { B.type = 'village'; B.dev = rng.int(1, 3); B.fort = 1; }
      let n = B.name, tries = 0;
      while (usedNames.has(n) && tries++ < 20) n = names.makeName(rng, R.culture);
      if (usedNames.has(n)) n = n + ' ' + ['Нижній', 'Верхній', 'Старий', 'Новий'][B.id % 4];
      usedNames.add(n); B.name = n;
      B.resources = {
        herbs: ((B.terrain[T.FOREST] || 0) + (B.terrain[T.PLAINS] || 0) * 0.5 + (B.terrain[T.SWAMP] || 0) + (B.terrain[T.JUNGLE] || 0)) / B.area,
        ore: (hills * 1.5 + (B.terrain[T.TUNDRA] || 0) * 0.3) / B.area,
        fish: B.coastal ? 1 : hasRiver[B.id] ? 0.7 : 0.15,
      };
      B.river = hasRiver[B.id];
    }

    // ---- Roads ----
    const roadMask = new Uint8Array(W * H);
    const roads = []; // {a,b,path,cost,major}
    const edgeSet = new Set();
    const edgeKey = (a, b) => (a < b ? a + '-' + b : b + '-' + a);
    // MST (Prim) over adjacency by euclid
    const inTree = new Array(nB).fill(false);
    const mstEdges = [];
    inTree[0] = true;
    const eh = new MinHeap();
    const pushEdges = (b) => { for (const m of adj[b]) if (!inTree[m]) eh.push([b, m], Math.hypot(pos[b].x - pos[m].x, pos[b].y - pos[m].y)); };
    pushEdges(0);
    while (eh.size) {
      const [a, b] = eh.pop();
      if (inTree[b]) continue;
      inTree[b] = true; mstEdges.push([a, b]); pushEdges(b);
    }
    const extra = [];
    for (let a = 0; a < nB; a++) for (const b of adj[a]) if (a < b) {
      const d = Math.hypot(pos[a].x - pos[b].x, pos[a].y - pos[b].y);
      if (d < 11 && rng.chance(0.45)) extra.push([a, b]);
    }
    const tierOf = (b) => ({ capital: 4, city: 3, town: 2, castle: 2 }[baronies[b].type] || 1);
    const allEdges = [...mstEdges, ...extra];
    allEdges.sort((e1, e2) => (tierOf(e2[0]) + tierOf(e2[1])) - (tierOf(e1[0]) + tierOf(e1[1])));
    for (const [a, b] of allEdges) {
      const k = edgeKey(a, b); if (edgeSet.has(k)) continue;
      const res = astar(terrain, river, roadMask, baronyCells[a], baronyCells[b], false);
      if (!res) continue;
      edgeSet.add(k);
      const major = tierOf(a) >= 2 && tierOf(b) >= 2;
      for (const c of res.path) roadMask[c] = Math.max(roadMask[c], major ? 2 : 1);
      roads.push({ a, b, path: res.path, cost: travelCost(terrain, river, res.path, roadMask), major });
    }

    // Ensure every barony is reachable by road
    {
      const comp = new Array(nB).fill(-1);
      const nbr = Array.from({ length: nB }, () => []);
      for (const r of roads) { nbr[r.a].push(r.b); nbr[r.b].push(r.a); }
      const label = () => {
        comp.fill(-1); let c = 0;
        for (let i = 0; i < nB; i++) {
          if (comp[i] >= 0) continue;
          const st = [i]; comp[i] = c;
          while (st.length) { const u = st.pop(); for (const v of nbr[u]) if (comp[v] < 0) { comp[v] = c; st.push(v); } }
          c++;
        }
        return c;
      };
      let guard = 0;
      while (label() > 1 && guard++ < 60) {
        // connect smallest non-main component to nearest barony of another component
        const sizes = {}; comp.forEach((c) => (sizes[c] = (sizes[c] || 0) + 1));
        const mainC = +Object.keys(sizes).sort((a, b) => sizes[b] - sizes[a])[0];
        const lone = comp.findIndex((c) => c !== mainC);
        let best = -1, bd = Infinity;
        for (let j = 0; j < nB; j++) if (comp[j] === mainC) { const d = Math.hypot(pos[j].x - pos[lone].x, pos[j].y - pos[lone].y); if (d < bd) { bd = d; best = j; } }
        const res = astar(terrain, river, roadMask, baronyCells[lone], baronyCells[best], true);
        if (!res) { // give up: remove from map by merging into neighbour (rare)
          nbr[lone].push(best); nbr[best].push(lone); continue;
        }
        for (const c of res.path) roadMask[c] = Math.max(roadMask[c], 1);
        roads.push({ a: lone, b: best, path: res.path, cost: travelCost(terrain, river, res.path, roadMask), major: false });
        nbr[lone].push(best); nbr[best].push(lone);
      }
    }

    // ---- Dungeons / lairs ----
    const DTYPES = [
      { key: 'goblin', name: 'Гоблінська нора', icon: '👺', terr: [T.FOREST, T.HILLS, T.PLAINS] },
      { key: 'crypt', name: 'Склеп', icon: '💀', terr: [T.PLAINS, T.SWAMP, T.TUNDRA] },
      { key: 'slime', name: 'Слизова печера', icon: '🟢', terr: [T.SWAMP, T.FOREST, T.JUNGLE] },
      { key: 'ruins', name: 'Руїни храму', icon: '🏚️', terr: [T.DESERT, T.JUNGLE, T.PLAINS] },
      { key: 'mine', name: 'Покинута шахта', icon: '🕳️', terr: [T.HILLS, T.MOUNTAIN, T.TUNDRA] },
      { key: 'tower', name: 'Вежа мага-відлюдника', icon: '🗼', terr: [T.HILLS, T.FOREST, T.BEACH] },
      { key: 'dragon', name: 'Лігво дракона', icon: '🐉', terr: [T.MOUNTAIN, T.HILLS] },
      { key: 'beast', name: 'Звірине лігво', icon: '🐺', terr: [T.FOREST, T.TUNDRA, T.JUNGLE] },
    ];
    const dungeonCands = [];
    for (let i = 0; i < W * H; i++) {
      if (!main[i] || terrain[i] === T.ASH || terrain[i] === T.PEAK) continue;
      const b = cellBarony[i];
      if (b < 0) continue;
      const d = Math.hypot(pos[b].x - (i % W), pos[b].y - ((i / W) | 0));
      if (d < 3.2) continue;
      if (roadMask[i]) continue;
      dungeonCands.push(i);
    }
    rng.shuffle(dungeonCands);
    const dungeons = [];
    for (const c of dungeonCands) {
      if (dungeons.length >= 26) break;
      const x = c % W, y = (c / W) | 0;
      if (dungeons.some((d) => Math.hypot(d.x - x, d.y - y) < 12)) continue;
      const ty = terrain[c];
      const opts = DTYPES.filter((d) => d.terr.includes(ty));
      if (!opts.length) continue;
      const dt = rng.pick(opts);
      dungeons.push({ id: dungeons.length, type: dt.key, icon: dt.icon, baseName: dt.name, cell: c, x, y, barony: cellBarony[c], tier: 1, final: false, relic: false });
    }

    // Final citadel in the wastes
    let citadel = far;
    dungeons.push({ id: dungeons.length, type: 'citadel', icon: '🌋', baseName: 'Цитадель Короля Демонів', cell: citadel, x: wx, y: wy, barony: -1, tier: 6, final: true, relic: false });

    // ---- Player start: a village of a middle kingdom (not the empire) ----
    const kingdomIds = [1, 2, 3, 4, 5, 6].filter((r) => cultureOf[r] !== 'desert');
    let startRealm = kingdomIds.find((r) => cultureOf[r] === 'slavic') ?? kingdomIds[0];
    const startCandidates = baronies.filter((B) => B.realm === startRealm && B.type === 'village');
    const startB = (startCandidates.length ? rng.pick(startCandidates) : baronies.find((B) => B.realm === startRealm)).id;
    // Danger scales with distance from start
    let maxD = 1;
    for (const B of baronies) { B.distStart = Math.hypot(B.x - pos[startB].x, B.y - pos[startB].y); maxD = Math.max(maxD, B.distStart); }
    for (const B of baronies) {
      let lvl = 1 + Math.floor((B.distStart / maxD) * 22);
      if (B.type === 'capital' || B.type === 'city') lvl = Math.max(1, lvl - 2);
      B.danger = lvl;
    }
    for (const D of dungeons) {
      if (D.final) { D.level = 32; continue; }
      const dd = Math.hypot(D.x - pos[startB].x, D.y - pos[startB].y);
      D.tier = Math.min(5, 1 + Math.floor((dd / maxD) * 5.2));
      D.level = Math.max(1, Math.round(D.tier * 5 - 3 + rng.int(-1, 2)));
      D.floors = 1 + Math.min(4, D.tier);
    }
    // Relic dungeons: 3 high-tier ones
    const relicCands = dungeons.filter((d) => !d.final && d.tier >= 3).sort((a, b) => b.tier - a.tier);
    const relicPicks = rng.shuffle(relicCands.slice(0, 8)).slice(0, 3);
    relicPicks.forEach((d, i) => { d.relic = true; d.relicIndex = i; });
    // A guaranteed easy dungeon near start
    const easiest = dungeons.filter((d) => !d.final).sort((a, b) => Math.hypot(a.x - pos[startB].x, a.y - pos[startB].y) - Math.hypot(b.x - pos[startB].x, b.y - pos[startB].y))[0];
    if (easiest) { easiest.tier = 1; easiest.level = 2; easiest.floors = 2; easiest.relic = false; }
    for (const D of dungeons) {
      const R = D.barony >= 0 ? realms[baronies[D.barony].realm] : null;
      D.name = D.final ? D.baseName : `${D.baseName} ${R ? names.makeName(rng, R.culture) : ''}`.trim();
    }

    // Trails dungeon→nearest barony
    const trails = [];
    for (const D of dungeons) {
      let bestB = -1, bd = Infinity;
      for (const B of baronies) { const d = Math.hypot(B.x - D.x, B.y - D.y); if (d < bd) { bd = d; bestB = B.id; } }
      const res = astar(terrain, river, roadMask, baronyCells[bestB], D.cell, true);
      if (!res) { D.unreachable = true; continue; }
      D.link = bestB;
      trails.push({ dungeon: D.id, b: bestB, path: res.path, cost: travelCost(terrain, river, res.path, roadMask) });
    }

    for (let i = dungeons.length - 1; i >= 0; i--) if (dungeons[i].unreachable) dungeons.splice(i, 1);
    dungeons.forEach((d, i) => { trails.forEach((t) => { if (t.dungeon === d.id) t.dungeon = i; }); d.id = i; });

    // Build travel graph: nodes 'b:<id>' and 'd:<id>'
    const graph = {};
    const addEdge = (u, v, path, cost, kind) => {
      (graph[u] = graph[u] || []).push({ to: v, path, cost, kind });
      (graph[v] = graph[v] || []).push({ to: u, path: path.slice().reverse(), cost, kind });
    };
    for (const r of roads) addEdge('b:' + r.a, 'b:' + r.b, r.path, r.cost, r.major ? 'major' : 'road');
    for (const t of trails) addEdge('b:' + t.b, 'd:' + t.dungeon, t.path, t.cost, 'trail');

    const world = {
      seed, W, H, terrain, height, river, roadMask, main, cellBarony,
      baronies, counties, duchies, realms, roads, trails, dungeons, graph,
      startBarony: startB, startRealm, wastes: { x: wx, y: wy, r: wasteR },
      genMs: Date.now() - t0,
    };
    return world;
  }

  function travelCost(terrain, river, path, roadMask) {
    let c = 0;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1], b = path[i];
      const diag = (a % W !== b % W) && (((a / W) | 0) !== ((b / W) | 0)) ? 1.414 : 1;
      c += (roadMask[b] ? 0.5 : Math.min(cellCost(terrain, river, b), 6) * 0.6) * diag;
    }
    return c;
  }

  // Dijkstra over travel graph. Returns {nodes:[..], legs:[edge..], cost}
  function findRoute(world, from, to) {
    if (from === to) return { nodes: [from], legs: [], cost: 0 };
    const dist = { [from]: 0 }, prev = {};
    const heap = new MinHeap(); heap.push(from, 0);
    while (heap.size) {
      const u = heap.pop();
      if (u === to) break;
      for (const e of world.graph[u] || []) {
        const nd = dist[u] + e.cost;
        if (dist[e.to] === undefined || nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = { u, e }; heap.push(e.to, nd); }
      }
    }
    if (dist[to] === undefined) return null;
    const legs = []; const nodes = [to]; let k = to;
    while (k !== from) { const p = prev[k]; legs.push(p.e); nodes.push(p.u); k = p.u; }
    legs.reverse(); nodes.reverse();
    return { nodes, legs, cost: dist[to] };
  }

  function nodeXY(world, node) {
    const [kind, id] = node.split(':');
    const o = kind === 'b' ? world.baronies[+id] : world.dungeons[+id];
    return { x: o.x, y: o.y };
  }

  ISK.world = { generateWorld, findRoute, nodeXY, W, H, T, TERRAIN_INFO, SETTLEMENT, MinHeap, astar };
})();
