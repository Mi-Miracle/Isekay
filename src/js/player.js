// Player character: stats, levels, classes, inventory, equipment, professions, guild.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const D = () => ISK.data;

  function newPlayer(opts) {
    const p = {
      name: opts.name || 'Хіро', gender: opts.gender || 'm', cheat: opts.cheat || 'luck', origin: opts.origin || 'офісний працівник',
      level: 1, xp: 0, statPoints: 3,
      stats: { str: 5, agi: 5, int: 5, vit: 5, luk: 5 },
      hp: 1, mp: 1, gold: 60,
      classes: { primary: null, secondary: null }, classXp: {},
      inventory: { potion_s: 3, food_bread: 2 },
      equipment: { weapon: 'w_sword_0_0', armor: 'a_cloth_0_0', accessory: null },
      professions: {}, guild: { registered: false, rank: 0, points: 0, done: 0, examPending: false },
      quests: [], questLog: [], rep: {}, location: null, buffs: [], food: null,
      relics: 0, flags: {}, kills: {}, stat: { battles: 0, wins: 0, dungeons: 0, deaths: 0, steps: 0, crafted: 0, gathered: 0 },
      title: null, ownedBarony: -1, companion: opts.cheat === 'slime' ? { name: 'Слизько', lvl: 1 } : null,
    };
    for (const k of Object.keys(D().PROFESSIONS)) p.professions[k] = { lvl: 1, xp: 0 };
    if (p.cheat === 'luck') p.stats.luk += 8;
    p.hp = maxHp(p); p.mp = maxMp(p);
    return p;
  }

  const xpNeed = (L) => Math.round(40 * Math.pow(L, 1.65));
  const classXpNeed = (L) => Math.round(35 * Math.pow(L, 1.5));
  const profXpNeed = (L) => Math.round(18 * Math.pow(L, 1.45));

  function item(id) { return id ? D().getItem(id) : null; }

  function totalStats(p) {
    const s = { ...p.stats };
    for (const slot of ['weapon', 'armor', 'accessory']) {
      const it = item(p.equipment[slot]);
      if (it && it.statBonus) for (const k in it.statBonus) s[k] += it.statBonus[k];
    }
    for (const cls of [p.classes.primary, p.classes.secondary]) {
      if (!cls) continue;
      const b = D().CLASSES[cls].bonus; const lvl = classLevel(p, cls);
      for (const k in b) s[k] += Math.floor(b[k] * (1 + lvl / 5));
    }
    if (p.food && p.food.buff === 'all') for (const k in s) s[k] = Math.round(s[k] * (1 + p.food.amt));
    return s;
  }

  function maxHp(p) { const s = totalStats(p); return Math.round(40 + s.vit * 12 + p.level * 10); }
  function maxMp(p) {
    const s = totalStats(p); const ar = item(p.equipment.armor);
    let m = 15 + s.int * 7 + p.level * 4 + (ar ? ar.mp || 0 : 0);
    if (p.cheat === 'mana') m *= 1.5;
    return Math.round(m);
  }

  function derived(p) {
    const s = totalStats(p);
    const w = item(p.equipment.weapon), a = item(p.equipment.armor);
    const wt = w ? D().WEAPON_TYPES[w.wtype] : null;
    const mainStat = wt ? s[wt.stat] : s.str;
    let atk = w ? w.atk + mainStat * 2.2 : 2 + s.str * 1.5;
    let matk = w && w.matk ? w.atk * 1.2 + s.int * 2.6 : s.int * 2.0;
    const prefers = [p.classes.primary, p.classes.secondary].filter(Boolean).some((c) => D().CLASSES[c].weapon === (w && w.wtype));
    if (prefers) { atk *= 1.15; matk *= 1.15; }
    if (p.food && p.food.buff === 'atk') atk *= 1 + p.food.amt;
    let def = (a ? a.def : 0) + (w && w.def ? w.def : 0) + s.vit * 0.8;
    let crit = 5 + s.luk * 0.6 + s.agi * 0.2 + (w ? w.crit || 0 : 0) + (p.food && p.food.buff === 'crit' ? p.food.amt : 0);
    let dodge = Math.min(40, s.agi * 0.45 + (a ? a.dodge || 0 : 0));
    const blunt = w && (w.wtype === 'mace' || w.wtype === 'knuckles');
    return { s, atk: Math.round(atk), matk: Math.round(matk), def: Math.round(def), crit: Math.min(75, crit), dodge, blunt, maxHp: maxHp(p), maxMp: maxMp(p), weapon: w, armor: a };
  }

  function classLevel(p, cls) { return (p.classXp[cls] && p.classXp[cls].lvl) || 0; }

  function knownSkills(p) {
    const out = [];
    for (const cls of [p.classes.primary, p.classes.secondary]) {
      if (!cls) continue;
      const L = classLevel(p, cls);
      for (const sk of D().CLASSES[cls].skills) if (sk.lvl <= L) out.push({ ...sk, cls });
    }
    return out;
  }

  function addXp(p, amount, ui) {
    if (p.cheat === 'exp') amount = Math.round(amount * 1.6);
    p.xp += amount;
    const ups = [];
    while (p.xp >= xpNeed(p.level)) {
      p.xp -= xpNeed(p.level); p.level++; p.statPoints += 3;
      p.hp = maxHp(p); p.mp = maxMp(p);
      ups.push(p.level);
    }
    return { amount, ups };
  }

  function addClassXp(p, amount) {
    const res = [];
    for (const cls of [p.classes.primary, p.classes.secondary]) {
      if (!cls) continue;
      const c = (p.classXp[cls] = p.classXp[cls] || { lvl: 1, xp: 0 });
      if (c.lvl >= 15) continue;
      c.xp += Math.round(amount * (cls === p.classes.secondary ? 0.7 : 1));
      while (c.lvl < 15 && c.xp >= classXpNeed(c.lvl)) {
        c.xp -= classXpNeed(c.lvl); c.lvl++;
        const newSk = D().CLASSES[cls].skills.filter((s) => s.lvl === c.lvl);
        res.push({ cls, lvl: c.lvl, skills: newSk });
      }
    }
    return res;
  }

  function addProfXp(p, prof, amount) {
    const pr = p.professions[prof];
    pr.xp += amount; const ups = [];
    while (pr.lvl < 30 && pr.xp >= profXpNeed(pr.lvl)) { pr.xp -= profXpNeed(pr.lvl); pr.lvl++; ups.push(pr.lvl); }
    return ups;
  }

  function addItem(p, id, n = 1) { p.inventory[id] = (p.inventory[id] || 0) + n; if (p.inventory[id] <= 0) delete p.inventory[id]; }
  function hasItem(p, id, n = 1) { return (p.inventory[id] || 0) >= n; }
  function removeItem(p, id, n = 1) { if (!hasItem(p, id, n)) return false; addItem(p, id, -n); return true; }

  function equip(p, id) {
    const it = item(id); if (!it) return false;
    const slot = it.kind === 'weapon' ? 'weapon' : it.kind === 'armor' ? 'armor' : it.kind === 'accessory' ? 'accessory' : null;
    if (!slot || !hasItem(p, id)) return false;
    removeItem(p, id);
    if (p.equipment[slot]) addItem(p, p.equipment[slot]);
    p.equipment[slot] = id;
    p.hp = Math.min(p.hp, maxHp(p)); p.mp = Math.min(p.mp, maxMp(p));
    return true;
  }
  function unequip(p, slot) {
    if (!p.equipment[slot]) return;
    addItem(p, p.equipment[slot]); p.equipment[slot] = null;
    p.hp = Math.min(p.hp, maxHp(p)); p.mp = Math.min(p.mp, maxMp(p));
  }

  function sellPrice(p, id) {
    const it = item(id); if (!it || !it.price) return 0;
    let v = it.price * 0.45;
    if (p.cheat === 'appraisal') v *= 1.15;
    return Math.max(1, Math.round(v));
  }
  function buyPrice(p, id, mod = 1) {
    const it = item(id); if (!it) return 0;
    return Math.max(1, Math.round(it.price * mod));
  }

  function guildRank(p) { return D().GUILD_RANKS[p.guild.rank].r; }
  function nextRank(p) { return D().GUILD_RANKS[p.guild.rank + 1] || null; }

  function useConsumable(p, id) {
    const it = item(id);
    if (!it || it.kind !== 'consumable' || !hasItem(p, id)) return null;
    const u = it.use; const out = [];
    if (u.revive) return null; // passive
    removeItem(p, id);
    let mul = 1;
    if (u.food && p.cheat === 'cook') mul = 2;
    if (u.hp) { const before = p.hp; p.hp = Math.min(maxHp(p), p.hp + Math.round(u.hp * (u.food ? mul : 1))); out.push(`+${p.hp - before} ❤️`); }
    if (u.mp) { const before = p.mp; p.mp = Math.min(maxMp(p), p.mp + u.mp); out.push(`+${p.mp - before} 🔷`); }
    if (u.food) { p.food = { ...u.food, amt: u.food.amt * mul }; out.push('ситий бонус'); }
    return { text: out.join(' '), use: u };
  }

  ISK.player = {
    newPlayer, xpNeed, classXpNeed, profXpNeed, totalStats, maxHp, maxMp, derived, classLevel, knownSkills,
    addXp, addClassXp, addProfXp, addItem, hasItem, removeItem, equip, unequip, sellPrice, buyPrice,
    guildRank, nextRank, useConsumable, item,
  };
})();
