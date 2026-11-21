// Player v2: races, appearance, stats, class levels + skill ranks + advancement, equipment slots, professions, fame & social rank, party, pets.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const D = () => ISK.data;
  const SLOTS = ['weapon', 'offhand', 'head', 'body', 'legs', 'feet', 'hands', 'cloak', 'ring1', 'ring2', 'amulet', 'costume'];
  const SLOT_NAMES = { weapon: 'Зброя', offhand: 'Друга рука', head: 'Голова', body: 'Тіло', legs: 'Ноги', feet: 'Взуття', hands: 'Руки', cloak: 'Плащ', ring1: 'Перстень', ring2: 'Перстень', amulet: 'Амулет', costume: 'Вбрання' };

  function newPlayer(opts) {
    const race = opts.race === 'god' ? 'goblin' : (opts.race || 'human'); // богом стати не можна. Гоблін — найближче.
    const p = {
      name: opts.name || 'Хіро', gender: opts.gender || 'm', race, cheat: opts.cheat || 'luck', origin: opts.origin || 'офісний працівник',
      look: Object.assign({ hair: 0, hairColor: 0, eyes: 0, costume: 'c_default' }, opts.look || {}),
      level: 1, xp: 0, statPoints: 3, stats: { str: 5, agi: 5, int: 5, vit: 5, luk: 5 },
      hp: 1, mp: 1, gold: 60, fame: 0, social: 0,
      classes: { primary: null, secondary: null }, classXp: {}, skillRanks: {},
      inventory: { potion_s: 3, food_bread: 2, c_default: 0 },
      equipment: { weapon: 'w_sword_0_0', offhand: null, head: null, body: 'a_body_cloth_0_0', legs: 'a_legs_cloth_0_0', feet: 'a_feet_cloth_0_0', hands: null, cloak: null, ring1: null, ring2: null, amulet: null, costume: opts.look && opts.look.costume || 'c_default' },
      professions: {}, guild: { registered: false, rank: 0, points: 0, done: 0 },
      quests: [], location: null, food: null, relics: 0, flags: {}, kills: {},
      stat: { battles: 0, wins: 0, dungeons: 0, deaths: 0, crafted: 0, gathered: 0, harvests: 0, dice: 0, continents: {} },
      pets: [], activePet: -1, mounts: ['feet'], mount: 'feet', ship: false, party: [],
      house: null, holdings: [], land: {}, achievements: {}, version: 2,
    };
    delete p.inventory.c_default;
    for (const k of Object.keys(D().PROFESSIONS)) p.professions[k] = { lvl: 1, xp: 0 };
    const R = D().RACES[race]; if (R) for (const [k, v] of Object.entries(R.stats)) p.stats[k] = Math.max(1, p.stats[k] + v);
    if (p.cheat === 'luck') p.stats.luk += 8;
    if (p.cheat === 'rich') p.gold = 1500;
    if (p.cheat === 'slime') { p.pets.push({ key: 'slime', name: 'Слизько', lvl: 1, xp: 0 }); p.activePet = 0; }
    if (p.cheat === 'summoner') { p.pets.push({ key: 'talksword', name: 'Бззз', lvl: 1, xp: 0 }); p.activePet = 0; }
    if (p.cheat === 'dragonblood') p.inventory.dragon_egg = 1;
    p.hp = maxHp(p); p.mp = maxMp(p);
    return p;
  }

  const xpNeed = (L) => Math.round(40 * Math.pow(L, 1.65));
  const classXpNeed = (L) => Math.round(35 * Math.pow(L, 1.45));
  const profXpNeed = (L) => Math.round(18 * Math.pow(L, 1.45));
  const item = (id) => (id ? D().getItem(id) : null);

  function eqItems(p) { return SLOTS.map((s) => item(p.equipment[s])).filter(Boolean); }

  function totalStats(p) {
    const s = { ...p.stats };
    for (const it of eqItems(p)) if (it.statBonus) for (const k in it.statBonus) s[k] += it.statBonus[k];
    for (const cls of [p.classes.primary, p.classes.secondary]) {
      if (!cls) continue;
      const C = D().CLASSES[cls]; const cx = p.classXp[cls] || { lvl: 1 };
      for (const k in C.bonus) s[k] += Math.floor(C.bonus[k] * (1 + cx.lvl / 6));
      if (cx.adv) { const A = C.adv.find((a) => a.id === cx.adv); if (A) for (const k in A.bonus) s[k] += A.bonus[k]; }
      if (cx.adv && cx.master) { const A = C.adv.find((a) => a.id === cx.adv); if (A && A.master) for (const k in A.master.bonus) s[k] += A.master.bonus[k]; }
      if (cx.ascended) for (const k in s) s[k] += 6;
    }
    if (p.food && p.food.buff === 'all') for (const k in s) s[k] = Math.round(s[k] * (1 + p.food.amt));
    return s;
  }

  function maxHp(p) { const s = totalStats(p); let v = 40 + s.vit * 12 + p.level * 10; if (p.race === 'dragonkin') v *= 1.1; return Math.round(v); }
  function maxMp(p) {
    const s = totalStats(p); let m = 15 + s.int * 7 + p.level * 4;
    for (const it of eqItems(p)) m += it.mp || 0;
    if (p.cheat === 'mana') m *= 1.5;
    return Math.round(m);
  }

  function derived(p) {
    const s = totalStats(p);
    const w = item(p.equipment.weapon), off = item(p.equipment.offhand);
    const wt = w ? D().WEAPON_TYPES[w.wtype] : null;
    const mainStat = wt ? s[wt.stat] : s.str;
    let atk = w ? w.atk + mainStat * 2.2 : 2 + s.str * 1.5;
    let matk = (w && w.matk ? w.atk * 1.2 + s.int * 2.6 : s.int * 2.0) + (off && off.matkB ? off.matkB : 0);
    const prefers = [p.classes.primary, p.classes.secondary].filter(Boolean).some((c) => w && (D().CLASSES[c].weapon === w.wtype || (D().CLASSES[c].alt || []).includes(w.wtype)));
    if (prefers) { atk *= 1.15; matk *= 1.15; }
    if (p.race === 'orc') atk *= 1.1;
    if (p.race === 'elf') matk *= 1.15;
    if (p.food && p.food.buff === 'atk') atk *= 1 + p.food.amt;
    let def = s.vit * 0.8, dodge = s.agi * 0.45, crit = 5 + s.luk * 0.6 + s.agi * 0.2;
    for (const it of eqItems(p)) { def += it.def || 0; dodge += it.dodge || 0; crit += it.crit || 0; }
    if (p.food && p.food.buff === 'crit') crit += p.food.amt;
    if (p.food && p.food.buff === 'def') def *= 1 + p.food.amt;
    if (p.cheat === 'tank') def *= 1.3;
    if (p.race === 'beast') dodge += 10; if (p.race === 'darkelf') crit += 8; if (p.cheat === 'ninja') dodge += 15;
    const blunt = w && ['mace', 'knuckles', 'warhammer'].includes(w.wtype);
    return { s, atk: Math.round(atk), matk: Math.round(matk), def: Math.round(def), crit: Math.min(75, crit), dodge: Math.min(55, dodge), blunt, maxHp: maxHp(p), maxMp: maxMp(p), weapon: w, speed: 10 + s.agi * 0.6 };
  }

  function classLevel(p, cls) { return (p.classXp[cls] && p.classXp[cls].lvl) || 0; }
  function skillRank(p, id) { return p.skillRanks[id] || 1; }
  function rankSkill(sk, r) {
    const out = { ...sk, rank: r };
    if (out.power) out.power = out.power * (1 + 0.15 * (r - 1));
    if (out.heal) out.heal = out.heal * (1 + 0.15 * (r - 1));
    out.mp = Math.max(1, Math.round(sk.mp * (1 - 0.06 * (r - 1))));
    return out;
  }
  function availableSkills(p, cls) {
    const cx = p.classXp[cls]; if (!cx) return [];
    return D().allSkillsOf(cls).filter((s) => (s.adv ? s.adv === cx.adv && (!s.master || cx.master) : s.ascend ? cx.ascended : true) && s.lvl <= cx.lvl);
  }
  function knownSkills(p) {
    const out = [];
    for (const cls of [p.classes.primary, p.classes.secondary]) if (cls) for (const s of availableSkills(p, cls)) out.push(rankSkill(s, skillRank(p, s.id)));
    return out;
  }

  function addXp(p, amount) {
    if (p.cheat === 'exp') amount = Math.round(amount * 1.6);
    p.xp += amount; const ups = [];
    while (p.xp >= xpNeed(p.level)) { p.xp -= xpNeed(p.level); p.level++; p.statPoints += 3; p.hp = maxHp(p); p.mp = maxMp(p); ups.push(p.level); }
    return { amount, ups };
  }
  function addClassXp(p, amount) {
    const res = [];
    for (const cls of [p.classes.primary, p.classes.secondary]) {
      if (!cls) continue;
      const c = (p.classXp[cls] = p.classXp[cls] || { lvl: 1, xp: 0, sp: 0 });
      const CAP = D().CLASS_CAP || 30;
      if (c.lvl >= CAP) continue;
      c.xp += Math.round(amount * (cls === p.classes.secondary ? 0.7 : 1) * (p.cheat === 'nerd' ? 1.3 : 1));
      while (c.lvl < CAP && c.xp >= classXpNeed(c.lvl)) {
        c.xp -= classXpNeed(c.lvl); c.lvl++; c.sp = (c.sp || 0) + 1;
        const newSk = availableSkills(p, cls).filter((s) => s.lvl === c.lvl);
        res.push({ cls, lvl: c.lvl, skills: newSk, advReady: c.lvl === 10 && !c.adv, masterReady: c.lvl === 20 && !c.master, ascendReady: c.lvl === 30 });
      }
    }
    return res;
  }
  function upgradeSkill(p, cls, id) {
    const c = p.classXp[cls]; if (!c || !c.sp) return false;
    const r = skillRank(p, id); if (r >= 5) return false;
    p.skillRanks[id] = r + 1; c.sp--; return true;
  }
  function addProfXp(p, prof, amount) {
    if (p.race === 'human') amount = Math.round(amount * 1.1);
    if (p.race === 'dwarf' && prof === 'smithing') amount = Math.round(amount * 1.25);
    const pr = p.professions[prof] = p.professions[prof] || { lvl: 1, xp: 0 };
    pr.xp += amount; const ups = [];
    while (pr.lvl < 30 && pr.xp >= profXpNeed(pr.lvl)) { pr.xp -= profXpNeed(pr.lvl); pr.lvl++; ups.push(pr.lvl); }
    return ups;
  }
  function profRank(p, prof) { const L = (p.professions[prof] || { lvl: 1 }).lvl; return D().PROF_RANKS.filter((r) => r.lvl <= L).pop().name; }
  function addFame(p, n) { if (p.cheat === 'charisma') n = Math.round(n * 1.5); p.fame = Math.max(0, p.fame + n); return n; }

  function addItem(p, id, n = 1) { p.inventory[id] = (p.inventory[id] || 0) + n; if (p.inventory[id] <= 0) delete p.inventory[id]; }
  function hasItem(p, id, n = 1) { return (p.inventory[id] || 0) >= n; }
  function removeItem(p, id, n = 1) { if (!hasItem(p, id, n)) return false; addItem(p, id, -n); return true; }

  function slotFor(p, it) {
    if (it.slot === 'ring') return !p.equipment.ring1 ? 'ring1' : !p.equipment.ring2 ? 'ring2' : 'ring1';
    return it.slot;
  }
  function equip(p, id) {
    const it = item(id); if (!it || !it.slot || !hasItem(p, id)) return false;
    const slot = slotFor(p, it);
    removeItem(p, id);
    if (p.equipment[slot] && slot !== 'costume') addItem(p, p.equipment[slot]);
    else if (p.equipment[slot] && slot === 'costume' && p.equipment[slot] !== 'c_default') addItem(p, p.equipment[slot]);
    p.equipment[slot] = id;
    if (slot === 'costume') p.look.costume = id;
    p.hp = Math.min(p.hp, maxHp(p)); p.mp = Math.min(p.mp, maxMp(p));
    return true;
  }
  function unequip(p, slot) {
    if (!p.equipment[slot]) return;
    if (slot === 'costume') { if (p.equipment.costume !== 'c_default') addItem(p, p.equipment.costume); p.equipment.costume = 'c_default'; p.look.costume = 'c_default'; return; }
    addItem(p, p.equipment[slot]); p.equipment[slot] = null;
    p.hp = Math.min(p.hp, maxHp(p)); p.mp = Math.min(p.mp, maxMp(p));
  }

  function priceMul(p) { let m = 1; if (p.cheat === 'merchant') m *= 0.9; if (p.cheat === 'charisma') m *= 0.85; if (p.race === 'goblin') m *= 0.9; return m; }
  function sellPrice(p, id) { const it = item(id); if (!it || !it.price) return 0; let v = it.price * 0.45; if (p.cheat === 'appraisal') v *= 1.15; if (p.cheat === 'merchant') v *= 1.3; return Math.max(1, Math.round(v)); }
  function buyPrice(p, id, mod = 1) { const it = item(id); if (!it) return 0; return Math.max(1, Math.round(it.price * mod * priceMul(p))); }

  function guildRank(p) { return D().GUILD_RANKS[p.guild.rank].r; }
  function nextRank(p) { return D().GUILD_RANKS[p.guild.rank + 1] || null; }
  function socialName(p) { return D().SOCIAL[p.social].name; }

  function useConsumable(p, id) {
    const it = item(id);
    if (!it || it.kind !== 'consumable' || !hasItem(p, id)) return null;
    const u = it.use; const out = [];
    if (u.revive || u.dmg || (u.buff && !u.food)) return null;
    removeItem(p, id);
    let mul = 1;
    if (u.food && p.cheat === 'cook') mul = 2;
    if (u.food && p.race === 'halfling') mul *= 1.5;
    if (u.hp) { const before = p.hp; p.hp = Math.min(maxHp(p), p.hp + Math.round(u.hp * (u.food ? mul : 1))); out.push(`+${p.hp - before} ❤️`); }
    if (u.mp) { const before = p.mp; p.mp = Math.min(maxMp(p), p.mp + u.mp); out.push(`+${p.mp - before} 🔷`); }
    if (u.food) { p.food = { ...u.food, amt: u.food.amt * (p.cheat === 'cook' ? 2 : 1) }; out.push('ситий бонус'); }
    if (u.cure) out.push('отрута виведена');
    return { text: out.join(' '), use: u };
  }

  // ---- companions & pets ----
  function companionStats(c) {
    const k = c.lvl;
    const base = { warrior: [1.2, 1.0, 1.3], mage: [0.8, 1.3, 0.8], healer: [0.9, 0.7, 1.0], archer: [0.9, 1.15, 0.9], rogue: [0.85, 1.2, 0.85] }[c.role] || [1, 1, 1];
    return { maxHp: Math.round((60 + k * 22) * base[0]), atk: Math.round((8 + k * 3.4) * base[1]), def: Math.round((3 + k * 1.3) * base[2]), speed: 9 + k * 0.4 };
  }
  function petStats(p, pet) {
    const P = D().PETS[pet.key]; const k = pet.lvl;
    let mul = P.power * (p.cheat === 'beasttalk' ? 1.5 : 1);
    return { atk: Math.round((7 + k * 3) * mul), heal: Math.round((6 + k * 2.5) * mul), maxHp: Math.round((40 + k * 15) * mul) };
  }
  function addPetXp(p, amount) {
    const pet = p.pets[p.activePet]; if (!pet) return null;
    pet.xp += amount; let up = false;
    while (pet.xp >= 40 + pet.lvl * 25) { pet.xp -= 40 + pet.lvl * 25; pet.lvl++; up = true; }
    return up ? pet : null;
  }
  function addCompanionXp(p, amount) {
    const ups = [];
    for (const c of p.party) { c.xp += amount; while (c.xp >= 50 + c.lvl * 30) { c.xp -= 50 + c.lvl * 30; c.lvl++; ups.push(c); } }
    return ups;
  }
  function travelSpeed(p) { let s = D().MOUNTS[p.mount].speed; if (p.cheat === 'speed') s *= 1.4; return s; }
  function encounterMul(p) { return D().MOUNTS[p.mount].enc; }

  ISK.player = {
    SLOTS, SLOT_NAMES, newPlayer, xpNeed, classXpNeed, profXpNeed, totalStats, maxHp, maxMp, derived, classLevel, skillRank, availableSkills, knownSkills,
    addXp, addClassXp, upgradeSkill, addProfXp, profRank, addFame, addItem, hasItem, removeItem, equip, unequip, sellPrice, buyPrice, priceMul,
    guildRank, nextRank, socialName, useConsumable, item, companionStats, petStats, addPetXp, addCompanionXp, travelSpeed, encounterMul, rankSkill,
  };
})();
