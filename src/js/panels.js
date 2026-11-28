// Panels v2: character & equipment, inventory, skills (ranks/advancement), professions, quests, realms, party/pets, achievements,
// settlement services, house & farming, land management, social promotions, save/load, settings.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = () => ISK.ui; const h = (...a) => ISK.ui.h(...a);
  const D = () => ISK.data; const PL = () => ISK.player; const GM = () => ISK.game; const A = () => ISK.audio; const G = () => ISK.ui.G; const SP = () => ISK.sprites;
  const POL = () => ISK.politics;
  const STAT_NAMES = { str: '💪 Сила', agi: '🌀 Спритність', int: '🧠 Інтелект', vit: '❤️ Витривалість', luk: '🍀 Удача' };
  const reopen = (fn) => { UI().closeTop(); fn(); };
  const SAVE_PREFIX = 'dyvo_save_';

  function itemDesc(it) {
    const parts = [];
    if (it.kind === 'weapon') parts.push(`⚔️ ${it.atk}${it.matk ? ' (магія)' : ''}`, it.crit ? `крит +${it.crit}%` : '', it.def ? `🛡 ${it.def}` : '');
    if (it.kind === 'armor' || it.kind === 'offhand') parts.push(it.def ? `🛡 ${it.def}` : '', it.mp ? `🔷 +${it.mp}` : '', it.dodge ? `ухил. +${it.dodge.toFixed(1)}%` : '', it.matkB ? `✨ +${it.matkB}` : '', it.crit ? `крит +${it.crit}%` : '', it.slot ? PL().SLOT_NAMES[it.slot] : '');
    if (it.statBonus) for (const [k, v] of Object.entries(it.statBonus)) parts.push(`${STAT_NAMES[k].split(' ')[0]}+${v}`);
    if (it.lvl && ['weapon', 'armor', 'offhand'].includes(it.kind)) parts.push(`рів. ${it.lvl}`);
    if (it.kind === 'costume') parts.push('вбрання');
    if (it.use) { const u = it.use; if (u.hp) parts.push(`+${u.hp}❤️`); if (u.mp) parts.push(`+${u.mp}🔷`); if (u.dmg) parts.push(`${u.dmg} шкоди всім`); if (u.buff) parts.push(`баф`); if (u.food) parts.push(`ситість: ${u.food.battles} боїв`); if (u.revive) parts.push('воскресіння'); }
    if (it.unique) parts.unshift('★ унікальна');
    if (it.desc) parts.push(it.desc);
    return parts.filter(Boolean).join(' · ');
  }
  function itemEl(id, count, acts, extra) {
    const it = PL().item(id); if (!it) return h('div');
    return h('div', { class: 'item r' + (it.rarity || 0) }, h('div', { class: 'ic' }, it.icon), h('div', { style: { minWidth: 0 } }, h('div', { class: 'nm' }, it.name), h('div', { class: 'ds' }, extra || itemDesc(it))), count > 1 ? h('div', { class: 'cnt' }, '×' + count) : null, acts && acts.length ? h('div', { class: 'acts' }, acts) : null);
  }

  function open(name) { if (UI().modalStack.length) UI().closeAll(); ({ character, inventory, skills, professions, quests, realms, chronicle, system, party, achievements }[name] || (ISK.bondsUI && ISK.bondsUI[name]) || (() => {}))(); }

  // ---------------- Character ----------------
  // v5.8: клік по слоту спорядження — список того, що можна вдягти саме сюди
  function equipPicker(slot) {
    const p = G().player; const cur = PL().item(p.equipment[slot]);
    const ids = Object.keys(p.inventory).filter((iid) => p.inventory[iid] > 0 && PL().fitsSlot(PL().item(iid), slot));
    ids.sort((a, b) => (PL().item(b).lvl || 0) - (PL().item(a).lvl || 0) || (PL().item(b).rarity || 0) - (PL().item(a).rarity || 0));
    const back = () => { UI().closeTop(); reopen(character); };
    UI().modal({ title: `${PL().SLOT_NAMES[slot]}: що вдягти?`, icon: cur ? cur.icon : '🎒', size: 'narrow', body: () => {
      const w = h('div', { class: 'col' });
      w.appendChild(h('div', { class: 'card' }, h('div', { class: 'muted', style: { fontSize: '12px' } }, 'Зараз вдягнуто'), cur ? itemEl(p.equipment[slot], 1, slot === 'costume' && p.equipment[slot] === 'c_default' ? [] : [h('button', { class: 'btn small', onclick: () => { PL().unequip(p, slot); A().play('click'); back(); } }, 'Зняти')]) : h('div', { class: 'muted' }, '— порожньо —')));
      if (!ids.length) { w.appendChild(h('div', { class: 'muted' }, 'У рюкзаку немає нічого для цього слота. Зазирни в крамницю, кузню чи підземелля!')); return w; }
      const list = h('div', { class: 'items' });
      for (const iid of ids) { const it = PL().item(iid); const lock = it.lvl > p.level + 2;
        list.appendChild(itemEl(iid, p.inventory[iid], [h('button', { class: 'btn small primary', disabled: lock, title: lock ? `Потрібен рівень ${it.lvl - 2}` : '', onclick: () => { if (PL().equipTo(p, iid, slot)) { A().play('clang'); back(); } } }, lock ? `🔒 рів. ${it.lvl - 2}` : 'Вдягти')])); }
      w.appendChild(list); return w;
    } });
  }
  function character() {
    const p = G().player; const R = D().RACES[p.race];
    UI().modal({ title: p.name, sub: `${R.icon} ${R.name} · ${PL().socialName(p)} · ⭐ слава ${Math.floor(p.fame)} · колись ${p.origin}`, iconEl: SP().img(SP().hero(p), 48), body: () => {
      const d = PL().derived(p);
      const stats = h('div', { class: 'card' }, h('h4', null, `Характеристики ${p.statPoints ? `(вільних: ${p.statPoints})` : ''}`));
      for (const k of Object.keys(STAT_NAMES)) stats.appendChild(h('div', { class: 'stat-row' }, h('div', { class: 'nm' }, STAT_NAMES[k]), h('div', { class: 'v' }, String(d.s[k])), h('div', { class: 'muted', style: { fontSize: '12px' } }, `(база ${p.stats[k]})`), h('div', { class: 'spacer' }),
        p.statPoints > 0 ? h('button', { class: 'plus', onclick: () => { p.stats[k]++; p.statPoints--; reopen(character); } }, '+') : null, p.statPoints >= 5 ? h('button', { class: 'plus', title: '+5', onclick: () => { p.stats[k] += 5; p.statPoints -= 5; reopen(character); } }, '⁵') : null));
      const der = h('div', { class: 'card' }, h('h4', null, 'Бойові показники'), ...[['⚔️ Атака', d.atk], ['✨ Магічна атака', d.matk], ['🛡️ Захист', d.def], ['💥 Шанс криту', d.crit.toFixed(1) + '%'], ['💨 Ухилення', d.dodge.toFixed(1) + '%'], ['❤️ Здоров\'я', d.maxHp], ['🔷 Мана', d.maxMp]].map(([a, b]) => h('div', { class: 'stat-row' }, h('div', { class: 'nm', style: { width: '160px' } }, a), h('div', { class: 'v' }, String(b)))));
      const eq = h('div', { class: 'card eqgrid' }, h('h4', null, 'Спорядження та вбрання'));
      const doll = h('div', { class: 'doll' }, SP().img(SP().hero(p), 128));
      eq.appendChild(doll);
      for (const slot of PL().SLOTS) {
        const id = p.equipment[slot]; const it = PL().item(id);
        const can = Object.keys(p.inventory).filter((iid) => PL().fitsSlot(PL().item(iid), slot)).length;
        eq.appendChild(h('div', { class: 'slot clickable r' + (it ? it.rarity || 0 : 0) + (can ? ' has-alt' : ''), title: (it ? `${it.name}\n${itemDesc(it)}\n\n` : PL().SLOT_NAMES[slot] + '\n') + (can ? `Клікни — вибрати з ${can} речей` : 'Клікни — що можна вдягти'), onclick: (e) => { if (e.target.closest('.x')) return; equipPicker(slot); } }, can ? h('div', { class: 'alt-n' }, '+' + can) : null, h('div', { class: 'sl' }, PL().SLOT_NAMES[slot]), h('div', { class: 'si' }, it ? it.icon : '—'), h('div', { class: 'sn' }, it ? it.name : ''),
          it && !(slot === 'costume' && id === 'c_default') ? h('button', { class: 'x', title: 'Зняти', onclick: () => { PL().unequip(p, slot); reopen(character); } }, '✕') : null));
      }
      const cl = h('div', { class: 'card' }, h('h4', null, 'Класи, раса, благословення'));
      const ch = D().CHEATS[p.cheat];
      cl.appendChild(h('div', { class: 'item' }, h('div', { class: 'ic' }, ch.icon), h('div', null, h('div', { class: 'nm' }, 'Благословення: ' + ch.name), h('div', { class: 'ds' }, ch.desc))));
      cl.appendChild(h('div', { class: 'item', style: { marginTop: '6px' } }, h('div', { class: 'ic' }, R.icon), h('div', null, h('div', { class: 'nm' }, 'Раса: ' + R.name), h('div', { class: 'ds' }, R.desc))));
      for (const c of [p.classes.primary, p.classes.secondary]) {
        if (!c) continue; const C = D().CLASSES[c]; const cx = p.classXp[c] || { lvl: 1, xp: 0 }; const adv = cx.adv ? C.adv.find((a) => a.id === cx.adv) : null;
        cl.appendChild(h('div', { class: 'item', style: { marginTop: '6px' } }, h('div', { class: 'ic' }, adv ? adv.icon : C.icon), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${adv ? adv.name : C.name}${cx.ascended ? ' → ' + C.ascend.name : ''} — рів. ${cx.lvl}/30`), h('div', { class: 'prog', style: { marginTop: '4px' } }, h('div', { style: { width: (cx.lvl >= 30 ? 100 : cx.xp / PL().classXpNeed(cx.lvl) * 100) + '%' } })))));
      }
      if (!p.classes.primary) cl.appendChild(h('div', { class: 'muted', style: { marginTop: '6px' } }, 'Обери бойову професію в Гільдії шукачів пригод.'));
      const st = p.stat;
      const rec = h('div', { class: 'card' }, h('h4', null, 'Літопис героя'), h('div', { class: 'kv' }, ...[['Перемог', st.wins], ['Поразок', st.deaths], ['Підземель', st.dungeons], ['Створено', st.crafted], ['Врожаїв', st.harvests], ['Квестів', p.guild.done], ['Осколків', p.relics + '/3'], ['Володінь', p.holdings.length], ['Днів у Дивосвіті', GM().day(G()) - (G().startDay || 0)]].flatMap(([a, b]) => [h('div', { class: 'k' }, a), h('div', null, String(b))])));
      return h('div', { class: 'grid3' }, h('div', { class: 'col' }, stats, der), h('div', { class: 'col' }, eq), h('div', { class: 'col' }, cl, rec));
    } });
  }

  function inventory(filter = 'all') {
    const p = G().player;
    const kinds = { all: 'Усе', equip: 'Спорядження', cons: 'Витратні', mat: 'Матеріали', farm: 'Ферма' };
    UI().modal({ title: 'Інвентар', icon: '🎒', sub: `🪙 ${Math.floor(p.gold)} золота`, tabs: Object.entries(kinds).map(([id, label]) => ({ id, label, render: () => {
      const list = h('div', { class: 'items' });
      const ents = Object.entries(p.inventory).filter(([iid]) => { const it = PL().item(iid); if (!it) return false;
        if (id === 'equip') return ['weapon', 'armor', 'accessory', 'offhand', 'costume'].includes(it.kind);
        if (id === 'cons') return it.kind === 'consumable'; if (id === 'mat') return it.kind === 'material' && !['seed', 'crop'].includes(it.kind === 'material' ? D().MATERIALS[iid].kind : '');
        if (id === 'farm') return it.kind === 'material' && ['seed', 'crop'].includes(D().MATERIALS[iid].kind); return true; }).sort((a, b) => (PL().item(b[0]).price || 0) - (PL().item(a[0]).price || 0));
      for (const [iid, n] of ents) {
        const it = PL().item(iid); const acts = [];
        if (it.slot) acts.push(h('button', { class: 'btn small primary', disabled: it.lvl > p.level + 2, title: it.lvl > p.level + 2 ? `Потрібен рівень ${it.lvl - 2}` : '', onclick: () => { PL().equip(p, iid); A().play('clang'); reopen(() => inventory(id)); } }, 'Вдягти'));
        if (it.kind === 'consumable' && !it.use.dmg && !it.use.revive && !(it.use.buff && !it.use.food)) acts.push(h('button', { class: 'btn small', onclick: () => {
          if (it.use.home) { const hn = GM().homeNode(G()); if (!hn) { UI().toast('🏡 У тебе ще нема дому! Купи будинок у місті з нерухомістю.', 'bad'); return; } if (hn === p.location) { UI().toast('Ти й так удома. Сувій ображено згорнувся.', ''); return; } PL().removeItem(p, iid); GM().arrive(G(), hn); UI().closeAll(); ISK.render.centerOn(p.location); UI().toast(`🏡 Додому! ${UI().nodeName(hn)}`, 'good'); A().play('magic'); if (ISK.nav) ISK.nav.banner(hn); UI().refresh(); return; }
          if (it.use.teleport) { const T = GM().nearestTown(G()); PL().removeItem(p, iid); p.location = 'b:' + T.id; UI().closeAll(); ISK.render.centerOn(p.location); UI().toast(`🌀 Телепорт до ${T.name}!`, 'good'); A().play('magic'); return; }
          if (it.use.reveal) { PL().removeItem(p, iid); GM().discoverAround(G(), 45); UI().toast('🗺️ Мапа навколо відкрита!', 'good'); reopen(() => inventory(id)); return; }
          const r = PL().useConsumable(p, iid); if (r) { A().play('heal'); UI().toast(`${it.icon} ${r.text}`, 'good'); } reopen(() => inventory(id)); } }, 'Вжити'));
        if (iid === 'dragon_egg') acts.push(h('span', { class: 'muted', style: { fontSize: '11px' } }, 'інкубатор удома'));
        list.appendChild(itemEl(iid, n, acts));
      }
      if (!ents.length) list.appendChild(h('div', { class: 'muted' }, 'Порожньо. Як у гаманці після таверни.'));
      return list;
    } })), tab: filter });
  }

  function skills() {
    const p = G().player;
    UI().modal({ title: 'Навички та класи', icon: '📖', size: 'mid', body: () => {
      const wrap = h('div', { class: 'col' });
      const cls = [p.classes.primary, p.classes.secondary].filter(Boolean);
      if (!cls.length) wrap.appendChild(h('div', { class: 'muted' }, 'Поки що ти вмієш тільки махати палицею і кричати. Обери клас у Гільдії!'));
      for (const c of cls) {
        const C = D().CLASSES[c]; const cx = p.classXp[c]; const L = cx.lvl;
        wrap.appendChild(h('div', { class: 'row' }, h('h3', { style: { margin: '4px 0', fontFamily: 'Georgia' } }, `${C.icon} ${C.name} — рівень ${L}`), h('span', { class: 'tag rank' }, `Очки навичок: ${cx.sp || 0}`)));
        const T = D().classTier && D().classTier(c, cx);
        if (T) {
          const path = [C.name, cx.adv ? (C.adv.find((a) => a.id === cx.adv) || {}).name : 'Клас ІІ', cx.adv && (C.adv.find((a) => a.id === cx.adv) || {}).master ? C.adv.find((a) => a.id === cx.adv).master.name : 'Клас ІІІ', C.ascend.name];
          wrap.appendChild(h('div', { class: 'grade-track' }, path.map((nm, ti) => h('div', { class: 'gt-tier' + (ti < T.tier ? ' done' : ti === T.tier ? ' cur' : '') }, h('div', { class: 'gt-nm' }, nm), h('div', { class: 'gt-pips' }, [1, 2, 3].map((gi) => h('span', { class: 'gt-pip' + (ti < T.tier || (ti === T.tier && gi <= T.grade) ? ' on' : '') }, ['I', 'II', 'III'][gi - 1])))))));
          wrap.appendChild(h('div', { class: 'muted', style: { fontSize: '12px' } }, `Поточний грейд: ${T.icon} ${T.title} · кожен грейд дає +${T.tier * 3 + T.grade} до основної характеристики`));
        }
        if (L >= 10 && !cx.adv) {
          wrap.appendChild(h('div', { class: 'quest main' }, h('div', { class: 't' }, '⬆️ Підвищення класу доступне!'), h('div', { class: 'd' }, 'Обери шлях розвитку. Це назавжди (ну, до перереєстрації в іншому світі).'),
            h('div', { class: 'choice-grid' }, C.adv.map((a) => h('div', { class: 'choice', onclick: async () => { if (!(await UI().confirm(`Стати «${a.name}»?\n${a.desc}`))) return; cx.adv = a.id; A().play('level'); UI().cutin(a.name.toUpperCase(), 'Нове підвищення класу!', '#b77bff'); reopen(skills); } },
              h('div', { class: 'ic' }, a.icon), h('div', { class: 'nm' }, a.name), h('div', { class: 'ds' }, a.desc), h('div', { class: 'ds', style: { color: 'var(--cyan)' } }, a.skills.map((s) => s.icon + ' ' + s.name).join(', ')))))));
        }
        const A2 = cx.adv ? C.adv.find((a) => a.id === cx.adv) : null;
        if (L >= 20 && A2 && A2.master && !cx.master) {
          const M = A2.master;
          wrap.appendChild(h('div', { class: 'quest main' }, h('div', { class: 't' }, `⏫ Клас ІІІ: ${M.icon} ${M.name}`), h('div', { class: 'd' }, `${M.desc} Нові навички: ${M.skills.map((x) => x.icon + ' ' + x.name).join(', ')}.`),
            h('button', { class: 'btn primary', style: { marginTop: '6px' }, onclick: () => { cx.master = true; A().play('win'); UI().cutin(M.name.toUpperCase(), 'КЛАС ІІІ ВІДКРИТО!', '#ff9df0'); UI().sparkle(innerWidth / 2, innerHeight / 2, 30); reopen(skills); } }, `⏫ Стати «${M.name}»`)));
        }
        wrap.appendChild(h('div', { class: 'muted', style: { fontSize: '12.5px' } }, `Шлях: ${C.name} → ${A2 ? A2.name : 'клас ІІ (рів. 10)'} → ${A2 && A2.master ? A2.master.name : 'клас ІІІ'} (рів. 20) → ${C.ascend.name} (рів. 30, вознесіння у тренера) · макс. рівень класу ${D().CLASS_CAP || 30}`));
        const grid = h('div', { class: 'items' });
        for (const sk of D().allSkillsOf(c)) {
          if (sk.adv && cx.adv && sk.adv !== cx.adv) continue;
          if (sk.adv && !cx.adv) continue;
          const ok = sk.lvl <= L && (!sk.ascend || cx.ascended) && (!sk.master || cx.master); const r = PL().skillRank(p, sk.id); const rs = PL().rankSkill(sk, r);
          grid.appendChild(h('div', { class: 'item', style: { opacity: ok ? 1 : 0.45 } }, h('div', { class: 'ic' }, sk.icon),
            h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${sk.name}${ok ? ` ★${r}` : sk.ascend ? ' 🔒 вознесіння (рів. 30)' : sk.master && !cx.master ? ` 🔒 клас ІІІ (рів. ${sk.lvl})` : ` 🔒 рів. ${sk.lvl}`}`), h('div', { class: 'ds' }, `🔷${rs.mp}${sk.cd ? ` · ⏱${sk.cd}` : ''}${rs.power ? ` · сила ×${rs.power.toFixed(2)}` : ''} · ${sk.desc}`)),
            ok && r < 5 ? h('div', { class: 'acts' }, h('button', { class: 'btn small primary', disabled: !cx.sp, onclick: () => { PL().upgradeSkill(p, c, sk.id); A().play('magic'); reopen(skills); } }, '⬆ ранг')) : null));
        }
        wrap.appendChild(grid);
      }
      if (p.jackSkills && p.jackSkills.length) {
        wrap.appendChild(h('h3', { style: { margin: '10px 0 4px', fontFamily: 'Georgia' } }, '🃏 Позичені навички (Майстер на всі руки)'));
        const idx = D().skillIndex ? D().skillIndex() : new Map();
        wrap.appendChild(h('div', { class: 'items' }, p.jackSkills.map((id) => { const sk = idx.get(id); return sk ? h('div', { class: 'item' }, h('div', { class: 'ic' }, sk.icon), h('div', null, h('div', { class: 'nm' }, sk.name), h('div', { class: 'ds' }, sk.desc))) : null; })));
      }
      return wrap;
    } });
  }

  function professions() {
    const p = G().player;
    UI().modal({ title: 'Професії', icon: '⚒️', size: 'mid', body: () => {
      const grid = h('div', { class: 'grid2' });
      for (const [k, pr] of Object.entries(D().PROFESSIONS)) {
        const s = p.professions[k] || { lvl: 1, xp: 0 };
        grid.appendChild(h('div', { class: 'card' }, h('div', { class: 'row' }, h('div', { style: { fontSize: '30px' } }, pr.icon), h('div', { style: { flex: 1 } },
          h('div', { style: { fontWeight: 800 } }, `${pr.name} — ${PL().profRank(p, k)} (рів. ${s.lvl})`), h('div', { class: 'muted', style: { fontSize: '12.5px' } }, pr.desc),
          h('div', { class: 'prog', style: { marginTop: '6px' } }, h('div', { style: { width: (s.xp / PL().profXpNeed(s.lvl) * 100) + '%' } }))))));
      }
      return h('div', null, h('div', { class: 'muted', style: { marginBottom: '10px' } }, 'Ранги: Учень → Підмайстер → Ремісник → Майстер → Грандмайстер → Легенда. Вищий рівень — більше видобутку та рідкісніші речі.'), grid);
    } });
  }

  function questEl(q, opts = {}) {
    const g = G(); const done = GM().questDone(g, q); let prog = '';
    if (q.type === 'hunt') prog = `${Math.min(q.count, (g.player.kills[q.target] || 0) - q.base)}/${q.count}`;
    if (q.type === 'gather') prog = `${Math.min(q.count, g.player.inventory[q.item] || 0)}/${q.count}`;
    if (['deliver', 'clear', 'bounty', 'merc', 'horde'].includes(q.type)) prog = q.progress ? 'виконано' : 'в процесі';
    return h('div', { class: 'quest' + (done ? ' done' : '') }, h('div', { class: 'row' }, h('div', { class: 't' }, q.title), h('div', { class: 'spacer' }), opts.board ? null : h('span', { class: 'tag' }, prog)),
      h('div', { class: 'd' }, q.desc, q.deadline ? ` Термін: до ${GM().dateStr(q.deadline)}.` : ''),
      h('div', { class: 'row' }, h('span', { class: 'gold' }, `🪙 ${q.gold}`), h('span', null, `✨ ${q.xp}`), q.pts ? h('span', { class: 'muted' }, `🛡️ +${q.pts}`) : null, h('span', { class: 'muted' }, `⭐ +${q.fame || 2}`), h('div', { class: 'spacer' }), opts.actions));
  }
  function quests() {
    const g = G(), p = g.player;
    UI().modal({ title: 'Журнал квестів', icon: '📜', size: 'mid', body: () => {
      const w = h('div');
      w.appendChild(h('div', { class: 'quest main' }, h('div', { class: 't' }, '🌸 Головний квест: Доручення богині'), h('div', { class: 'd' }, mainQuestText(p))));
      if (!p.quests.length) w.appendChild(h('div', { class: 'muted' }, 'Активних квестів немає. Зазирни на дошку в Гільдії або до старости села.'));
      for (const q of p.quests) {
        const node = q.type === 'deliver' ? q.to : q.type === 'bounty' ? q.at : q.type === 'clear' ? 'd:' + q.dungeon : q.at || 'b:' + q.from;
        w.appendChild(questEl(q, { actions: [h('button', { class: 'btn small', onclick: () => { UI().closeAll(); g.discovered[node] = 1; UI().showInfo(node); ISK.render.centerOn(node); } }, '🧭 На мапі'),
          h('button', { class: 'btn small ghost', onclick: async () => { if (await UI().confirm('Відмовитись від квесту?')) { p.quests = p.quests.filter((x) => x !== q); if (q.type === 'deliver') PL().removeItem(p, 'package'); UI().closeAll(); quests(); } } }, 'Відмова')] }));
      }
      return w;
    } });
  }
  function mainQuestText(p) {
    if (!p.guild.registered) return 'Знайди найближче містечко з Гільдією шукачів пригод (позначено ❗ на мапі) і зареєструйся.';
    if (!p.classes.primary) return 'Обери бойову професію в Гільдії.';
    if (p.guild.rank < 2) return `Досягни рангу D (зараз ${PL().guildRank(p)}, очок: ${p.guild.points}).`;
    if (p.relics < 3) return `Знайди 3 Осколки Печаті в позначених 🔱 підземеллях (${p.relics}/3). Деякі — на інших континентах!`;
    if (!p.flags.demonKing) return 'Пливи до Демонії й перемож Володаря Демонів Малдраґора у Цитаделі 👿!';
    return '✨ Володаря Демонів переможено! Тепер живи як хочеш: стань герцогом, фермером чи легендою SSS.';
  }

  function realms() {
    const g = G(), w = g.world, P = g.P;
    const card = (st) => {
      const R = w.realms[st.id]; const owned = POL().ownedBaronies(w, st.id); const army = P.armies.filter((a) => a.realm === st.id).reduce((s, a) => s + a.size, 0); const wars = POL().warsOf(P, st.id);
      return h('div', { class: 'realm-card', style: { opacity: st.dead ? 0.45 : 1 } }, h('div', { class: 'stripe', style: { background: R.color } }), h('div', null,
        h('div', { class: 'row' }, h('h4', null, R.fullName), st.dead ? h('span', { class: 'tag war' }, 'знищено') : null, R.isEmpire ? h('span', { class: 'tag rank' }, 'Імперія') : null, R.liege >= 0 ? h('span', { class: 'tag' }, 'васал Імперії') : null, R.isDemon ? h('span', { class: 'tag war' }, 'Темрява') : null, h('div', { class: 'spacer' }), R.isDemon ? null : h('span', { class: 'muted' }, `Репутація: ${st.playerRep || 0}`)),
        h('div', { class: 'muted', style: { fontSize: '13px', margin: '2px 0 6px' } }, `«${R.motto}» · Народ: ${R.race}`),
        h('div', { class: 'kv', style: { gridTemplateColumns: '140px 1fr' } },
          h('div', { class: 'k' }, 'Правитель'), h('div', null, `${POL().rulerFull(w, st)}, ${st.ruler.age} р. (${st.ruler.traits.map((t) => POL().TRAITS[t].name).join(', ')})`),
          h('div', { class: 'k' }, 'Землі'), h('div', null, `${owned.length} баронств · ${R.duchies.length} герцогств · столиця: ${w.baronies[R.capital].name}`),
          R.isDemon ? null : [h('div', { class: 'k' }, 'Казна / військо'), h('div', null, `🪙 ${Math.round(st.gold).toLocaleString('uk')} · ⚔️ ${Math.round(st.manpower).toLocaleString('uk')}${army ? ` · у полі ${army.toLocaleString('uk')}` : ''}`)],
          R.isDemon ? [h('div', { class: 'k' }, 'Легіони'), h('div', null, `${army.toLocaleString('uk')} у полі · наступне вторгнення ~${GM().dateStr(P.nextInvasion)}`)] : null,
          R.isDemon ? null : [h('div', { class: 'k' }, 'Курс ШІ'), h('div', null, `${{ build: '🏗️ будівництво', trade: '🐪 торгівля', army: '⚒️ армія', war: '⚔️ війна' }[st.focus || 'build']} · дохід ${st.income ?? '?'}🪙/день · збудовано ${st.built || 0}${st.levy ? ` · казарми ${st.levy}` : ''}`)],
          (st.trade || []).length ? [h('div', { class: 'k' }, 'Торгівля'), h('div', null, st.trade.map((a) => h('span', { class: 'tag', style: { marginRight: '4px' } }, '🐪 ' + w.realms[a].name)))] : null,
          P.armies.some((a) => a.realm === st.id) ? [h('div', { class: 'k' }, 'Армії'), h('div', null, P.armies.filter((a) => a.realm === st.id).map((a) => h('div', { style: { fontSize: '13px' } }, `${a.patrol ? '🛡️' : a.icon || '⚑'} ${a.name}: ${a.size.toLocaleString('uk')}${a.mix ? ` (🗡️${a.mix[0]}% 🏹${a.mix[1]}% 🐎${a.mix[2]}% 🔮${a.mix[3]}%)` : ''} — ${w.baronies[a.node].name}${a.heroName ? ` · з героєм ${a.heroName}` : ''}`)))] : null,
          h('div', { class: 'k' }, 'Союзники'), h('div', null, st.alliances.length ? st.alliances.map((a) => h('span', { class: 'tag ally', style: { marginRight: '4px' } }, w.realms[a].name)) : '—'),
          h('div', { class: 'k' }, 'Війни'), h('div', null, wars.length ? wars.map((x) => h('span', { class: 'tag war', style: { marginRight: '4px' } }, x.name)) : R.isDemon ? 'з усім світом' : 'мир'))));
    };
    UI().modal({ title: 'Держави Дивосвіту', icon: '👑', tabs: [
      { id: 'empire', label: '🏛️ Імперія', render: () => { const E = w.realms.find((r) => r.isEmpire); const list = [E, ...w.realms.filter((r) => r.liege === E.id)]; return h('div', null, h('div', { class: 'muted', style: { marginBottom: '8px' } }, `Імперія та її ${list.length - 1} васальних королівств діють як блок: разом воюють і разом обороняються. Васали можуть повстати за незалежність.`), list.map((r) => card(P.realms[r.id]))); } },
      { id: 'list', label: '👑 Людські королівства', render: () => h('div', null, w.realms.filter((r) => !r.isEmpire && r.liege < 0 && !r.isDemon && r.raceKey === 'human').map((r) => card(P.realms[r.id]))) },
      { id: 'races', label: '🧝 Інші раси', render: () => h('div', null, h('div', { class: 'muted', style: { marginBottom: '8px' } }, 'Ельфи, гноми, орки, гобліни, звіролюди, напіврослики, драконіди й темні ельфи мають власні королівства на своїх континентах. Свої ж раси ставляться до тебе тепліше.'), w.realms.filter((r) => !r.isDemon && r.raceKey !== 'human').map((r) => card(P.realms[r.id]))) },
      { id: 'heroes', label: '🌟 Герої', render: () => h('div', null, h('div', { class: 'muted', style: { marginBottom: '8px' } }, 'НПС-герої мандрують світом: зачищають підземелля, б\'ються з ордами, допомагають своїм королівствам. Зустрінеш — можна поговорити, позмагатися або покликати в загін.'),
        (P.heroes || []).filter((x) => x.alive || x.joined).sort((a, b) => b.lvl - a.lvl).map((x) => h('div', { class: 'item' }, h('div', { class: 'ic' }, x.icon), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${x.name} · рів. ${x.lvl}${x.joined ? ' · у твоєму загоні' : ''}${x.rival ? ' · ісекайник' : ''}`), h('div', { class: 'ds' }, `${D().CLASSES[x.cls].name} · ${D().RACES[x.race] ? D().RACES[x.race].name : x.race} · ${x.realm >= 0 ? w.realms[x.realm].name : 'вільний'} · зачищено ${x.cleared} · ворогів ${x.kills} · зараз: ${x.joined ? 'з тобою' : w.baronies[x.node].name}`))))) },
      { id: 'dark', label: '😈 Темрява', render: () => h('div', null, w.demonId >= 0 ? card(P.realms[w.demonId]) : null, h('h4', null, 'Армії Темряви та орди'), P.armies.filter((a) => POL().isDemon(P, a.realm)).map((a) => h('div', { class: 'chron' }, `${a.icon || '😈'} ${a.name}: ${a.size.toLocaleString('uk')} біля ${w.baronies[a.node].name}`)), P.armies.some((a) => POL().isDemon(P, a.realm)) ? null : h('div', { class: 'muted' }, 'Зараз тихо. Підозріло тихо.')) },
      { id: 'wars', label: '⚔️ Війни', render: () => {
        const wrap = h('div'); if (!P.wars.length) wrap.appendChild(h('div', { class: 'muted' }, '🕊️ Між королівствами — мир. Ну, офіційно.'));
        for (const war of P.wars) {
          const side = (list) => list.map((r) => h('span', { style: { color: w.realms[r].color, fontWeight: 700 } }, w.realms[r].name)).reduce((acc, el, i) => acc.concat(i ? [', ', el] : [el]), []);
          const sc = war.score;
          wrap.appendChild(h('div', { class: 'card', style: { marginBottom: '10px' } }, h('div', { class: 'row' }, h('b', null, '⚔️ ' + war.name), war.independence ? h('span', { class: 'tag war' }, 'за незалежність') : null, h('div', { class: 'spacer' }), h('span', { class: 'muted' }, `з ${GM().dateStr(war.start)} · битв: ${war.battles}`)),
            h('div', { class: 'muted', style: { margin: '4px 0' } }, 'Привід: ' + war.reason), h('div', { class: 'row', style: { margin: '6px 0' } }, h('div', null, 'Нападники: ', side(war.attackers)), h('div', { class: 'spacer' }), h('div', null, 'Захисники: ', side(war.defenders))),
            h('div', { class: 'war-bar' }, h('div', { style: { left: '50%', width: Math.abs(sc) / 2 + '%', background: sc >= 0 ? w.realms[war.leaderA].color : w.realms[war.leaderD].color, transform: sc >= 0 ? 'none' : 'translateX(-100%)' } }))));
        }
        return wrap;
      } },
      { id: 'rel', label: '🤝 Відносини', render: () => {
        const alive = P.realms.filter((r) => !r.dead && !w.realms[r.id].isDemon);
        const t = h('table', { class: 'rel-matrix' }, h('tr', null, h('th'), alive.map((r) => h('th', { style: { color: w.realms[r.id].color } }, w.realms[r.id].name.slice(0, 6)))));
        for (const a of alive) t.appendChild(h('tr', null, h('th', { style: { color: w.realms[a.id].color, textAlign: 'left' } }, w.realms[a.id].name), alive.map((b) => { if (a.id === b.id) return h('td', { class: 'muted' }, '—'); const v = Math.round(a.relations[b.id] || 0); const war = POL().atWar(P, a.id, b.id), ally = a.alliances.includes(b.id), vas = w.realms[a.id].liege === b.id || w.realms[b.id].liege === a.id; return h('td', { style: { background: war ? 'rgba(255,92,108,.3)' : ally ? 'rgba(89,227,154,.22)' : `rgba(${v < 0 ? '255,92,108' : '89,227,154'},${Math.abs(v) / 250})` } }, war ? '⚔️' : ally ? '🤝' : vas ? '👑' : String(v)); })));
        return h('div', { style: { overflow: 'auto' } }, h('div', { class: 'muted', style: { marginBottom: '10px' } }, '⚔️ війна · 🤝 союз · 👑 васалітет · число — відносини від -100 до 100.'), t);
      } },
    ] });
  }
  function chronicle() { const g = G(); UI().modal({ title: 'Хроніка Дивосвіту', icon: '📰', size: 'mid', body: () => h('div', null, g.P.chronicle.slice(0, 250).map((c) => h('div', { class: 'chron' }, h('span', { class: 'd' }, GM().dateStr(c.day)), c.text))) }); }

  function party() {
    const p = G().player;
    UI().modal({ title: 'Загін, пітомці, транспорт', icon: '👥', size: 'mid', body: () => {
      const w = h('div', { class: 'col' });
      w.appendChild(h('h4', null, `Товариші (${p.party.length}/${ISK.bonds ? ISK.bonds.partyCap(p) : 3})`, ISK.bondsUI ? h('button', { class: 'btn small', style: { marginLeft: '10px' }, onclick: () => { UI().closeAll(); ISK.bondsUI.legends(); } }, '💘 Серця') : null));
      if (!p.party.length) w.appendChild(h('div', { class: 'muted' }, 'Найми товаришів у таверні. Удвох веселіше, утрьох — ще й безпечніше.'));
      for (const c of p.party) { const st = PL().companionStats(c); w.appendChild(h('div', { class: 'item' }, SP().img(SP().forCompanion(c), 40), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${c.name} — ${c.roleName}, рів. ${c.lvl}`), h('div', { class: 'ds' }, `${c.traitName} · ❤️ ${c.hp ?? st.maxHp}/${st.maxHp} · ⚔️ ${st.atk} · платня ${c.wage}🪙/день · «${c.line}»`)), h('div', { class: 'acts' }, h('button', { class: 'btn small ghost', onclick: async () => { if (await UI().confirm(`Відпустити ${c.name}?`)) { p.party = p.party.filter((x) => x !== c); reopen(party); } } }, 'Відпустити')))); }
      w.appendChild(h('h4', null, 'Пітомці'));
      if (!p.pets.length) w.appendChild(h('div', { class: 'muted' }, 'Пітомців немає. Купи у стайні або висиди яйце.'));
      p.pets.forEach((pet, i) => { const P = D().PETS[pet.key]; w.appendChild(h('div', { class: 'item' + (i === p.activePet ? ' r2' : '') }, SP().img(SP().forPet(pet.key), 40), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${P.icon} ${pet.name} — рів. ${pet.lvl}${i === p.activePet ? ' (з тобою)' : ''}`), h('div', { class: 'ds' }, P.desc)), h('div', { class: 'acts' }, i !== p.activePet ? h('button', { class: 'btn small', onclick: () => { p.activePet = i; reopen(party); } }, 'Взяти') : null, PL().hasItem(p, 'pet_treat') ? h('button', { class: 'btn small', onclick: () => { PL().removeItem(p, 'pet_treat'); pet.xp += 40 + pet.lvl * 10; PL().addPetXp(p, 0); UI().toast(`${P.icon} Ням! ${pet.name} щасливий.`, 'good'); reopen(party); } }, '🦴') : null))); });
      w.appendChild(h('h4', null, 'Транспорт'));
      w.appendChild(h('div', { class: 'row' }, p.mounts.map((m) => { const M = D().MOUNTS[m]; return h('button', { class: 'btn' + (p.mount === m ? ' primary' : ''), onclick: () => { p.mount = m; reopen(party); } }, `${M.icon} ${M.name} ×${M.speed}`); }), p.ship ? h('span', { class: 'tag ally' }, '⛵ Власний корабель') : null));
      return w;
    } });
  }
  function achievements() {
    const p = G().player;
    UI().modal({ title: 'Досягнення', icon: '🏆', size: 'mid', body: () => h('div', { class: 'items' }, Object.entries(D().ACHIEVEMENTS).map(([k, a]) => h('div', { class: 'item' + (p.achievements[k] ? ' r3' : ''), style: { opacity: p.achievements[k] ? 1 : 0.45 } }, h('div', { class: 'ic' }, p.achievements[k] ? a.icon : '🔒'), h('div', null, h('div', { class: 'nm' }, a.name), h('div', { class: 'ds' }, a.desc))))) });
  }

  function system() {
    UI().modal({ title: 'Меню', icon: '⚙️', size: 'narrow', body: () => h('div', { class: 'col' },
      h('button', { class: 'btn', onclick: () => { UI().closeAll(); saveDialog(); } }, '💾 Зберегти гру'), h('button', { class: 'btn', onclick: () => { UI().closeAll(); loadDialog(); } }, '📂 Завантажити'),
      h('button', { class: 'btn', onclick: () => { UI().closeAll(); party(); } }, '👥 Загін і пітомці (T)'), h('button', { class: 'btn', onclick: () => { UI().closeAll(); achievements(); } }, '🏆 Досягнення (Y)'),
      h('button', { class: 'btn', onclick: () => { UI().closeAll(); settings(); } }, '🔊 Налаштування'), h('button', { class: 'btn', onclick: () => { UI().closeAll(); help(); } }, '❓ Як грати'),
      h('button', { class: 'btn ghost', onclick: async () => { if (await UI().confirm('Вийти в головне меню? Гра збережеться автоматично.')) { UI().closeAll(); autosave(); UI().showScreen('screen-title'); ISK.story.titleRefresh(); } } }, '🏠 Головне меню')) });
  }
  function help() {
    UI().alert('Як грати', [
      '🗺️ Мапа: рух у два натискання — клік (або WASD) обирає напрямок і показує шлях, другий клік (або те саме WASD) — іти. Камера завжди йде за героєм; Ctrl + перетягування або Ctrl + стрілки — оглянути мапу, Ctrl + коліщатко (чи Ctrl + Q/E) — наблизити/віддалити. Пішки герой ходить повільно — верхи й каретою швидше. Куплені мапи відкриваються лише на мінімапі та мапі світу (M).',
      '🏘️ Міста й села: кнопка «Увійти» або клавіша E — мапа поселення з будівлями (гільдія, ринок, таверна…). Клікни будівлю — герой підійде й увійде. Дім: подвір\'я → двері → кімнати (ліжко, кухня, комора, бібліотека). WASD — ходити, E — дія поруч, Esc — вийти.',
      '🎽 Герой: клікни слот спорядження — побачиш усе, що можна туди вдягти. Монстри ростуть разом із тобою: до рівня місцевості додається ~70% твоїх рівнів.',
      '🏳️ Регіони видно завжди: тонкі лінії — графства, світліші — герцогства, кольорові — королівства, золотий пунктир — кордон Імперії. Режими 1–4: рельєф, політична, де-юре, небезпека.',
      '🧭 Навігація: N — наступна ціль (квести й мітки), V — іти до цілі, Z — поспіх, X — змінити транспорт. ПКМ по мапі — мітки. Літаючі (грифон, мітла, килим, віверна) летять напряму. Між містами зі стайнею — поштова карета без засідок. З рангу D — портали гільдії. 🗼 Вежі у фортецях і містах відкривають мапу. Сувій «Додому» — у твою садибу. 🎮 Є підтримка геймпада.',
      '❗ Маркери квестів підстрибують над цілями на мапі.', '⛵ На інші континенти й острови — морем з портів (квиток або власний корабель).',
      '⚔️ Бій: Атака — ПРОБІЛ у золотій зоні. Значки над ворогами — їхні наміри. Шкала УЛЬТИ заповнюється в бою.',
      '🏠 Купи будинок, вирощуй урожай, будуй майстерні. Здобувай славу ⭐ і титули при дворі: Лицар → Барон → Граф → Герцог.',
      '⌨️ C персонаж · I інвентар · K навички · P професії · J квести · R держави · H хроніка · T загін · Y досягнення · Space до героя · Esc меню.',
    ].join('\n\n'), '❓');
  }
  function settings() {
    const s = A().settings; const V = ISK.voice.settings;
    const slider = (val, label, fn) => h('div', { class: 'field' }, h('label', null, label), h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: val, oninput: (e) => fn(+e.target.value) }));
    UI().modal({ title: 'Налаштування', icon: '🔊', size: 'narrow', body: () => h('div', { class: 'col' }, slider(s.sfx, 'Звукові ефекти', (v) => { A().setVolume('sfx', v); A().play('click'); }), slider(s.music, 'Музика', (v) => A().setVolume('music', v)), slider(V.volume, 'Голоси персонажів', (v) => { ISK.voice.setVolume(v); ISK.voice.blip('Богиня Люмі', 'а'); }),
      h('div', { class: 'field' }, h('label', null, 'Озвучка діалогів'), h('select', { onchange: (e) => ISK.voice.setMode(e.target.value) }, [['neural', `Нейроголоси — українська озвучка${V.installed ? '' : ' (потрібно завантажити)'}`], ['blip', 'Аніме-голоси (бурмотіння)'], ['tts', `Системний голос (укр.)${ISK.voice.hasTTS() ? '' : ' — не встановлено'}`], ['off', 'Вимкнено']].map(([v, l]) => h('option', { value: v, selected: V.mode === v ? true : null }, l)))),
      ISK.voice.hasNeural() && !V.installed ? h('div', { class: 'card' }, h('div', { style: { fontSize: '13px', marginBottom: '6px' } }, '🎙️ Нейроозвучка: справжні українські голоси (Микита, Тетяна, Лада), працює офлайн. Одноразове завантаження ~80 МБ.'),
        h('button', { class: 'btn primary', onclick: async (e) => { const b = e.target; b.disabled = true; b.textContent = 'Завантаження… 0%'; const r = await ISK.voice.install((v) => { b.textContent = `Завантаження… ${v}%`; }); if (r && r.ok) { b.textContent = '✅ Встановлено!'; ISK.voice.say('Богиня Люмі', 'Тепер ти мене чуєш? Ура! Я так довго цього чекала!'); } else { b.disabled = false; b.textContent = '⚠️ Помилка: ' + ((r && r.error) || '?') + ' — спробувати ще'; } } }, '⬇️ Завантажити нейроозвучку')) : null,
      ISK.voice.hasNeural() && V.installed ? h('button', { class: 'btn ghost', onclick: () => ISK.voice.say('Богиня Люмі', 'Привіт, герою! Це я, Люмі. Звук працює чудово!') }, '🔊 Перевірити голос') : null,
      h('button', { class: 'btn', onclick: () => { UI().closeAll(); ISK.panels2.voices(); } }, '🎚️ Голоси персонажів: тембр і швидкість кожного'),
      h('div', { class: 'field' }, h('label', null, 'Складність гри'), h('div', { class: 'row wrap' }, Object.entries(ISK.combat.DIFF).map(([k, d]) => h('button', { class: 'btn small' + ((UI().G && UI().G.difficulty) === k ? ' primary' : ''), title: d.desc, onclick: () => { if (!UI().G) return; UI().G.difficulty = k; ISK.difficulty = k; UI().toast(`Складність: ${d.name}. ${d.desc}`, 'good'); reopen(settings); } }, d.name)))),
      h('div', { class: 'field' }, h('label', null, 'Бойова система'), h('div', { class: 'row wrap' }, [['action', '⚔️ Екшен (реальний час)', 'Арена як у сучасних іграх: рух, комбо, перекати, парирування.'], ['turn', '🎲 Покроковий (легкий)', 'Класичні ходи: є час подумати і попити чаю.']].map(([k, n, t]) => h('button', { class: 'btn small' + (ISK.combatUI.mode() === k ? ' primary' : ''), title: t, onclick: () => { ISK.combatUI.setMode(k); UI().toast(`Бій: ${n}. ${t}`, 'good'); reopen(settings); } }, n)))),
      h('div', { class: 'field' }, h('label', null, '📡 Twitch-чат (глядачі впливають на гру)'), h('div', { class: 'row', style: { gap: '6px' } }, (() => { const inp = h('input', { value: (ISK.twitch && ISK.twitch.channel()) || 'mi_miracle', style: { width: '160px' } }); return [inp, h('button', { class: 'btn small primary', onclick: () => { ISK.twitch.connect(inp.value.trim()); reopen(settings); } }, ISK.twitch && ISK.twitch.connected() ? '🔄 Перепідключити' : '🔌 Підключити'), ISK.twitch && ISK.twitch.connected() ? h('button', { class: 'btn small ghost', onclick: () => { ISK.twitch.disconnect(); reopen(settings); } }, 'Вимкнути') : null]; })()), h('div', { class: 'muted', style: { fontSize: '12px' } }, 'Команди: !герой · !подарунок · !лікуй · !орда (3 голоси) · !війна (5 голосів) · !погода [дощ/сніг/буря/туман/ясно] · !жарт · !допомога')),
      h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: !!UI().quickAnim, onchange: (e) => { UI().quickAnim = e.target.checked; try { localStorage.dyvo_quickanim = e.target.checked ? '1' : ''; } catch (_) {} } }), 'Пришвидшена анімація подорожей (×2.5)'),
      h('div', { class: 'muted', style: { fontSize: '12px' } }, 'F11 — повноекранний режим. Оновлення гри встановлюються автоматично при запуску.'),
      h('button', { class: 'btn ghost', onclick: () => { UI().closeAll(); cheats(); } }, '🧪 Чіт-меню (для тестування) · клавіша ` або F10')) });
  }

  // ---------------- Save / load ----------------
  const SLOTS = ['auto', '1', '2', '3'];
  function slotInfo(slot) { try { const s = localStorage.getItem(SAVE_PREFIX + slot); if (!s) return null; const j = JSON.parse(s); return { name: j.player.name, level: j.player.level, time: j.time }; } catch (e) { return null; } }
  function save(slot) { try { localStorage.setItem(SAVE_PREFIX + slot, GM().serialize(G())); localStorage.setItem('dyvo_last', slot); return true; } catch (e) { UI().toast('Помилка збереження: ' + e.message, 'bad'); return false; } }
  function autosave() { if (G()) save('auto'); }
  function load(slot) { const s = localStorage.getItem(SAVE_PREFIX + slot); if (!s) return false; try { UI().startGame(GM().deserialize(s)); return true; } catch (e) { UI().alert('Помилка', e.message, '⚠️'); return false; } }
  function saveDialog() { UI().modal({ title: 'Зберегти гру', icon: '💾', size: 'narrow', body: () => h('div', { class: 'col' }, SLOTS.filter((s) => s !== 'auto').map((slot) => { const i = slotInfo(slot); return h('button', { class: 'btn', onclick: () => { if (save(slot)) { UI().toast('💾 Збережено!', 'good'); UI().closeAll(); } } }, `Слот ${slot}: ${i ? `${i.name}, рів. ${i.level}, ${GM().dateStr(i.time)}` : 'порожньо'}`); })) }); }
  function loadDialog() { UI().modal({ title: 'Завантажити гру', icon: '📂', size: 'narrow', body: () => h('div', { class: 'col' }, SLOTS.map((slot) => { const i = slotInfo(slot); return h('button', { class: 'btn', disabled: !i, onclick: () => { UI().closeAll(); if (load(slot)) UI().toast('📂 Завантажено', 'good'); } }, `${slot === 'auto' ? 'Автозбереження' : 'Слот ' + slot}: ${i ? `${i.name}, рів. ${i.level}, ${GM().dateStr(i.time)}` : 'порожньо'}`); })) }); }

  // ======================= Services =======================
  function openService(s, B) { ({ guild, tavern, shop: (b) => store(b, 'shop'), smith: (b) => store(b, 'smith'), alchemist: (b) => store(b, 'alchemist'), magic: (b) => store(b, 'magic'), market: (b) => store(b, 'market'), trainer, temple, arena, court, stable, estate, harbor, elder }[s])(B); }

  function npcLine(icon, name, text) { return h('div', { class: 'quest' }, h('div', { class: 't' }, `${icon} ${name}`), h('div', { class: 'd', style: { fontSize: '14.5px' } }, text)); }

  function guild(B) {
    const g = G(), p = g.player;
    if (!p.guild.registered) {
      UI().modal({ title: 'Гільдія шукачів пригод', icon: '🛡️', size: 'mid', sub: B.name, body: () => h('div', null,
        npcLine('👩‍💼', 'Реєстраторка Мірра', '«Ласкаво просимо! Ще один герой з іншого світу? Третій за сьогодні. Графа «Причина смерті: вантажівка» вже надрукована. Реєстрація — 10 золотих.»'),
        h('button', { class: 'btn primary', disabled: p.gold < 10, onclick: async () => {
          p.gold -= 10; p.guild.registered = true; A().play('level'); UI().closeAll();
          await UI().alert('Кристал оцінки', `Ти торкаєшся кристала... Він спалахує ${['рожевим', 'золотим', 'веселковим'][Math.floor(Math.random() * 3)]} світлом!\n\nМірра: «О-о-о! Ваші показники... абсолютно середні. Але кристал показує «${D().CHEATS[p.cheat].name}»${p.flags.godGoblin ? ' і раса «Бог (тепер гоблін)»' : ''}. Що б це не означало.»\n\nТи отримуєш картку гільдії рангу F!`, '🔮');
          UI().checkMainQuest(); chooseClass(B);
        } }, '📝 Зареєструватися (10 🪙)')) });
      return;
    }
    if (!p.classes.primary) return chooseClass(B);
    const nr = PL().nextRank(p);
    UI().modal({ title: 'Гільдія шукачів пригод', icon: '🛡️', sub: `${B.name} · ранг ${PL().guildRank(p)} · очки ${p.guild.points}${nr ? ' / ' + nr.pts : ''}`, tabs: [
      { id: 'board', label: '📋 Дошка', render: () => { const bd = GM().board(g, B.id); const w = h('div'); if (!bd.quests.length) w.appendChild(h('div', { class: 'muted' }, 'Дошка порожня. Нові оголошення згодом.')); for (const q of bd.quests) w.appendChild(questEl(q, { board: true, actions: [h('button', { class: 'btn small primary', onclick: () => { const err = GM().acceptQuest(g, B.id, q.id); if (err) UI().toast(err, 'bad'); else { UI().toast('📜 Квест прийнято! Ціль позначена на мапі.', 'good'); reopen(() => guild(B)); } } }, 'Прийняти')] })); return w; } },
      { id: 'turn', label: '✅ Здати', render: () => {
        const w = h('div'); const doneQ = p.quests.filter((q) => GM().questDone(g, q) || (q.type === 'merc' && q.from === B.id));
        if (!doneQ.length) w.appendChild(h('div', { class: 'muted' }, 'Немає виконаних квестів.'));
        for (const q of doneQ) w.appendChild(questEl(q, { actions: [q.type === 'merc' && !q.progress ? h('button', { class: 'btn small danger', onclick: async () => {
          UI().closeAll(); const ens = [ISK.combat.makeEnemy('soldier', q.lvl, { elite: true, name: 'Ворожий капітан' }), ISK.combat.makeEnemy('soldier', q.lvl - 1), ISK.combat.makeEnemy('soldier', q.lvl - 1)];
          const r = await ISK.combatUI.run(ens, { biome: 'plains', noFlee: true }); if (r === 'win') { q.progress = 1; applyMerc(q); UI().toast('⚔️ Ти переломив хід битви! Повертайся по нагороду.', 'epic'); }
        } }, '⚔️ У бій!') : h('button', { class: 'btn small primary', disabled: !GM().questDone(g, q), onclick: () => {
          const r = GM().turnInQuest(g, q.id); if (r) { A().play('coin'); UI().toast(`✅ ${q.title}: +${q.gold}🪙 +${q.xp}✨ +${r.fame}⭐`, 'good'); if (r.xr.ups.length) UI().levelUp(p.level); }
          const nr2 = PL().nextRank(p); if (nr2 && p.guild.points >= nr2.pts) UI().toast(`🏅 Доступний іспит на ранг ${nr2.r}!`, 'epic');
          UI().checkMainQuest(); reopen(() => guild(B));
        } }, 'Здати')] }));
        return w;
      } },
      { id: 'rank', label: '🏅 Ранг', render: () => {
        const w = h('div');
        w.appendChild(h('div', { class: 'row', style: { gap: '6px', marginBottom: '12px' } }, D().GUILD_RANKS.map((r, i) => h('span', { class: 'tag' + (i === p.guild.rank ? ' rank' : ''), style: { fontSize: '15px', padding: '6px 12px', opacity: i <= p.guild.rank ? 1 : 0.4 } }, r.r))));
        if (!nr) { w.appendChild(h('div', { class: 'gold' }, 'Ранг SSS! Барди вже складають пісні.')); return w; }
        w.appendChild(h('div', null, `Наступний ранг: ${nr.r} — ${nr.pts} очок (є ${p.guild.points}).`));
        w.appendChild(h('div', { class: 'prog', style: { margin: '8px 0' } }, h('div', { style: { width: Math.min(100, p.guild.points / nr.pts * 100) + '%' } })));
        if (p.guild.points >= nr.pts) {
          const examLvl = 2 + p.guild.rank * 4;
          w.appendChild(h('div', { class: 'quest main' }, h('div', { class: 't' }, `Іспит на ранг ${nr.r}`), h('div', { class: 'd' }, `Екзаменатор ${['Борис Залізний Лоб', 'Ліна Блискавка', 'Старий Ґром', 'Таємнича Маска'][p.guild.rank % 4]} чекає на арені гільдії (рівень ${examLvl}).`),
            h('button', { class: 'btn primary', onclick: async () => {
              UI().closeAll(); const ex = ISK.combat.makeEnemy('soldier', examLvl, { elite: true, name: 'Екзаменатор гільдії', icon: '🧔' }); ex.drops = [];
              const r = await ISK.combatUI.run([ex], { biome: 'plains', noFlee: true, noDeath: true });
              if (r === 'win') { p.guild.rank++; PL().addFame(p, 10 + p.guild.rank * 5); UI().cutin(`РАНГ ${PL().guildRank(p)}!`, 'Мірра вручає нову картку. Вона блищить. Ти теж.', '#f2c45a'); UI().checkMainQuest(); }
              else UI().toast('Іспит провалено. Спробуй ще раз, коли станеш сильнішим.', 'bad');
            } }, '⚔️ Скласти іспит')));
        }
        return w;
      } },
      { id: 'class', label: '⚔️ Другий клас', render: () => classTab() },
      ...((p.classes.primary === 'jack' || p.classes.secondary === 'jack') ? [{ id: 'jack', label: '🃏 Чужі навички', render: () => jackTab(B) }] : []),
      { id: 'rivals', label: '🐺 Клани', render: () => rivalsTab(B) },
    ] });
  }
  function jackTab(B) {
    const p = G().player; const cx = p.classXp.jack; const w = h('div'); const slots = D().JACK_SLOTS(cx.lvl);
    w.appendChild(h('div', { class: 'muted', style: { marginBottom: '8px' } }, `🃏 Майстер на всі руки (рів. класу ${cx.lvl}) може тримати ${slots} чужих навичок. Вивчення: 1 очко навичок + золото. Доступні навички до рівня ${cx.lvl}. Зайнято: ${p.jackSkills.length}/${slots}.`));
    const grid = h('div', { class: 'items' }); w.appendChild(grid);
    const byClass = {};
    for (const sk of D().skillIndex().values()) { if (sk.lvl > cx.lvl || sk.cls === 'jack') continue; (byClass[sk.cls] = byClass[sk.cls] || []).push(sk); }
    for (const [ck, arr] of Object.entries(byClass)) {
      grid.appendChild(h('div', { class: 'loc-section' }, `${D().CLASSES[ck].icon} ${D().CLASSES[ck].name}`));
      for (const sk of arr.sort((a, b) => a.lvl - b.lvl)) {
        const has = p.jackSkills.includes(sk.id); const cost = 80 * sk.lvl;
        grid.appendChild(h('div', { class: 'item' }, h('div', { class: 'ic' }, sk.icon), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${sk.name} · рів. ${sk.lvl}`), h('div', { class: 'ds' }, `${sk.desc || ''} · ${sk.mp} MP`)),
          h('div', { class: 'acts' }, has ? h('button', { class: 'btn small ghost', onclick: () => { p.jackSkills = p.jackSkills.filter((x) => x !== sk.id); reopen(() => guild(B)); } }, 'Забути') : h('button', { class: 'btn small primary', disabled: p.jackSkills.length >= slots || cx.sp < 1 || p.gold < cost, onclick: () => { cx.sp--; p.gold -= cost; p.jackSkills.push(sk.id); A().play('magic'); UI().toast(`🃏 Вивчено чужу навичку: ${sk.icon} ${sk.name}!`, 'epic'); reopen(() => guild(B)); } }, `Вивчити ${cost}🪙`))));
      }
    }
    return w;
  }
  function rivalsTab(B) {
    const g = G(); const p = g.player; const w = h('div'); const rv = ISK.life.rivals(g);
    w.appendChild(h('div', { class: 'muted', style: { marginBottom: '8px' } }, 'Клани-суперники полюють на ті самі квести. Обганяй їх за очками гільдії та кидай виклик раз на тиждень.'));
    const rows = [{ name: 'Твоя гільдія (ти)', icon: '⭐', pts: p.guild.points, me: true }, ...rv.map((r) => { const RG = D().RIVAL_GUILDS.find((x) => x.id === r.id); return { ...RG, pts: r.pts, id: r.id }; })].sort((a, b) => b.pts - a.pts);
    rows.forEach((r, i) => w.appendChild(h('div', { class: 'item' + (r.me ? ' r2' : '') }, h('div', { class: 'ic' }, `${i + 1}`), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${r.icon} ${r.name}`), h('div', { class: 'ds' }, r.me ? 'Це ти. Ти молодець.' : r.motto)), h('div', { class: 'gold' }, `${r.pts} оч.`),
      r.me ? null : h('button', { class: 'btn small primary', onclick: async () => {
        const c = ISK.life.rivalChallenge(g, r.id); if (c.err) return UI().toast(c.err, 'bad');
        UI().closeAll(); const res = await ISK.combatUI.run(c.enemies, { biome: 'plains', noFlee: true, noDeath: true });
        ISK.life.rivalResult(g, r.id, res === 'win'); UI().toast(res === 'win' ? `🏆 Клан «${c.RG.name}» принижено! +60 очок гільдії` : `😤 «${c.RG.name}» сміються з тебе. Реванш через тиждень!`, res === 'win' ? 'epic' : 'bad', 5000);
      } }, '⚔️ Виклик'))));
    return w;
  }
  function classTab() {
    const p = G().player; const w = h('div');
    w.appendChild(h('div', { class: 'muted', style: { marginBottom: '8px' } }, p.level >= 15 && !p.classes.secondary ? 'Ти досяг 15 рівня — можеш опанувати другий клас!' : `Основний клас: ${D().CLASSES[p.classes.primary].name}. Другий клас — з 15 рівня. Підвищення класу — у вікні навичок (K) з 10 рівня класу.`));
    if (p.level >= 15 && !p.classes.secondary) w.appendChild(h('div', { class: 'choice-grid' }, Object.entries(D().CLASSES).filter(([k, C]) => k !== p.classes.primary && (!C.hidden || p.cheat === 'jack')).map(([k, C]) => h('div', { class: 'choice', onclick: async () => { if (await UI().confirm(`Обрати другий клас: ${C.name}? (500 🪙)`)) { if (p.gold < 500) return UI().toast('Недостатньо золота', 'bad'); p.gold -= 500; p.classes.secondary = k; p.classXp[k] = p.classXp[k] || { lvl: 1, xp: 0, sp: 0 }; UI().closeAll(); UI().cutin(C.name.toUpperCase(), 'Другий клас!', '#7cd6ff'); } } }, h('div', { class: 'ic' }, C.icon), h('div', { class: 'nm' }, C.name), h('div', { class: 'ds' }, C.desc)))));
    return w;
  }
  function chooseClass(B) {
    const p = G().player;
    UI().modal({ title: 'Обери бойову професію', icon: '⚔️', sub: 'Мірра: «Обирайте уважно! З 10 рівня класу — клас ІІ, з 20 — клас ІІІ, з 30 — вознесіння.»', body: () => h('div', { class: 'choice-grid' }, Object.entries(D().CLASSES).filter(([k, C]) => !C.hidden || p.cheat === 'jack').map(([k, C]) => h('div', { class: 'choice' + (C.hidden ? ' secret' : ''), onclick: async () => {
      if (!(await UI().confirm(`${C.icon} ${C.name}: ${C.desc}\n\nКлас ІІ: ${C.adv.map((a) => a.name).join(' або ')}.\nКлас ІІІ: ${C.adv.map((a) => a.master ? a.master.name : '?').join(' або ')}.\nВознесіння: ${C.ascend.name}.\n\nОбрати?`))) return;
      p.classes.primary = k; p.classXp[k] = { lvl: 1, xp: 0, sp: 0 };
      const wid = `w_${C.weapon}_0_0`; PL().addItem(p, wid); PL().equip(p, wid);
      const mat = C.main === 'int' ? 'cloth' : C.main === 'agi' ? 'leather' : 'plate';
      for (const sl of ['body', 'legs', 'feet']) { const id = `a_${sl}_${mat}_0_0`; PL().addItem(p, id); PL().equip(p, id); }
      p.hp = PL().maxHp(p); p.mp = PL().maxMp(p); UI().closeAll(); UI().cutin(C.name.toUpperCase(), 'Бойову професію обрано!', '#ff7eb6');
      await UI().alert('Клас обрано!', `Тепер ти — ${C.name}! ${C.icon}\n\nПерша навичка: ${C.skills[0].icon} ${C.skills[0].name}.\nЗа кожен рівень класу — очко навичок для підвищення рангу навичок (вікно K).\n\nЗазирни на дошку оголошень!`, C.icon);
      guild(B);
    } }, h('div', { class: 'ic' }, C.icon), h('div', { class: 'nm' }, C.name), h('div', { class: 'ds' }, C.desc), h('div', { class: 'ds', style: { marginTop: '6px', color: 'var(--cyan)' } }, `${STAT_NAMES[C.main]} · ${D().WEAPON_TYPES[C.weapon].name}`)))) });
  }
  function applyMerc(q) {
    const g = G(); const armies = g.P.armies.filter((a) => a.realm === q.realmFor);
    if (armies.length) { const a = armies.sort((x, y) => y.size - x.size)[0]; a.size += 600 + g.player.level * 40; a.bonus = 1.25; a.morale = Math.min(1.2, a.morale + 0.15); }
    const en = g.P.armies.filter((a) => a.realm === q.against); if (en.length) en[0].size = Math.max(150, Math.floor(en[0].size * 0.85));
    g.P.realms[q.realmFor].playerRep = Math.min(100, (g.P.realms[q.realmFor].playerRep || 0) + 12);
    if (g.P.realms[q.against]) g.P.realms[q.against].playerRep = Math.max(-100, (g.P.realms[q.against].playerRep || 0) - 15);
    POL().log(g.P, GM().day(g), `🦸 Найманець ${g.player.name} відзначився в бою на боці ${g.world.realms[q.realmFor].fullName}. Барди переплутали ім'я.`, 'battle', [q.realmFor, q.against]);
  }

  function elder(B) {
    const g = G(), p = g.player;
    UI().modal({ title: `Староста ${B.name}`, icon: '👴', size: 'mid', body: () => {
      const bd = GM().board(g, B.id, true); const w = h('div', null, npcLine('👴', 'Староста', ['«Ох, синку, біда в нас... Ну, як завжди.»', '«Герой? Чудово! У нас якраз криниця кусається.»', '«Допоможеш селу — село запам\'ятає. Ну, до наступної пиятики.»'][B.id % 3]));
      for (const q of bd.quests) w.appendChild(questEl(q, { board: true, actions: [h('button', { class: 'btn small primary', onclick: () => { const e = GM().acceptQuest(g, B.id, q.id, true); if (e) UI().toast(e, 'bad'); else { UI().toast('📜 Квест прийнято!', 'good'); reopen(() => elder(B)); } } }, 'Допомогти')] }));
      const doneQ = p.quests.filter((q) => q.elder && q.from === B.id && GM().questDone(g, q));
      for (const q of doneQ) w.appendChild(questEl(q, { actions: [h('button', { class: 'btn small primary', onclick: () => { const r = GM().turnInQuest(g, q.id); if (r) { A().play('coin'); UI().toast(`🙏 Село вдячне! +${q.gold}🪙 +${r.fame}⭐`, 'good'); if (r.xr.ups.length) UI().levelUp(p.level); } reopen(() => elder(B)); } }, 'Здати')] }));
      if (!bd.quests.length && !doneQ.length) w.appendChild(h('div', { class: 'muted' }, 'Зараз у селі спокійно. Навіть кури не бунтують.'));
      return w;
    } });
  }

  function tavern(B) {
    const g = G(), p = g.player; const restCost = Math.round(5 + B.dev * 2 + p.level);
    const rumors = () => { const out = []; for (const war of g.P.wars.slice(0, 2)) out.push(`Чув? Іде «${war.name}». Ціни на мечі злетіли!`); const da = g.P.armies.find((a) => POL().isDemon(g.P, a.realm)); if (da) out.push(`Кажуть, «${da.name}» бачили біля ${g.world.baronies[da.node].name}. Тримай меч напоготові.`); const und = g.world.dungeons.filter((d) => !g.cleared[d.id] && !d.final && Math.hypot(d.x - B.x, d.y - B.y) < 25); if (und.length) { const d = und[Math.floor(Math.random() * und.length)]; g.discovered['d:' + d.id] = 1; out.push(`Неподалік є «${d.name}». Там скарби. І щось, що хрумтить героями.`); } return out; };
    UI().modal({ title: `Таверна «${['П\'яний Слиз', 'Вантажівка і Кухоль', 'Сонний Дракон', 'Три Гобліни', 'Ісекай Інн', 'Кривий Меч', 'Ситий Лицар'][B.id % 7]}»`, icon: '🍺', sub: B.name, tabs: [
      { id: 'main', label: '🍺 Зала', render: () => h('div', { class: 'col' }, npcLine('🧔', 'Корчмар', `«${D().JOKES[Math.floor(Math.random() * D().JOKES.length)]}»`),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', disabled: p.gold < restCost, onclick: () => { p.gold -= restCost; p.hp = PL().maxHp(p); p.mp = PL().maxMp(p); for (const c of p.party) c.hp = undefined; UI().showNews(GM().passTime(g, 1)); A().play('heal'); autosave(); UI().toast('😴 Ти чудово виспався. Здоров\'я і мана відновлені. (Автозбереження)', 'good'); } }, `🛏️ Відпочити (${restCost} 🪙)`),
          h('button', { class: 'btn', onclick: () => { const r = rumors(); UI().alert('Чутки', (r.length ? r : ['Нічого цікавого. Хіба кіт корчмаря знову вкрав ковбасу.']).join('\n\n'), '👂'); } }, '👂 Чутки'),
          h('button', { class: 'btn', disabled: p.gold < 8, onclick: () => { p.gold -= 8; PL().addItem(p, 'food_bread'); UI().toast('🍞 Куплено хліб', 'good'); UI().refresh(); } }, '🍞 Хліб (8)'),
          h('button', { class: 'btn pink', onclick: () => ISK.minigames.dice() }, '🎲 Кості'),
          h('button', { class: 'btn', onclick: () => cooking() }, '🍳 Кухня'))) },
      { id: 'hire', label: '👥 Найманці', render: () => {
        const w = h('div', { class: 'col' }, h('div', { class: 'muted' }, `Товариші б\'ються поруч і ростуть у рівнях. Щоденна платня. Загін: ${p.party.length}/${ISK.bonds ? ISK.bonds.partyCap(p) : 3}.`));
        for (const c of GM().hireOptions(g, B.id)) w.appendChild(h('div', { class: 'item' }, SP().img(SP().forCompanion(c), 44), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${c.name} — ${c.roleName}, рів. ${c.lvl}`), h('div', { class: 'ds' }, `${c.traitName}: «${c.line}» · платня ${Math.round(c.wage * (p.cheat === 'harem' ? 0.5 : 1))}🪙/день`)),
          h('div', { class: 'acts' }, h('button', { class: 'btn small primary', onclick: () => { const e = GM().hire(g, c); if (e) UI().toast(e, 'bad'); else { A().play('coin'); UI().toast(`🤝 ${c.name} приєднується до загону!`, 'epic'); reopen(() => tavern(B)); } } }, `Найняти ${Math.round(c.fee * (p.cheat === 'harem' ? 0.5 : 1))}🪙`))));
        return w;
      } },
    ] });
  }

  function store(B, kind) {
    const g = G(), p = g.player; const titles = { shop: ['Крамниця', '🛒'], smith: ['Кузня', '⚒️'], alchemist: ['Лавка алхіміка', '⚗️'], market: ['Ринок', '🏪'], magic: ['Лавка магії', '🔮'] };
    const mod = GM().priceMod(g, B);
    const CATS = [['all', 'Усе'], ['weapon', '🗡️ Зброя'], ['armor', '🛡️ Броня'], ['offhand', '🔰 Щити/книги'], ['accessory', '💍 Прикраси'], ['potion', '🧪 Зілля'], ['food', '🍲 Їжа'], ['scroll', '📜 Сувої'], ['material', '🪨 Матеріали'], ['other', '📦 Інше']];
    const catOf = (id) => { const it = PL().item(id); if (!it) return 'other'; if (it.kind === 'weapon') return 'weapon'; if (it.kind === 'armor') return 'armor'; if (it.kind === 'offhand') return 'offhand'; if (it.kind === 'accessory' || it.slot === 'ring' || it.slot === 'amulet' || it.slot === 'artifact') return 'accessory'; if (/^food_|^dish/.test(id)) return 'food'; if (/^scroll_/.test(id) || (it.use && it.use.scroll)) return 'scroll'; if (it.use) return 'potion'; if (D().MATERIALS[id]) return 'material'; return 'other'; };
    const filt = { buy: 'all', sell: 'all' };
    const listWith = (mode, ids, row) => {
      const w = h('div'); const bar = h('div', { class: 'row', style: { flexWrap: 'wrap', gap: '4px', marginBottom: '8px' } }); const list = h('div', { class: 'items' });
      const present = new Set(ids.map(catOf));
      const draw = () => { list.innerHTML = ''; const sorted = ids.filter((id) => filt[mode] === 'all' || catOf(id) === filt[mode]).sort((x, y) => CATS.findIndex((c) => c[0] === catOf(x)) - CATS.findIndex((c) => c[0] === catOf(y)) || (PL().item(x).price || 0) - (PL().item(y).price || 0)); for (const id of sorted) list.appendChild(row(id)); if (!sorted.length) list.appendChild(h('div', { class: 'muted' }, 'Порожньо.')); [...bar.children].forEach((b) => b.classList.toggle('primary', b.dataset.c === filt[mode])); };
      for (const [c, l] of CATS) if (c === 'all' || present.has(c)) { const b = h('button', { class: 'btn small', onclick: () => { filt[mode] = c; draw(); } }, l); b.dataset.c = c; bar.appendChild(b); }
      w.append(bar, list); draw(); return w;
    };
    const tabs = [
      { id: 'buy', label: '🛍️ Купити', render: () => listWith('buy', GM().shopStock(g, B, kind), (id) => { const price = PL().buyPrice(p, id, mod); return itemEl(id, 1, [h('button', { class: 'btn small primary', disabled: p.gold < price, onclick: () => { p.gold -= price; PL().addItem(p, id); A().play('coin'); UI().toast(`Куплено: ${PL().item(id).name}`, 'good'); UI().refresh(); reopen(() => store(B, kind)); } }, `${price} 🪙`)]); }) },
      { id: 'sell', label: '💰 Продати', render: () => listWith('sell', Object.keys(p.inventory).filter((id) => { const it = PL().item(id); return it && it.price > 0 && p.inventory[id] > 0; }), (id) => { const n = p.inventory[id]; const price = PL().sellPrice(p, id); const back = () => { reopen(() => store(B, kind)); setTimeout(() => document.querySelector('.tabs button[data-id="sell"]')?.click(), 10); }; return itemEl(id, n, [h('button', { class: 'btn small', onclick: () => { PL().removeItem(p, id); p.gold += price; A().play('coin'); back(); } }, `+${price}`), n > 1 ? h('button', { class: 'btn small ghost', onclick: () => { PL().removeItem(p, id, n); p.gold += price * n; A().play('coin'); back(); } }, `усі +${price * n}`) : null]); }) },
    ];
    if (kind === 'smith') tabs.push({ id: 'forge', label: '🔥 Кувати', render: () => gearTab('smithing') });
    if (kind === 'market' || kind === 'shop') tabs.push({ id: 'tailor', label: '🧵 Кравецтво', render: () => gearTab('tailoring') }, { id: 'process', label: '🪡 Обробка', render: () => craftTab('tailoring') });
    if (kind === 'alchemist') tabs.push({ id: 'brew', label: '🧪 Варити', render: () => craftTab('alchemy') });
    if (kind === 'magic') tabs.push({ id: 'scribe', label: '📜 Писати сувої', render: () => craftTab('scribing') }, { id: 'jewel', label: '💍 Ювелірство', render: () => craftTab('jewelcrafting') });
    if (kind === 'shop') tabs.push({ id: 'cook2', label: '🍳 Кухня', render: () => craftTab('cooking') });
    UI().modal({ title: titles[kind][0], icon: titles[kind][1], sub: `${B.name} · 🪙 ${Math.floor(p.gold)}${mod > 1.05 ? ' · воєнні ціни!' : mod < 1 ? ' · знижка за репутацію/титул' : ''}`, tabs });
  }
  const gearState = { cat: 'weapon', tier: -1 };
  function gearTab(prof) {
    const p = G().player; const w = h('div'); const lvl = (p.professions[prof] || { lvl: 1 }).lvl;
    if (gearState.tier < 0) gearState.tier = Math.max(0, [1, 4, 8, 13, 18, 24, 30, 36].filter((l) => l <= lvl).length - 1);
    const cats = prof === 'smithing' ? [['weapon', '🗡️ Зброя'], ['armor', '🛡️ Броня (кольчуга, лати)'], ['offhand', '🔰 Щити й інше']] : [['armor', '🧥 Тканина і шкіра'], ['offhand', '📕 Гримуари, сагайдаки']];
    if (!cats.some((c) => c[0] === gearState.cat)) gearState.cat = cats[0][0];
    w.appendChild(h('div', { class: 'muted', style: { marginBottom: '6px' } }, `${D().PROFESSIONS[prof].icon} ${D().PROFESSIONS[prof].name}: ${PL().profRank(p, prof)} (рів. ${lvl}). Якість мінігри = шанс на рідкісну, епічну, легендарну чи навіть міфічну річ.${p.cheat === 'crafter' ? ' 🛠️ Руки майстра: −40% вартості.' : ''}`));
    const bar = h('div', { class: 'row', style: { flexWrap: 'wrap', gap: '6px', marginBottom: '8px' } });
    for (const [k, l] of cats) bar.appendChild(h('button', { class: 'btn small' + (gearState.cat === k ? ' primary' : ''), onclick: () => { gearState.cat = k; rerender(); } }, l));
    bar.appendChild(h('div', { class: 'spacer' }));
    D().TIERS.forEach((T, i) => bar.appendChild(h('button', { class: 'btn small' + (gearState.tier === i ? ' pink' : ' ghost'), title: `рів. ${[1, 4, 8, 13, 18, 24, 30, 36][i]}`, onclick: () => { gearState.tier = i; rerender(); } }, `${T.name}ий`)));
    w.appendChild(bar);
    const grid = h('div', { class: 'items' }); w.appendChild(grid);
    const t = gearState.tier; let ids = [];
    if (gearState.cat === 'weapon') ids = Object.keys(D().WEAPON_TYPES).map((x) => `w_${x}_${t}_0`);
    else if (gearState.cat === 'offhand') ids = Object.keys(D().OFFHAND).map((x) => `o_${x}_${t}_0`);
    else ids = Object.keys(D().ARMOR_SLOTS).flatMap((sl) => (prof === 'smithing' ? ['chain', 'plate'] : ['cloth', 'leather']).map((m) => `a_${sl}_${m}_${t}_0`));
    ids = ids.filter((id) => { const r = D().gearRecipe(id); return r && r.prof === prof; });
    const cm = p.cheat === 'crafter' ? 0.6 : 1;
    for (const id of ids) {
      const r = D().gearRecipe(id); const can = GM().canCraftGear(p, id);
      const needs = Object.entries(r.needs).map(([k, n]) => { const it = PL().item(k); const have = p.inventory[k] || 0; const nn = Math.ceil(n * cm); return `${it.icon}${have}/${nn}`; }).join(' ');
      grid.appendChild(itemEl(id, 1, [h('button', { class: 'btn small primary', disabled: !can, onclick: async () => {
        UI().closeAll(); const q = prof === 'smithing' ? await ISK.minigames.forge(Math.min(5, t)) : await ISK.minigames.cooking(r.lvl);
        const res = GM().craftGear(G(), id, q);
        if (res.fail) UI().toast(prof === 'smithing' ? '💥 Метал тріснув! Матеріали втрачено.' : '✂️ Нитка порвалась... усе пішло на ганчірки.', 'bad');
        else { A().play(prof === 'smithing' ? 'clang' : 'magic'); UI().toast(`${prof === 'smithing' ? '⚒️ Викувано' : '🧵 Пошито'}: ${PL().item(res.id).name}!`, res.rarity >= 2 ? 'epic' : 'good', 4000); if (res.rarity >= 3) UI().cutin(res.rarity >= 4 ? 'МІФІЧНИЙ КРАФТ!' : 'ЛЕГЕНДАРНИЙ КРАФТ!', PL().item(res.id).name, res.rarity >= 4 ? '#ff4d6d' : '#ffb52e'); }
        if (res.ups && res.ups.length) UI().toast(`${D().PROFESSIONS[prof].icon} ${D().PROFESSIONS[prof].name}: рівень ${res.ups[res.ups.length - 1]}!`, 'good'); UI().refresh();
      } }, prof === 'smithing' ? 'Кувати' : 'Шити')], `${needs} · ${Math.round(r.gold * cm)}🪙 · рів. ${r.lvl}`));
    }
    if (!ids.length) grid.appendChild(h('div', { class: 'muted' }, 'Тут нічого. Обери іншу категорію.'));
    function rerender() { const parent = w.parentNode; if (parent) { parent.innerHTML = ''; parent.appendChild(gearTab(prof)); } }
    return w;
  }
  function forgeTab() { return gearTab('smithing'); }
  function forgeTabOld() {
    const p = G().player; const w = h('div'); const lvl = p.professions.smithing.lvl;
    w.appendChild(h('div', { class: 'muted', style: { marginBottom: '8px' } }, `Ковальство: ${PL().profRank(p, 'smithing')} (рів. ${lvl}). Якість мінігри — шанс на рідкісну річ.`));
    const grid = h('div', { class: 'items' });
    for (let tier = 0; tier < 6; tier++) {
      const r = D().smithRecipe(tier); if (lvl + 4 < r.lvl) continue;
      const have = p.inventory[r.ore] || 0; const ore = D().MATERIALS[r.ore]; const can = have >= r.count && p.gold >= r.gold && lvl >= r.lvl;
      const ids = [...Object.keys(D().WEAPON_TYPES).map((t) => `w_${t}_${tier}_0`), ...Object.keys(D().OFFHAND).map((t) => `o_${t}_${tier}_0`), ...Object.keys(D().ARMOR_SLOTS).flatMap((s) => ['cloth', 'leather', 'plate'].map((m) => `a_${s}_${m}_${tier}_0`))];
      for (const id of ids) grid.appendChild(itemEl(id, 1, [h('button', { class: 'btn small primary', disabled: !can, onclick: async () => {
        UI().closeAll(); const q = await ISK.minigames.forge(tier); const res = GM().smith(G(), id, tier, q);
        if (res.fail) UI().toast('💥 Метал тріснув! Руду втрачено.', 'bad'); else { A().play('clang'); UI().toast(`⚒️ Викувано: ${PL().item(res.id).name}!`, res.rarity >= 2 ? 'epic' : 'good', 4000); }
        if (res.ups && res.ups.length) UI().toast(`⚒️ Ковальство: рівень ${res.ups[res.ups.length - 1]}!`, 'good'); UI().refresh();
      } }, 'Кувати')], `${ore.icon} ${have}/${r.count} · ${r.gold}🪙 · рів. ${r.lvl}`));
    }
    w.appendChild(grid); return w;
  }
  function craftTab(prof) {
    const p = G().player; const w = h('div'); const lvl = p.professions[prof].lvl;
    w.appendChild(h('div', { class: 'muted', style: { marginBottom: '8px' } }, `${D().PROFESSIONS[prof].name}: ${PL().profRank(p, prof)} (рів. ${lvl}). Ідеальна мінігра — подвійний результат.`));
    const grid = h('div', { class: 'items' });
    for (const r of D().RECIPES[prof]) {
      const ok = GM().canCraft(p, r) && lvl >= r.lvl; const needs = Object.entries(r.needs).map(([id, n]) => `${PL().item(id) ? PL().item(id).icon : '?'}${p.inventory[id] || 0}/${n}`).join(' ');
      grid.appendChild(itemEl(r.out, 1, [h('button', { class: 'btn small primary', disabled: !ok, onclick: async () => {
        UI().closeAll(); const q = prof === 'alchemy' ? await ISK.minigames.alchemy(r.lvl) : prof === 'scribing' ? await ISK.minigames.alchemy(r.lvl + 4) : await ISK.minigames.cooking(r.lvl);
        const res = GM().craft(G(), prof, r, q); UI().toast(res.count ? `✨ Створено: ${PL().item(r.out).name} ×${res.count}` : '💨 Невдача... Вийшло щось сіре і сумне.', res.count ? 'good' : 'bad');
        if (res.ups.length) UI().toast(`${D().PROFESSIONS[prof].icon} ${D().PROFESSIONS[prof].name}: рівень ${res.ups[res.ups.length - 1]}!`, 'good'); UI().refresh();
      } }, 'Створити')], `${needs} · рів. ${r.lvl}`));
    }
    w.appendChild(grid); return w;
  }
  function cooking() { UI().modal({ title: 'Кухня', icon: '🍳', size: 'mid', body: () => craftTab('cooking') }); }

  function trainer(B) {
    const p = G().player; const cost = 200 + p.level * 30;
    UI().modal({ title: 'Тренер', icon: '🥋', size: 'mid', sub: B.name, body: () => {
      const w = h('div', { class: 'col' }, npcLine('🧓', 'Майстер Ґо', '«Сила — у тренуванні. Тренування — у силі. Платити — наперед.»'));
      w.appendChild(h('div', { class: 'row' },
        h('button', { class: 'btn primary', disabled: p.gold < cost || !p.classes.primary, onclick: () => { p.gold -= cost; const xp = 30 + p.level * 12; const res = PL().addClassXp(p, xp); GM().passTime(G(), 1); A().play('level'); UI().toast(`🥋 +${xp} досвіду класу`, 'good'); for (const r of res) UI().toast(`${D().CLASSES[r.cls].icon} Рівень класу ${r.lvl}! +1 очко навичок`, 'epic', 4000); reopen(() => trainer(B)); } }, `🏋️ Тренуватися день (${cost} 🪙)`),
        h('button', { class: 'btn', disabled: p.gold < 300, onclick: async () => { if (!(await UI().confirm('Скинути всі очки характеристик за 300 🪙?'))) return; p.gold -= 300; const R = D().RACES[p.race]; const base = { str: 5, agi: 5, int: 5, vit: 5, luk: 5 }; for (const [k, v] of Object.entries(R.stats)) base[k] = Math.max(1, base[k] + v); if (p.cheat === 'luck') base.luk += 8; const spent = Object.keys(base).reduce((s, k) => s + p.stats[k] - base[k], 0); p.stats = base; p.statPoints += spent; UI().toast('Очки скинуто. Розподіли у вікні персонажа.', 'good'); UI().refresh(); } }, '🔄 Перерозподіл (300 🪙)')));
      for (const c of [p.classes.primary, p.classes.secondary].filter(Boolean)) {
        const C = D().CLASSES[c], cx = p.classXp[c];
        if (cx.lvl >= 30 && !cx.ascended) w.appendChild(h('div', { class: 'quest main' }, h('div', { class: 't' }, `🌟 Вознесіння: ${C.ascend.name}`), h('div', { class: 'd' }, `Ритуал вознесіння: 5000🪙 і 1200⭐ слави. Дає +6 до всіх характеристик і навичку «${C.ascend.skill.name}».`),
          h('button', { class: 'btn primary', disabled: p.gold < 5000 || p.fame < 1200, onclick: () => { p.gold -= 5000; cx.ascended = true; A().play('win'); UI().closeAll(); UI().cutin(C.ascend.name.toUpperCase(), 'ВОЗНЕСІННЯ!', '#fff6a0'); UI().sparkle(innerWidth / 2, innerHeight / 2, 40); } }, '🌟 Вознестися')));
      }
      return w;
    } });
  }
  function temple(B) {
    const p = G().player; const cost = Math.round(p.level * 4);
    UI().modal({ title: 'Храм Богині Люмі', icon: '⛪', size: 'mid', sub: B.name, body: () => h('div', { class: 'col' }, npcLine('🙏', 'Жриця Аделія', '«Богиня любить усіх своїх дітей. Особливо тих, хто жертвує.» На статуї богині хтось намалював вуса.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', disabled: p.gold < cost, onclick: () => { p.gold -= cost; p.hp = PL().maxHp(p); p.mp = PL().maxMp(p); for (const c of p.party) c.hp = undefined; A().play('heal'); UI().toast('✨ Тебе й загін зцілено святим світлом.', 'good'); UI().refresh(); } }, `💚 Зцілення (${cost} 🪙)`),
        h('button', { class: 'btn', disabled: p.gold < 100, onclick: () => { p.gold -= 100; p.food = { buff: 'all', amt: 0.08, battles: 5 }; A().play('magic'); UI().toast('🌸 Благословення Люмі: +8% до характеристик на 5 боїв.', 'good'); UI().refresh(); } }, '🌸 Благословення (100)'),
        h('button', { class: 'btn', disabled: p.gold < 50, onclick: () => { p.gold -= 50; PL().addFame(p, 2); UI().toast('🙏 Пожертва прийнята. +2⭐ Жриця усміхається.', 'good'); UI().refresh(); } }, '🪙 Пожертва (50)'),
        h('button', { class: 'btn ghost', onclick: () => UI().alert('Молитва', ['Голос у голові: «Абонент тимчасово недоступний».', 'Голос Люмі: «Я зайнята! Пиши в листі!»', 'Ти відчуваєш тепло. Або це просто свічки.', 'Люмі: «О, ти ще живий? Молодець! Тримайся!»'][Math.floor(Math.random() * 4)], '🙏') }, '🙏 Помолитися'))) });
  }
  function arena(B) {
    const p = G().player; const lvl = Math.max(p.level, 3);
    UI().modal({ title: 'Арена', icon: '🏟️', size: 'mid', sub: `${B.name} · Хліба і видовищ!`, body: () => h('div', { class: 'col' }, npcLine('📣', 'Ведучий', '«Пані та панове! Сьогодні — герой з іншого світу! Ставки здебільшого на монстрів!»'),
      h('div', { class: 'row' }, [['Бронзовий кубок', 0, 3, 80], ['Срібний кубок', 3, 4, 200], ['Золотий кубок', 6, 5, 500]].map(([nm, add, waves, prize]) => h('button', { class: 'btn' + (add === 0 ? ' primary' : ''), onclick: async () => {
        UI().closeAll();
        for (let wv = 1; wv <= waves; wv++) { const keys = Object.keys(D().MONSTERS).filter((k) => k !== 'mimic' && k !== 'soldier'); const ens = Array.from({ length: Math.min(3, 1 + Math.floor(wv / 2)) }, () => ISK.combat.makeEnemy(keys[Math.floor(Math.random() * keys.length)], lvl + add + wv - 2)); UI().cutin(`ХВИЛЯ ${wv}/${waves}`, nm, '#ff7eb6'); const r = await ISK.combatUI.run(ens, { biome: 'plains', noFlee: true, noDeath: true, arena: true }); if (r !== 'win') { UI().toast('Тебе винесли з арени на ношах. Натовп аплодує... монстрам.', 'bad'); return; } }
        p.gold += prize; PL().addFame(p, 10 + add * 3); A().play('win'); UI().alert('Перемога на арені!', `${nm} — твій! +${prize} 🪙, +слава\nНатовп скандує твоє ім'я. Неправильно, але скандує.`, '🏆');
      } }, `${nm} · ${waves} хв. · ${prize}🪙`)))) });
  }

  function court(B) {
    const g = G(), p = g.player, w = g.world; const realmId = B.owner; if (realmId < 0 || POL().isDemon(g.P, realmId)) return;
    const st = g.P.realms[realmId]; const rep = st.playerRep || 0;
    const lands = w.baronies.filter((b) => b.owner === realmId && b.occ < 0 && b.type !== 'capital' && b.holder !== 'player').sort((a, b) => a.dev - b.dev).slice(0, 6);
    const next = D().SOCIAL[p.social + 1]; const reasons = next ? GM().socialCheck(g, p.social + 1, realmId) : [];
    UI().modal({ title: `Двір: ${w.realms[realmId].fullName}`, icon: '👑', size: 'mid', sub: `${POL().rulerFull(w, st)} · репутація ${rep} · твій титул: ${PL().socialName(p)} · ⭐${Math.floor(p.fame)}`, body: () => h('div', { class: 'col' },
      npcLine('👑', POL().rulerFull(w, st), rep < 10 ? '«Хто пустив простолюдина? А, ісекайник. Кажи швидше, у нас бенкет.»' : rep < 40 ? '«А, той самий герой! Чули про тебе. Здебільшого добре.»' : '«Мій вірний герою! Корона в боргу перед тобою. Не в грошовому сенсі.»'),
      h('div', { class: 'card' }, h('h4', null, 'Соціальний статус'),
        h('div', { class: 'row' }, D().SOCIAL.map((s, i) => h('span', { class: 'tag' + (i === p.social ? ' rank' : ''), style: { opacity: i <= p.social ? 1 : 0.45 } }, s.name))),
        next ? h('div', { style: { marginTop: '8px' } }, `Наступний титул: ${next.name} — потрібно: ${next.req || ''}. ${reasons.length ? 'Бракує: ' + reasons.join(', ') : '✅ Усе готово!'}`) : h('div', { class: 'gold' }, 'Ти досяг вершини!'),
        next && !reasons.length ? h('button', { class: 'btn primary', style: { marginTop: '8px' }, onclick: () => { const S = GM().promote(g, realmId); if (S) { A().play('win'); UI().closeAll(); UI().cutin(S.name.toUpperCase(), `Титул від ${w.realms[realmId].name}!`, '#ffd36e'); UI().sparkle(innerWidth / 2, innerHeight / 2, 30, ['👑', '✦', '★']); } } }, `🎖️ Прийняти титул «${next.name}»`) : null),
      h('div', { class: 'card' }, h('h4', null, 'Землі на продаж (потрібен титул Лицаря та репутація 40+)'),
        lands.map((b) => { const free = p.fame >= 900 && rep >= 70; const price = GM().baronyPrice(b); return h('div', { class: 'row', style: { margin: '4px 0' } }, h('span', null, `${ISK.world.SETTLEMENT[b.type].icon} ${b.name} (розвиток ${b.dev})`), h('div', { class: 'spacer' }),
          h('button', { class: 'btn small primary', disabled: p.social < 3 || rep < 40 || (!free && p.gold < price), onclick: async () => { if (!(await UI().confirm(free ? `Корона дарує тобі ${b.name} за заслуги! Прийняти?` : `Купити баронство ${b.name} за ${price} 🪙?`))) return; const e = GM().grantBarony(g, b.id, free); if (e) return UI().toast(e, 'bad'); A().play('level'); UI().closeAll(); UI().cutin('ЗЕМЛЕВЛАСНИК!', `${b.name} тепер твоє`, '#7cd67c'); UI().checkMainQuest(); } }, free ? '🎁 Дарунок' : `${price} 🪙`)); })),
      h('div', { class: 'card' }, h('h4', null, 'Пожертва короні'), h('button', { class: 'btn', disabled: p.gold < 200, onclick: () => { p.gold -= 200; st.gold += 200; st.playerRep = Math.min(100, rep + 4); UI().toast('Корона вдячна. +4 репутації', 'good'); reopen(() => court(B)); } }, 'Пожертвувати 200 🪙 (+4 репутації)'))) });
  }

  function stable(B) {
    const p = G().player;
    UI().modal({ title: 'Стайня і звіринець', icon: '🐎', size: 'mid', sub: B.name, body: () => h('div', { class: 'col' }, npcLine('🤠', 'Конюх Остап', '«Коні, віслюки, курки-переростки... Дракона? Ні, драконів не тримаємо. Вони тримають нас.»'),
      h('h4', null, 'Транспорт'), h('div', { class: 'items' }, Object.entries(D().MOUNTS).filter(([k]) => k !== 'feet').map(([k, M]) => itemElRaw(M.icon, M.name, `Швидкість ×${M.speed} · засідки ×${M.enc}${M.desc ? ' · ' + M.desc : ''}`, [h('button', { class: 'btn small primary', disabled: !p.mounts.includes(k) && p.gold < M.price, onclick: () => { const e = ISK.game.buyMount(G(), k); if (e) UI().toast(e, 'bad'); else { A().play('coin'); UI().toast(`${M.icon} ${M.name} — твій транспорт!`, 'good'); reopen(() => stable(B)); } } }, p.mounts.includes(k) ? (p.mount === k ? 'Обрано' : 'Сісти') : `${M.price} 🪙`)]))),
      h('h4', null, 'Пітомці'), h('div', { class: 'items' }, Object.entries(D().PETS).filter(([, P]) => P.price > 0).map(([k, P]) => itemElRaw(P.icon, P.name, P.desc, [h('button', { class: 'btn small primary', disabled: p.pets.some((x) => x.key === k) || p.gold < P.price, onclick: () => { const e = GM().buyPet(G(), k); if (e) UI().toast(e, 'bad'); else { A().play('coin'); UI().toast(`${P.icon} У тебе новий друг!`, 'epic'); reopen(() => stable(B)); } } }, p.pets.some((x) => x.key === k) ? 'Вже є' : `${P.price} 🪙`)])))) });
  }
  function itemElRaw(icon, name, desc, acts) { return h('div', { class: 'item' }, h('div', { class: 'ic' }, icon), h('div', { style: { minWidth: 0 } }, h('div', { class: 'nm' }, name), h('div', { class: 'ds' }, desc)), h('div', { class: 'acts' }, acts)); }

  function harbor(B) {
    const p = G().player, w = G().world;
    const lanes = (w.graph['b:' + B.id] || []).filter((e) => e.kind === 'sea');
    UI().modal({ title: 'Гавань', icon: '⛵', size: 'mid', sub: B.name, body: () => h('div', { class: 'col' }, npcLine('🧑‍✈️', 'Капітан Морж', '«Куди пливемо? Тільки не в Демонію. Там погані відгуки на мапах.»'),
      h('h4', null, 'Морські маршрути звідси'), lanes.length ? lanes.map((e) => { const T = w.baronies[+e.to.slice(2)]; const t = GM().seaTicket(e); return h('div', { class: 'row', style: { margin: '3px 0' } }, `⛴️ ${T.name} (${w.realms[T.owner] ? w.realms[T.owner].name : '—'}) · ~${Math.max(1, Math.round(GM().legDays(e, p)))} дн.`, h('div', { class: 'spacer' }), h('button', { class: 'btn small', onclick: () => { UI().closeAll(); UI().startTravel('b:' + T.id); } }, p.ship ? 'Пливти' : `Квиток ${t}🪙`)); }) : h('div', { class: 'muted' }, 'Рейсів немає. Риби теж.'),
      h('h4', null, 'Власний корабель'), p.ship ? h('div', { class: 'good' }, `⛵ ${D().SHIP.name} — твій! Морські подорожі безкоштовні та швидші.`) : h('button', { class: 'btn primary', disabled: p.gold < D().SHIP.price, onclick: () => { p.gold -= D().SHIP.price; p.ship = true; A().play('win'); UI().closeAll(); UI().cutin('КАПІТАН!', D().SHIP.name, '#6fe3ff'); } }, `Купити корабель (${D().SHIP.price} 🪙)`)) });
  }

  function estate(B) {
    const g = G(), p = g.player; const cost = GM().houseCost(B);
    UI().modal({ title: 'Контора нерухомості', icon: '🏠', size: 'mid', sub: B.name, body: () => h('div', { class: 'col' }, npcLine('🕴️', 'Ріелтор Шнобель', '«Будинок з видом на... на інші будинки! Ідеально для героя. Іпотека? Ні, тільки готівка.»'),
      p.house ? h('div', null, `Твій дім у ${g.world.baronies[p.house.barony].name}. `, p.house.barony === B.id ? h('button', { class: 'btn primary', onclick: () => { UI().closeAll(); house(); } }, '🏡 Відкрити дім') : h('span', { class: 'muted' }, 'Продати і купити тут:')) : null,
      !p.house || p.house.barony !== B.id ? h('button', { class: 'btn primary', disabled: p.gold < cost, onclick: async () => { if (p.house && !(await UI().confirm('Старий будинок буде продано за пів ціни, а речі зі скрині перевезено. Продовжити?'))) return; if (p.house) { p.gold += Math.round(GM().houseCost(g.world.baronies[p.house.barony]) / 2); const chest = p.house.chest; GM().buyHouse(g, B.id); p.house.chest = chest; } else { const e = GM().buyHouse(g, B.id); if (e) return UI().toast(e, 'bad'); } A().play('win'); UI().closeAll(); UI().cutin('НОВИЙ ДІМ!', 'Іпотека в іншому світі (без іпотеки)', '#7cd67c'); house(); } }, `Купити будинок (${cost} 🪙)`) : null) });
  }

  function house() {
    const g = G(), p = g.player, H = p.house; if (!H) return;
    if (p.location !== 'b:' + H.barony) { UI().toast('Твій дім в іншому місці.', 'bad'); return; }
    UI().modal({ title: 'Мій дім', icon: '🏡', sub: `${g.world.baronies[H.barony].name} · затишно, хоч і пахне котами`, tabs: [
      { id: 'home', label: '🛋️ Кімнати', render: () => {
        const w = h('div', { class: 'col' });
        w.appendChild(h('div', { class: 'row' }, H.upgrades.bed ? h('button', { class: 'btn primary', onclick: () => { p.hp = PL().maxHp(p); p.mp = PL().maxMp(p); for (const c of p.party) c.hp = undefined; UI().showNews(GM().passTime(g, 1)); const rs = GM().sleepAtHome(g); autosave(); A().play('heal'); UI().toast('😴 Найкращий сон — удома. (Автозбереження)' + (rs ? ` · Виспався: +20% досвіду ще на ${rs} перемог` : ''), 'good', 4000); } }, '🛏️ Спати') : null,
          H.upgrades.kitchen ? h('button', { class: 'btn', onclick: () => { UI().closeAll(); cooking(); } }, '🍳 Кухня') : null,
          H.upgrades.lab ? h('button', { class: 'btn', onclick: () => { UI().closeAll(); UI().modal({ title: 'Лабораторія', icon: '⚗️', tabs: [{ id: 'a', label: '⚗️ Алхімія', render: () => craftTab('alchemy') }, { id: 's', label: '📜 Сувої', render: () => craftTab('scribing') }] }); } }, '⚗️ Лабораторія') : null,
          H.upgrades.forge ? h('button', { class: 'btn', onclick: () => { UI().closeAll(); UI().modal({ title: 'Домашня кузня', icon: '⚒️', body: forgeTab }); } }, '⚒️ Кузня') : null,
          H.upgrades.incubator && PL().hasItem(p, 'dragon_egg') ? h('button', { class: 'btn pink', onclick: () => { PL().removeItem(p, 'dragon_egg'); if (!p.pets.some((x) => x.key === 'dragon')) { p.pets.push({ key: 'dragon', name: 'Іскорка', lvl: Math.max(1, p.level - 3), xp: 0 }); p.activePet = p.pets.length - 1; } GM().unlock(g, 'pet'); UI().closeAll(); UI().cutin('ДРАКОНЧИК!', 'З яйця вилупилася Іскорка! Вона вже підпалила килим.', '#ff9a3c'); } }, '🥚 Висидіти яйце') : null));
        const I = GM().houseInfo(g); const tabTo = (id) => { reopen(house); setTimeout(() => document.querySelector(`.tabs button[data-id="${id}"]`)?.click(), 10); };
        w.appendChild(h('div', { class: 'card' }, h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('div', null, h('div', { style: { fontSize: '20px', fontWeight: 800 } }, `${I.L.icon} ${I.L.name}`), h('div', { class: 'muted', style: { fontSize: '13px' } }, `${I.L.desc} · прибудов ${I.used}/${I.slots} · макс. рівень прибудов ${I.cap} · грядок ${H.plots.length}`)),
          I.next ? h('button', { class: 'btn primary', title: I.next.desc, onclick: () => { const e = GM().upgradeHouseLevel(g); if (e) { UI().toast(e, 'bad', 4000); return; } A().play('clang'); UI().cutin(`${I.next.icon} ${I.next.name.toUpperCase()}!`, 'Будинок перебудовано! Сусіди в шоці.', '#ffd76e'); reopen(house); } }, `🔨 Перебудувати в «${I.next.name}» · ${Object.entries(I.next.cost).map(([k2, v]) => (k2 === 'gold' ? `${v}🪙` : `${PL().item(k2).icon}${v}`)).join(' ')}`) : h('span', { class: 'gold' }, '👑 Найкращий дім у королівстві'))));
        w.appendChild(h('h4', null, 'Прибудови'));
        const grid = h('div', { class: 'items' });
        for (const [k, U] of Object.entries(D().HOUSE_UPGRADES)) { const lvl = H.upgrades[k] || 0; const max = U.max || 1; const c = GM().upgradeCost(g, k); const lock = lvl < max ? GM().upgradeLock(g, k) : null;
          grid.appendChild(itemElRaw(U.icon, `${U.name}${lvl ? ` (рів. ${lvl}/${max})` : ''}`, `${U.desc}${lvl < max ? ` · ${c.gold}🪙 🪵${c.wood} 🪨${c.stone}` : ''}${lock ? ' · 🔒 ' + lock : ''}`, [lvl < max ? h('button', { class: 'btn small ' + (lock ? 'ghost' : 'primary'), disabled: !!lock, onclick: () => { const e = GM().upgradeHouse(g, k); if (e) UI().toast(e, 'bad'); else { A().play('clang'); UI().toast(`🔨 ${lvl ? 'Покращено' : 'Збудовано'}: ${U.name}${lvl ? ' → рів. ' + (lvl + 1) : ''}!`, 'good'); reopen(house); } } }, lvl ? '⬆️ Покращити' : 'Будувати') : h('span', { class: 'good' }, '✔')])); }
        w.appendChild(grid);
        w.appendChild(h('div', { class: 'muted', style: { fontSize: '12px' } }, 'Деревину добувай лісорубством 🪓, камінь — гірництвом ⛏️, або купуй на ринку.'));
        return w;
      } },
      { id: 'garden', label: '🌱 Город', render: () => {
        const w = h('div', { class: 'col' });
        if (!H.plots.length) { w.appendChild(h('div', { class: 'muted' }, 'Збудуй «Город» у вкладці кімнат, щоб отримати грядки.')); return w; }
        const seeds = Object.keys(D().CROPS).filter((s) => PL().hasItem(p, s));
        const gtab = () => { reopen(house); setTimeout(() => document.querySelector('.tabs button[data-id="garden"]')?.click(), 10); };
        const empty = H.plots.filter((x) => !x.seed).length, ready = H.plots.filter((x) => x.ready).length;
        w.appendChild(h('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap' } },
          h('button', { class: 'btn primary', disabled: !ready, onclick: () => { const r = GM().harvestAll(g); A().play('coin'); UI().toast('🌾 Зібрано: ' + Object.entries(r).map(([id, n]) => `${PL().item(id).icon}×${n}`).join(' '), 'good', 3500); gtab(); } }, `🌾 Зібрати все (${ready})`),
          h('select', { disabled: !empty || !seeds.length, onchange: (e) => { if (!e.target.value) return; const n = GM().plantAll(g, e.target.value); A().play('bubble'); UI().toast(`🌱 Посаджено грядок: ${n}`, 'good'); gtab(); } }, h('option', { value: '' }, empty ? (seeds.length ? `🌱 Посадити на всі порожні (${empty})…` : 'Немає насіння') : 'Порожніх грядок нема'), seeds.map((sd) => h('option', { value: sd }, `${PL().item(sd).name} ×${p.inventory[sd]}`))),
          H.upgrades.greenhouse ? h('span', { class: 'tag ally' }, '🪴 Теплиця: росте і взимку') : null, H.upgrades.irrigation ? h('span', { class: 'tag ally' }, `💧 −${H.upgrades.irrigation * 10}% часу росту`) : null));
        const grid = h('div', { class: 'plots' });
        H.plots.forEach((pl, i) => {
          const C = pl.seed ? D().CROPS[pl.seed] : null;
          grid.appendChild(h('div', { class: 'plot' + (pl.ready ? ' ready' : '') }, h('div', { class: 'pi' }, pl.ready ? PL().item(C.crop).icon : pl.seed ? '🌱' : '🟫'),
            h('div', { class: 'ds' }, pl.ready ? 'Дозріло!' : pl.seed ? `${PL().item(C.crop).name}: ${Math.max(0, pl.readyDay - GM().day(g))} дн.` : 'Порожня грядка'),
            pl.ready ? h('button', { class: 'btn small primary', onclick: () => { const r = GM().harvest(g, i, 1); if (r) { A().play('coin'); UI().toast(`🌾 Урожай: ${PL().item(r.crop).name} ×${r.n}`, 'good'); if (r.ups.length) UI().toast(`🌾 Фермерство: рівень ${r.ups[r.ups.length - 1]}!`, 'good'); } reopen(house); setTimeout(() => document.querySelector('.tabs button[data-id="garden"]')?.click(), 10); } }, 'Зібрати') : null,
            !pl.seed ? h('select', { onchange: (e) => { if (GM().plant(g, i, e.target.value)) { A().play('bubble'); reopen(house); setTimeout(() => document.querySelector('.tabs button[data-id="garden"]')?.click(), 10); } } }, h('option', { value: '' }, seeds.length ? 'Посадити...' : 'Немає насіння'), seeds.map((s) => h('option', { value: s }, `${PL().item(s).name} ×${p.inventory[s]}`))) : null));
        });
        w.appendChild(grid); w.appendChild(h('div', { class: 'muted', style: { fontSize: '12px' } }, 'Насіння купуй на ринку 🏪. Урожай — для кулінарії й продажу. Борщ сам себе не зварить!'));
        return w;
      } },
      { id: 'farm', label: '🐔 Ферма', render: () => {
        const w = h('div', { class: 'col' }); const I = GM().houseInfo(g);
        const farms = Object.entries(D().HOUSE_UPGRADES).filter(([, U]) => U.farm);
        const have = farms.filter(([k]) => H.upgrades[k]);
        if (!have.length) { w.appendChild(h('div', { class: 'muted' }, 'Збудуй курник, корівник, пасіку, сад чи ставок у вкладці «Кімнати» — і щодня тут з\'являтимуться продукти.')); return w; }
        w.appendChild(h('div', { class: 'items' }, have.map(([k, U]) => itemElRaw(U.icon, `${U.name} (рів. ${H.upgrades[k]})`, 'Щодня: ' + U.prod.map(([id, per, ch]) => `${PL().item(id).icon} ${PL().item(id).name} ×${per * H.upgrades[k]}${ch < 1 ? ` (${Math.round(ch * 100)}%)` : ''}`).join(', ') + (U.noWinter ? ' · взимку відпочиває' : ''), []))));
        w.appendChild(h('h4', null, `🏚️ Комора: ${I.stored}/${I.storeCap}`));
        w.appendChild(h('div', { class: 'row', style: { flexWrap: 'wrap', gap: '6px' } }, Object.entries(H.store).map(([id, n]) => h('span', { class: 'tag' }, `${PL().item(id).icon} ${PL().item(id).name} ×${n}`)), !I.stored ? h('span', { class: 'muted' }, 'Поки порожньо. Кури ще думають.') : null));
        w.appendChild(h('button', { class: 'btn primary', disabled: !I.stored, style: { marginTop: '8px' }, onclick: () => { const r = GM().collectStore(g); A().play('coin'); UI().toast('🧺 Забрано з комори: ' + Object.entries(r).map(([id, n]) => `${PL().item(id).icon}×${n}`).join(' '), 'good', 3500); reopen(house); setTimeout(() => document.querySelector('.tabs button[data-id="farm"]')?.click(), 10); } }, '🧺 Забрати все з комори'));
        if (I.stored >= I.storeCap) w.appendChild(h('div', { class: 'bad', style: { fontSize: '13px' } }, 'Комора повна — нові продукти псуються! Забери або збудуй більшу комору.'));
        return w;
      } },
      { id: 'chest', label: '🧰 Скриня', render: () => {
        const w = h('div', { class: 'grid2' }); if (!H.upgrades.chest) return h('div', { class: 'muted' }, 'Збудуй скриню.');
        const inv = h('div', { class: 'items' }), ch = h('div', { class: 'items' });
        for (const [id, n] of Object.entries(p.inventory)) { const it = PL().item(id); if (!it || it.kind === 'material' && D().MATERIALS[id].kind === 'quest') continue; inv.appendChild(itemEl(id, n, [h('button', { class: 'btn small', onclick: () => { PL().removeItem(p, id, n); H.chest[id] = (H.chest[id] || 0) + n; reopen(house); setTimeout(() => document.querySelector('.tabs button[data-id="chest"]')?.click(), 10); } }, '→')])); }
        for (const [id, n] of Object.entries(H.chest)) ch.appendChild(itemEl(id, n, [h('button', { class: 'btn small', onclick: () => { PL().addItem(p, id, n); delete H.chest[id]; reopen(house); setTimeout(() => document.querySelector('.tabs button[data-id="chest"]')?.click(), 10); } }, '←')]));
        w.append(h('div', null, h('h4', null, 'Рюкзак'), inv), h('div', null, h('h4', null, 'Скриня'), ch)); return w;
      } },
    ] });
  }

  function land(bid, tab) {
    const g = G(), p = g.player, B = g.world.baronies[bid]; const L = GM().landState(g, bid);
    const again = (t) => { reopen(() => land(bid, t)); };
    const kv = (k, v, st) => [h('div', { class: 'k' }, k), h('div', st ? { style: st } : null, v)];
    UI().modal({ title: `Баронство ${B.name}`, icon: D().LAND_TIERS[L.tier].icon, size: 'wide', sub: `Твої землі · сюзерен: ${g.world.realms[B.owner].fullName}`, tab, tabs: [
      { id: 'main', label: '🏰 Резиденція', render: () => {
        const I = GM().landInfo(g, bid); const w = h('div', { class: 'col' });
        w.appendChild(h('div', { class: 'card' }, h('div', { class: 'row', style: { justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' } },
          h('div', null, h('div', { style: { fontSize: '20px', fontWeight: 800 } }, `${I.T.icon} ${I.T.name}`), h('div', { class: 'muted', style: { fontSize: '13px' } }, `${I.T.desc} · ділянок ${I.used}/${I.lots} · будівлі до рів. ${I.cap}`)),
          I.next ? h('button', { class: 'btn primary', title: I.next.desc, onclick: () => { const e = GM().upgradeLandTier(g, bid); if (e) { UI().toast(e, 'bad', 4000); return; } A().play('clang'); UI().cutin(`${I.next.icon} ${I.next.name.toUpperCase()}!`, `${B.name} розбудовано!`, '#ffd76e'); again('main'); } }, `🔨 Розбудувати: ${I.next.name} · ${Object.entries(I.next.cost).map(([k2, v]) => (k2 === 'gold' ? `${v}🪙` : `${PL().item(k2).icon}${v}`)).join(' ')}`) : h('span', { class: 'gold' }, '👑 Найвеличніший замок округи'))));
        w.appendChild(h('div', { class: 'kv' },
          kv('Жителі', `👥 ${L.pop}/${I.housing}${I.incoming ? ` (+${I.incoming} в дорозі)` : ''}`),
          kv('Їжа', `🍞 запас ${Math.max(0, Math.round(L.food))}/${I.foodCap} · ${I.foodProd >= L.pop ? '+' : ''}${I.foodProd - L.pop}/день`, { color: I.foodProd < L.pop ? 'var(--bad)' : 'var(--good)' }),
          kv('Лояльність', `${Math.round(L.loyalty)}%`, { color: L.loyalty < 30 ? 'var(--bad)' : 'var(--good)' }),
          kv('Дохід', h('span', { class: 'gold' }, `${GM().landIncome(g, bid)}🪙/день`)), kv('Розвиток', `${B.dev}/10`), kv('Укріплення', String(B.fort))));
        w.appendChild(h('div', { class: 'row' }, 'Податки: ', ['Низькі', 'Звичайні', 'Високі'].map((t, i) => h('button', { class: 'btn small' + (L.tax === i ? ' primary' : ''), onclick: () => { L.tax = i; again('main'); } }, t))));
        w.appendChild(h('div', { class: 'muted', style: { fontSize: '12px' } }, 'Високі податки — більше золота, але селяни злі. Нижче 12% лояльності — повстання з вилами. Кожен житель приносить трохи золота, але хоче їсти.'));
        const stItems = Object.entries(L.store);
        w.appendChild(h('h4', null, '📦 Склад баронства'));
        w.appendChild(h('div', { class: 'row', style: { flexWrap: 'wrap', gap: '6px' } }, stItems.length ? stItems.map(([id, n]) => h('span', { class: 'tag' }, `${PL().item(id).icon} ${PL().item(id).name} ×${n}`)) : h('span', { class: 'muted' }, 'Порожньо. Лісопилка й каменоломня наповнять склад.'),
          stItems.length ? h('button', { class: 'btn small primary', onclick: () => { const r = GM().collectLand(g, bid); A().play('coin'); UI().toast('📦 Забрано: ' + Object.entries(r).map(([id, n]) => `${PL().item(id).icon}×${n}`).join(' '), 'good'); again('main'); } }, '📦 Забрати все') : null));
        return w;
      } },
      { id: 'build', label: '🔨 Будівництво', render: () => {
        const I = GM().landInfo(g, bid);
        return h('div', { class: 'col' }, h('div', { class: 'muted' }, `Ділянок зайнято ${I.used}/${I.lots}. Максимальний рівень будівель — ${I.cap}. Розбудова резиденції відкриває більше.`),
          h('div', { class: 'items' }, Object.entries(D().LAND_BUILDINGS).map(([k, Bd]) => { const lvl = L.buildings[k] || 0; const cost = GM().buildCost(g, bid, k); const lock = lvl < Bd.max ? GM().buildLock(g, bid, k) : null;
            return itemElRaw(Bd.icon, `${Bd.name} ${lvl}/${Bd.max}`, `${Bd.desc}${lvl < Bd.max ? ` · ${cost}🪙` : ''}${lock ? ' · 🔒 ' + lock : ''}`, [lvl < Bd.max ? h('button', { class: 'btn small ' + (lock ? 'ghost' : 'primary'), disabled: !!lock || p.gold < cost, onclick: () => { const e = GM().buildOnLand(g, bid, k); if (e) UI().toast(e, 'bad'); else { A().play('clang'); UI().toast(`🔨 ${Bd.name}: рівень ${lvl + 1}!`, 'good'); again('build'); } } }, lvl ? '⬆️' : 'Будувати') : h('span', { class: 'good' }, '✔')]); })));
      } },
      { id: 'people', label: '👥 Жителі', render: () => {
        const I = GM().landInfo(g, bid); const w = h('div', { class: 'col' });
        w.appendChild(h('div', null, `👥 Жителів: ${L.pop} з ${I.housing} місць${I.incoming ? ` · у дорозі ще ${I.incoming}` : ''}.`));
        w.appendChild(h('div', { class: 'muted', style: { fontSize: '13px' } }, 'Щоб розширюватися, шукай поселенців. Їм потрібні житла 🏘️ та їжа 🌾. Якщо лояльність висока, а їжі вдосталь, люди народжуються й приходять самі.'));
        w.appendChild(h('div', { class: 'items' }, D().SETTLER_OFFERS.map((O) => { const cd = Math.max(0, Math.ceil((L.cool[O.id] || 0) - GM().day(g)));
          return itemElRaw(O.icon, O.name, `${O.desc} · +${O.pop[0]}–${O.pop[1]} жителів за ${O.days} дн.${O.gold ? ` · ${O.gold}🪙` : ''}${O.fame ? ` · ${O.fame}⭐` : ''}${cd ? ` · ⏳ ${cd} дн.` : ''}`, [h('button', { class: 'btn small primary', disabled: !!cd, onclick: () => { const e = GM().inviteSettlers(g, bid, O.id); if (e) { UI().toast(e, 'bad'); return; } A().play(O.id === 'lumi' ? 'magic' : 'coin'); UI().toast(O.id === 'lumi' ? '🌸 Люмі: «Окей, відправляю! Тільки не кажи їм про вантажівку.»' : `${O.icon} Поселенці вже в дорозі!`, 'good', 3500); again('people'); } }, 'Запросити')]); })));
        if (L.pop >= I.housing) w.appendChild(h('div', { class: 'bad', style: { fontSize: '13px' } }, '🏘️ Усі житла зайняті — нові поселенці не зможуть оселитися. Будуй житла!'));
        return w;
      } },
    ] });
  }

  // ---------------- Location actions ----------------
  async function gather(prof) {
    const g = G(); const lvl = g.player.professions[prof].lvl;
    const q = prof === 'fishing' ? await ISK.minigames.fishing(lvl) : prof === 'mining' ? await ISK.minigames.mining(lvl) : prof === 'lumber' ? await ISK.minigames.mining(lvl, { title: '🪓 Рубка дерев', hint: 'Клікай / ПРОБІЛ, коли кільце співпаде з золотим. Дерево падає... на когось.' }) : await ISK.minigames.herbs(lvl);
    const res = GM().gatherYield(g, prof, q); GM().passTime(g, 0.25);
    const txt = Object.entries(res.items).map(([id, n]) => `${PL().item(id).icon}${PL().item(id).name} ×${n}`).join(', ');
    UI().toast(txt ? `Здобуто: ${txt}` : 'Нічого не вдалося зібрати. Буває.', txt ? 'good' : 'bad', 4200);
    if (res.ups.length) UI().toast(`${D().PROFESSIONS[prof].icon} ${D().PROFESSIONS[prof].name}: рівень ${res.ups[res.ups.length - 1]} (${PL().profRank(g.player, prof)})!`, 'epic');
    UI().refresh();
  }
  async function explore() {
    const g = G(); const B = GM().here(g).B; GM().passTime(g, 0.3);
    const lm = ISK.world.landmarkAt(g.world, B.cell);
    let keys = lm ? lm.monsters.filter((k) => D().MONSTERS[k]) : Object.entries(D().MONSTERS).filter(([, m]) => m.biome.includes(UI().biomeAt(g.player.location))).map(([k]) => k);
    if (!keys.length) keys = ['slime', 'rabbit'];
    const lvl = Math.max(1, B.danger + Math.floor(Math.random() * 3) - 1); const n = lvl < 3 ? 1 : 1 + Math.floor(Math.random() * 2);
    await ISK.combatUI.run(Array.from({ length: n }, () => ISK.combat.makeEnemy(keys[Math.floor(Math.random() * keys.length)], lvl)), { biome: UI().biomeAt(g.player.location) });
    UI().refresh();
  }
  function talk(B) {
    const g = G(); const npcs = GM().npcsAt(g, B.id);
    UI().modal({ title: `Мешканці ${B.name}`, icon: '💬', size: 'mid', body: () => h('div', { class: 'col' }, npcs.map((n) => h('div', { class: 'item' }, SP().img(SP().npc(n.name + B.id), 48), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${n.icon} ${n.name}`), h('div', { class: 'ds' }, '«' + n.lines[Math.floor(Math.random() * n.lines.length)] + '»')),
      h('div', { class: 'acts' }, h('button', { class: 'btn small', onclick: () => { ISK.story.npcTalk(n.name, n.lines[Math.floor(Math.random() * n.lines.length)], SP().npc(n.name + B.id)); } }, '💬 Говорити'))))) });
  }
  async function attackArmy(id) {
    const g = G(); const a = g.P.armies.find((x) => x.id === id); if (!a) return;
    if (!(await UI().confirm(`Атакувати «${a.name}» (${a.size.toLocaleString('uk')})? Ти вдариш у центр і битимешся з ватажками.`, 'В атаку!', 'Ні'))) return;
    const lvl = Math.max(g.player.level, g.world.baronies[a.node].danger) + 2;
    const pool = a.horde ? ['zombie', 'skeleton', 'ghost', 'troll', 'wolf'] : ['demon', 'imp', 'vampire'];
    const ens = [ISK.combat.makeEnemy(pool[0], lvl + 1, { elite: true, name: a.horde ? 'Ватажок орди' : 'Демон-командир' }), ISK.combat.makeEnemy(pool[1 + Math.floor(Math.random() * (pool.length - 1))], lvl), ISK.combat.makeEnemy(pool[1 + Math.floor(Math.random() * (pool.length - 1))], lvl)];
    UI().cutin(a.horde ? 'ОРДА!' : 'ЛЕГІОН ПІТЬМИ!', 'Битва за Дивосвіт', '#ff5c6c');
    const r = await ISK.combatUI.run(ens, { biome: 'ash', noFlee: true, horde: true });
    if (r === 'win') { const res = GM().hitArmy(g, id, true); UI().alert('Удар по Темряві!', `Ти розбив ${res.killed.toLocaleString('uk')} ворогів! Решта в паніці. +слава`, '🛡️'); }
    UI().refresh();
  }
  function campfire() {
    const p = G().player;
    UI().modal({ title: 'Табір', icon: '🔥', size: 'mid', body: () => h('div', { class: 'col' }, h('div', { class: 'muted' }, 'Відпочинок відновлює 50% здоров\'я та мани (пів дня). Тут же можна готувати.'),
      h('button', { class: 'btn primary', onclick: () => { p.hp = Math.min(PL().maxHp(p), p.hp + Math.round(PL().maxHp(p) * 0.5)); p.mp = Math.min(PL().maxMp(p), p.mp + Math.round(PL().maxMp(p) * 0.5)); UI().showNews(GM().passTime(G(), 0.5)); A().play('heal'); UI().toast('🔥 Ти відпочив біля вогнища. Комарі вдячні.', 'good'); reopen(campfire); } }, '😴 Відпочити'), craftTab('cooking')) });
  }
  function waitDays() {
    UI().modal({ title: 'Чекати', icon: '⏳', size: 'narrow', body: () => h('div', { class: 'col' }, h('div', { class: 'muted' }, 'Світ живе, поки ти чекаєш. Урожай росте, війни йдуть, демони пливуть...'),
      h('div', { class: 'row' }, [1, 3, 7, 30].map((d) => h('button', { class: 'btn', onclick: () => { const news = GM().passTime(G(), d); UI().closeAll(); UI().showNews(news); UI().toast(`⏳ Минуло ${d} дн. Подій у світі: ${news.length}`, ''); UI().refresh(); } }, `${d} дн.`)))) });
  }

  // ---- resource sites ----
  async function gatherSite(bid, i) {
    const g = G(); const B = g.world.baronies[bid]; const st = B.sites[i]; const S2 = D().RESOURCE_SITES[st.key]; const prof = S2.prof; const lvl = (g.player.professions[prof] || { lvl: 1 }).lvl;
    const q = prof === 'fishing' ? await ISK.minigames.fishing(lvl) : prof === 'mining' ? await ISK.minigames.mining(lvl, { title: `${S2.icon} ${S2.name}`, hint: 'Клікай / ПРОБІЛ, коли кільце співпаде з золотим. Родовище багате!' }) : prof === 'lumber' ? await ISK.minigames.mining(lvl, { title: `${S2.icon} ${S2.name}`, hint: S2.verb ? 'Влуч у момент — здобич не втече!' : 'Рубай у ритм!' }) : await ISK.minigames.herbs(lvl);
    const res = GM().gatherSite(g, bid, i, q); GM().passTime(g, 0.25);
    if (!res) { UI().toast('Родовище виснажене.', 'bad'); return; }
    const txt = Object.entries(res.items).map(([id, n]) => `${PL().item(id).icon}${PL().item(id).name} ×${n}`).join(', ');
    UI().toast(`${S2.icon} ${S2.name}: ${txt || 'нічого'}`, 'good', 4600);
    if (res.ups.length) UI().toast(`${D().PROFESSIONS[prof].icon} ${D().PROFESSIONS[prof].name}: рівень ${res.ups[res.ups.length - 1]}!`, 'epic');
    UI().refresh();
  }
  // ---- v5.2: угіддя в природі ----
  function spotsNear(bid) {
    const g = G(), w = g.world; const edges = (w.graph['b:' + bid] || []).filter((e) => e.to[0] === 'r');
    UI().modal({ title: 'Угіддя поруч', icon: '🧺', sub: 'Ресурси тепер збирають у природі: йди стежкою до лісу, шахти, лугу чи озера.', size: 'mid', body: () => h('div', { class: 'items' }, edges.map((e) => {
      const Rn = w.rnodes[+e.to.slice(2)], S2 = D().RESOURCE_SITES[Rn.key], left = GM().rnodeLeft(g, Rn.id); const days = GM().legDays(e, g.player);
      return h('div', { class: 'item' }, h('div', { class: 'ic' }, S2.icon), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${S2.name} · запас ${left}/${Rn.rich}`), h('div', { class: 'ds' }, `${S2.mats.map((m) => PL().item(m[0]).icon + ' ' + PL().item(m[0]).name).join(', ')} · ~${days < 1 ? Math.max(1, Math.round(days * 24)) + ' год.' : days.toFixed(1) + ' дн.'} стежкою`)),
        h('div', { class: 'acts' }, h('button', { class: 'btn small primary', onclick: () => { UI().closeAll(); g.discovered[e.to] = 1; UI().startTravel(e.to); } }, '🚶 Іти')));
    })) });
  }
  async function gatherNode(rid) {
    const g = G(); const Rn = g.world.rnodes[rid]; const S2 = D().RESOURCE_SITES[Rn.key]; const prof = S2.prof; const lvl = (g.player.professions[prof] || { lvl: 1 }).lvl;
    const q = prof === 'fishing' ? await ISK.minigames.fishing(lvl) : prof === 'mining' ? await ISK.minigames.mining(lvl, { title: `${S2.icon} ${S2.name}`, hint: 'Клікай / ПРОБІЛ, коли кільце співпаде з золотим. Жила багата!' }) : prof === 'lumber' ? await ISK.minigames.mining(lvl, { title: `${S2.icon} ${S2.name}`, hint: S2.verb ? 'Влуч у момент — здобич не втече!' : 'Рубай у ритм! Дерево падає... на когось.' }) : await ISK.minigames.herbs(lvl);
    const res = GM().gatherRnode(g, rid, q); GM().passTime(g, 0.25);
    if (!res) { UI().toast('Виснажено. Повертайся за кілька днів.', 'bad'); return; }
    const txt = Object.entries(res.items).map(([id, n]) => `${PL().item(id).icon}${PL().item(id).name} ×${n}`).join(', ');
    UI().toast(`${S2.icon} ${S2.name}: ${txt || 'нічого'}`, txt ? 'good' : 'bad', 4600);
    if (res.ups.length) UI().toast(`${D().PROFESSIONS[prof].icon} ${D().PROFESSIONS[prof].name}: рівень ${res.ups[res.ups.length - 1]}!`, 'epic');
    UI().refresh();
  }
  // ---- v5.2: картограф і мапи різних тирів ----
  function mapPreview(g, tier, B) {
    const cv = document.createElement('canvas'); cv.width = 240; cv.height = 160; cv.className = 'map-preview';
    const W = ISK.world.W, S = ISK.render.S; const cells = GM().mapCells(g, tier, B);
    let x0 = W, y0 = 1e9, x1 = 0, y1 = 0; for (const i of cells) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const pad = 3; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(ISK.world.H - 1, y1 + pad);
    let bw = x1 - x0 + 1, bh = y1 - y0 + 1; const ar = cv.width / cv.height; if (bw / bh > ar) { const nh = bw / ar; y0 = Math.max(0, y0 - (nh - bh) / 2); bh = nh; } else { const nw = bh * ar; x0 = Math.max(0, x0 - (nw - bw) / 2); bw = nw; }
    const q = cv.getContext('2d'); const w = g.world, T = ISK.world.T;
    const inSet = new Uint8Array(W * ISK.world.H); for (const i of cells) inSet[i] = 1;
    // схематична мапа на пергаменті: що вищий тир — то більше деталей
    const mk = document.createElement('canvas'); mk.width = Math.max(1, Math.ceil(bw)); mk.height = Math.max(1, Math.ceil(bh)); const mg = mk.getContext('2d'); const img = mg.createImageData(mk.width, mk.height); const dd = img.data;
    const land = (c) => c >= 0 && ISK.world.isLand(w.terrain[c]);
    for (let y = 0; y < mk.height; y++) for (let x = 0; x < mk.width; x++) {
      const cx = Math.floor(x0 + x), cy = Math.floor(y0 + y), o = (y * mk.width + x) * 4; const c = cx < W && cy < ISK.world.H ? cy * W + cx : -1;
      let col = [222, 204, 160];
      if (c >= 0) {
        const t = w.terrain[c], L = land(c);
        if (!L) col = tier >= 3 ? [196, 196, 170] : [208, 190, 146];
        else if (tier >= 3 && (t === T.MOUNTAIN || t === T.PEAK)) col = [176, 150, 108]; else if (tier >= 3 && (t === T.FOREST || t === T.JUNGLE)) col = [190, 192, 140]; else if (tier >= 3 && t === T.DESERT) col = [236, 214, 160]; else if (tier >= 3 && t === T.SWAMP) col = [170, 178, 140]; else col = [232, 214, 170];
        if (L && (!land(c - 1) || !land(c + 1) || !land(c - W) || !land(c + W))) col = [110, 76, 40];
        if (tier >= 2 && w.river[c] && L) col = [130, 150, 160];
        if (!inSet[c]) col = [col[0] * 0.25 + 216 * 0.75, col[1] * 0.25 + 198 * 0.75, col[2] * 0.25 + 152 * 0.75];
      }
      dd[o] = col[0]; dd[o + 1] = col[1]; dd[o + 2] = col[2]; dd[o + 3] = 255;
    }
    mg.putImageData(img, 0, 0); q.imageSmoothingEnabled = false; q.drawImage(mk, 0, 0, cv.width, cv.height);
    const kx = cv.width / bw, ky = cv.height / bh; const at = (o) => [(o.x - x0 + 0.5) * kx, (o.y - y0 + 0.5) * ky];
    q.lineCap = 'round';
    if (tier >= 2) for (const r of w.roads) { if (!inSet[r.a !== undefined ? w.baronies[r.a].cell : 0] && !inSet[w.baronies[r.b].cell]) continue; q.strokeStyle = 'rgba(120,70,30,.75)'; q.lineWidth = r.major ? 1.6 : 1; q.setLineDash(r.major ? [] : [3, 2]); q.beginPath(); r.path.forEach((c, k) => { const p0 = at({ x: c % W, y: (c / W) | 0 }); k ? q.lineTo(p0[0], p0[1]) : q.moveTo(p0[0], p0[1]); }); q.stroke(); }
    q.setLineDash([]);
    if (tier >= 3) { q.fillStyle = 'rgba(90,60,30,.7)'; q.font = `${Math.max(7, Math.min(11, kx * 1.6))}px serif`; q.textAlign = 'center'; q.textBaseline = 'middle'; for (let k = 0; k < cells.length; k += Math.max(1, Math.floor(cells.length / 260))) { const c = cells[k]; const t = w.terrain[c]; if ((c * 7919) % 5) continue; const p0 = at({ x: c % W, y: (c / W) | 0 }); if (t === T.MOUNTAIN || t === T.PEAK) q.fillText('▲', p0[0], p0[1]); else if (t === T.FOREST || t === T.JUNGLE) q.fillText('♣', p0[0], p0[1]); } }
    // кракелюр і рамка «пергамент»
    q.strokeStyle = 'rgba(90,60,30,.25)'; q.lineWidth = 1; for (let i = 0; i < 8; i++) { q.beginPath(); const sx = (i * 53) % cv.width, sy = (i * 37) % cv.height; q.moveTo(sx, sy); q.lineTo(sx + 30 - (i % 3) * 20, sy + 18); q.stroke(); }
    const vg = q.createRadialGradient(cv.width / 2, cv.height / 2, cv.height * 0.3, cv.width / 2, cv.height / 2, cv.width * 0.65); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(80,50,20,.45)'); q.fillStyle = vg; q.fillRect(0, 0, cv.width, cv.height);
    q.textAlign = 'center'; q.textBaseline = 'middle';
    if (tier >= 2) for (const Bb of w.baronies) if (inSet[Bb.cell]) { const [x, y] = at(Bb); const big = ['capital', 'city'].includes(Bb.type); q.fillStyle = '#3a200c'; q.beginPath(); q.arc(x, y, big ? 3 : 1.6, 0, 7); q.fill(); if (big && tier >= 3) { q.font = 'italic 9px Georgia, serif'; q.fillText(Bb.name, x, y - 7); } }
    if (tier >= 3) { q.font = '9px "Segoe UI Emoji", sans-serif'; for (const Dg of w.dungeons) if (inSet[Dg.cell]) { const [x, y] = at(Dg); q.fillStyle = '#7a1a10'; q.fillText('☠', x, y); } }
    if (tier >= 4) for (const Rn of w.rnodes) if (inSet[Rn.cell]) { const [x, y] = at(Rn); q.fillStyle = '#2a5a20'; q.fillRect(x - 1, y - 1, 2, 2); }
    // троянда вітрів
    q.save(); q.translate(cv.width - 24, cv.height - 24); q.strokeStyle = '#5a3a18'; q.fillStyle = '#5a3a18'; q.lineWidth = 1; q.beginPath(); q.arc(0, 0, 9, 0, 7); q.stroke(); for (let a = 0; a < 4; a++) { q.rotate(Math.PI / 2); q.beginPath(); q.moveTo(0, -13); q.lineTo(3, 0); q.lineTo(-3, 0); q.fill(); } q.restore();
    q.strokeStyle = '#5a3a18'; q.lineWidth = 4; q.strokeRect(2, 2, cv.width - 4, cv.height - 4); q.strokeStyle = '#a07a40'; q.lineWidth = 1; q.strokeRect(7, 7, cv.width - 14, cv.height - 14);
    const [mx, my] = at(B); q.fillStyle = '#c0302a'; q.font = 'bold 15px sans-serif'; q.fillText('✕', mx, my);
    return cv;
  }
  function cartographer(bid) {
    const g = G(), B = g.world.baronies[bid];
    UI().modal({ title: `Картограф ${B.name}`, icon: '🗺️', sub: '«Мапи! Свіжі мапи! Майже без помилок!» Купленe відкривається на мапі як умовна мапа; на власні очі побачиш, коли дійдеш.', size: 'wide', body: () => h('div', { class: 'map-tiers' }, GM().MAP_TIERS.map((T0) => {
      const own = GM().mapOwned(g, T0.id, B); const cost = Math.round(T0.price * GM().priceMod(g, B));
      return h('div', { class: 'map-tier' + (own ? ' owned' : '') }, mapPreview(g, T0.id, B), h('div', { class: 'nm' }, `${T0.icon} Тир ${T0.id}: ${T0.name}`), h('div', { class: 'ds' }, T0.desc),
        h('button', { class: 'btn ' + (own ? 'ghost' : 'primary'), disabled: own, onclick: () => { const r = GM().buyMap(g, T0.id, B); if (!r.ok) { UI().toast(r.msg, 'bad'); return; } A().play('coin'); UI().toast(`${T0.icon} Мапу куплено! -${r.cost}🪙 · на мапі з'явилося ${r.n} нових клітинок`, 'good', 4200); reopen(() => cartographer(bid)); } }, own ? '✔️ Уже є' : `Купити · ${cost}🪙`));
    })) });
  }
  function worldMap() {
    const g = G(); if (!g) return; let political = false;
    const cv = document.createElement('canvas'); const W = ISK.world.W, H = ISK.world.H; const vw = Math.min(window.innerWidth - 120, 1400, (window.innerHeight - 230) * W / H); cv.width = Math.round(vw); cv.height = Math.round(vw * H / W); cv.className = 'world-map-cv';
    // v5.8: коліщатко — наблизити/віддалити, перетягування — зсунути, клік — показати це місце на мапі
    const view = { z: 1, ox: 0, oy: 0 }; const clampV = () => { const mw = cv.width / view.z, mh = cv.height / view.z; view.ox = Math.max(0, Math.min(cv.width - mw, view.ox)); view.oy = Math.max(0, Math.min(cv.height - mh, view.oy)); };
    { const hp = ISK.world.nodeXY(g.world, g.player.location); view.z = 2.5; view.ox = (hp.x + 0.5) / W * cv.width - cv.width / view.z / 2; view.oy = (hp.y + 0.5) / H * cv.height - cv.height / view.z / 2; clampV(); }
    let raf = 0; const loop = () => { if (!cv.isConnected) { cancelAnimationFrame(raf); return; } ISK.render.drawWorldMap(cv, { political, view }); raf = requestAnimationFrame(loop); };
    const known = g.fog ? Math.round(g.fog.reduce((a, v) => a + (v === 2 ? 1 : 0), 0) / g.fog.length * 1000) / 10 : 100;
    const toCv = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    cv.addEventListener('wheel', (e) => { e.preventDefault(); const [mx, my] = toCv(e); const wx = view.ox + mx / view.z, wy = view.oy + my / view.z; view.z = Math.max(1, Math.min(12, view.z * (e.deltaY < 0 ? 1.18 : 0.85))); view.ox = wx - mx / view.z; view.oy = wy - my / view.z; clampV(); }, { passive: false });
    let drag = null; cv.addEventListener('mousedown', (e) => { if (e.button !== 0) return; const [mx, my] = toCv(e); drag = { mx, my, ox: view.ox, oy: view.oy, moved: false }; cv.style.cursor = 'grabbing'; });
    const mm = (e) => { if (!drag) return; const [mx, my] = toCv(e); const dx = mx - drag.mx, dy = my - drag.my; if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true; view.ox = drag.ox - dx / view.z; view.oy = drag.oy - dy / view.z; clampV(); };
    const mu = (e) => { if (!drag) return; const d = drag; drag = null; cv.style.cursor = ''; if (d.moved || !cv.isConnected) return; const [mx, my] = toCv(e); const k = (W * ISK.render.S) / cv.width; ISK.render.lookAt((view.ox + mx / view.z) * k, (view.oy + my / view.z) * k); UI().closeAll(); };
    window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
    const zbtn = (lbl, f) => h('button', { class: 'btn small', onclick: () => { const cx = view.ox + cv.width / view.z / 2, cy = view.oy + cv.height / view.z / 2; view.z = Math.max(1, Math.min(12, view.z * f)); view.ox = cx - cv.width / view.z / 2; view.oy = cy - cv.height / view.z / 2; clampV(); } }, lbl);
    UI().modal({ title: 'Мапа Дивосвіту', icon: '🗺️', sub: `Досліджено власними очима: ${known}% світу · коліщатко — масштаб, тягни — зсунути, клік — глянути туди`, size: 'full', onClose: () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); },
      body: () => h('div', { class: 'col' }, h('div', { class: 'row' }, h('button', { class: 'btn small', onclick: (e) => { political = !political; e.target.textContent = political ? '🏔️ Рельєф' : '👑 Королівства'; } }, '👑 Королівства'), zbtn('➕', 1.5), zbtn('➖', 1 / 1.5), h('button', { class: 'btn small', onclick: () => { view.z = 1; view.ox = 0; view.oy = 0; } }, '🌍 Увесь світ'), h('span', { class: 'muted' }, '🟫 умовна (куплена) · ⬛ невідомо · кольорові кола — монстри поруч')), cv) });
    loop();
  }
  // ---- NPC heroes ----
  const heroBy = (id) => (G().P.heroes || []).find((x) => x.id === id);
  function heroTalk(id) {
    const hh = heroBy(id); if (!hh) return;
    ISK.voice.say(hh.name, ISK.heroes.line(hh), hh.female ? 'f' : 'm');
    UI().alert(`${hh.icon} ${hh.name}`, `«${ISK.heroes.line(hh)}»\n\nРівень ${hh.lvl} · ${D().CLASSES[hh.cls].name} · зачищено підземель: ${hh.cleared} · переможено ворогів: ${hh.kills}${hh.rel ? `\nСтавлення до тебе: ${'❤️'.repeat(Math.min(5, hh.rel))}` : ''}`, hh.icon);
  }
  async function heroSpar(id) {
    const hh = heroBy(id); if (!hh) return;
    if (!(await UI().confirm(`Дружній спаринг з ${hh.name} (рів. ${hh.lvl})? Смерті не буде — тільки сором.`, 'В бій!', 'Ні'))) return;
    const e = ISK.combat.makeEnemy('soldier', hh.lvl, { elite: true, name: hh.name, icon: hh.icon }); e.drops = []; e.gold = 0;
    const r = await ISK.combatUI.run([e], { biome: UI().biomeAt(G().player.location), noFlee: true, noDeath: true, xpMul: 0.5 });
    if (r === 'win') { hh.rel = (hh.rel || 0) + 1; PL().addFame(G().player, 5 + hh.lvl); UI().toast(`🏅 ${hh.name}: «Непогано! Ти справжній герой.» +${5 + hh.lvl}⭐ · повага ↑`, 'epic', 5000); }
    else UI().toast(`${hh.name}: «Тренуйся ще. Я почекаю... в таверні.»`, 'bad');
    UI().refresh();
  }
  function heroRecruit(id) {
    const e = GM().recruitHero(G(), id);
    if (e) UI().toast(e, 'bad'); else { A().play('win'); UI().cutin('ГЕРОЙ У ЗАГОНІ!', heroBy(id).name, '#ffd36e'); UI().refresh(); }
  }
  // ---- cheat menu (testing) ----
  function cheats() {
    const g = G(); if (!g) return; const p = g.player;
    const btn = (label, fn) => h('button', { class: 'btn small', onclick: () => { fn(); A().play('magic'); UI().toast('🧪 ' + label, 'epic', 2000); UI().refresh(); } }, label);
    const giveAll = (filter, n) => { for (const [k, m] of Object.entries(D().MATERIALS)) if (filter(m)) PL().addItem(p, k, n); };
    UI().modal({ title: 'Чіт-меню розробника', icon: '🧪', size: 'mid', sub: 'Тільки для тестування! Богиня нічого не бачила.', body: () => h('div', { class: 'col' },
      h('h4', null, 'Персонаж'),
      h('div', { class: 'row', style: { flexWrap: 'wrap', gap: '6px' } },
        btn('+10 000 🪙', () => { p.gold += 10000; }), btn('+1 рівень', () => PL().addXp(p, PL().xpNeed(p.level))), btn('+10 рівнів', () => { for (let i = 0; i < 10; i++) PL().addXp(p, PL().xpNeed(p.level)); }),
        btn('+5 рівнів класу', () => { if (!p.classes.primary) { p.classes.primary = 'swordsman'; p.classXp.swordsman = { lvl: 1, xp: 0, sp: 0 }; } for (let i = 0; i < 5; i++) PL().addClassXp(p, PL().classXpNeed(p.classXp[p.classes.primary].lvl)); }),
        btn('+1000 ⭐ слави', () => PL().addFame(p, 1000)), btn('Повне зцілення', () => { p.hp = PL().maxHp(p); p.mp = PL().maxMp(p); }),
        btn(p.flags.godMode ? 'Безсмертя: ВИМК' : 'Безсмертя: УВІМК', () => { p.flags.godMode = !p.flags.godMode; }),
        btn('Ранг гільдії +1', () => { p.guild.registered = true; p.guild.rank = Math.min(D().GUILD_RANKS.length - 1, p.guild.rank + 1); p.guild.points = D().GUILD_RANKS[p.guild.rank].pts; }),
        btn('Соц. титул +1', () => { p.social = Math.min(D().SOCIAL.length - 1, p.social + 1); }), btn('Професії +5', () => { for (const k of Object.keys(p.professions)) p.professions[k].lvl = Math.min(30, p.professions[k].lvl + 5); })),
      h('h4', null, 'Предмети'),
      h('div', { class: 'row', style: { flexWrap: 'wrap', gap: '6px' } },
        btn('Усі руди ×20', () => giveAll((m) => m.kind === 'ore', 20)), btn('Трави ×20', () => giveAll((m) => m.kind === 'herb', 20)), btn('Будматеріали ×30', () => giveAll((m) => m.kind === 'build', 30)),
        btn('Трофеї монстрів ×10', () => giveAll((m) => m.kind === 'drop', 10)), btn('Легендарка', () => PL().addItem(p, D().randomGear(p.level, 3))), btn('Міфічна річ', () => PL().addItem(p, D().randomGear(p.level, 4))),
        btn('Усі унікальні', () => D().UNIQUES.forEach((u) => PL().addItem(p, u.id))), btn('Зілля ×10', () => { for (const k of ['potion_l', 'ether_l', 'phoenix', 'scroll_haste', 'elixir_str']) PL().addItem(p, k, 10); }),
        btn('Драконяче яйце', () => PL().addItem(p, 'dragon_egg')), btn('Корабель і грифон', () => { p.ship = true; if (!p.mounts.includes('griffin')) p.mounts.push('griffin'); p.mount = 'griffin'; })),
      h('h4', null, 'Світ'),
      h('div', { class: 'row', style: { flexWrap: 'wrap', gap: '6px' } },
        btn('Відкрити всю мапу', () => { GM().revealAll(g, 2); p.flags.relicsRevealed = true; }),
        btn('+30 днів', () => UI().showNews(GM().passTime(g, 30))), btn('+1 рік', () => UI().showNews(GM().passTime(g, 360))),
        btn('Орда поруч', () => { const B = GM().here(g).B || g.world.baronies[0]; ISK.politics.spawnDemonArmy(g.world, g.P, Math.floor(g.time), null, { size: 3000, node: B.id, name: 'Тестова орда', horde: true, icon: '🧟' }); }),
        btn('Війна (випадкова)', () => { const al = g.P.realms.filter((r) => !r.dead && !ISK.politics.isDemon(g.P, r.id)); const a = al[Math.floor(Math.random() * al.length)], b = al[Math.floor(Math.random() * al.length)]; if (a !== b) ISK.politics.declareWar(g.world, g.P, a.id, b.id, Math.floor(g.time), new ISK.RNG(Date.now() >>> 0), 'Чіт-меню сказало'); }),
        btn('3 Осколки Печаті', () => { p.relics = 3; p.flags.relicsRevealed = true; }),
        btn('Телепорт у столицю', () => { const cap = g.world.realms[g.world.empireId].capital; p.location = 'b:' + cap; GM().discoverAround(g); ISK.render.centerOn(p.location); }),
        btn('Новий герой', () => { const hh = ISK.heroes.makeHero(g.world, g.P, new ISK.RNG(Date.now() >>> 0)); hh.node = +p.location.slice(2); g.P.heroes.push(hh); })),
      h('div', { class: 'muted', style: { fontSize: '12px' } }, 'Порада: пробіл — пауза/хід часу, +/− — швидкість часу, F — до героя.')) });
  }

  ISK.panels = { spotsNear, gatherNode, cartographer, worldMap, gatherSite, heroTalk, heroSpar, heroRecruit, cheats, gearTab, open, openService, gather, explore, talk, attackArmy, campfire, waitDays, save, load, autosave, slotInfo, itemEl, chooseClass, guild, store, cooking, settings, loadDialog, help, character, inventory, quests, realms, party, achievements, house, land, skills };
})();
