// Хроніки Дивосвіту v4 — "life" systems: seasons & weather, lords (barons→kings) with dialogs & quests, romance,
// marriage & dynasty, the player's own army (recruit, battle armies, siege, declare war), naval battles & piracy,
// rival guilds, caravans and world events, goddess calls and Twitch-viewer actions.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const D = () => ISK.data, PL = () => ISK.player, POL = () => ISK.politics, GM = () => ISK.game;
  const day = (G) => Math.floor(G.time);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const L = (G) => (G.life = G.life || {});
  function hash(...xs) { let h = 2166136261; for (const x of xs) { h ^= x; h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }

  // ---------------- seasons & weather ----------------
  function seasonOf(d) { const m = Math.floor((d % 360) / 30); return m === 11 || m <= 1 ? 3 : m <= 4 ? 0 : m <= 7 ? 1 : 2; }
  const WEATHER_TABLE = [
    [['rain', 35], ['clear', 45], ['fog', 10], ['storm', 10]],
    [['clear', 55], ['heat', 20], ['storm', 15], ['rain', 10]],
    [['rain', 40], ['fog', 25], ['clear', 25], ['storm', 10]],
    [['snow', 40], ['clear', 35], ['fog', 15], ['storm', 10]],
  ];
  function weatherOf(G, d) {
    const lf = L(G); if (lf.weatherOverride && lf.weatherOverride.until >= d) return lf.weatherOverride.key;
    const s = seasonOf(d); const r = hash(G.seed, Math.floor(d / 3)) % 100; let acc = 0;
    for (const [k, w] of WEATHER_TABLE[s]) { acc += w; if (r < acc) return k; }
    return 'clear';
  }
  function environment(G) {
    const d = day(G); const si = seasonOf(d); const S = D().SEASONS[si]; const wk = weatherOf(G, d); const Wt = D().WEATHER[wk];
    return { season: S, seasonIdx: si, weather: Wt, weatherKey: wk, travel: S.travel * Wt.travel, enc: Wt.enc };
  }

  // ---------------- lords ----------------
  const RANK = { baron: { t: 'Барон', tf: 'Баронеса', mul: 1, social: 1 }, count: { t: 'Граф', tf: 'Графиня', mul: 1.5, social: 2 }, duke: { t: 'Герцог', tf: 'Герцогиня', mul: 2.2, social: 3 }, king: { t: 'Король', tf: 'Королева', mul: 3.5, social: 5 } };
  function lordByKey(G, key) {
    const w = G.world; const [k, idS] = key.split(':'); const id = +idS;
    if (k === 'b') { const B = w.baronies[id]; return B && B.lord && { key, kind: 'baron', ...B.lord, seat: id, realm: B.owner, domain: B.name }; }
    if (k === 'c') { const C = w.counties[id]; return C && C.lord && { key, kind: 'count', ...C.lord, seat: C.seat, realm: C.realm, domain: 'графство ' + C.name }; }
    if (k === 'd') { const Du = w.duchies[id]; return Du && Du.lord && { key, kind: 'duke', ...Du.lord, seat: Du.seat, realm: Du.realm, domain: 'герцогство ' + Du.name }; }
    if (k === 'k') { const st = G.P.realms[id]; const R = w.realms[id]; if (!st || st.dead || R.isDemon) return null; return { key, kind: 'king', name: st.ruler.name, female: !!st.ruler.female, trait: hash(id, G.seed) % 10, age: st.ruler.age, portrait: hash(id, 77), seat: R.capital, realm: id, domain: R.fullName, royalTitle: st.ruler.female ? R.rulerTitleF : R.rulerTitle }; }
    return null;
  }
  function lordsAt(G, bid) {
    const w = G.world, B = w.baronies[bid]; if (!B || POL().isDemon(G.P, B.owner)) return [];
    const out = [];
    const R = w.realms[B.owner]; if (R && R.capital === bid) { const k = lordByKey(G, 'k:' + B.owner); if (k) out.push(k); }
    const Du = w.duchies[B.duchy]; if (Du && Du.seat === bid) out.push(lordByKey(G, 'd:' + Du.id));
    const Co = w.counties[B.county]; if (Co && Co.seat === bid) out.push(lordByKey(G, 'c:' + Co.id));
    if (B.holder !== 'player') out.push(lordByKey(G, 'b:' + bid));
    return out.filter(Boolean);
  }
  function lordTitle(l) { return l.kind === 'king' ? l.royalTitle : (l.female ? RANK[l.kind].tf : RANK[l.kind].t); }
  function lordTrait(l) { const t = D().LORD_TRAITS[l.trait % D().LORD_TRAITS.length]; return { id: t[0], name: t[1], desc: t[2] }; }
  function lordRel(G, key) {
    const l = lordByKey(G, key); if (!l) return 0; const p = G.player; const tr = lordTrait(l).id;
    let v = ((G.P.realms[l.realm] && G.P.realms[l.realm].playerRep) || 0) * 0.5 + p.social * 3 + (p.lordRel[key] || 0);
    if (tr === 'kind') v += 10; if (tr === 'paranoid') v -= 15; if (tr === 'romantic' && p.cheat === 'charisma') v += 10;
    if (p.cheat === 'royal') v += 15; if (D().hasArt(p, 'lords')) v += 25; if (p.spouse && p.spouse.kind === 'noble') v += 15;
    return Math.max(-100, Math.min(100, Math.round(v)));
  }
  function addLordRel(G, key, n) { G.player.lordRel[key] = (G.player.lordRel[key] || 0) + n; }
  function lordLine(G, l, kind) {
    const t = lordTrait(l).id; const arr = D().LORD_LINES[kind] || D().LORD_LINES.greet;
    const special = { greedy: 'Золото маєш? Ні? Тоді говори швидко.', glutton: 'Ти голодний? Я — завжди. Сідай, тут кабанчик.', poet: '«О мандрівнику, чиє волосся — вітер...» Це про тебе. Подобається?', lazy: 'Ох... знову відвідувачі... *позіхає*', paranoid: 'Хто тебе послав?! Покажи руки! ...Добре, говори.', warlike: 'Ти воїн? Чудово! Хочеш когось завоювати? Я — так.' };
    if (kind === 'greet' && special[t] && Math.random() < 0.5) return special[t];
    return pick(arr).replace('{realm}', G.world.realms[pick(G.world.realms.filter((r) => !r.isDemon)).id].name);
  }
  function lordGift(G, key, gold) {
    const p = G.player; if (p.gold < gold) return 'Недостатньо золота';
    p.gold -= gold; const l = lordByKey(G, key); const tr = lordTrait(l).id;
    const n = Math.round((gold / (40 * RANK[l.kind].mul)) * (tr === 'greedy' ? 2 : 1));
    addLordRel(G, key, Math.min(25, n)); return null;
  }
  // lord quests -> regular player quests with lordKey
  function lordQuest(G, key) {
    const lf = L(G); lf.lordQ = lf.lordQ || {}; const d = day(G);
    const cur = lf.lordQ[key]; if (cur && d - cur.day < 12) return cur.q;
    const l = lordByKey(G, key); const w = G.world; const B = w.baronies[l.seat] || w.baronies[0]; const p = G.player;
    const rng = new ISK.RNG(hash(G.seed, d, key.length, l.seat));
    const mul = RANK[l.kind].mul; const lvl = Math.max(B.danger, p.level - 1);
    const base = { id: 'lq' + rng.int(1, 1e9), from: l.seat, realm: l.realm, lordKey: key, lordName: `${lordTitle(l)} ${l.name}`, pts: 0, progress: 0, relGain: Math.round(10 + 5 * mul), gold: Math.round((80 + lvl * 20) * mul), xp: Math.round((60 + lvl * 18) * mul), fame: Math.round(6 * mul) };
    const types = ['lord_hunt', 'lord_letter', 'lord_gather', 'lord_dungeon', 'lord_spy', 'lord_duel'];
    const enemyArmy = G.P.armies.find((a) => POL().enemiesOf(G.P, l.realm).has(a.realm) && Math.hypot(w.baronies[a.node].x - B.x, w.baronies[a.node].y - B.y) < 50);
    if (enemyArmy) types.push('lord_army', 'lord_army');
    const tp = rng.pick(types); const T = D().LORD_QUESTS.find((x) => x.type === tp);
    let q = null;
    if (T.type === 'lord_hunt') { const keys = Object.entries(D().MONSTERS).filter(([, m]) => m.biome && m.biome.length).map(([k2]) => k2).filter((k2) => k2 !== 'mimic'); const mk = rng.pick(keys); const n = rng.int(4, 8); q = { ...base, type: 'hunt', target: mk, count: n, base: p.kills[mk] || 0, at: 'b:' + l.seat, title: `${T.title}: ${D().MONSTERS[mk].name} ×${n}`, desc: T.desc.replace('{monster}', D().MONSTERS[mk].name.toLowerCase()).replace('{n}', n) }; }
    else if (T.type === 'lord_letter') { const far = w.baronies.filter((b) => b.id !== l.seat && b.land === B.land && !POL().isDemon(G.P, b.owner) && Math.hypot(b.x - B.x, b.y - B.y) > 15 && Math.hypot(b.x - B.x, b.y - B.y) < 70); if (far.length) { const t2 = rng.pick(far); q = { ...base, type: 'deliver', to: 'b:' + t2.id, deadline: d + 40, title: `${T.title} → ${t2.name}`, desc: T.desc.replace('{target}', t2.lord ? t2.lord.name : 'місцевому лорду').replace('{town}', t2.name) }; } }
    else if (T.type === 'lord_gather') { const mats = Object.entries(D().MATERIALS).filter(([, m]) => ['herb', 'crop', 'ore', 'build', 'fish'].includes(m.kind) && (m.tier === undefined || m.tier <= 3) && m.price < 60); const [mid, mm] = rng.pick(mats); const n = rng.int(4, 9); q = { ...base, type: 'gather', item: mid, count: n, title: `${T.title}: ${mm.name} ×${n}`, desc: T.desc.replace('{n}', n).replace('{item}', mm.name) }; }
    else if (T.type === 'lord_dungeon') { const dg = w.dungeons.filter((x) => !x.final && x.type !== 'hellgate' && !G.cleared[x.id]).sort((a, b) => Math.hypot(a.x - B.x, a.y - B.y) - Math.hypot(b.x - B.x, b.y - B.y))[0]; if (dg) q = { ...base, type: 'clear', dungeon: dg.id, title: `${T.title}: ${dg.name}`, desc: T.desc.replace('{dungeon}', dg.name), gold: base.gold + dg.level * 20 }; }
    else if (T.type === 'lord_spy') { const en = [...POL().enemiesOf(G.P, l.realm)].filter((r) => !G.P.realms[r].dead && !POL().isDemon(G.P, r)); const rr = en.length ? rng.pick(en) : rng.pick(w.realms.filter((r) => !r.isDemon && r.id !== l.realm)).id; const cap = w.baronies[w.realms[rr].capital]; q = { ...base, type: 'spy', to: 'b:' + cap.id, title: `${T.title}: ${cap.name}`, desc: T.desc.replace('{town}', cap.name).replace('{realm}', w.realms[rr].name), gold: base.gold * 1.4 }; }
    else if (T.type === 'lord_duel') q = { ...base, type: 'duel', lvl: lvl + 2, champion: `Сер ${rng.pick(['Бертран', 'Гаврило', 'Ульріх', 'Остап', 'Ланселот-молодший', 'Тимко Залізна Щелепа'])}`, title: T.title, desc: T.desc };
    else if (T.type === 'lord_army' && enemyArmy) q = { ...base, type: 'horde', army: enemyArmy.id, at: 'b:' + enemyArmy.node, lvl: lvl + 3, title: `${T.title}: ${enemyArmy.name}`, desc: T.desc.replace('{army}', enemyArmy.name), gold: base.gold * 1.6, fame: base.fame * 2 };
    if (!q) q = { ...base, type: 'gather', item: 'food_bread', count: 3, title: 'Хліб для бенкету', desc: 'Принеси 3 хлібини. Так, просто хліб. Лорд на дієті.' };
    q.title = `👑 ${q.title}`; q.desc = `${q.lordName}: «${q.desc}»`;
    lf.lordQ[key] = { day: d, q }; return q;
  }
  function acceptLordQuest(G, key) {
    const p = G.player; const q = lordQuest(G, key); if (!q || q.taken) return 'Завдань немає';
    if (p.quests.length >= 10) return 'Забагато активних квестів';
    q.taken = true; const copy = { ...q }; if (copy.type === 'deliver') PL().addItem(p, 'package'); if (copy.type === 'hunt') copy.base = p.kills[copy.target] || 0;
    p.quests.push(copy); return null;
  }
  function turnInLord(G, key) {
    const p = G.player; const done = p.quests.filter((q) => q.lordKey === key && GM().questDone(G, q)); const res = [];
    for (const q of done) { const r = GM().turnInQuest(G, q.id); if (r) { addLordRel(G, key, q.relGain || 10); res.push(r); } }
    return res;
  }
  // land grant / marriage
  function lordCanGrant(G, key) { const l = lordByKey(G, key); return l && (l.kind === 'king' || l.kind === 'duke') && lordRel(G, key) >= 70 && G.player.social >= 2; }
  function lordGrant(G, key) {
    const l = lordByKey(G, key); const w = G.world;
    const free = w.baronies.filter((b) => b.owner === l.realm && b.occ < 0 && b.holder !== 'player' && b.type === 'village' && (l.kind === 'king' || b.duchy === w.baronies[l.seat].duchy));
    if (!free.length) return 'Вільних земель немає';
    const B = free.sort((a, b) => b.dev - a.dev)[0]; const e = GM().grantBarony(G, B.id, true); if (e) return e;
    addLordRel(G, key, -30); return null;
  }
  function childName(l, female) { const r = new ISK.RNG(hash(l.portrait, female ? 2 : 1)); return `${r.pick(female ? ['Мирослава', 'Ізабелла', 'Віолетта', 'Злата', 'Аріна', 'Ксенія', 'Леся'] : ['Ярослав', 'Тристан', 'Едмунд', 'Остап', 'Філіп', 'Данило', 'Маркіян'])}, ${female ? 'донька' : 'син'} ${l.name.split(' ')[0]}а`; }
  function canMarry(G, key) {
    const p = G.player; const l = lordByKey(G, key); if (!l || p.spouse) return false;
    return lordRel(G, key) >= (p.cheat === 'charisma' ? 45 : 60) && p.social >= RANK[l.kind].social;
  }
  function marryLordChild(G, key) {
    const p = G.player; const l = lordByKey(G, key); if (!canMarry(G, key)) return 'Лорд не вважає тебе гідним(ою)... поки що.';
    const cost = Math.round(500 * RANK[l.kind].mul); if (p.gold < cost) return `Весілля коштує ${cost} 🪙`;
    p.gold -= cost; const female = p.gender === 'm';
    p.spouse = { name: childName(l, female), female, kind: 'noble', from: key, day: day(G), icon: female ? '👸' : '🤴', portrait: hash(l.portrait, 9) };
    addLordRel(G, key, 30); PL().addFame(p, Math.round(40 * RANK[l.kind].mul));
    POL().log(G.P, day(G), `💒 Весілля року! ${p.name} одружується з ${p.spouse.name}. ${l.kind === 'king' ? 'Королівство святкує тиждень!' : 'Сусіди заздрять.'}`, 'event', [l.realm]);
    L(G).call = { ctx: 'married', text: pick(D().GODDESS_LINES.married) };
    return null;
  }
  function proposeCompanion(G, idx) {
    const p = G.player; const c = p.party[idx]; if (!c || p.spouse) return 'Неможливо';
    if ((c.affection || 0) < (p.cheat === 'charisma' ? 15 : 25)) return `${c.name}: «Ми... ще не настільки близькі. Більше пригод разом!» (прихильність ${c.affection || 0}/25)`;
    if (p.gold < 300) return 'Весілля коштує 300 🪙 (скромне, з борщем)';
    p.gold -= 300; const kind = { warrior: 'warrior', mage: 'mage', healer: 'healer', archer: 'warrior', rogue: 'merchant' }[c.role] || 'warrior';
    p.spouse = { name: c.name, female: c.gender === 'f', kind, companion: c.id, day: day(G), icon: c.icon, portrait: hash(c.name.length, 5) };
    c.wage = 0; PL().addFame(p, 25);
    POL().log(G.P, day(G), `💞 ${p.name} і ${c.name} одружилися! Таверна гуляє за рахунок нареченого(ї).`, 'event', []);
    L(G).call = { ctx: 'married', text: pick(D().GODDESS_LINES.married) };
    return null;
  }
  const childAge = (G, c) => Math.floor((day(G) - c.born) / 30);
  function takeHeir(G, i) {
    const p = G.player; const c = p.children[i]; if (!c || childAge(G, c) < 16) return 'Спадкоємець ще замалий';
    const lf = L(G); lf.dynasty = lf.dynasty || []; lf.dynasty.push({ name: p.name, level: p.level, fame: p.fame, until: day(G) });
    const old = p.name; p.name = c.name; p.gender = c.female ? 'f' : 'm'; p.level = Math.max(1, Math.floor(p.level * 0.6)); p.xp = 0; p.fame = Math.floor(p.fame * 0.6);
    for (const k of Object.keys(p.classXp)) { p.classXp[k].lvl = Math.max(1, Math.floor(p.classXp[k].lvl * 0.6)); p.classXp[k].sp = 0; if (p.classXp[k].lvl < 20) p.classXp[k].master = false; if (p.classXp[k].lvl < 10) p.classXp[k].adv = null; if (p.classXp[k].lvl < 30) p.classXp[k].ascended = false; }
    p.statPoints += 10; p.spouse = null; p.children.splice(i, 1); p.hp = PL().maxHp(p); p.mp = PL().maxMp(p);
    POL().log(G.P, day(G), `👑 Династія продовжується! ${old} передає спадщину: тепер грає ${p.name}.`, 'event', []);
    return null;
  }

  // ---------------- player's own army ----------------
  function armyCap(G) { const p = G.player; return 20 + p.holdings.length * 40 + p.social * 12 + Math.floor(p.level / 2); }
  function armyCount(p) { return p.army ? Object.values(p.army.units).reduce((a, b) => a + b, 0) : 0; }
  function canRecruitHere(G) {
    const hr = GM().here(G); if (hr.kind !== 'barony') return false; const B = hr.B;
    return G.player.holdings.includes(B.id) || ['capital', 'city', 'fortress'].includes(B.type);
  }
  function recruit(G, unit, n) {
    const p = G.player; const U = D().UNITS[unit]; if (!U) return 'Невідомий загін';
    if (!canRecruitHere(G)) return 'Наймати військо можна у своїх землях, містах і фортецях';
    if (armyCount(p) + n > armyCap(G)) return `Ліміт війська: ${armyCap(G)} загонів (більше земель і титулів — більше війська)`;
    if ((unit === 'knights' && p.social < 3) || (unit === 'mages' && p.social < 2)) return 'Цей загін потребує вищого титулу';
    const cost = U.cost * n * 10; if (p.gold < cost) return `Потрібно ${cost} 🪙`;
    p.gold -= cost; p.army = p.army || { units: {}, morale: 1, name: `Дружина ${p.name}` };
    p.army.units[unit] = (p.army.units[unit] || 0) + n; return null;
  }
  function dismiss(G, unit, n) { const p = G.player; if (!p.army || !p.army.units[unit]) return; p.army.units[unit] = Math.max(0, p.army.units[unit] - n); if (!armyCount(p)) p.army = null; }
  function armyPower(G) {
    const p = G.player; if (!p.army) return 0;
    let s = 0; for (const [k, n] of Object.entries(p.army.units)) s += n * D().UNITS[k].power * 10;
    s *= (1 + p.level * 0.02) * (p.army.morale || 1) * (D().hasArt(p, 'army') ? 1.4 : 1) * (p.spouse && p.spouse.kind === 'warrior' ? 1.1 : 1);
    return Math.round(s);
  }
  function armyUpkeep(p) { if (!p.army) return 0; let u = 0; for (const [k, n] of Object.entries(p.army.units)) u += n * D().UNITS[k].upkeep * 10; return Math.round(u); }
  function lossesFrac(p, frac) { for (const k of Object.keys(p.army.units)) p.army.units[k] = Math.max(0, Math.round(p.army.units[k] * (1 - frac))); if (!armyCount(p)) p.army = null; }
  function battleArmy(G, armyId) {
    const p = G.player; const a = G.P.armies.find((x) => x.id === armyId); if (!a || !p.army) return null;
    const mine = armyPower(G); const theirs = a.size * POL().raceAI(G.world, a.realm).atk * (a.heroBonus || 1) * (POL().isDemon(G.P, a.realm) ? 1.1 : 1);
    const r = Math.max(0.05, Math.min(0.95, mine / (mine + theirs) + rnd(-0.08, 0.08)));
    const won = r > 0.5; const killed = Math.round(a.size * Math.min(0.95, r * 0.8)); a.size -= killed;
    lossesFrac(p, (1 - r) * 0.55); if (p.army) p.army.morale = Math.max(0.5, Math.min(1.3, (p.army.morale || 1) + (won ? 0.08 : -0.15)));
    if (a.size < 150) G.P.armies = G.P.armies.filter((x) => x !== a);
    if (won) { PL().addFame(p, 30 + Math.round(killed / 100)); for (const q of p.quests) if (q.type === 'horde' && q.army === armyId) q.progress = 1; }
    if (!POL().isDemon(G.P, a.realm)) { const st = G.P.realms[a.realm]; st.playerRep = Math.max(-100, (st.playerRep || 0) - 15); }
    POL().log(G.P, day(G), won ? `⚔️ ${p.army ? p.army.name : 'Військо ' + p.name} розгромило «${a.name}»! Загинуло ${killed.toLocaleString('uk')} ворогів.` : `🏳️ Військо ${p.name} відступило після бою з «${a.name}». Барди пишуть «стратегічний відступ».`, 'battle', [a.realm]);
    return { won, killed, r };
  }
  function liegeOf(G) { const p = G.player; const bid = p.holdings[0]; return bid !== undefined ? G.world.baronies[bid].owner : -1; }
  function declareWarOn(G, realmId) {
    const p = G.player; const lg = liegeOf(G);
    if (lg < 0) return 'У тебе немає сюзерена. Спершу отримай землю (баронство).';
    if (p.social < 4) return 'Оголошувати війну може лише лорд з титулом не нижче за «Лицар»';
    if (realmId === lg || POL().bloc(G.P, lg).includes(realmId)) return 'Це твої союзники!';
    if (POL().atWar(G.P, lg, realmId)) return 'Війна вже йде';
    POL().declareWar(G.world, G.P, lg, realmId, day(G), new ISK.RNG(Date.now() >>> 0), `Претензії лорда ${p.name}`);
    PL().addFame(p, 20); return null;
  }
  function siege(G, bid) {
    const p = G.player; const w = G.world; const B = w.baronies[bid]; if (!p.army) return { err: 'Немає війська' };
    const lg = liegeOf(G); const ctrl = B.occ >= 0 ? B.occ : B.owner;
    if (lg >= 0 && ctrl === lg) return { err: 'Це землі твого сюзерена' };
    const atWar = lg >= 0 && POL().atWar(G.P, lg, ctrl);
    if (!atWar && !POL().isDemon(G.P, ctrl)) return { err: 'Ви не у стані війни. Спершу оголоси війну (потрібна земля і титул).' };
    const garrison = 300 + B.fort * 450 + B.dev * 140 + G.P.armies.filter((a) => a.node === bid && a.realm === ctrl).reduce((s, a) => s + a.size, 0);
    const mine = armyPower(G); const r = Math.max(0.05, Math.min(0.95, mine / (mine + garrison) + rnd(-0.07, 0.07)));
    lossesFrac(p, (1 - r) * 0.5);
    if (r > 0.5) {
      G.P.armies = G.P.armies.filter((a) => !(a.node === bid && a.realm === ctrl));
      if (lg >= 0) { B.occ = lg; B.occDays = 0; }
      if (lg >= 0 && !p.holdings.includes(bid) && B.type !== 'capital') { B.owner = lg; B.occ = -1; B.holder = 'player'; p.holdings.push(bid); p.land[bid] = p.land[bid] || { tax: 1, buildings: {}, loyalty: 40 }; }
      PL().addFame(p, 60);
      POL().log(G.P, day(G), `🏰 ${p.name} штурмом узяв ${B.name}! Над мурами — новий прапор.`, 'battle', [ctrl]);
      return { won: true };
    }
    POL().log(G.P, day(G), `🧱 Штурм ${B.name} військом ${p.name} провалився. Мури виявились мурами.`, 'battle', [ctrl]);
    return { won: false };
  }

  // ---------------- naval battles & piracy ----------------
  function shipStats(p) {
    const u = p.shipUp || {}; const sea = D().hasArt(p, 'sea') ? 1.5 : 1; const sailor = p.cheat === 'sailor' ? 1.25 : 1;
    return { maxHp: Math.round((120 + (u.hull || 0) * 90 + p.level * 6) * sailor), atk: Math.round((22 + (u.cannons || 0) * 20 + p.level * 2.2) * sea * sailor), board: 0.3 + (u.crew || 0) * 0.12 + (sailor - 1), speed: 1 + (u.sails || 0) * 0.25 };
  }
  const FOES = {
    pirate: { name: 'Піратський бриг «Гнилий Зуб»', icon: '🏴‍☠️', hp: 1, atk: 1, board: 0.35, loot: 1, line: '«Арр! Віддавай ром і шкарпетки!»' },
    navy: { name: 'Королівський фрегат', icon: '⚓', hp: 1.4, atk: 1.1, board: 0.2, loot: 0.7, line: '«Іменем короля — здавайтеся! Або ні. Як хочете.»' },
    kraken: { name: 'Кракен Глибинний Хруст', icon: '🦑', hp: 2, atk: 1.3, board: 0, loot: 1.6, line: '*Хрусь* (так кракени вітаються)' },
    merchant: { name: 'Торговий когг «Повна Кишеня»', icon: '🚢', hp: 0.8, atk: 0.5, board: 0.15, loot: 2, line: '«Ой лишенько! Пірати!» (це ти)' },
    ghost: { name: 'Корабель-привид «Летючий Голландець-2»', icon: '👻', hp: 1.6, atk: 1.2, board: 0.4, loot: 1.8, line: '«Ууууу... наш капітан забув, навіщо ми пливемо...»' },
  };
  function startNaval(G, foeKey, lvl) {
    const p = G.player; const F = FOES[foeKey] || FOES.pirate; const st = shipStats(p);
    return { foeKey, foe: { ...F, maxHp: Math.round((90 + lvl * 22) * F.hp), hp: 0, atk: Math.round((14 + lvl * 4.2) * F.atk) }, ship: { ...st, hp: st.maxHp }, round: 0, evade: false, over: null, lvl };
  }
  function navalAct(G, s, action) {
    const ev = []; if (s.over) return ev; if (!s.foe.hp) s.foe.hp = s.foe.maxHp;
    s.round++;
    if (action === 'volley') { const dmg = Math.round(s.ship.atk * rnd(0.8, 1.25) * (Math.random() < 0.15 ? 1.8 : 1)); s.foe.hp = Math.max(0, s.foe.hp - dmg); ev.push(`💣 Залп! ${s.foe.name} отримує ${dmg} шкоди.`); }
    else if (action === 'board') {
      if (s.foeKey === 'kraken') ev.push('🦑 Абордаж кракена? Ти серйозно? Він слизький!');
      else { const ch = s.ship.board * (1.2 - s.foe.hp / s.foe.maxHp * 0.6); if (Math.random() < ch) { s.foe.hp = 0; ev.push('🏴‍☠️ АБОРДАЖ! Твоя команда перестрибує на палубу і захоплює корабель!'); } else { const dmg = Math.round(s.foe.atk * 0.8); s.ship.hp -= dmg; ev.push(`🪝 Абордаж провалився! Команда падає у воду. −${dmg} HP корабля.`); } }
    } else if (action === 'evade') { s.evade = true; const rep = Math.round(s.ship.maxHp * 0.08); s.ship.hp = Math.min(s.ship.maxHp, s.ship.hp + rep); ev.push(`⛵ Маневр! Ти ловиш вітер і латаєш дірки (+${rep}).`); }
    else if (action === 'ram') { const dmg = Math.round(s.ship.atk * 1.5); s.foe.hp = Math.max(0, s.foe.hp - dmg); const self = Math.round(s.ship.maxHp * 0.12); s.ship.hp -= self; ev.push(`💥 ТАРАН! ${dmg} шкоди ворогу, ${self} — собі. Ніс корабля плаче.`); }
    if (s.foe.hp <= 0) { s.over = 'win'; return ev; }
    // foe turn
    const r = Math.random();
    if (s.foeKey === 'kraken' && r < 0.35) { const dmg = Math.round(s.foe.atk * 1.4 * (s.evade ? 0.4 : 1)); s.ship.hp -= dmg; ev.push(`🦑 Щупальця обвивають щоглу! −${dmg}.`); }
    else if (r < 0.2 && s.foe.board > 0) { if (Math.random() < s.foe.board * (s.evade ? 0.3 : 1)) { const dmg = Math.round(s.foe.atk * 1.6); s.ship.hp -= dmg; ev.push(`⚔️ Ворог іде на абордаж! Бійка на палубі: −${dmg}.`); } else ev.push('🪝 Ворожий абордаж провалився. Хтось упав у воду. Хлюп.'); }
    else { const dmg = Math.round(s.foe.atk * rnd(0.8, 1.2) * (s.evade ? 0.35 : 1)); s.ship.hp -= dmg; ev.push(`💥 ${s.foe.icon} Ворожий залп: −${dmg}.${s.evade ? ' (маневр допоміг!)' : ''}`); }
    s.evade = false;
    if (s.ship.hp <= 0) { s.ship.hp = 0; s.over = 'lose'; }
    return ev;
  }
  function navalRewards(G, s) {
    const p = G.player; const F = FOES[s.foeKey]; if (s.over !== 'win') { const lost = Math.floor(p.gold * 0.15); p.gold -= lost; return { lost }; }
    const gold = Math.round((60 + s.lvl * 30) * F.loot); p.gold += gold; const items = {};
    const loot = ['coin_old', 'pearl', 'fish_kraken', 'silk', 'gem', 'amber']; for (let i = 0; i < 2; i++) { const it = pick(loot); if (D().MATERIALS[it]) items[it] = (items[it] || 0) + 1; }
    if (Math.random() < 0.08) items[D().randomGear(s.lvl, 2)] = 1;
    for (const [k, n] of Object.entries(items)) PL().addItem(p, k, n);
    const xr = PL().addXp(p, 40 + s.lvl * 15); PL().addFame(p, s.foeKey === 'kraken' ? 30 : 8);
    if (s.foeKey === 'merchant') { p.flags.pirate = (p.flags.pirate || 0) + 1; const hr = GM().here(G); const rid = hr.kind === 'barony' ? hr.B.owner : -1; if (rid >= 0 && G.P.realms[rid]) G.P.realms[rid].playerRep = Math.max(-100, (G.P.realms[rid].playerRep || 0) - 8); }
    if (s.foeKey === 'pirate') p.flags.pirateHunter = (p.flags.pirateHunter || 0) + 1;
    return { gold, items, xr };
  }
  function shipUpgrade(G, key) {
    const p = G.player; const U = D().SHIP_UPGRADES[key]; p.shipUp = p.shipUp || {}; const lvl = p.shipUp[key] || 0;
    if (!p.ship) return 'Спершу купи корабель'; if (lvl >= U.cost.length) return 'Максимальний рівень';
    if (p.gold < U.cost[lvl]) return `Потрібно ${U.cost[lvl]} 🪙`;
    p.gold -= U.cost[lvl]; p.shipUp[key] = lvl + 1; return null;
  }

  // ---------------- rival guilds ----------------
  function rivals(G) { const lf = L(G); if (!lf.rivals) lf.rivals = D().RIVAL_GUILDS.map((r, i) => ({ id: r.id, pts: 200 + i * 150, members: 12 + i * 5, wins: 0 })); return lf.rivals; }
  function rivalTick(G, d) {
    const rv = rivals(G);
    for (const r of rv) r.pts += Math.round(rnd(4, 18) * (1 + d / 600));
    if (d % 9 === 0) {
      const r = pick(rv); const keys = Object.keys(G.boards); const k = keys.length ? pick(keys) : null;
      if (k && G.boards[k].quests.length) { const q = G.boards[k].quests.splice(Math.floor(Math.random() * G.boards[k].quests.length), 1)[0]; const RG = D().RIVAL_GUILDS.find((x) => x.id === r.id); G.notices.push(`${RG.icon} Клан «${RG.name}» перехопив квест «${q.title}»! ${pick(['Нахаби.', 'Без черги!', 'Помста буде.', 'Вони навіть не прочитали опис.'])}`); }
    }
  }
  function rivalChallenge(G, id) {
    const lf = L(G); lf.rivalCd = lf.rivalCd || {}; const d = day(G);
    if (lf.rivalCd[id] && d - lf.rivalCd[id] < 7) return { err: `Клан ще зализує рани. Виклик через ${7 - (d - lf.rivalCd[id])} дн.` };
    lf.rivalCd[id] = d; const p = G.player; const RG = D().RIVAL_GUILDS.find((x) => x.id === id);
    const lvl = Math.max(3, p.level + 1);
    const enemies = [ISK.combat.makeEnemy('bandit', lvl, { elite: true, name: `Чемпіон «${RG.name}»`, icon: RG.icon }), ISK.combat.makeEnemy('soldier', lvl - 1, { name: `Боєць «${RG.name}»` }), ISK.combat.makeEnemy('soldier', lvl - 1, { name: `Боєць «${RG.name}»` })];
    for (const e of enemies) { e.drops = []; e.gold = Math.round(e.gold * 0.5); }
    return { enemies, RG };
  }
  function rivalResult(G, id, won) { const r = rivals(G).find((x) => x.id === id); const p = G.player; if (won) { r.pts = Math.max(0, r.pts - 80); p.guild.points += 60; r.wins = (r.wins || 0); PL().addFame(p, 15); } else { r.pts += 40; r.wins = (r.wins || 0) + 1; } }

  // ---------------- caravans & world events ----------------
  function caravanTick(G, d) {
    const lf = L(G); lf.caravans = lf.caravans || []; const w = G.world;
    if (d % 6 === 0 && lf.caravans.length < 10) {
      const pairs = []; for (const st of G.P.realms) if (!st.dead) for (const t of st.trade || []) if (t > st.id && !G.P.realms[t].dead) pairs.push([st.id, t]);
      if (pairs.length) {
        const [a, b] = pick(pairs); const A = w.realms[a].capital, B = w.realms[b].capital; const path = POL().bfsPath(w, A, B);
        if (path && path.length > 1) lf.caravans.push({ id: d * 100 + a, realm: a, to: b, node: A, path: path.slice(1), prog: 0, legDays: 2, icon: Math.random() < 0.5 ? '🐪' : '🐴', name: `Караван ${w.realms[a].name}` });
      }
    }
    const adj = POL().roadAdj(w);
    for (const c of lf.caravans) {
      if (!c.path.length) continue;
      const e = (adj[c.node] || []).find((x) => x.to === c.path[0]); const days = Math.max(1, Math.round((e ? e.cost : 8) / 6)); c.legDays = days;
      c.prog += 1 / days; if (c.prog >= 1) { c.node = c.path.shift(); c.prog = 0; }
      if (Math.random() < 0.004) { c.robbed = true; POL().log(G.P, d, `🗡️ Розбійники пограбували «${c.name}» біля ${w.baronies[c.node].name}. Верблюди обурені.`, 'event', [c.realm]); }
    }
    for (const c of lf.caravans) if (!c.path.length && !c.robbed) { G.P.realms[c.realm].gold += 120; if (G.P.realms[c.to]) G.P.realms[c.to].gold += 120; }
    lf.caravans = lf.caravans.filter((c) => c.path.length && !c.robbed);
  }
  function worldEvent(G, d) {
    const lf = L(G); if (d < (lf.nextEvent || 12)) return; lf.nextEvent = d + 12 + Math.floor(Math.random() * 14);
    const w = G.world; const towns = w.baronies.filter((b) => ['city', 'town', 'capital'].includes(b.type) && !POL().isDemon(G.P, b.owner)); const T = pick(towns);
    const [key, text] = pick(D().WORLD_EVENTS);
    POL().log(G.P, d, text.replace('{town}', T.name).replace('{realm}', w.realms[T.owner].name), 'event', [T.owner]);
    lf.events = lf.events || [];
    if (key === 'festival' || key === 'goblin_market') lf.events.push({ key, bid: T.id, until: d + 7 });
    if (key === 'goldrush' || key === 'meteor') { T.sites = T.sites || []; if (T.sites.length < 3) T.sites.push({ key: key === 'meteor' ? 'meteor' : 'goldmine', rich: 4, temp: d + 40 }); }
    if (key === 'tournament') lf.events.push({ key, bid: T.id, until: d + 10 });
    if (key === 'dragon') lf.events.push({ key, bid: T.id, until: d + 5 });
    lf.events = lf.events.filter((e) => e.until >= d);
    for (const B of w.baronies) if (B.sites) B.sites = B.sites.filter((s) => !s.temp || s.temp >= d);
  }
  function eventAt(G, bid) { const lf = L(G); return (lf.events || []).find((e) => e.bid === bid && e.until >= day(G)); }

  // ---------------- goddess calls ----------------
  function goddessTick(G, d) {
    const lf = L(G); const p = G.player; if (lf.call) return;
    const chance = p.cheat === 'goddess_fav' ? 0.1 : 0.035; if (Math.random() > chance) return;
    let ctx = 'random';
    if (p.hp < PL().maxHp(p) * 0.25) ctx = 'lowhp'; else if (p.gold > 8000 && Math.random() < 0.5) ctx = 'rich'; else if (seasonOf(d) === 3 && Math.random() < 0.3) ctx = 'winter';
    const text = pick(D().GODDESS_LINES[ctx] || D().GODDESS_LINES.random).replace('{name}', p.name);
    let gift = null; if (p.cheat === 'goddess_fav' && Math.random() < 0.5) { gift = pick(['potion_m', 'ether', 'food_honeycake', 'elixir_luck', 'potion_l']); PL().addItem(p, gift); }
    lf.call = { ctx, text, gift };
  }
  function react(ctx) { const G = ISK.ui && ISK.ui.G; if (!G) return; const lines = D().GODDESS_LINES[ctx]; if (lines && Math.random() < 0.6) L(G).call = { ctx, text: pick(lines) }; }

  // ---------------- Twitch viewers ----------------
  function viewerHero(G, user) {
    const p = G.player; const at = GM().here(G).kind === 'barony' ? GM().here(G).B.id : G.world.startBarony;
    const ex = (G.P.heroes || []).find((h) => h.viewer === user && h.alive); if (ex) return `${user} вже мандрує Дивосвітом як герой рівня ${ex.lvl}!`;
    const h = ISK.heroes.makeHero(G.world, G.P, new ISK.RNG(hash(user.length, day(G))), { name: `${user} (глядач)`, lvl: Math.max(2, Math.floor(p.level * 0.7)) }); h.node = at; h.viewer = user; G.P.heroes.push(h);
    POL().log(G.P, day(G), `📡 Глядач ${user} переродився в Дивосвіті як герой ${D().CLASSES[h.cls].name}!`, 'hero', []);
    return null;
  }
  function viewerGift(G, user) {
    const p = G.player; const n = p.cheat === 'streamer' ? 2 : 1; const it = pick(['potion_m', 'ether', 'food_borsch', 'elixir_str', 'bomb', 'scroll_haste', 'food_bread', 'potion_s']);
    PL().addItem(p, it, n); G.notices.push(`🎁 ${user} дарує тобі ${PL().item(it).name}${n > 1 ? ' ×2' : ''}!`);
  }
  function viewerHeal(G, user) { const p = G.player; const h = Math.round(PL().maxHp(p) * (p.cheat === 'streamer' ? 0.5 : 0.25)); p.hp = Math.min(PL().maxHp(p), p.hp + h); G.notices.push(`💚 ${user} надсилає зцілення: +${h} HP!`); }
  function viewerHorde(G, user) {
    const lf = L(G); lf.hordeVotes = lf.hordeVotes || {}; lf.hordeVotes[user] = 1; const n = Object.keys(lf.hordeVotes).length; const need = 3;
    if (n < need) { G.notices.push(`🧟 ${user} голосує за орду! (${n}/${need})`); return; }
    lf.hordeVotes = {};
    const hr = GM().here(G); const B = hr.kind === 'barony' ? hr.B : G.world.baronies[G.world.startBarony]; const near = [B.id, ...B.adj].find((x) => !G.world.baronies[x].holder) ?? B.id;
    POL().spawnDemonArmy(G.world, G.P, day(G), null, { size: 600 + G.player.level * 70, node: near, name: `Орда глядача ${user}`, horde: true, icon: '🧟' });
    POL().log(G.P, day(G), `📡🧟 Чат проголосував! Орда глядача ${user} з'являється біля ${G.world.baronies[near].name}!`, 'war', []);
  }
  function viewerWeather(G, user, key) {
    const k = D().WEATHER[key] ? key : pick(Object.keys(D().WEATHER)); L(G).weatherOverride = { key: k, until: day(G) + 1 };
    G.notices.push(`🌦️ ${user} змінює погоду: ${D().WEATHER[k].icon} ${D().WEATHER[k].name}!`);
  }
  function viewerWar(G, user) {
    const lf = L(G); lf.warVotes = lf.warVotes || {}; lf.warVotes[user] = 1; const n = Object.keys(lf.warVotes).length;
    if (n < 5) { G.notices.push(`⚔️ ${user} голосує за війну! (${n}/5)`); return; }
    lf.warVotes = {}; const al = G.P.realms.filter((r) => !r.dead && !POL().isDemon(G.P, r.id)); const a = pick(al), b = pick(al.filter((x) => x !== a && !POL().atWar(G.P, a.id, x.id)));
    if (a && b) POL().declareWar(G.world, G.P, a.id, b.id, day(G), new ISK.RNG(Date.now() >>> 0), 'Чат так вирішив');
  }

  // ---------------- hooks ----------------
  function init(G) { L(G); rivals(G); }
  function beforeTime() { /* reserved */ }
  function daily(G, d) {
    const p = G.player; const env = environment(G); ISK.season = env.season.id;
    // winter freezes the garden
    if (env.seasonIdx === 3 && p.house && !p.house.upgrades.greenhouse) for (const pl of p.house.plots) if (pl.seed && !pl.ready) pl.readyDay += 1;
    // army upkeep & desertion
    if (p.army) { const u = armyUpkeep(p); if (p.gold >= u) p.gold -= u; else { lossesFrac(p, 0.1); G.notices.push('💸 Військові без платні: 10% дезертирували!'); } }
    // children
    if (p.spouse && p.children.length < 3 && Math.random() < 1 / 160) { const female = Math.random() < 0.5; const c = { name: pick(female ? ['Маруся', 'Ліза', 'Олеся', 'Христя', 'Аля', 'Нора'] : ['Тарасик', 'Ромчик', 'Левко', 'Іванко', 'Макс', 'Ярчик']), female, born: d }; p.children.push(c); G.notices.push(`👶 У родині ${p.name} поповнення: ${c.name}! (росте магічно швидко: рік за місяць)`); }
    rivalTick(G, d); caravanTick(G, d); worldEvent(G, d); goddessTick(G, d);
  }
  function onDungeon() { /* reserved for seasonal hooks */ }

  ISK.life = {
    init, daily, beforeTime, onDungeon, environment, seasonOf, weatherOf,
    lordByKey, lordsAt, lordTitle, lordTrait, lordRel, addLordRel, lordLine, lordGift, lordQuest, acceptLordQuest, turnInLord, lordCanGrant, lordGrant, canMarry, marryLordChild, childName,
    proposeCompanion, childAge, takeHeir,
    armyCap, armyCount, canRecruitHere, recruit, dismiss, armyPower, armyUpkeep, battleArmy, liegeOf, declareWarOn, siege,
    shipStats, startNaval, navalAct, navalRewards, shipUpgrade, FOES,
    rivals, rivalChallenge, rivalResult, eventAt,
    react, viewerHero, viewerGift, viewerHeal, viewerHorde, viewerWeather, viewerWar, RANK,
  };
  ISK.goddess = { react };
  if (ISK.game) ISK.game.environment = environment;
})();
