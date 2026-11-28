// Хроніки Дивосвіту v5.9 — логіка легендарних супутників (зустрічі, прихильність, сюжетні розділи) і власного клану.
// Працює і в Node (без DOM) — тести в test/bonds.test.js.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const D = () => ISK.data, PL = () => ISK.player, GM = () => ISK.game;
  const day = (G) => Math.floor(G.time);
  const LG = () => D().LEGENDS || {};

  // ================= Легенди =================
  function legends(p) { p.legends = p.legends || {}; return p.legends; }
  function st(p, id) { const L = legends(p); return L[id] || null; }
  function partyCap(p) { const c = p.clan; let n = 3; if (c && c.lvl >= 3) n++; if (c && c.lvl >= 8) n++; return n; }
  function bondTier(b) { return b >= 80 ? 3 : b >= 40 ? 2 : b >= 15 ? 1 : 0; }
  const TIER_NAMES = ['Знайомі', 'Друзі', 'Близькі', 'Споріднені душі'];

  // чи може легенда з'явитися: when = arrive | res | win | sleep; ctx = { type, hpFrac }
  function meetCandidates(G, when, ctx = {}) {
    const p = G.player, d = day(G), out = [];
    if (p.flags.legendCool && d < p.flags.legendCool) return out;
    for (const [id, L] of Object.entries(LG())) {
      if (st(p, id)) continue; const m = L.meet; if (!m || m.when !== when) continue;
      if (L.only && L.only !== (p.gender || 'm')) continue; // чоловічі легенди v6.0 — лише для героїнь
      if (p.level < (m.minLvl || 1)) continue;
      if (m.types && ctx.type && !m.types.includes(ctx.type)) continue;
      if (m.types && !ctx.type) continue;
      if (m.lowHp && !(ctx.hpFrac !== undefined && ctx.hpFrac <= m.lowHp)) continue;
      out.push(id);
    }
    return out;
  }
  function rollMeet(G, when, ctx = {}, rnd = Math.random) {
    const c = meetCandidates(G, when, ctx); if (!c.length) return null;
    // героїням частіше трапляються хлопці, героям — дівчата
    const pg = G.player.gender || 'm'; const pool = []; for (const x of c) { const w = LG()[x].gender !== pg ? 3 : 1; for (let i = 0; i < w; i++) pool.push(x); }
    const id = pool[Math.floor(rnd() * pool.length)]; const L = LG()[id];
    const mul = G.player.cheat === 'harem' ? 2 : 1;
    return rnd() < (L.meet.chance || 0.2) * mul ? id : null;
  }
  function meet(G, id) {
    const p = G.player; if (!LG()[id]) return null;
    const L = legends(p); if (L[id]) return L[id];
    L[id] = { met: day(G), bond: 5, ch: 0, lvl: Math.max(1, p.level - 1), xp: 0, talked: -1, gifts: {}, sig: 1 };
    p.flags.legendCool = day(G) + 3;
    if (ISK.politics && G.P) ISK.politics.log(G.P, day(G), `💘 ${p.name} зустрів(ла) ${LG()[id].name} — «${LG()[id].title}». Барди вже пишуть другий сезон.`, 'hero', []);
    return L[id];
  }
  function inParty(p, id) { return p.party.find((c) => c.legend === id) || null; }
  function asMember(p, id) {
    const L = LG()[id], s = st(p, id); const R = D().CLAN.roles[L.role] || ['⚔️', 'Воїн'];
    return { id: 'L_' + id, legend: id, name: L.name, gender: L.gender, role: L.role, roleName: `${R[0]} ${L.title}`, icon: L.icon, lvl: s.lvl, xp: s.xp, wage: 0, fee: 0, trait: 'legend', traitName: L.type, line: L.lines[0], ch: s.ch, sig: s.sig, hp: undefined };
  }
  function join(G, id) {
    const p = G.player, s = st(p, id); if (!s) return 'Ви ще не знайомі';
    if (inParty(p, id)) return 'Вже в загоні';
    if (p.party.length >= partyCap(p)) return `Загін повний (макс. ${partyCap(p)})`;
    p.party.push(asMember(p, id)); if (GM() && GM().unlock) GM().unlock(G, 'party');
    return null;
  }
  function leave(G, id) {
    const p = G.player, c = inParty(p, id); if (!c) return 'Не в загоні';
    const s = st(p, id); s.lvl = c.lvl; s.xp = c.xp; p.party = p.party.filter((x) => x !== c); return null;
  }
  function sync(p) { for (const c of p.party) if (c.legend) { const s = st(p, c.legend); if (s) { s.lvl = c.lvl; s.xp = c.xp; c.ch = s.ch; c.sig = s.sig; } } }
  function addBond(G, id, n) {
    const s = st(G.player, id); if (!s) return 0;
    const before = s.bond; s.bond = Math.max(0, Math.min(D().LEGEND_BOND_MAX || 100, s.bond + n)); return s.bond - before;
  }
  function nextChapter(p, id) {
    const s = st(p, id), L = LG()[id]; if (!s || !L) return null;
    const c = L.chapters[s.ch]; return c && s.bond >= c.bond ? { idx: s.ch, ...c } : null;
  }
  function talk(G, id, rnd = Math.random) {
    const p = G.player, s = st(p, id), L = LG()[id]; if (!s) return null;
    const d = day(G); const fresh = s.talked !== d; s.talked = d;
    const gain = fresh ? addBond(G, id, 3) : 0;
    const tier = bondTier(s.bond); const pool = L.lines.slice(0, Math.min(L.lines.length, tier + 2));
    const line = pool[Math.floor(rnd() * pool.length)];
    const others = p.party.filter((c) => c.legend && c.legend !== id);
    const jealous = others.length && rnd() < 0.35 ? { id: others[0].legend, name: LG()[others[0].legend].name, text: LG()[others[0].legend].jealous } : null;
    return { line, gain, tier, jealous };
  }
  function likes(id, it) { const L = LG()[id]; return !!(it && L && (L.likes.includes(it.kind) || L.likes.includes(it.id))); }
  function gift(G, id, itemId) {
    const p = G.player, s = st(p, id); if (!s) return { err: 'Ви ще не знайомі' };
    if (!PL().hasItem(p, itemId)) return { err: 'Немає такої речі' };
    const d = day(G); s.gifts = s.gifts || {}; const today = s.gifts[d] || 0; if (today >= 3) return { err: 'На сьогодні подарунків досить — зніяковіє.' };
    const it = PL().item(itemId); PL().removeItem(p, itemId, 1); s.gifts = { [d]: today + 1 };
    const liked = likes(id, it); const gain = addBond(G, id, liked ? 8 : 3);
    return { liked, gain, it };
  }
  function completeChapter(G, id) {
    const p = G.player, s = st(p, id), ch = nextChapter(p, id); if (!ch) return null;
    const r = ch.reward || {};
    if (r.stat) p.stats[r.stat] = (p.stats[r.stat] || 0) + r.n;
    if (r.gold) p.gold += r.gold; if (r.giveGold) p.gold = Math.max(0, p.gold + r.giveGold);
    if (r.fame && PL().addFame) PL().addFame(p, r.fame);
    if (r.sigUp) s.sig = 2;
    s.ch++; sync(p);
    if (s.ch >= LG()[id].chapters.length && GM() && GM().unlock) { p.flags.legendDone = (p.flags.legendDone || 0) + 1; }
    return { ch, reward: r };
  }
  function companionMul(c) { return c && c.legend ? 1.2 + 0.08 * (c.ch || 0) : 1; }
  // особлива атака легенди в покроковому бою: повертає опис для combat.js
  function signature(c) {
    const L = LG()[c.legend]; if (!L || !L.sig) return null;
    return { ...L.sig, mul: c.sig === 2 ? 1.6 : 1 };
  }

  // ================= Клан =================
  function clanCan(G) {
    const p = G.player, C = D().CLAN;
    if (p.clan) return 'Клан уже є';
    if (p.level < C.minLvl) return `Потрібен ${C.minLvl} рівень героя`;
    if (!p.guild || !p.guild.registered || p.guild.rank < C.minRank) return `Потрібна реєстрація в гільдії і ранг ${D().GUILD_RANKS[C.minRank].r}`;
    if (p.gold < C.cost) return `Потрібно ${C.cost}🪙`;
    return null;
  }
  function foundClan(G, o = {}) {
    const e = clanCan(G); if (e) return e;
    const p = G.player; const name = String(o.name || '').trim().slice(0, 28);
    if (name.length < 2) return 'Назва закоротка';
    p.gold -= D().CLAN.cost;
    const seat = p.location && p.location[0] === 'b' ? +p.location.slice(2) : (G.world ? G.world.startBarony : 0);
    p.clan = { name, icon: o.icon || '🐉', motto: String(o.motto || 'Разом — до кінця!').slice(0, 60), lvl: 1, xp: 0, bank: 0, seat, founded: day(G), members: [], hall: {}, missions: [], rep: {}, wars: 0, warCool: -1, log: [] };
    clanLog(G, `🏯 Засновано клан «${name}»!`);
    if (ISK.politics && G.P) ISK.politics.log(G.P, day(G), `🏯 ${p.name} засновує клан «${name}» ${p.clan.icon}. Гільдії нервово перевіряють свої рейтинги.`, 'hero', []);
    return null;
  }
  function clanLog(G, text) { const c = G.player.clan; if (!c) return; c.log.unshift({ d: day(G), text }); if (c.log.length > 40) c.log.length = 40; }
  function perks(p) {
    const c = p.clan; const l = c ? c.lvl : 0;
    return { xp: l >= 10 ? 0.15 : l >= 6 ? 0.1 : l >= 2 ? 0.05 : 0, gold: l >= 10 ? 0.25 : l >= 7 ? 0.2 : l >= 4 ? 0.1 : 0, fame: l >= 1 ? 0.05 : 0, portal: l >= 5, slots: partyCap(p) };
  }
  function addClanXp(G, n) {
    const c = G.player.clan; if (!c) return 0; const C = D().CLAN; let ups = 0;
    c.xp += Math.max(0, Math.round(n));
    while (c.lvl < C.maxLvl && c.xp >= C.xpNeed(c.lvl)) { c.xp -= C.xpNeed(c.lvl); c.lvl++; ups++; clanLog(G, `⬆️ Клан досяг ${c.lvl} рівня!`); if (G.notices) G.notices.push(`🏯 Клан «${c.name}» досяг ${c.lvl} рівня!`); }
    if (c.lvl >= C.maxLvl) c.xp = Math.min(c.xp, C.xpNeed(c.lvl));
    return ups;
  }
  const hallLvl = (c, k) => (c.hall && c.hall[k]) || 0;
  function memberCap(c) { return 4 + 3 * hallLvl(c, 'barracks'); }
  function upgradeHall(G, k) {
    const c = G.player.clan, H = D().CLAN.hall[k]; if (!c || !H) return 'Немає такої будівлі';
    const l = hallLvl(c, k); if (l >= H.max) return 'Максимальний рівень';
    if (l >= c.lvl + 1) return `Спершу підніми рівень клану до ${l}`;
    const cost = H.cost[l]; if (c.bank < cost) return `У скарбниці замало: треба ${cost}🪙`;
    c.bank -= cost; c.hall[k] = l + 1; addClanXp(G, 30 + l * 20); clanLog(G, `${H.icon} ${H.name} → рівень ${l + 1}`); return null;
  }
  function deposit(G, n) { const p = G.player, c = p.clan; n = Math.floor(n); if (!c || n <= 0) return 'Нема що класти'; if (p.gold < n) return 'Недостатньо золота'; p.gold -= n; c.bank += n; return null; }
  function withdraw(G, n) { const p = G.player, c = p.clan; n = Math.floor(n); if (!c || n <= 0) return 'Нема що брати'; if (c.bank < n) return 'У скарбниці менше'; c.bank -= n; p.gold += n; return null; }
  function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const NAMES = { m: ['Богдан', 'Ярема', 'Кіріл', 'Гаррі Половинка', 'Фенрір', 'Остап', 'Сірий Том', 'Лука', 'Борислав', 'Тодо', 'Злат', 'Ігнат'], f: ['Мирослава', 'Ліза-Блискавка', 'Орися', 'Сакура', 'Дарина', 'Руна', 'Іванка', 'Фрея', 'Ніка', 'Злата', 'Маріка', 'Софа'] };
  const QUIRKS = ['боїться курей', 'завжди голодний(а)', 'співає в бою', 'колекціонує ложки', 'вірить у свою зірку', 'спить на ходу', 'рахує ворогів уголос', 'носить три шоломи', 'мріє про таверну', 'ображається на дощ'];
  function candidates(G) {
    const p = G.player, c = p.clan; if (!c) return [];
    const wk = Math.floor(day(G) / 7); c.cand = c.cand || {};
    if (c.cand.wk === wk) return c.cand.list;
    const r = seeded((G.seed || 1) * 31 + wk * 977 + c.founded); const n = 3 + hallLvl(c, 'tavern'); const list = [];
    const roles = Object.keys(D().CLAN.roles); const racesK = Object.keys(D().RACES).filter((k) => !D().RACES[k].fake && k !== 'halfling');
    for (let i = 0; i < n; i++) {
      const g = r() < 0.5 ? 'f' : 'm'; const role = roles[Math.floor(r() * roles.length)];
      const lvl = Math.max(1, Math.round(p.level * (0.45 + r() * 0.4) + hallLvl(c, 'tavern') * 2));
      list.push({ id: 'm' + wk + '_' + i + '_' + Math.floor(r() * 1e6), name: NAMES[g][Math.floor(r() * NAMES[g].length)], gender: g, role, race: racesK[Math.floor(r() * racesK.length)], lvl, xp: 0, fee: 60 + lvl * 30, quirk: QUIRKS[Math.floor(r() * QUIRKS.length)], busy: -1 });
    }
    c.cand = { wk, list }; return list;
  }
  function recruitMember(G, cid) {
    const p = G.player, c = p.clan; if (!c) return 'Немає клану';
    const cand = candidates(G).find((x) => x.id === cid); if (!cand) return 'Кандидат пішов';
    if (c.members.length >= memberCap(c)) return `Казарми повні (${memberCap(c)}). Розбудуй казарми.`;
    if (c.bank >= cand.fee) c.bank -= cand.fee; else if (p.gold >= cand.fee) p.gold -= cand.fee; else return `Потрібно ${cand.fee}🪙`;
    c.members.push({ ...cand }); c.cand.list = c.cand.list.filter((x) => x.id !== cid);
    addClanXp(G, 10); clanLog(G, `🤝 До клану вступає ${cand.name} (${D().CLAN.roles[cand.role][1]}, рів. ${cand.lvl})`); return null;
  }
  function dismiss(G, mid) { const c = G.player.clan; if (!c) return 'Немає клану'; const m = c.members.find((x) => x.id === mid); if (!m) return 'Немає такого'; if (m.busy > day(G)) return 'Зараз на контракті'; c.members = c.members.filter((x) => x !== m); clanLog(G, `👋 ${m.name} покидає клан.`); return null; }
  function memberXp(m, n) { m.xp += n; let up = 0; while (m.xp >= 40 + m.lvl * 25) { m.xp -= 40 + m.lvl * 25; m.lvl++; up++; } return up; }
  function contracts(G) {
    const c = G.player.clan; if (!c) return [];
    const wk = Math.floor(day(G) / 7); c.con = c.con || {};
    if (c.con.wk === wk) return c.con.list;
    const r = seeded((G.seed || 1) * 17 + wk * 131 + c.lvl); const all = D().CLAN.contracts.filter((k) => k.diff <= Math.ceil(c.lvl / 2) + 1);
    const pool = all.slice(); const list = [];
    while (list.length < 4 && pool.length) { const i = Math.floor(r() * pool.length); list.push({ ...pool[i], uid: wk + ':' + pool[i].key }); pool.splice(i, 1); }
    c.con = { wk, list }; return list;
  }
  const ROLE_W = { warrior: 1.1, mage: 1.15, healer: 0.9, archer: 1.05, rogue: 1.0 };
  function teamPower(ms) { const roles = new Set(ms.map((m) => m.role)); return ms.reduce((s, m) => s + m.lvl * (ROLE_W[m.role] || 1), 0) * (1 + 0.06 * (roles.size - 1)) + (roles.has('healer') ? 4 : 0); }
  function needPower(con, p) { return (6 + con.diff * con.diff * 5) * (0.6 + Math.min(2.4, p.level / 12)); }
  function chanceOf(G, con, ms) {
    const c = G.player.clan; if (!ms.length) return 0;
    const ratio = teamPower(ms) / needPower(con, G.player);
    return Math.max(0.05, Math.min(0.97, 0.15 + ratio * 0.55 + 0.06 * hallLvl(c, 'warroom')));
  }
  function sendMission(G, uid, mids) {
    const c = G.player.clan; if (!c) return 'Немає клану';
    const con = contracts(G).find((x) => x.uid === uid); if (!con) return 'Контракт уже неактуальний';
    if (c.missions.some((m) => m.uid === uid)) return 'Цей контракт уже виконують';
    const d = day(G); const ms = c.members.filter((m) => mids.includes(m.id) && !(m.busy > d)); if (!ms.length) return 'Обери вільних членів клану';
    const ch = chanceOf(G, con, ms);
    for (const m of ms) m.busy = d + con.days;
    c.missions.push({ uid, key: con.key, name: con.name, icon: con.icon, until: d + con.days, members: ms.map((m) => m.id), chance: ch, gold: con.gold, xp: con.xp, item: con.item || null, fame: con.fame || 0 });
    clanLog(G, `${con.icon} Загін вирушив: «${con.name}» (шанс ${Math.round(ch * 100)}%)`); return null;
  }
  function resolveMissions(G, d, rnd = Math.random) {
    const p = G.player, c = p.clan; if (!c) return [];
    const out = [];
    for (const ms of c.missions.slice()) {
      if (d < ms.until) continue;
      c.missions = c.missions.filter((x) => x !== ms);
      const team = c.members.filter((m) => ms.members.includes(m.id)); for (const m of team) m.busy = -1;
      const ok = rnd() < ms.chance; const scale = 1 + (p.level - 1) * 0.06;
      if (ok) {
        const g = Math.round(ms.gold * scale); c.bank += g; for (const m of team) memberXp(m, Math.round(ms.xp * 0.6));
        addClanXp(G, ms.xp); if (ms.item && D().getItem(ms.item[0])) PL().addItem(p, ms.item[0], ms.item[1]); if (ms.fame && PL().addFame) PL().addFame(p, ms.fame);
        const t = `${ms.icon} «${ms.name}» — успіх! +${g}🪙 у скарбницю${ms.item && D().getItem(ms.item[0]) ? `, ${PL().item(ms.item[0]).icon}×${ms.item[1]}` : ''}`; clanLog(G, t); out.push(t);
      } else {
        for (const m of team) memberXp(m, Math.round(ms.xp * 0.2)); addClanXp(G, Math.round(ms.xp * 0.25));
        const t = `${ms.icon} «${ms.name}» — провал: ${D().CLAN.fails[Math.floor(rnd() * D().CLAN.fails.length)]}.`; clanLog(G, t); out.push(t);
      }
    }
    return out;
  }
  function daily(G, d) {
    const p = G.player, c = p.clan; if (!c) return;
    const res = resolveMissions(G, d); if (G.notices) for (const t of res) G.notices.push('🏯 ' + t);
    const tr = hallLvl(c, 'training'); if (tr) for (const m of c.members) if (!(m.busy > d)) memberXp(m, 3 * tr);
    const v = hallLvl(c, 'vault'); if (v) c.bank += Math.min(300, Math.floor(c.bank * 0.005 * v));
  }
  // війна гільдій: виклик чемпіонів суперників (бій запускає UI)
  function warReady(G) { const c = G.player.clan; return !!c && day(G) >= (c.warCool || -1); }
  function warEnemies(G, rivalId) {
    const p = G.player, c = p.clan, C = ISK.combat; const R = (D().RIVAL_GUILDS || []).find((x) => x.id === rivalId); if (!R || !C) return null;
    const rep = (c.rep[rivalId] || 0); const lvl = p.level + Math.floor(rep / 2) + 1;
    const keys = ['soldier', 'bandit', 'pirate', 'orc']; const n = 2 + (rep >= 3 ? 1 : 0);
    const out = []; for (let i = 0; i < n; i++) out.push(C.makeEnemy(keys[(i + rep) % keys.length], lvl, { noScale: true, elite: i === 0, name: i === 0 ? `Чемпіон «${R.name}»` : `Боєць «${R.name}»`, icon: R.icon }));
    return out;
  }
  function warResult(G, rivalId, win) {
    const p = G.player, c = p.clan; if (!c) return null; const R = (D().RIVAL_GUILDS || []).find((x) => x.id === rivalId);
    c.warCool = day(G) + 5;
    if (win) { c.rep[rivalId] = (c.rep[rivalId] || 0) + 1; c.wars++; const g = 200 + c.lvl * 90 + c.rep[rivalId] * 60; c.bank += g; addClanXp(G, 80 + c.lvl * 15); if (PL().addFame) PL().addFame(p, 6 + c.rep[rivalId]); clanLog(G, `⚔️ Перемога над «${R.name}»! +${g}🪙 у скарбницю`); return { gold: g }; }
    clanLog(G, `💢 Поразка від «${R.name}». Реванш за 5 днів.`); return { gold: 0 };
  }
  function seatName(G) { const c = G.player.clan; return c && G.world && G.world.baronies[c.seat] ? G.world.baronies[c.seat].name : '—'; }

  // ================= Гачки в основну гру =================
  // викликається з applyRewards до нарахування
  function boostRewards(G, r) {
    if (!r || r._clan) return; r._clan = true; const pk = perks(G.player);
    if (pk.xp) r.xp = Math.round(r.xp * (1 + pk.xp)); if (pk.gold) r.gold = Math.round(r.gold * (1 + pk.gold)); if (pk.fame && r.fame) r.fame = Math.round(r.fame * (1 + pk.fame));
  }
  function onWin(G) {
    const p = G.player; sync(p);
    for (const c of p.party) if (c.legend) addBond(G, c.legend, 1);
    if (p.clan) addClanXp(G, 4 + Math.floor(p.level / 4));
  }

  ISK.bonds = {
    legends, st, partyCap, bondTier, TIER_NAMES, meetCandidates, rollMeet, meet, join, leave, inParty, sync, addBond, nextChapter, talk, likes, gift, completeChapter, companionMul, signature,
    clanCan, foundClan, perks, addClanXp, hallLvl, memberCap, upgradeHall, deposit, withdraw, candidates, recruitMember, dismiss, contracts, chanceOf, teamPower, sendMission, resolveMissions, daily,
    warReady, warEnemies, warResult, seatName, clanLog, boostRewards, onWin,
  };
})();
