// Turn-based combat engine (pure logic; UI animates the returned events).
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const D = () => ISK.data;
  const PL = () => ISK.player;

  function makeEnemy(key, lvl, mods = {}) {
    const m = D().MONSTERS[key];
    lvl = Math.max(1, Math.round(lvl));
    const f = mods.elite ? 1.8 : 1;
    const e = {
      key, name: (mods.elite ? 'Елітний ' : '') + m.name, icon: m.icon, lvl,
      maxHp: Math.round(m.hp * (1 + 0.24 * (lvl - 1)) * f), atk: Math.round(m.atk * (1 + 0.2 * (lvl - 1)) * (mods.elite ? 1.25 : 1)),
      def: Math.round(m.def * (1 + 0.17 * (lvl - 1))), agi: m.agi + lvl * 0.3,
      weak: m.weak || [], resist: m.resist || [], status: {}, elite: !!mods.elite, boss: false,
      xp: Math.round((10 + lvl * 7) * m.xp * (mods.elite ? 2.2 : 1)), gold: Math.round((m.gold + lvl * 1.5) * (mods.elite ? 2.5 : 1)),
      drops: m.drops || [], poison: m.poison || 0, drain: m.drain || 0, regen: m.regen || 0, turn: 0,
    };
    if (mods.name) e.name = mods.name;
    e.hp = e.maxHp;
    return e;
  }

  function makeBoss(dtype, lvl) {
    const b = D().BOSSES[dtype];
    const base = makeEnemy('orc', lvl);
    base.name = b.name; base.icon = b.icon; base.boss = true; base.dtype = dtype; base.key = 'boss_' + dtype;
    base.maxHp = Math.round(base.maxHp * (2.2 + b.hp * 0.35)); base.hp = base.maxHp;
    base.atk = Math.round(base.atk * (0.75 + b.atk * 0.35)); base.def = Math.round(base.def * b.def * 0.8);
    base.agi = 6 + lvl * 0.4;
    base.weak = b.elemWeak || base.weak; base.resist = [];
    base.xp = Math.round(base.xp * 6); base.gold = Math.round(base.gold * 8 + 50);
    base.line = b.line;
    if (dtype === 'citadel') { base.phase = 1; base.finalBoss = true; }
    return base;
  }

  function startBattle(p, enemies, opts = {}) {
    return {
      enemies, buffs: {}, cd: {}, turn: 0, over: null, opts, log: [], defending: false,
      slime: p.companion ? { name: p.companion.name, lvl: p.level } : null, rewards: null,
    };
  }

  const rnd = (a, b) => a + Math.random() * (b - a);
  const chance = (x) => Math.random() < x;

  function elemMult(e, elem) {
    if (!elem) return 1;
    if (e.weak.includes(elem)) return 1.5;
    if (e.resist.includes(elem)) return 0.5;
    return 1;
  }

  function mitig(atk, def, pierce) { return atk * (pierce ? 1 : 70 / (70 + def * 2)); }

  function playerHit(b, p, d, e, power, opts, ev) {
    const atkStat = opts.magic ? d.matk : d.atk;
    let atk = atkStat * power;
    if (b.buffs.atk) atk *= 1 + b.buffs.atk.amt;
    let crit = d.crit + (opts.critBonus || 0) + (b.buffs.crit ? b.buffs.crit.amt : 0);
    const isCrit = opts.forceCrit || chance(crit / 100);
    let dmg = mitig(atk, e.def, opts.pierce) * rnd(0.9, 1.1) * (opts.quality || 1);
    let elem = opts.elem || (!opts.magic && d.blunt ? 'blunt' : null);
    const em = elemMult(e, elem);
    dmg *= em;
    if (isCrit) dmg *= 1.75;
    if (e.status.freeze) dmg *= 1.2;
    dmg = Math.max(1, Math.round(dmg));
    e.hp = Math.max(0, e.hp - dmg);
    ev.push({ kind: 'dmg', side: 'enemy', target: b.enemies.indexOf(e), amount: dmg, crit: isCrit, weak: em > 1, resist: em < 1, elem });
    if (e.hp <= 0) ev.push({ kind: 'die', target: b.enemies.indexOf(e), name: e.name });
    return dmg;
  }

  function applyStatus(e, effect, ev, idx) {
    if (!effect || !effect.status) return;
    if (e.hp <= 0) return;
    if (e.boss && (effect.status === 'stun' || effect.status === 'freeze') && chance(0.5)) { ev.push({ kind: 'text', text: `${e.name} опирається!` }); return; }
    if (chance(effect.chance ?? 1)) {
      e.status[effect.status] = effect.turns;
      const names = { poison: '☠️ Отруєння', burn: '🔥 Горіння', freeze: '❄️ Заморожено', stun: '💫 Оглушено' };
      ev.push({ kind: 'status', target: idx, text: names[effect.status] });
    }
  }

  function alive(b) { return b.enemies.filter((e) => e.hp > 0); }

  function act(b, p, action) {
    const ev = [];
    if (b.over) return ev;
    const d = PL().derived(p);
    b.turn++;
    b.defending = false;
    const target = b.enemies[action.target ?? b.enemies.findIndex((e) => e.hp > 0)] || alive(b)[0];

    if (action.type === 'attack') {
      if (target) {
        const magicW = d.weapon && d.weapon.matk;
        playerHit(b, p, d, target, 1, { quality: action.quality || 1, forceCrit: action.quality >= 1.3, magic: magicW }, ev);
        if (b.buffs.counter) { /* handled when hit */ }
      }
    } else if (action.type === 'skill') {
      const sk = PL().knownSkills(p).find((s) => s.id === action.id);
      if (!sk) return [{ kind: 'text', text: 'Невідома навичка.' }];
      let cost = sk.mp;
      if (p.mp < cost) return [{ kind: 'text', text: 'Недостатньо мани!' }];
      if (b.cd[sk.id] > 0) return [{ kind: 'text', text: 'Навичка перезаряджається.' }];
      p.mp -= cost; b.cd[sk.id] = sk.cd + 1;
      ev.push({ kind: 'skill', name: sk.name, icon: sk.icon });
      const magic = sk.scale === 'int';
      if (sk.target === 'self') {
        if (sk.heal) {
          const base = sk.scale === 'vit' ? d.s.vit * 5 + p.level * 5 : d.matk * 1.3;
          const amt = Math.round(base * sk.heal * rnd(0.9, 1.1));
          const before = p.hp; p.hp = Math.min(d.maxHp, p.hp + amt);
          ev.push({ kind: 'heal', side: 'player', amount: p.hp - before });
        }
        if (sk.effect && sk.effect.buff) {
          b.buffs[sk.effect.buff] = { amt: sk.effect.amt, turns: sk.effect.turns };
          ev.push({ kind: 'buff', text: `${sk.icon} ${sk.name} (${sk.effect.turns} х.)` });
        }
      } else {
        const targets = sk.target === 'all' ? alive(b) : [target];
        const hits = sk.hits || 1;
        for (const t of targets) {
          for (let h = 0; h < hits; h++) {
            if (t.hp <= 0) break;
            const dmg = playerHit(b, p, d, t, sk.power, { magic, elem: sk.elem, pierce: sk.pierce, critBonus: sk.critBonus || 0, quality: action.quality || 1 }, ev);
            if (sk.steal && dmg > 0) {
              const g = Math.round(t.gold * rnd(0.3, 0.7) + 5);
              p.gold += g; ev.push({ kind: 'text', text: `💰 Вкрадено ${g} золота!` });
            }
          }
          applyStatus(t, sk.effect, ev, b.enemies.indexOf(t));
        }
      }
    } else if (action.type === 'item') {
      const it = PL().item(action.id);
      if (!it || !PL().hasItem(p, action.id)) return [{ kind: 'text', text: 'Немає предмета.' }];
      const u = it.use;
      if (u.dmg) {
        PL().removeItem(p, action.id);
        for (const t of alive(b)) {
          const dmg = Math.round(u.dmg * (1 + p.level * 0.08) * elemMult(t, u.elem));
          t.hp = Math.max(0, t.hp - dmg);
          ev.push({ kind: 'dmg', side: 'enemy', target: b.enemies.indexOf(t), amount: dmg, elem: u.elem });
          if (t.hp <= 0) ev.push({ kind: 'die', target: b.enemies.indexOf(t), name: t.name });
        }
      } else if (u.buff) {
        PL().removeItem(p, action.id);
        b.buffs[u.buff] = { amt: u.amt, turns: u.turns };
        ev.push({ kind: 'buff', text: `${it.icon} ${it.name}` });
      } else if (u.cure) {
        PL().removeItem(p, action.id);
        b.playerStatus = {};
        ev.push({ kind: 'text', text: '💊 Отруту виведено.' });
      } else {
        const r = PL().useConsumable(p, action.id);
        if (r) ev.push({ kind: 'heal', side: 'player', amount: 0, text: `${it.icon} ${r.text}` });
      }
    } else if (action.type === 'defend') {
      b.defending = true;
      const mpGain = Math.round(d.maxMp * 0.1);
      p.mp = Math.min(d.maxMp, p.mp + mpGain);
      ev.push({ kind: 'text', text: `🛡️ Захисна стійка (+${mpGain} мани)` });
    } else if (action.type === 'flee') {
      const boss = b.enemies.some((e) => e.boss);
      if (boss || b.opts.noFlee) { ev.push({ kind: 'text', text: 'Від цього бою не втечеш!' }); }
      else {
        const avgAgi = alive(b).reduce((s, e) => s + e.agi, 0) / Math.max(1, alive(b).length);
        if (chance(0.45 + (d.s.agi - avgAgi) * 0.03 + d.s.luk * 0.01)) {
          b.over = 'flee'; ev.push({ kind: 'text', text: '💨 Ти успішно втік! Героїчно. Майже.' }); return ev;
        }
        ev.push({ kind: 'text', text: 'Втекти не вдалося!' });
      }
    }

    // companion slime
    if (b.slime && alive(b).length) {
      const t = alive(b)[0];
      if (chance(0.25) && p.hp < d.maxHp * 0.6) {
        const amt = Math.round(d.maxHp * 0.08);
        p.hp = Math.min(d.maxHp, p.hp + amt);
        ev.push({ kind: 'heal', side: 'player', amount: amt, text: '🟢 Слизько обіймає тебе' });
      } else {
        const dmg = Math.max(1, Math.round(mitig(8 + p.level * 4, t.def) * rnd(0.8, 1.2)));
        t.hp = Math.max(0, t.hp - dmg);
        ev.push({ kind: 'dmg', side: 'enemy', target: b.enemies.indexOf(t), amount: dmg, by: 'slime' });
        if (t.hp <= 0) ev.push({ kind: 'die', target: b.enemies.indexOf(t), name: t.name });
      }
      if (chance(0.12)) ev.push({ kind: 'text', text: ISK.data.SLIME_LINES[Math.floor(Math.random() * ISK.data.SLIME_LINES.length)] });
    }

    if (checkEnd(b, p, ev)) return ev;
    enemyPhase(b, p, d, ev);
    endRound(b, p, d, ev);
    checkEnd(b, p, ev);
    return ev;
  }

  function enemyPhase(b, p, d, ev) {
    for (const e of b.enemies) {
      if (e.hp <= 0 || p.hp <= 0) continue;
      e.turn++;
      // DoT
      if (e.status.poison) { const dmg = Math.max(1, Math.round(e.maxHp * (e.boss ? 0.025 : 0.07))); e.hp = Math.max(0, e.hp - dmg); ev.push({ kind: 'dmg', side: 'enemy', target: b.enemies.indexOf(e), amount: dmg, dot: 'poison' }); }
      if (e.status.burn) { const dmg = Math.max(1, Math.round(e.maxHp * (e.boss ? 0.03 : 0.06) + d.matk * 0.2)); e.hp = Math.max(0, e.hp - dmg); ev.push({ kind: 'dmg', side: 'enemy', target: b.enemies.indexOf(e), amount: dmg, dot: 'burn' }); }
      if (e.hp <= 0) { ev.push({ kind: 'die', target: b.enemies.indexOf(e), name: e.name }); continue; }
      if (e.status.freeze || e.status.stun) { ev.push({ kind: 'text', text: `${e.icon} ${e.name} не може рухатися!` }); continue; }
      if (e.regen) { const h = Math.round(e.maxHp * e.regen); e.hp = Math.min(e.maxHp, e.hp + h); }
      // Boss specials
      let mult = 1, label = null, aoe = false;
      if (e.boss) {
        if (e.finalBoss && e.phase === 1 && e.hp < e.maxHp * 0.5) {
          e.phase = 2; e.atk = Math.round(e.atk * 1.3); e.icon = '👹';
          ev.push({ kind: 'text', text: '👹 Малдраґор: «Ти думав, це моя справжня форма?! Ні! Ось моя справжня форма! ...Почекай, корону поправлю.»', big: true });
        }
        if (e.turn % 4 === 0) { mult = 2.1; label = '💢 Нищівний удар!'; }
        else if (e.turn % 5 === 0 && e.hp < e.maxHp * 0.6) {
          const h = Math.round(e.maxHp * 0.12); e.hp = Math.min(e.maxHp, e.hp + h);
          ev.push({ kind: 'heal', side: 'enemy', target: b.enemies.indexOf(e), amount: h, text: `${e.name} відновлюється!` }); continue;
        }
      }
      if (label) ev.push({ kind: 'text', text: `${e.icon} ${label}` });
      // dodge
      const dodge = d.dodge + (b.buffs.dodge ? b.buffs.dodge.amt : 0);
      if (chance(dodge / 100)) { ev.push({ kind: 'miss', side: 'player', by: b.enemies.indexOf(e) }); continue; }
      let dmg = mitig(e.atk * mult * rnd(0.88, 1.12), d.def * (b.buffs.def ? 1 + b.buffs.def.amt : 1));
      if (b.defending) dmg *= 0.45;
      if (b.buffs.shield) dmg *= 1 - b.buffs.shield.amt;
      if (chance(0.06)) { dmg *= 1.5; }
      dmg = Math.max(1, Math.round(dmg));
      p.hp = Math.max(0, p.hp - dmg);
      ev.push({ kind: 'dmg', side: 'player', amount: dmg, by: b.enemies.indexOf(e) });
      if (e.drain) { const h = Math.round(dmg * e.drain); e.hp = Math.min(e.maxHp, e.hp + h); }
      if (e.poison && chance(e.poison)) { b.playerStatus = { poison: 3 }; ev.push({ kind: 'status', side: 'player', text: '☠️ Тебе отруєно!' }); }
      if (b.buffs.counter && e.hp > 0) {
        playerHit(b, p, d, e, b.buffs.counter.amt, {}, ev);
        ev.push({ kind: 'text', text: '⚔️ Контратака!' });
      }
      if (p.hp <= 0 && PL().hasItem(p, 'phoenix')) {
        PL().removeItem(p, 'phoenix'); p.hp = Math.round(d.maxHp * 0.5);
        ev.push({ kind: 'heal', side: 'player', amount: p.hp, text: '🪶 Перо фенікса спалахує! Ти воскресаєш!' });
      }
    }
  }

  function endRound(b, p, d, ev) {
    for (const k of Object.keys(b.buffs)) {
      if (k === 'regen') { const h = Math.round(d.maxHp * b.buffs.regen.amt); p.hp = Math.min(d.maxHp, p.hp + h); ev.push({ kind: 'heal', side: 'player', amount: h }); }
      if (--b.buffs[k].turns <= 0) delete b.buffs[k];
    }
    if (p.food && p.food.buff === 'regen') p.hp = Math.min(d.maxHp, p.hp + Math.round(d.maxHp * p.food.amt));
    for (const k of Object.keys(b.cd)) if (--b.cd[k] <= 0) delete b.cd[k];
    for (const e of b.enemies) for (const s of Object.keys(e.status)) if (--e.status[s] <= 0) delete e.status[s];
    if (b.playerStatus && b.playerStatus.poison) {
      const dmg = Math.round(d.maxHp * 0.05); p.hp = Math.max(1, p.hp - dmg);
      ev.push({ kind: 'dmg', side: 'player', amount: dmg, dot: 'poison' });
      if (--b.playerStatus.poison <= 0) b.playerStatus = {};
    }
    if (p.cheat === 'mana') p.mp = Math.min(d.maxMp, p.mp + Math.round(d.maxMp * 0.08));
    else p.mp = Math.min(d.maxMp, p.mp + Math.round(d.maxMp * 0.03));
  }

  function checkEnd(b, p, ev) {
    if (!alive(b).length) { b.over = 'win'; computeRewards(b, p); ev.push({ kind: 'end', result: 'win' }); return true; }
    if (p.hp <= 0) { b.over = 'lose'; ev.push({ kind: 'end', result: 'lose' }); return true; }
    return false;
  }

  function computeRewards(b, p) {
    const d = PL().derived(p);
    let xp = 0, gold = 0; const items = {};
    const lootMul = 1 + d.s.luk * 0.015;
    for (const e of b.enemies) {
      xp += e.xp; gold += Math.round(e.gold * rnd(0.7, 1.3));
      for (const [id, pr] of e.drops) if (chance(Math.min(0.95, pr * lootMul))) items[id] = (items[id] || 0) + 1;
      if (e.boss || e.elite) {
        // equipment drop
        const tier = Math.max(0, Math.min(5, Math.floor(e.lvl / 6)));
        const rar = e.boss ? (chance(0.35) ? 3 : 2) : (chance(0.3 * lootMul) ? 1 : 0);
        if (e.boss || chance(0.4)) {
          const cls = p.classes.primary ? D().CLASSES[p.classes.primary].weapon : 'sword';
          const wid = chance(0.6) ? `w_${chance(0.7) ? cls : Object.keys(D().WEAPON_TYPES)[Math.floor(Math.random() * 7)]}_${tier}_${rar}` : `a_${['cloth', 'leather', 'plate'][Math.floor(Math.random() * 3)]}_${tier}_${rar}`;
          items[wid] = (items[wid] || 0) + 1;
        }
        if (e.boss && chance(0.5)) { const acc = D().ACCESSORIES.filter((a) => a.lvl <= e.lvl + 3); if (acc.length) { const a = acc[Math.floor(Math.random() * acc.length)]; items[a.id] = (items[a.id] || 0) + 1; } }
      }
      p.kills[e.key] = (p.kills[e.key] || 0) + 1;
    }
    if (b.opts.xpMul) xp = Math.round(xp * b.opts.xpMul);
    b.rewards = { xp, gold, items };
  }

  ISK.combat = { makeEnemy, makeBoss, startBattle, act, alive };
})();
