// Combat engine v2: party (hero + companions + pet) vs enemies, enemy intents & skills, limit-break gauge, statuses.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const D = () => ISK.data;
  const PL = () => ISK.player;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const chance = (x) => Math.random() < x;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  function makeEnemy(key, lvl, mods = {}) {
    const m = D().MONSTERS[key] || D().MONSTERS.goblin;
    lvl = Math.max(1, Math.round(lvl));
    const f = mods.elite ? 1.8 : 1;
    const e = {
      key, name: (mods.elite ? 'Елітний ' : '') + m.name, icon: m.icon, lvl, humanoid: !!m.humanoid,
      maxHp: Math.round(m.hp * (1 + 0.24 * (lvl - 1)) * f), atk: Math.round(m.atk * (1 + 0.2 * (lvl - 1)) * (mods.elite ? 1.25 : 1)),
      def: Math.round(m.def * (1 + 0.17 * (lvl - 1))), agi: m.agi + lvl * 0.3, weak: m.weak || [], resist: m.resist || [], status: {}, buffs: {},
      elite: !!mods.elite, boss: false, xp: Math.round((10 + lvl * 7) * m.xp * (mods.elite ? 2.2 : 1)), gold: Math.round((m.gold + lvl * 1.5) * (mods.elite ? 2.5 : 1)),
      drops: m.drops || [], drain: m.drain || 0, regen: m.regen || 0, skills: m.skills || [], turn: 0,
    };
    if (mods.name) e.name = mods.name;
    if (mods.icon) e.icon = mods.icon;
    e.hp = e.maxHp;
    return e;
  }

  function makeBoss(dtype, lvl) {
    const b = D().BOSSES[dtype] || D().BOSSES.goblin;
    const base = makeEnemy('orc', lvl);
    Object.assign(base, { name: b.name, icon: b.icon, boss: true, dtype, key: 'boss_' + dtype, humanoid: false, line: b.line });
    base.maxHp = Math.round(base.maxHp * (2.2 + b.hp * 0.35)); base.hp = base.maxHp;
    base.atk = Math.round(base.atk * (0.75 + b.atk * 0.35)); base.def = Math.round(base.def * b.def * 0.8); base.agi = 6 + lvl * 0.4;
    base.weak = b.elemWeak || []; base.resist = [];
    base.xp = Math.round(base.xp * 6); base.gold = Math.round(base.gold * 8 + 50);
    base.skills = [['slam', 'Нищівний удар', 'hit', 2.1, 2], ['wave', 'Хвиля руйнування', 'aoe', 1.3, 2], ['roar', 'Лютий рев', 'buff', 0, 1], ['regen', 'Темне відновлення', 'heal', 0.12, 1]];
    if (dtype === 'citadel') { base.phase = 1; base.finalBoss = true; }
    return base;
  }

  function startBattle(p, enemies, opts = {}) {
    const allies = [{ kind: 'player', name: p.name, icon: p.gender === 'f' ? '👩' : '🧑', alive: true }];
    for (const c of p.party) {
      const st = PL().companionStats(c);
      if (c.hp === undefined || c.hp > st.maxHp) c.hp = st.maxHp;
      allies.push({ kind: 'comp', ref: c, name: c.name, icon: c.icon, maxHp: st.maxHp, atk: st.atk, def: st.def, alive: c.hp > 0, status: {} });
    }
    const pet = p.pets[p.activePet];
    if (pet) { const st = PL().petStats(p, pet); allies.push({ kind: 'pet', ref: pet, name: pet.name, icon: D().PETS[pet.key].icon, role: D().PETS[pet.key].role, hp: st.maxHp, maxHp: st.maxHp, atk: st.atk, heal: st.heal, def: 2 + pet.lvl, alive: true, status: {} }); }
    const b = { allies, enemies, buffs: {}, cd: {}, turn: 0, over: null, opts, limit: 0, defending: false, pStatus: {}, undyingUsed: false, rewards: null, firstStrike: p.cheat === 'ninja' };
    planIntents(b);
    return b;
  }

  const alive = (b) => b.enemies.filter((e) => e.hp > 0);
  const aliveAllies = (b, p) => b.allies.filter((a) => (a.kind === 'player' ? p.hp > 0 : a.kind === 'comp' ? a.ref.hp > 0 : a.hp > 0));
  const allyHp = (a, p) => (a.kind === 'player' ? p.hp : a.kind === 'comp' ? a.ref.hp : a.hp);
  function setAllyHp(a, p, v) { if (a.kind === 'player') p.hp = v; else if (a.kind === 'comp') a.ref.hp = v; else a.hp = v; }

  const INTENT_TXT = { hit: '⚔️', aoe: '💥', heal: '💚', buff: '⬆️', poison: '☠️', stun: '💫', drain: '🩸', summon: '➕', attack: '🗡️' };
  function planIntents(b) {
    for (const e of b.enemies) {
      if (e.hp <= 0) continue;
      let s = null;
      const opts = e.skills.filter((sk) => !(sk[2] === 'heal' && e.hp > e.maxHp * 0.6) && !(sk[2] === 'summon' && (b.enemies.length >= 4 || e.hp > e.maxHp * 0.7)));
      if (opts.length && chance(e.boss ? 0.55 : 0.38)) {
        const tot = opts.reduce((x, k) => x + k[4], 0); let r = Math.random() * tot;
        for (const k of opts) { r -= k[4]; if (r <= 0) { s = k; break; } }
      }
      e.intent = s ? { id: s[0], name: s[1], kind: s[2], mult: s[3] } : { id: 'attack', name: 'Атака', kind: 'attack', mult: 1 };
      e.intent.icon = INTENT_TXT[e.intent.kind];
    }
  }

  function elemMult(e, elem) { if (!elem) return 1; if (e.weak.includes(elem)) return 1.5; if (e.resist.includes(elem)) return 0.5; return 1; }
  function mitig(atk, def, pierce) { return atk * (pierce ? 1 : 70 / (70 + def * 2)); }

  function hitEnemy(b, e, raw, opts, ev, by) {
    if (e.hp <= 0) return 0;
    let dmg = mitig(raw, e.def * (e.buffs.def ? 1.5 : 1), opts.pierce) * rnd(0.9, 1.1);
    const em = elemMult(e, opts.elem); dmg *= em;
    if (opts.crit) dmg *= 1.75;
    if (e.status.freeze) dmg *= 1.2;
    if (opts.execute && e.hp < e.maxHp * 0.3) dmg *= 3;
    dmg = Math.max(1, Math.round(dmg));
    e.hp = Math.max(0, e.hp - dmg);
    ev.push({ kind: 'dmg', side: 'enemy', target: b.enemies.indexOf(e), amount: dmg, crit: !!opts.crit, weak: em > 1, resist: em < 1, elem: opts.elem, by });
    if (e.hp <= 0) ev.push({ kind: 'die', target: b.enemies.indexOf(e), name: e.name });
    return dmg;
  }

  function applyStatus(e, effect, ev, idx) {
    if (!effect || !effect.status || e.hp <= 0) return;
    if (e.boss && (effect.status === 'stun' || effect.status === 'freeze') && chance(0.5)) { ev.push({ kind: 'text', text: `${e.name} опирається!` }); return; }
    if (chance(effect.chance ?? 1)) {
      e.status[effect.status] = effect.turns;
      ev.push({ kind: 'status', target: idx, text: { poison: '☠️ Отруєння', burn: '🔥 Горіння', freeze: '❄️ Заморожено', stun: '💫 Оглушено' }[effect.status] });
    }
  }

  function partyHeal(b, p, amt, ev, label) {
    for (const a of aliveAllies(b, p)) {
      const max = a.kind === 'player' ? PL().maxHp(p) : a.maxHp;
      const before = allyHp(a, p); setAllyHp(a, p, Math.min(max, before + amt));
      ev.push({ kind: 'heal', side: 'ally', ally: b.allies.indexOf(a), amount: allyHp(a, p) - before, text: label });
      label = null;
    }
  }

  function playerAction(b, p, d, action, ev) {
    const target = b.enemies[action.target] && b.enemies[action.target].hp > 0 ? b.enemies[action.target] : alive(b)[0];
    const critRoll = (bonus = 0) => { if (b.firstStrike) { b.firstStrike = false; return true; } return chance((d.crit + bonus + (b.buffs.crit ? b.buffs.crit.amt : 0)) / 100); };
    const atkMul = (b.buffs.atk ? 1 + b.buffs.atk.amt : 1) * (p.cheat === 'berserk' && p.hp < PL().maxHp(p) * 0.4 ? 1.4 : 1);
    if (action.type === 'attack') {
      if (!target) return;
      const magicW = d.weapon && d.weapon.matk;
      const crit = action.quality >= 1.3 || critRoll();
      hitEnemy(b, target, (magicW ? d.matk : d.atk) * atkMul * (action.quality || 1), { crit, elem: !magicW && d.blunt ? 'blunt' : null }, ev, 'player');
      b.limit = Math.min(100, b.limit + 9);
    } else if (action.type === 'limit') {
      if (b.limit < 100) return ev.push({ kind: 'text', text: 'Шкала ульти ще не заповнена!' });
      b.limit = 0;
      ev.push({ kind: 'limit', text: `${p.name}: «СИЛА ПРОТАГОНІСТА!!!»` });
      for (const e of alive(b)) hitEnemy(b, e, Math.max(d.atk, d.matk) * 4.2 * atkMul, { crit: true, pierce: true }, ev, 'player');
      partyHeal(b, p, Math.round(PL().maxHp(p) * 0.2), ev, '✨ Сила дружби лікує команду');
    } else if (action.type === 'skill') {
      const sk = PL().knownSkills(p).find((s) => s.id === action.id);
      if (!sk) return ev.push({ kind: 'text', text: 'Невідома навичка.' });
      if (p.mp < sk.mp) return ev.push({ kind: 'text', text: 'Недостатньо мани!' });
      if (b.cd[sk.id] > 0) return ev.push({ kind: 'text', text: 'Навичка перезаряджається.' });
      p.mp -= sk.mp; b.cd[sk.id] = (sk.cd || 0) + 1;
      ev.push({ kind: 'skill', name: sk.name, icon: sk.icon, big: sk.ascend || sk.mp >= 40 });
      const magic = sk.scale === 'int';
      const statAtk = sk.scale === 'luk' ? d.atk * (0.6 + d.s.luk / 40) : magic ? d.matk : d.atk;
      if (sk.heal) {
        const base = sk.scale === 'vit' ? d.s.vit * 5 + p.level * 5 : d.matk * 1.3;
        const amt = Math.round(base * sk.heal * rnd(0.9, 1.1));
        if (sk.target === 'party') partyHeal(b, p, amt, ev, `${sk.icon} ${sk.name}`);
        else { const before = p.hp; p.hp = Math.min(d.maxHp, p.hp + amt); ev.push({ kind: 'heal', side: 'ally', ally: 0, amount: p.hp - before }); }
      }
      if (sk.effect && sk.effect.buff) { b.buffs[sk.effect.buff] = { amt: sk.effect.amt, turns: sk.effect.turns }; ev.push({ kind: 'buff', text: `${sk.icon} ${sk.name} (${sk.effect.turns} х.)` }); }
      if (sk.power) {
        const targets = sk.target === 'all' ? alive(b) : [target].filter(Boolean);
        for (const t of targets) {
          for (let h = 0; h < (sk.hits || 1); h++) {
            if (t.hp <= 0) break;
            const dmg = hitEnemy(b, t, statAtk * sk.power * atkMul * (action.quality || 1), { elem: sk.elem, pierce: sk.pierce, crit: critRoll(sk.critBonus || 0), execute: sk.execute }, ev, 'player');
            if (sk.drain) { const hgain = Math.round(dmg * sk.drain); p.hp = Math.min(d.maxHp, p.hp + hgain); }
            if (sk.steal && dmg > 0) { const g = Math.round(t.gold * rnd(0.3, 0.7) + 5); p.gold += g; ev.push({ kind: 'text', text: `💰 Вкрадено ${g} золота!` }); }
          }
          if (!(sk.effect && sk.effect.buff)) applyStatus(t, sk.effect, ev, b.enemies.indexOf(t));
        }
        b.limit = Math.min(100, b.limit + 6);
      }
    } else if (action.type === 'item') {
      const it = PL().item(action.id);
      if (!it || !PL().hasItem(p, action.id)) return ev.push({ kind: 'text', text: 'Немає предмета.' });
      const u = it.use;
      if (u.dmg) {
        PL().removeItem(p, action.id);
        ev.push({ kind: 'skill', name: it.name, icon: it.icon });
        for (const t of alive(b)) { hitEnemy(b, t, u.dmg * (1 + p.level * 0.09), { pierce: true, elem: u.elem }, ev, 'player'); if (u.status) applyStatus(t, { status: u.status, turns: 1, chance: 0.6 }, ev, b.enemies.indexOf(t)); }
      } else if (u.buff) {
        PL().removeItem(p, action.id); b.buffs[u.buff] = { amt: u.amt, turns: u.turns }; ev.push({ kind: 'buff', text: `${it.icon} ${it.name}` });
      } else if (u.cure) { PL().removeItem(p, action.id); b.pStatus = {}; ev.push({ kind: 'text', text: '💊 Отруту виведено.' }); }
      else if (u.teleport || u.reveal) ev.push({ kind: 'text', text: 'Цей сувій не працює в бою.' });
      else { const r = PL().useConsumable(p, action.id); if (r) ev.push({ kind: 'heal', side: 'ally', ally: 0, amount: 0, text: `${it.icon} ${r.text}` }); }
    } else if (action.type === 'defend') {
      b.defending = true; const g = Math.round(d.maxMp * 0.12); p.mp = Math.min(d.maxMp, p.mp + g);
      b.limit = Math.min(100, b.limit + 5);
      ev.push({ kind: 'text', text: `🛡️ Захисна стійка (+${g} мани)` });
    } else if (action.type === 'flee') {
      if (b.enemies.some((e) => e.boss) || b.opts.noFlee) ev.push({ kind: 'text', text: 'Від цього бою не втечеш!' });
      else {
        const avg = alive(b).reduce((s, e) => s + e.agi, 0) / Math.max(1, alive(b).length);
        if (chance(0.45 + (d.s.agi - avg) * 0.03 + d.s.luk * 0.01)) { b.over = 'flee'; ev.push({ kind: 'text', text: '💨 Ти успішно втік! Героїчно. Майже.' }); }
        else ev.push({ kind: 'text', text: 'Втекти не вдалося!' });
      }
    }
  }

  function alliesAct(b, p, d, ev) {
    for (const a of b.allies) {
      if (a.kind === 'player' || !alive(b).length) continue;
      if (allyHp(a, p) <= 0) continue;
      if (a.kind === 'comp') {
        const c = a.ref; const t = pick(alive(b));
        const low = aliveAllies(b, p).find((x) => allyHp(x, p) < (x.kind === 'player' ? d.maxHp : x.maxHp) * 0.45);
        if (c.role === 'healer' && low && chance(0.7)) { partyHeal(b, p, Math.round(a.atk * 1.6), ev, `${a.icon} ${a.name} лікує команду`); continue; }
        if (c.role === 'mage' && chance(0.4)) { ev.push({ kind: 'text', text: `${a.icon} ${a.name}: «Вогняна куля!»` }); for (const e of alive(b)) hitEnemy(b, e, a.atk * 1.1, { elem: 'fire' }, ev, 'comp'); continue; }
        hitEnemy(b, t, a.atk * (b.buffs.atk ? 1 + b.buffs.atk.amt : 1), { crit: chance(c.role === 'rogue' ? 0.3 : 0.1) }, ev, 'comp:' + a.name);
        if (chance(0.08)) { const tr = D().COMPANION_TRAITS.find((x) => x.id === c.trait); if (tr) ev.push({ kind: 'text', text: `${a.icon} ${a.name}: «${tr.line}»` }); }
      } else if (a.kind === 'pet') {
        const role = a.role;
        if ((role === 'heal') && chance(0.5)) { partyHeal(b, p, a.heal, ev, `${a.icon} ${a.name} обіймає команду`); }
        else if (role === 'buff' && chance(0.4)) { b.buffs.crit = { amt: 15, turns: 2 }; ev.push({ kind: 'buff', text: `${a.icon} ${a.name} підказує слабкі місця (+15% криту)` }); }
        else if (role === 'loot' && chance(0.3)) { const g = 5 + Math.round(Math.random() * 10 * p.level); p.gold += g; ev.push({ kind: 'text', text: `${a.icon} ${a.name} поцупив ${g} 🪙 у ворога!` }); }
        else { const t = pick(alive(b)); hitEnemy(b, t, a.atk * (role === 'magic' ? 1.3 : 1), { elem: role === 'magic' ? 'fire' : null }, ev, 'pet:' + a.name); }
        if (a.ref.key === 'slime' && chance(0.1)) ev.push({ kind: 'text', text: pick(D().SLIME_LINES) });
      }
    }
  }

  function enemyTarget(b, p) {
    const al = aliveAllies(b, p);
    if (b.buffs.taunt) return al.find((a) => a.kind === 'player') || al[0];
    const tank = al.find((a) => a.kind === 'pet' && a.role === 'tank');
    if (tank && chance(0.5)) return tank;
    return chance(0.55) ? al.find((a) => a.kind === 'player') || pick(al) : pick(al);
  }

  function damageAlly(b, p, d, a, raw, ev, by, opts = {}) {
    const isP = a.kind === 'player';
    if (isP && chance((d.dodge + (b.buffs.dodge ? b.buffs.dodge.amt : 0) + (p.cheat === 'plot' ? 15 : 0)) / 100) && !opts.sure) { ev.push({ kind: 'miss', side: 'ally', ally: 0, by }); return 0; }
    const def = isP ? d.def * (b.buffs.def ? 1 + b.buffs.def.amt : 1) : a.def * (b.buffs.def ? 1 + b.buffs.def.amt * 0.5 : 1);
    let dmg = mitig(raw * rnd(0.88, 1.12), def);
    if (isP && b.defending) dmg *= 0.45;
    if (isP && b.buffs.shield) dmg *= 1 - b.buffs.shield.amt;
    if (isP && b.buffs.taunt) dmg *= 0.8;
    dmg = Math.max(1, Math.round(dmg));
    let hp = Math.max(0, allyHp(a, p) - dmg);
    if (isP && p.flags && p.flags.godMode) hp = Math.max(1, hp);
    if (isP && hp <= 0 && p.cheat === 'undying' && !b.undyingUsed) { b.undyingUsed = true; hp = 1; ev.push({ kind: 'text', text: '💀 «Безсмертний (майже)»: ти виживаєш з 1 HP!' }); }
    setAllyHp(a, p, hp);
    ev.push({ kind: 'dmg', side: 'ally', ally: b.allies.indexOf(a), amount: dmg, by });
    if (isP) b.limit = Math.min(100, b.limit + 6);
    if (isP && p.hp <= 0 && PL().hasItem(p, 'phoenix')) { PL().removeItem(p, 'phoenix'); p.hp = Math.round(d.maxHp * 0.5); ev.push({ kind: 'heal', side: 'ally', ally: 0, amount: p.hp, text: '🪶 Перо фенікса спалахує! Ти воскресаєш!' }); }
    if (!isP && hp <= 0) ev.push({ kind: 'text', text: `😵 ${a.name} вибуває з бою!` });
    if (isP && b.buffs.counter) { const e = b.enemies[by]; if (e && e.hp > 0) { hitEnemy(b, e, d.atk * b.buffs.counter.amt, {}, ev, 'player'); ev.push({ kind: 'text', text: '⚔️ Контратака!' }); } }
    return dmg;
  }

  function enemyPhase(b, p, d, ev) {
    for (const e of b.enemies.slice()) {
      if (e.hp <= 0 || p.hp <= 0) continue;
      e.turn++;
      if (e.status.poison) { const dmg = Math.max(1, Math.round(e.maxHp * (e.boss ? 0.025 : 0.07))); e.hp = Math.max(0, e.hp - dmg); ev.push({ kind: 'dmg', side: 'enemy', target: b.enemies.indexOf(e), amount: dmg, dot: 'poison' }); }
      if (e.status.burn) { const dmg = Math.max(1, Math.round(e.maxHp * (e.boss ? 0.03 : 0.06) + d.matk * 0.2)); e.hp = Math.max(0, e.hp - dmg); ev.push({ kind: 'dmg', side: 'enemy', target: b.enemies.indexOf(e), amount: dmg, dot: 'burn' }); }
      if (e.hp <= 0) { ev.push({ kind: 'die', target: b.enemies.indexOf(e), name: e.name }); continue; }
      if (e.status.freeze || e.status.stun) { ev.push({ kind: 'text', text: `${e.icon} ${e.name} не може рухатися!` }); continue; }
      if (e.regen) e.hp = Math.min(e.maxHp, e.hp + Math.round(e.maxHp * e.regen));
      if (e.finalBoss && e.phase === 1 && e.hp < e.maxHp * 0.5) {
        e.phase = 2; e.atk = Math.round(e.atk * 1.3); e.icon = '👹';
        ev.push({ kind: 'text', text: '👹 Малдраґор: «Ти думав, це моя справжня форма?! Ось вона! ...Почекай, корону поправлю.»', big: true });
      }
      const it = e.intent || { kind: 'attack', mult: 1, name: 'Атака' };
      const atk = e.atk * (e.buffs.atk ? 1.4 : 1);
      if (it.kind !== 'attack') ev.push({ kind: 'text', text: `${e.icon} ${e.name}: «${it.name}»!` });
      switch (it.kind) {
        case 'aoe': for (const a of aliveAllies(b, p)) damageAlly(b, p, d, a, atk * it.mult * 0.8, ev, b.enemies.indexOf(e)); break;
        case 'heal': { const h = Math.round(e.maxHp * (it.mult || 0.15)); e.hp = Math.min(e.maxHp, e.hp + h); ev.push({ kind: 'heal', side: 'enemy', target: b.enemies.indexOf(e), amount: h }); break; }
        case 'buff': e.buffs.atk = 3; e.buffs.def = 3; ev.push({ kind: 'status', target: b.enemies.indexOf(e), text: '⬆️ Посилення' }); break;
        case 'summon': { if (b.enemies.length < 5) { const n = makeEnemy(e.key, Math.max(1, e.lvl - 2)); n.name = 'Малий ' + n.name.toLowerCase(); n.maxHp = Math.round(n.maxHp * 0.5); n.hp = n.maxHp; n.skills = []; b.enemies.push(n); ev.push({ kind: 'summon', text: `${e.icon} ${e.name} ділиться! З'являється ${n.name}!` }); } break; }
        case 'drain': { const t = enemyTarget(b, p); const dmg = damageAlly(b, p, d, t, atk * it.mult, ev, b.enemies.indexOf(e)); e.hp = Math.min(e.maxHp, e.hp + Math.round(dmg * 0.6)); break; }
        case 'poison': { const t = enemyTarget(b, p); const dmg = damageAlly(b, p, d, t, atk * it.mult, ev, b.enemies.indexOf(e)); if (dmg && t.kind === 'player' && chance(0.6)) { b.pStatus.poison = 3; ev.push({ kind: 'status', side: 'ally', text: '☠️ Тебе отруєно!' }); } break; }
        case 'stun': { const t = enemyTarget(b, p); const dmg = damageAlly(b, p, d, t, atk * Math.max(0.4, it.mult), ev, b.enemies.indexOf(e)); if (dmg && t.kind === 'player' && chance(0.35) && !b.defending) { b.pStatus.stun = 1; ev.push({ kind: 'status', side: 'ally', text: '💫 Тебе оглушено! Пропуск ходу.' }); } break; }
        default: { const t = enemyTarget(b, p); damageAlly(b, p, d, t, atk * (it.mult || 1), ev, b.enemies.indexOf(e)); }
      }
      if (e.drain && it.kind === 'attack') e.hp = Math.min(e.maxHp, e.hp + Math.round(e.atk * e.drain));
      for (const k of Object.keys(e.buffs)) if (--e.buffs[k] <= 0) delete e.buffs[k];
    }
  }

  function endRound(b, p, d, ev) {
    for (const k of Object.keys(b.buffs)) {
      if (k === 'regen') { const h = Math.round(d.maxHp * b.buffs.regen.amt); p.hp = Math.min(d.maxHp, p.hp + h); ev.push({ kind: 'heal', side: 'ally', ally: 0, amount: h }); }
      if (--b.buffs[k].turns <= 0) delete b.buffs[k];
    }
    if (p.food && p.food.buff === 'regen') p.hp = Math.min(d.maxHp, p.hp + Math.round(d.maxHp * p.food.amt));
    for (const k of Object.keys(b.cd)) if (--b.cd[k] <= 0) delete b.cd[k];
    for (const e of b.enemies) for (const s of Object.keys(e.status)) if (--e.status[s] <= 0) delete e.status[s];
    if (b.pStatus.poison) { const dmg = Math.round(d.maxHp * 0.05); p.hp = Math.max(1, p.hp - dmg); ev.push({ kind: 'dmg', side: 'ally', ally: 0, amount: dmg, dot: 'poison' }); if (--b.pStatus.poison <= 0) delete b.pStatus.poison; }
    p.mp = Math.min(d.maxMp, p.mp + Math.round(d.maxMp * (p.cheat === 'mana' ? 0.08 : 0.03)));
    b.hasteUsed = false;
    planIntents(b);
  }

  function checkEnd(b, p, ev) {
    if (!alive(b).length) { b.over = 'win'; computeRewards(b, p); ev.push({ kind: 'end', result: 'win' }); return true; }
    if (p.hp <= 0) { b.over = 'lose'; ev.push({ kind: 'end', result: 'lose' }); return true; }
    return false;
  }

  function act(b, p, action) {
    const ev = [];
    if (b.over) return ev;
    const d = PL().derived(p);
    b.turn++; b.defending = false;
    if (b.pStatus.stun) { delete b.pStatus.stun; ev.push({ kind: 'text', text: '💫 Ти оговтуєшся від оглушення...' }); }
    else playerAction(b, p, d, action, ev);
    if (b.over) return ev;
    if (checkEnd(b, p, ev)) return ev;
    if (b.buffs.haste && !b.hasteUsed && action.type !== 'flee') { b.hasteUsed = true; ev.push({ kind: 'text', text: '⚡ Прискорення: додатковий хід!' }); return ev; }
    alliesAct(b, p, d, ev);
    if (checkEnd(b, p, ev)) return ev;
    enemyPhase(b, p, d, ev);
    if (checkEnd(b, p, ev)) return ev;
    endRound(b, p, d, ev);
    checkEnd(b, p, ev);
    return ev;
  }

  function computeRewards(b, p) {
    const d = PL().derived(p);
    let xp = 0, gold = 0, fame = 0; const items = {};
    const lootMul = (1 + d.s.luk * 0.015) * (p.cheat === 'loot' ? 1.4 : 1);
    for (const e of b.enemies) {
      xp += e.xp; gold += Math.round(e.gold * rnd(0.7, 1.3));
      for (const [id, pr] of [...e.drops, ...D().extraDrops(e.key)]) if (chance(Math.min(0.95, pr * lootMul))) items[id] = (items[id] || 0) + 1;
      // random gear drop from ordinary monsters (rarity rolled)
      if (!e.boss && !e.elite && chance(0.06 * lootMul)) { const gid = D().randomGear(e.lvl, D().rollRarity(lootMul, false), p.classes.primary ? D().CLASSES[p.classes.primary].weapon : null); items[gid] = (items[gid] || 0) + 1; }
      if (e.boss) { const us = D().uniqueFor(e.dtype); if (us.length && chance(0.22 * lootMul)) { const u = pick(us); items[u.id] = 1; } }
      if (e.boss || e.elite) {
        fame += e.boss ? 25 + e.lvl : 4;
        const cls = p.classes.primary ? D().CLASSES[p.classes.primary].weapon : 'sword';
        const nDrops = e.boss ? (chance(0.4) ? 2 : 1) : (chance(0.45) ? 1 : 0);
        for (let k = 0; k < nDrops; k++) { const wid = D().randomGear(e.lvl, e.boss ? D().rollRarity(lootMul, true) : Math.max(1, D().rollRarity(lootMul, false)), cls); items[wid] = (items[wid] || 0) + 1; }
        if (e.boss && chance(0.5)) { const acc = D().ACCESSORIES.filter((a) => a.lvl <= e.lvl + 3); if (acc.length) { const a = pick(acc); items[a.id] = (items[a.id] || 0) + 1; } }
        if (e.dtype === 'dragon' && chance(0.5)) items.dragon_egg = 1;
      }
      p.kills[e.key] = (p.kills[e.key] || 0) + 1;
    }
    if (b.opts.xpMul) xp = Math.round(xp * b.opts.xpMul);
    if (p.cheat === 'midas') gold = Math.round(gold * 1.6);
    if (b.opts.horde) fame += 20;
    b.rewards = { xp, gold, items, fame };
  }

  ISK.combat = { makeEnemy, makeBoss, startBattle, act, alive, aliveAllies, allyHp };
})();
