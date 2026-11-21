// Autonomous nation AI: economy, diplomacy, alliances, wars, armies, sieges, peace treaties, dynastic events.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const { RNG, names } = ISK;

  const TRAITS = {
    aggressive: { name: 'Войовничий', agg: 0.35, dip: -0.1 },
    peaceful: { name: 'Миролюбний', agg: -0.3, dip: 0.2 },
    greedy: { name: 'Жадібний', agg: 0.1, greed: 0.3 },
    diplomat: { name: 'Дипломат', dip: 0.35 },
    paranoid: { name: 'Параноїк', agg: 0.05, dip: -0.2 },
    ambitious: { name: 'Амбітний', agg: 0.2, dip: 0.05 },
    lazy: { name: 'Лінивий', agg: -0.15, eco: -0.15 },
    genius: { name: 'Геній стратегії', war: 0.2 },
    glutton: { name: 'Ненажера', eco: -0.05, desc: 'Витрачає казну на бенкети.' },
    just: { name: 'Справедливий', dip: 0.15, eco: 0.1 },
  };
  const TRAIT_KEYS = Object.keys(TRAITS);

  function makeRuler(rng, realm, day) {
    const female = rng.chance(0.4);
    const traits = rng.shuffle(TRAIT_KEYS.slice()).slice(0, 2);
    if (traits.includes('aggressive') && traits.includes('peaceful')) traits[1] = 'genius';
    return {
      name: names.personName(rng, female), female, epithet: rng.pick(names.PERSON.epithet)[female ? 1 : 0],
      age: rng.int(22, 58), traits, since: day, number: 1,
    };
  }

  function traitSum(ruler, key) {
    return ruler.traits.reduce((s, t) => s + (TRAITS[t][key] || 0), 0);
  }

  function rulerTitle(world, realm) {
    const R = world.realms[realm.id];
    return realm.ruler.female ? R.rulerTitleF : R.rulerTitle;
  }

  function rulerFull(world, realm) {
    const r = realm.ruler;
    const roman = ['', '', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'][Math.min(r.number, 10)] || '';
    return `${rulerTitle(world, realm)} ${r.name}${roman} ${r.epithet}`;
  }

  function initPolitics(world) {
    const rng = new RNG(world.seed * 7 + 13);
    const P = { realms: [], wars: [], armies: [], chronicle: [], nextId: 1, day: 0 };
    for (const B of world.baronies) B.occ = -1;
    for (const R of world.realms) {
      const baronies = world.baronies.filter((b) => b.owner === R.id);
      const devSum = baronies.reduce((s, b) => s + b.dev, 0);
      const st = {
        id: R.id, ruler: makeRuler(rng, R, 0), gold: 400 + devSum * 25 * (R.isEmpire ? 1.4 : 1),
        manpower: Math.round(devSum * 220 * (R.isEmpire ? 1.25 : 1)), maxManpower: Math.round(devSum * 240 * (R.isEmpire ? 1.25 : 1)),
        stability: 60, exhaustion: 0, relations: {}, alliances: [], truces: {}, dead: false, playerRep: 0, wins: 0, losses: 0,
      };
      P.realms.push(st);
    }
    // initial relations: cultural & geographic
    const borders = computeBorders(world);
    for (const a of P.realms) {
      for (const b of P.realms) {
        if (a.id === b.id) continue;
        let v = rng.int(-25, 30);
        if (borders[a.id].has(b.id)) v -= 12;
        if (world.realms[a.id].isEmpire || world.realms[b.id].isEmpire) v -= 10;
        a.relations[b.id] = v;
      }
    }
    // symmetric-ish
    for (const a of P.realms) for (const b of P.realms) if (a.id < b.id) {
      const m = Math.round((a.relations[b.id] + b.relations[a.id]) / 2);
      a.relations[b.id] = m; b.relations[a.id] = m;
    }
    // a couple of starting alliances
    const pairs = [];
    for (const a of P.realms) for (const b of P.realms) if (a.id < b.id && a.relations[b.id] > 15) pairs.push([a.id, b.id]);
    rng.shuffle(pairs);
    for (const [a, b] of pairs.slice(0, 2)) makeAlliance(world, P, a, b, 0, true);
    log(P, 0, `Почалася Ера Сміливців. На континенті ${world.realms.length} держав, і кожна вважає себе центром світу.`, 'info');
    return P;
  }

  function computeBorders(world) {
    const borders = world.realms.map(() => new Set());
    for (const B of world.baronies) for (const n of B.adj) {
      const o1 = B.owner, o2 = world.baronies[n].owner;
      if (o1 >= 0 && o2 >= 0 && o1 !== o2) borders[o1].add(o2);
    }
    return borders;
  }

  function roadAdj(world) {
    if (world._roadAdj) return world._roadAdj;
    const adj = world.baronies.map(() => []);
    for (const r of world.roads) {
      adj[r.a].push({ to: r.b, cost: r.cost }); adj[r.b].push({ to: r.a, cost: r.cost });
    }
    world._roadAdj = adj;
    return adj;
  }

  function bfsPath(world, from, to) {
    const adj = roadAdj(world);
    const dist = new Map([[from, 0]]), prev = new Map();
    const heap = new ISK.world.MinHeap(); heap.push(from, 0);
    while (heap.size) {
      const u = heap.pop(); if (u === to) break;
      for (const e of adj[u]) {
        const nd = dist.get(u) + e.cost;
        if (!dist.has(e.to) || nd < dist.get(e.to)) { dist.set(e.to, nd); prev.set(e.to, u); heap.push(e.to, nd); }
      }
    }
    if (!dist.has(to)) return null;
    const path = [to]; let k = to;
    while (k !== from) { k = prev.get(k); path.push(k); }
    return path.reverse();
  }

  function log(P, day, text, type = 'info', realms = []) {
    P.chronicle.unshift({ day, text, type, realms });
    if (P.chronicle.length > 400) P.chronicle.length = 400;
  }

  function rname(world, id) { return world.realms[id].fullName; }

  function atWar(P, a, b) {
    return P.wars.some((w) => (w.attackers.includes(a) && w.defenders.includes(b)) || (w.attackers.includes(b) && w.defenders.includes(a)));
  }
  function warsOf(P, a) { return P.wars.filter((w) => w.attackers.includes(a) || w.defenders.includes(a)); }
  function enemiesOf(P, a) {
    const s = new Set();
    for (const w of warsOf(P, a)) for (const e of (w.attackers.includes(a) ? w.defenders : w.attackers)) s.add(e);
    return s;
  }

  function relation(P, a, b) { return P.realms[a].relations[b] || 0; }
  function addRel(P, a, b, v) {
    if (a === b) return;
    const clamp = (x) => Math.max(-100, Math.min(100, x));
    P.realms[a].relations[b] = clamp((P.realms[a].relations[b] || 0) + v);
    P.realms[b].relations[a] = clamp((P.realms[b].relations[a] || 0) + v);
  }

  function makeAlliance(world, P, a, b, day, silent) {
    const A = P.realms[a], B = P.realms[b];
    if (A.alliances.includes(b)) return;
    A.alliances.push(b); B.alliances.push(a);
    addRel(P, a, b, 15);
    if (!silent) log(P, day, `🤝 ${rname(world, a)} і ${rname(world, b)} уклали оборонний союз. Обмінялися клятвами і рецептами пирогів.`, 'diplomacy', [a, b]);
    else log(P, day, `🤝 ${rname(world, a)} і ${rname(world, b)} — давні союзники.`, 'diplomacy', [a, b]);
  }
  function breakAlliance(world, P, a, b, day, reason) {
    const A = P.realms[a], B = P.realms[b];
    A.alliances = A.alliances.filter((x) => x !== b); B.alliances = B.alliances.filter((x) => x !== a);
    addRel(P, a, b, -25);
    log(P, day, `💔 Союз між ${rname(world, a)} і ${rname(world, b)} розірвано${reason ? ': ' + reason : '.'}`, 'diplomacy', [a, b]);
  }

  function realmPower(world, P, id) {
    const st = P.realms[id];
    const army = P.armies.filter((x) => x.realm === id).reduce((s, x) => s + x.size, 0);
    return st.manpower + army + st.gold * 0.5;
  }

  function ownedBaronies(world, id) { return world.baronies.filter((b) => b.owner === id); }

  const WAR_NAMES = [
    (a, b) => `Війна за ${b}`, (a, b) => `Велика ${a}-${b} війна`, () => 'Борщова війна', () => 'Війна Сломаного Списа',
    () => 'Війна через образливу листівку', () => 'Війна за останній пиріжок', (a, b) => `Прикордонний конфлікт ${b}`,
    () => 'Столітня (сподіваємось, ні) війна', () => 'Війна Трьох Корон і Однієї Корови',
  ];

  function declareWar(world, P, att, def, day, rng, reason, target) {
    if (att === def || atWar(P, att, def)) return null;
    const A = P.realms[att];
    if (A.alliances.includes(def)) breakAlliance(world, P, att, def, day, 'зрада!');
    const war = {
      id: P.nextId++, attackers: [att], defenders: [def], leaderA: att, leaderD: def, start: day, score: 0,
      reason, target, battles: 0, name: rng.pick(WAR_NAMES)(world.realms[att].name, world.baronies[target]?.name || world.realms[def].name),
    };
    P.wars.push(war);
    addRel(P, att, def, -50);
    log(P, day, `⚔️ ВІЙНА! ${rname(world, att)} ⟶ ${rname(world, def)}. Привід: ${reason}. Хроністи назвали її «${war.name}».`, 'war', [att, def]);
    // call allies
    const call = (side, leader, enemyLeader) => {
      for (const al of P.realms[leader].alliances.slice()) {
        if (P.realms[al].dead || war.attackers.includes(al) || war.defenders.includes(al)) continue;
        if (atWar(P, al, enemyLeader) || P.realms[al].alliances.includes(enemyLeader)) {
          if (P.realms[al].alliances.includes(enemyLeader) && !atWar(P, al, enemyLeader)) continue; // allied to both: stays out
        }
        const rel = relation(P, al, leader);
        const accept = rel > 10 && rng.chance(0.55 + rel / 250 + (side === 'def' ? 0.2 : 0));
        if (accept) {
          (side === 'att' ? war.attackers : war.defenders).push(al);
          log(P, day, `🛡️ ${rname(world, al)} вступає у війну на боці союзника — ${rname(world, leader)}.`, 'war', [al, leader]);
          addRel(P, al, enemyLeader, -30);
        } else {
          log(P, day, `🙈 ${rname(world, al)} ігнорує заклик союзника (${rname(world, leader)}). Незручно вийшло.`, 'diplomacy', [al, leader]);
          addRel(P, al, leader, -35);
          if (rng.chance(0.5)) breakAlliance(world, P, al, leader, day, 'боягузтво союзника');
        }
      }
    };
    call('def', def, att);
    call('att', att, def);
    for (const r of [...war.attackers, ...war.defenders]) mobilize(world, P, r, day, rng);
    return war;
  }

  function mobilize(world, P, rid, day, rng) {
    const st = P.realms[rid];
    if (P.armies.some((a) => a.realm === rid)) return;
    const total = Math.floor(st.manpower * 0.85);
    if (total < 300) return;
    st.manpower -= total;
    const n = total > 9000 ? 3 : total > 3500 ? 2 : 1;
    const own = ownedBaronies(world, rid);
    const enemies = enemiesOf(P, rid);
    // place near the front: own baronies adjacent to enemy
    const front = own.filter((b) => b.adj.some((n2) => enemies.has(world.baronies[n2].owner)));
    for (let i = 0; i < n; i++) {
      const at = (front.length ? rng.pick(front) : world.baronies[world.realms[rid].capital]) || own[0];
      if (!at) continue;
      P.armies.push({ id: P.nextId++, realm: rid, size: Math.floor(total / n), node: at.id, path: [], prog: 0, target: -1, siege: 0, morale: 1, name: `${i + 1}-ша армія ${world.realms[rid].name}` });
    }
  }

  function demobilize(world, P, rid) {
    const st = P.realms[rid];
    for (const a of P.armies.filter((x) => x.realm === rid)) st.manpower += a.size;
    P.armies = P.armies.filter((x) => x.realm !== rid);
    st.manpower = Math.min(st.manpower, st.maxManpower);
  }

  function chooseTarget(world, P, army, rng) {
    const enemies = enemiesOf(P, army.realm);
    const friends = new Set([army.realm]);
    for (const w of warsOf(P, army.realm)) for (const r of (w.attackers.includes(army.realm) ? w.attackers : w.defenders)) friends.add(r);
    const here = world.baronies[army.node];
    let best = -1, bs = -Infinity;
    for (const B of world.baronies) {
      const controller = B.occ >= 0 ? B.occ : B.owner;
      let score = -Infinity;
      if (enemies.has(controller)) {
        // enemy-held; prefer close, valuable, weakly fortified
        score = 30 + B.dev * 3 - B.fort * 4 - Math.hypot(B.x - here.x, B.y - here.y) * 1.6;
        if (B.type === 'capital') score += 25;
        if (B.owner === army.realm) score += 30; // liberate own land
      }
      if (score > bs) { bs = score; best = B.id; }
    }
    // hostile armies nearby: attack if stronger
    for (const e of P.armies) {
      if (!enemies.has(e.realm)) continue;
      const B = world.baronies[e.node];
      const d = Math.hypot(B.x - here.x, B.y - here.y);
      const s = 45 - d * 1.5 + (army.size > e.size * 1.15 ? 25 : -40);
      if (s > bs) { bs = s; best = B.id; }
    }
    return best;
  }

  function resolveBattle(world, P, day, rng, armiesHere, node) {
    // group by side using war membership of first army
    const a0 = armiesHere[0];
    const enemies = enemiesOf(P, a0.realm);
    const sideA = armiesHere.filter((x) => !enemies.has(x.realm));
    const sideB = armiesHere.filter((x) => enemies.has(x.realm));
    if (!sideB.length) return;
    const B = world.baronies[node];
    const str = (side) => side.reduce((s, x) => {
      const ruler = P.realms[x.realm].ruler;
      const genius = 1 + traitSum(ruler, 'war');
      const home = (B.occ >= 0 ? B.occ : B.owner) === x.realm ? 1 + B.fort * 0.06 : 1;
      return s + x.size * x.morale * genius * home * (x.bonus || 1);
    }, 0);
    const sA = str(sideA) * rng.float(0.75, 1.25), sB = str(sideB) * rng.float(0.75, 1.25);
    const winA = sA >= sB;
    const [W, L] = winA ? [sideA, sideB] : [sideB, sideA];
    const ratio = Math.min(sA, sB) / Math.max(sA, sB);
    let lossW = 0, lossL = 0;
    for (const x of W) { const l = Math.floor(x.size * rng.float(0.08, 0.2) * (0.5 + ratio)); x.size -= l; lossW += l; x.morale = Math.min(1.2, x.morale + 0.05); x.bonus = 1; }
    for (const x of L) { const l = Math.floor(x.size * rng.float(0.3, 0.6)); x.size -= l; lossL += l; x.morale = Math.max(0.4, x.morale - 0.2); x.bonus = 1; x.retreat = true; }
    const wRealm = W[0].realm, lRealm = L[0].realm;
    // war score
    for (const war of P.wars) {
      const attW = war.attackers.includes(wRealm) && war.defenders.includes(lRealm);
      const defW = war.defenders.includes(wRealm) && war.attackers.includes(lRealm);
      if (attW) war.score = Math.min(100, war.score + 6 + Math.round(lossL / 1500));
      if (defW) war.score = Math.max(-100, war.score - 6 - Math.round(lossL / 1500));
      if (attW || defW) war.battles++;
    }
    P.realms[wRealm].wins++; P.realms[lRealm].losses++;
    const big = lossL + lossW > 6000;
    log(P, day, `${big ? '🩸 Велика битва' : '⚔️ Битва'} біля ${B.name}. Перемога: ${rname(world, wRealm)} (втрати ${lossW.toLocaleString('uk')}). Поразка: ${rname(world, lRealm)} (втрати ${lossL.toLocaleString('uk')}).`, 'battle', [wRealm, lRealm]);
    P.armies = P.armies.filter((x) => x.size >= 150 || (P.realms[x.realm].manpower += x.size, false));
  }

  function siegeTick(world, P, day, rng, army) {
    const B = world.baronies[army.node];
    const controller = B.occ >= 0 ? B.occ : B.owner;
    const enemies = enemiesOf(P, army.realm);
    if (!enemies.has(controller)) { army.siege = 0; return false; }
    army.siege += (army.size / (B.fort * 1700 + B.dev * 300)) * rng.float(0.6, 1.3);
    if (army.siege >= 1) {
      army.siege = 0;
      if (!enemies.has(B.owner)) {
        B.occ = -1;
        log(P, day, `🏳️ ${rname(world, army.realm)} звільняє ${B.name}. Місцеві святкують, корчмар роздає пиво (тепле).`, 'siege', [army.realm]);
      } else {
        B.occ = army.realm;
        log(P, day, `🏴 ${rname(world, army.realm)} захоплює ${ISK.world.SETTLEMENT[B.type].name.toLowerCase()} ${B.name} (власник: ${rname(world, B.owner)}).`, 'siege', [army.realm, B.owner]);
      }
      for (const war of P.wars) {
        const att = war.attackers.includes(army.realm), def = war.defenders.includes(army.realm);
        if (!att && !def) continue;
        const v = 4 + B.dev + (B.type === 'capital' ? 20 : 0);
        war.score = Math.max(-100, Math.min(100, war.score + (att ? v : -v)));
      }
      world._ownerDirty = true;
      return true;
    }
    return false;
  }

  function endWar(world, P, war, day, rng, outcome) {
    const winners = outcome === 'att' ? war.attackers : outcome === 'def' ? war.defenders : [];
    const losers = outcome === 'att' ? war.defenders : outcome === 'def' ? war.attackers : [];
    const gained = [];
    let cap = 2 + Math.floor(Math.abs(war.score) / 12);
    for (const B of world.baronies) {
      if (B.occ < 0) continue;
      const occInWar = war.attackers.includes(B.occ) || war.defenders.includes(B.occ);
      if (!occInWar) continue;
      if (winners.includes(B.occ) && losers.includes(B.owner)) {
        // winner annexes occupied lands (not the loser's capital unless it's their last)
        const loserCapital = world.realms[B.owner].capital === B.id;
        if ((!loserCapital || ownedBaronies(world, B.owner).length <= 1) && cap-- > 0) {
          gained.push(B.name);
          for (const o of P.realms) if (o.id !== B.occ && !o.dead) addRel(P, o.id, B.occ, o.id === B.owner ? -10 : -3);
          B.owner = B.occ;
        }
      }
      B.occ = -1;
    }
    P.wars = P.wars.filter((w) => w !== war);
    const all = [...war.attackers, ...war.defenders];
    for (const a of war.attackers) for (const d of war.defenders) { P.realms[a].truces[d] = day + 300; P.realms[d].truces[a] = day + 300; }
    for (const r of all) {
      if (!warsOf(P, r).length) demobilize(world, P, r);
      P.realms[r].exhaustion = Math.max(0, P.realms[r].exhaustion - 20);
    }
    if (outcome === 'white') {
      log(P, day, `🕊️ «${war.name}» завершилась білим миром. Усі повернулися додому, ніхто нічого не виграв. Як завжди.`, 'peace', all);
    } else {
      const W = winners[0], L = losers[0];
      log(P, day, `📜 Мир! «${war.name}» завершено. Переможець: ${rname(world, W)}.${gained.length ? ' Анексовано: ' + gained.slice(0, 6).join(', ') + (gained.length > 6 ? ` та ще ${gained.length - 6}` : '') + '.' : ''}`, 'peace', all);
      for (const l of losers) { P.realms[l].stability -= 10; }
    }
    // eliminate realms without land
    for (const st of P.realms) {
      if (st.dead) continue;
      if (!ownedBaronies(world, st.id).length) {
        st.dead = true;
        demobilize(world, P, st.id); P.armies = P.armies.filter((a) => a.realm !== st.id);
        for (const o of P.realms) o.alliances = o.alliances.filter((x) => x !== st.id);
        log(P, day, `☠️ ${rname(world, st.id)} припиняє своє існування. Історики плачуть, картографи радіють.`, 'war', [st.id]);
      }
    }
    world._ownerDirty = true;
  }

  function evaluatePeace(world, P, war, day, rng) {
    const dur = day - war.start;
    const exA = Math.max(...war.attackers.map((r) => P.realms[r].exhaustion));
    const exD = Math.max(...war.defenders.map((r) => P.realms[r].exhaustion));
    const armiesA = P.armies.filter((a) => war.attackers.includes(a.realm)).length;
    const armiesD = P.armies.filter((a) => war.defenders.includes(a.realm)).length;
    if (war.score >= 60 || (war.score >= 30 && (exD > 55 || armiesD === 0) && dur > 40)) return endWar(world, P, war, day, rng, 'att');
    if (war.score <= -60 || (war.score <= -30 && (exA > 55 || armiesA === 0) && dur > 40)) return endWar(world, P, war, day, rng, 'def');
    if (dur > 240 && Math.abs(war.score) < 25 && rng.chance(0.25)) return endWar(world, P, war, day, rng, 'white');
    if (exA > 85 && exD > 85) return endWar(world, P, war, day, rng, war.score > 15 ? 'att' : war.score < -15 ? 'def' : 'white');
    if (armiesA === 0 && armiesD === 0 && dur > 30) return endWar(world, P, war, day, rng, war.score > 10 ? 'att' : war.score < -10 ? 'def' : 'white');
  }

  function aiDiplomacy(world, P, st, day, rng, borders) {
    if (st.dead) return;
    const R = world.realms[st.id];
    const agg = 0.25 + traitSum(st.ruler, 'agg') + (R.isEmpire ? 0.15 : 0) + (st.stability - 50) / 300;
    const dip = 0.3 + traitSum(st.ruler, 'dip');
    const myWars = warsOf(P, st.id);
    // --- War declaration ---
    if (day > 40 && !myWars.length && st.exhaustion < 30 && st.manpower > st.maxManpower * 0.6 && rng.chance(Math.max(0, agg) * 0.11)) {
      const myPow = realmPower(world, P, st.id);
      let best = null, bs = -Infinity;
      for (const other of borders[st.id]) {
        const O = P.realms[other];
        if (O.dead || st.alliances.includes(other) || (st.truces[other] || 0) > day) continue;
        const rel = relation(P, st.id, other);
        let enemyPow = realmPower(world, P, other);
        for (const al of O.alliances) if (!P.realms[al].dead && al !== st.id) enemyPow += realmPower(world, P, al) * 0.6;
        let myTotal = myPow;
        for (const al of st.alliances) if (!P.realms[al].dead && al !== other) myTotal += realmPower(world, P, al) * 0.4;
        // claims: de jure lands owned by them
        const claims = world.baronies.filter((b) => b.owner === other && b.realm === st.id);
        const score = (myTotal / Math.max(1, enemyPow)) * 40 - rel * 0.6 + claims.length * 12 + rng.float(-10, 10);
        if (myTotal > enemyPow * 1.1 && rel < 15 && score > bs) { bs = score; best = { other, claims }; }
      }
      if (best && bs > 45) {
        const reasons = best.claims.length
          ? [`повернення споконвічних земель (${best.claims[0].name})`, `історичні претензії на ${best.claims[0].name}`]
          : ['образа на королівському бенкеті', 'прикордонні сутички', 'жага слави', 'хтось наступив на королівську мантію', 'неправильно написане ім\'я в листі', 'божественне провидіння (і жадібність)'];
        const border = world.baronies.filter((b) => b.owner === best.other && b.adj.some((n) => world.baronies[n].owner === st.id));
        const target = (best.claims[0] || rng.pick(border) || world.baronies[world.realms[best.other].capital]).id;
        declareWar(world, P, st.id, best.other, day, rng, rng.pick(reasons), target);
        return;
      }
    }
    // --- Alliances ---
    if (st.alliances.length < 2 && rng.chance(0.12 * (1 + dip))) {
      let cand = null, cs = -Infinity;
      for (const O of P.realms) {
        if (O.id === st.id || O.dead || st.alliances.includes(O.id) || atWar(P, st.id, O.id) || O.alliances.length >= 2) continue;
        const rel = relation(P, st.id, O.id);
        // common rivals
        let common = 0;
        for (const X of P.realms) if (X.id !== st.id && X.id !== O.id && relation(P, st.id, X.id) < -20 && relation(P, O.id, X.id) < -20) common++;
        const s = rel + common * 15;
        if (rel > 25 && s > cs) { cs = s; cand = O.id; }
      }
      if (cand !== null && cs > 40) makeAlliance(world, P, st.id, cand, day);
    }
    // --- Improve relations with someone ---
    if (rng.chance(0.15 * (1 + dip))) {
      const o = rng.pick(P.realms.filter((x) => x.id !== st.id && !x.dead));
      if (o && !atWar(P, st.id, o.id)) {
        addRel(P, st.id, o.id, rng.int(3, 9));
        if (rng.chance(0.08)) log(P, day, `💌 ${rulerFull(world, st)} ${st.ruler.female ? 'надіслала' : 'надіслав'} подарунок (отримувач: ${rname(world, o.id)}): ${rng.pick(['живого лебедя', 'бочку меду', 'портрет себе (дуже великий)', 'рідкісного кота', 'карету без коліс', 'збірку власних віршів'])}.`, 'diplomacy', [st.id, o.id]);
      }
    }
  }

  function aiArmies(world, P, day, rng) {
    const adj = roadAdj(world);
    // movement
    for (const army of P.armies) {
      if (army.retreat) {
        army.retreat = false;
        const own = ownedBaronies(world, army.realm).filter((b) => b.occ < 0);
        if (own.length) {
          const here = world.baronies[army.node];
          own.sort((a, b) => Math.hypot(a.x - here.x, a.y - here.y) - Math.hypot(b.x - here.x, b.y - here.y));
          const p = bfsPath(world, army.node, own[Math.min(1, own.length - 1)].id);
          if (p) { army.path = p.slice(1); army.target = own[0].id; army.prog = 0; }
        }
        continue;
      }
      if (!army.path.length) {
        // at node: besiege or pick target
        const B = world.baronies[army.node];
        const controller = B.occ >= 0 ? B.occ : B.owner;
        if (enemiesOf(P, army.realm).has(controller)) { siegeTick(world, P, day, rng, army); continue; }
        if (day % 3 === army.id % 3) {
          const t = chooseTarget(world, P, army, rng);
          if (t >= 0 && t !== army.node) {
            const p = bfsPath(world, army.node, t);
            if (p) { army.path = p.slice(1); army.target = t; army.prog = 0; }
          }
        }
        continue;
      }
      const next = army.path[0];
      const edge = adj[army.node].find((e) => e.to === next);
      const days = Math.max(1, Math.round((edge ? edge.cost : 8) / 5));
      army.prog += 1 / days;
      if (army.prog >= 1) {
        army.node = next; army.path.shift(); army.prog = 0;
        // stop on enemy-held barony to besiege
        const B = world.baronies[army.node];
        const controller = B.occ >= 0 ? B.occ : B.owner;
        if (enemiesOf(P, army.realm).has(controller)) army.path = [];
      }
    }
    // battles where hostile armies share a node
    const byNode = new Map();
    for (const a of P.armies) { if (!byNode.has(a.node)) byNode.set(a.node, []); byNode.get(a.node).push(a); }
    for (const [node, list] of byNode) {
      if (list.length < 2) continue;
      const en = enemiesOf(P, list[0].realm);
      if (list.some((x) => en.has(x.realm))) resolveBattle(world, P, day, rng, list, node);
    }
  }

  function economyTick(world, P, day, rng) {
    const income = new Array(P.realms.length).fill(0);
    for (const B of world.baronies) {
      if (B.owner < 0) continue;
      const ctrl = B.occ >= 0 ? B.occ : B.owner;
      const v = B.dev * 0.55 + (B.type === 'capital' ? 4 : 0) + (B.type === 'port' ? 1 : 0);
      income[ctrl] += v * (B.occ >= 0 ? 0.5 : 1);
    }
    for (const st of P.realms) {
      if (st.dead) continue;
      const eco = 1 + traitSum(st.ruler, 'eco') + (st.stability - 50) / 250;
      const armies = P.armies.filter((a) => a.realm === st.id);
      const upkeep = armies.reduce((s, a) => s + a.size * 0.004, 0) + (st.ruler.traits.includes('glutton') ? 2 : 0);
      st.gold += income[st.id] * eco - upkeep;
      const devSum = world.baronies.reduce((s, b) => s + (b.owner === st.id ? b.dev : 0), 0);
      st.maxManpower = Math.round(devSum * 240 * (world.realms[st.id].isEmpire ? 1.25 : 1));
      if (!armies.length) st.manpower = Math.min(st.maxManpower, st.manpower + st.maxManpower * 0.004);
      else {
        st.exhaustion = Math.min(100, st.exhaustion + 0.25 + (st.gold < 0 ? 0.5 : 0));
        // reinforce armies
        if (st.manpower > 200 && st.gold > 50) {
          const a = rng.pick(armies); const add = Math.min(st.manpower, 150); a.size += add; st.manpower -= add; st.gold -= add * 0.1;
        }
      }
      // peacetime spending: development, forts, feasts
      if (!armies.length && st.gold > 1500 && rng.chance(0.05)) {
        const own = world.baronies.filter((b) => b.owner === st.id && b.occ < 0);
        const B = rng.pick(own);
        if (B) {
          const cost = 300 + B.dev * 160;
          if (B.dev < 10 && st.gold > cost) { st.gold -= cost; B.dev++; }
          else if (B.fort < 6 && st.gold > cost) { st.gold -= cost; B.fort++; }
        }
      }
      if (st.gold > 3000) st.gold -= (st.gold - 3000) * 0.01; // court, feasts, embezzlement
      if (st.gold < -300) { st.stability = Math.max(0, st.stability - 0.3); }
      else st.stability += (60 - st.stability) * 0.004;
      if (!armies.length) st.exhaustion = Math.max(0, st.exhaustion - 0.3);
    }
  }

  function relationsDrift(world, P, borders) {
    const total = world.baronies.length;
    const share = P.realms.map((r) => world.baronies.reduce((n, b) => n + (b.owner === r.id ? 1 : 0), 0) / total);
    for (const a of P.realms) {
      if (a.dead) continue;
      for (const b of P.realms) {
        if (b.id <= a.id || b.dead) continue;
        let v = a.relations[b.id] || 0;
        v += (0 - v) * 0.004;
        if (borders[a.id].has(b.id)) v -= 0.03;
        if (a.alliances.includes(b.id)) v += 0.05;
        if (share[a.id] > 0.3 || share[b.id] > 0.3) v -= 0.05; // fear of the hegemon
        a.relations[b.id] = v; b.relations[a.id] = v;
      }
    }
  }

  function randomEvents(world, P, day, rng) {
    for (const st of P.realms) {
      if (st.dead) continue;
      const R = world.realms[st.id];
      if (day % 360 === 0 && day > 0) st.ruler.age++;
      // ruler death
      const deathP = st.ruler.age > 55 ? (st.ruler.age - 50) * 0.00012 : 0.00002;
      if (rng.chance(deathP)) {
        const old = rulerFull(world, st);
        const cause = rng.pick(['від старості', 'вдавившись куркою на бенкеті', 'на полюванні (ведмідь був сильніший)', 'від підозрілого вина', 'впавши з балкона, коли махав натовпу', 'від сміху (жарт був справді смішний)']);
        const prevName = st.ruler.name;
        const heir = makeRuler(rng, R, day);
        heir.age = rng.int(16, 40);
        if (rng.chance(0.3)) { heir.name = prevName; heir.female = st.ruler.female; heir.number = st.ruler.number + 1; }
        st.ruler = heir;
        st.stability -= 12;
        log(P, day, `👑 ${old} ${st.ruler.female ? 'померла' : 'помер'} ${cause}. На трон сходить ${rulerFull(world, st)} (${heir.traits.map((t) => TRAITS[t].name).join(', ')}).`, 'dynasty', [st.id]);
        // new ruler may reconsider alliances
        for (const al of st.alliances.slice()) if (rng.chance(0.15)) breakAlliance(world, P, st.id, al, day, 'новий правитель не довіряє старим друзям');
        continue;
      }
      if (rng.chance(0.0016)) {
        const o = rng.pick(P.realms.filter((x) => x.id !== st.id && !x.dead && !atWar(P, x.id, st.id)));
        if (o) { addRel(P, st.id, o.id, 30); log(P, day, `💍 Королівське весілля! Династії ${R.name} та ${world.realms[o.id].name} поріднилися. Гості їли три дні.`, 'dynasty', [st.id, o.id]); }
      } else if (rng.chance(0.0015)) {
        const ns = [...computeBorders(world)[st.id]];
        if (ns.length) { const o = rng.pick(ns); addRel(P, st.id, o, -22); log(P, day, `😤 Прикордонний інцидент між ${R.fullName} і ${world.realms[o].fullName}: ${rng.pick(['вкрали козу', 'хтось перекинув прикордонний стовп', 'посли посварились через рецепт вареників', 'прикордонник показав язика', 'дракон сусідів наслідив на кордоні'])}. Відносини зіпсовані.`, 'diplomacy', [st.id, o]); }
      } else if (rng.chance(0.0008)) {
        st.manpower = Math.floor(st.manpower * 0.7);
        log(P, day, `🤧 ${R.fullName}: епідемія чуми кашлю! Лікарі радять зілля і менше обійматися.`, 'disaster', [st.id]);
      } else if (rng.chance(0.0012)) {
        st.gold += 200 + rng.int(0, 400);
        log(P, day, `🌾 ${R.fullName}: рекордний урожай! Казна поповнилась, гарбузи завбільшки з карету.`, 'economy', [st.id]);
      } else if (rng.chance(0.0006)) {
        const own = ownedBaronies(world, st.id);
        const B = rng.pick(own);
        if (B && B.dev > 1) { B.dev--; log(P, day, `🐉 Дракон напав на ${B.name} (${R.name})! Спалив млин і з'їв трьох корів. Розвиток знизився.`, 'disaster', [st.id]); }
      } else if (rng.chance(0.0006)) {
        const own = ownedBaronies(world, st.id);
        const B = rng.pick(own);
        if (B && B.dev < 10) { B.dev++; log(P, day, `🏗️ ${B.name} (${R.name}) процвітає: збудовано новий ринок і дуже гарний туалет.`, 'economy', [st.id]); }
      } else if (st.stability < 25 && rng.chance(0.004)) {
        st.gold -= 150; st.manpower = Math.floor(st.manpower * 0.85);
        log(P, day, `🔥 ${R.fullName}: повстання селян! Вимагають знизити податки і дозволити котів у тавернах.`, 'disaster', [st.id]);
      }
    }
  }

  function separatism(world, P, day, rng) {
    for (const B of world.baronies) {
      if (B.owner === B.realm || B.occ >= 0) continue;
      const home = P.realms[B.realm];
      const holder = P.realms[B.owner];
      if (home.dead) {
        if (rng.chance(0.0004)) {
          const prev = B.owner;
          home.dead = false; B.owner = B.realm;
          home.ruler = makeRuler(rng, world.realms[B.realm], day);
          home.manpower = 1500; home.gold = 600; home.stability = 50; home.exhaustion = 0;
          for (const o of P.realms) if (o.id !== home.id) { home.relations[o.id] = -10; o.relations[home.id] = -10; }
          addRel(P, prev, home.id, -40);
          log(P, day, `🌅 ${rname(world, home.id)} відроджується! Повстанці в ${B.name} проголосили нового правителя: ${rulerFull(world, home)}.`, 'dynasty', [home.id, prev]);
          world._ownerDirty = true;
        }
        continue;
      }
      if (atWar(P, B.owner, B.realm)) continue;
      const p = 0.00035 * (1 + (60 - holder.stability) / 40);
      if (rng.chance(p)) {
        const prev = B.owner;
        B.owner = B.realm;
        addRel(P, prev, B.realm, -20);
        log(P, day, `🔥 Повстання в ${B.name}! Місцеві вигнали намісника (${rname(world, prev)}) і повернулися під владу «рідної» корони — ${rname(world, B.realm)}.`, 'disaster', [prev, B.realm]);
        world._ownerDirty = true;
      }
    }
  }

  // Called once per in-game day.
  function tick(world, P, day) {
    P.day = day;
    const rng = new RNG((world.seed * 31 + day * 7919) >>> 0);
    economyTick(world, P, day, rng);
    aiArmies(world, P, day, rng);
    for (const war of P.wars.slice()) {
      // armies all gone from one side and no occupations? small score drift
      if ((day - war.start) % 7 === 0) evaluatePeace(world, P, war, day, rng);
    }
    // clean up wars where a side died
    for (const war of P.wars.slice()) {
      war.attackers = war.attackers.filter((r) => !P.realms[r].dead);
      war.defenders = war.defenders.filter((r) => !P.realms[r].dead);
      if (!war.attackers.length || !war.defenders.length) endWar(world, P, war, day, rng, war.attackers.length ? 'att' : 'def');
    }
    const borders = computeBorders(world);
    relationsDrift(world, P, borders);
    for (const st of P.realms) if ((day + st.id) % 7 === 0) aiDiplomacy(world, P, st, day, rng, borders);
    randomEvents(world, P, day, rng);
    separatism(world, P, day, rng);
  }

  function serialize(world, P) {
    return { P, owners: world.baronies.map((b) => [b.owner, b.occ, b.dev]) };
  }
  function restore(world, data) {
    data.owners.forEach(([o, occ, dev], i) => { world.baronies[i].owner = o; world.baronies[i].occ = occ; world.baronies[i].dev = dev; });
    world._ownerDirty = true;
    return data.P;
  }

  ISK.politics = {
    initPolitics, tick, declareWar, makeAlliance, breakAlliance, atWar, warsOf, enemiesOf, relation, addRel,
    rulerFull, rulerTitle, realmPower, ownedBaronies, computeBorders, bfsPath, log, TRAITS, serialize, restore,
  };
})();
