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
    if (it.desc) parts.push(it.desc);
    return parts.filter(Boolean).join(' · ');
  }
  function itemEl(id, count, acts, extra) {
    const it = PL().item(id); if (!it) return h('div');
    return h('div', { class: 'item r' + (it.rarity || 0) }, h('div', { class: 'ic' }, it.icon), h('div', { style: { minWidth: 0 } }, h('div', { class: 'nm' }, it.name), h('div', { class: 'ds' }, extra || itemDesc(it))), count > 1 ? h('div', { class: 'cnt' }, '×' + count) : null, acts && acts.length ? h('div', { class: 'acts' }, acts) : null);
  }

  function open(name) { if (UI().modalStack.length) UI().closeAll(); ({ character, inventory, skills, professions, quests, realms, chronicle, system, party, achievements }[name] || (() => {}))(); }

  // ---------------- Character ----------------
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
        eq.appendChild(h('div', { class: 'slot r' + (it ? it.rarity || 0 : 0), title: it ? `${it.name}\n${itemDesc(it)}` : PL().SLOT_NAMES[slot] }, h('div', { class: 'sl' }, PL().SLOT_NAMES[slot]), h('div', { class: 'si' }, it ? it.icon : '—'), h('div', { class: 'sn' }, it ? it.name : ''),
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
        if (L >= 10 && !cx.adv) {
          wrap.appendChild(h('div', { class: 'quest main' }, h('div', { class: 't' }, '⬆️ Підвищення класу доступне!'), h('div', { class: 'd' }, 'Обери шлях розвитку. Це назавжди (ну, до перереєстрації в іншому світі).'),
            h('div', { class: 'choice-grid' }, C.adv.map((a) => h('div', { class: 'choice', onclick: async () => { if (!(await UI().confirm(`Стати «${a.name}»?\n${a.desc}`))) return; cx.adv = a.id; A().play('level'); UI().cutin(a.name.toUpperCase(), 'Нове підвищення класу!', '#b77bff'); reopen(skills); } },
              h('div', { class: 'ic' }, a.icon), h('div', { class: 'nm' }, a.name), h('div', { class: 'ds' }, a.desc), h('div', { class: 'ds', style: { color: 'var(--cyan)' } }, a.skills.map((s) => s.icon + ' ' + s.name).join(', ')))))));
        }
        const grid = h('div', { class: 'items' });
        for (const sk of D().allSkillsOf(c)) {
          if (sk.adv && cx.adv && sk.adv !== cx.adv) continue;
          if (sk.adv && !cx.adv) continue;
          const ok = sk.lvl <= L && (!sk.ascend || cx.ascended); const r = PL().skillRank(p, sk.id); const rs = PL().rankSkill(sk, r);
          grid.appendChild(h('div', { class: 'item', style: { opacity: ok ? 1 : 0.45 } }, h('div', { class: 'ic' }, sk.icon),
            h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${sk.name}${ok ? ` ★${r}` : sk.ascend ? ' 🔒 вознесіння' : ` 🔒 рів. ${sk.lvl}`}`), h('div', { class: 'ds' }, `🔷${rs.mp}${sk.cd ? ` · ⏱${sk.cd}` : ''}${rs.power ? ` · сила ×${rs.power.toFixed(2)}` : ''} · ${sk.desc}`)),
            ok && r < 5 ? h('div', { class: 'acts' }, h('button', { class: 'btn small primary', disabled: !cx.sp, onclick: () => { PL().upgradeSkill(p, c, sk.id); A().play('magic'); reopen(skills); } }, '⬆ ранг')) : null));
        }
        wrap.appendChild(grid);
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
          h('div', { class: 'k' }, 'Союзники'), h('div', null, st.alliances.length ? st.alliances.map((a) => h('span', { class: 'tag ally', style: { marginRight: '4px' } }, w.realms[a].name)) : '—'),
          h('div', { class: 'k' }, 'Війни'), h('div', null, wars.length ? wars.map((x) => h('span', { class: 'tag war', style: { marginRight: '4px' } }, x.name)) : R.isDemon ? 'з усім світом' : 'мир'))));
    };
    UI().modal({ title: 'Держави Дивосвіту', icon: '👑', tabs: [
      { id: 'empire', label: '🏛️ Імперія', render: () => { const E = w.realms.find((r) => r.isEmpire); const list = [E, ...w.realms.filter((r) => r.liege === E.id)]; return h('div', null, h('div', { class: 'muted', style: { marginBottom: '8px' } }, `Імперія та її ${list.length - 1} васальних королівств діють як блок: разом воюють і разом обороняються. Васали можуть повстати за незалежність.`), list.map((r) => card(P.realms[r.id]))); } },
      { id: 'list', label: '👑 Королівства', render: () => h('div', null, w.realms.filter((r) => !r.isEmpire && r.liege < 0 && !r.isDemon).map((r) => card(P.realms[r.id]))) },
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
      w.appendChild(h('h4', null, `Товариші (${p.party.length}/2)`));
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
      '🗺️ Мапа: WASD/стрілки — рух, Q/E або коліщатко — масштаб, мінімапа — швидкий перехід. Клік — інфо, подвійний клік — подорож.',
      '🏳️ Регіони видно завжди: тонкі лінії — графства, світліші — герцогства, кольорові — королівства, золотий пунктир — кордон Імперії. Режими 1–4: рельєф, політична, де-юре, небезпека.',
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
      h('div', { class: 'field' }, h('label', null, 'Озвучка діалогів'), h('select', { onchange: (e) => ISK.voice.setMode(e.target.value) }, [['blip', 'Аніме-голоси (бурмотіння)'], ['tts', `Системний голос (укр.)${ISK.voice.hasTTS() ? '' : ' — не встановлено'}`], ['off', 'Вимкнено']].map(([v, l]) => h('option', { value: v, selected: V.mode === v ? true : null }, l)))),
      h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: !!UI().fastTravel, onchange: (e) => { UI().fastTravel = e.target.checked; } }), 'Швидка анімація подорожей'),
      h('div', { class: 'muted', style: { fontSize: '12px' } }, 'F11 — повноекранний режим. Оновлення гри перевіряються автоматично з GitHub.')) });
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
    ] });
  }
  function classTab() {
    const p = G().player; const w = h('div');
    w.appendChild(h('div', { class: 'muted', style: { marginBottom: '8px' } }, p.level >= 15 && !p.classes.secondary ? 'Ти досяг 15 рівня — можеш опанувати другий клас!' : `Основний клас: ${D().CLASSES[p.classes.primary].name}. Другий клас — з 15 рівня. Підвищення класу — у вікні навичок (K) з 10 рівня класу.`));
    if (p.level >= 15 && !p.classes.secondary) w.appendChild(h('div', { class: 'choice-grid' }, Object.entries(D().CLASSES).filter(([k]) => k !== p.classes.primary).map(([k, C]) => h('div', { class: 'choice', onclick: async () => { if (await UI().confirm(`Обрати другий клас: ${C.name}? (500 🪙)`)) { if (p.gold < 500) return UI().toast('Недостатньо золота', 'bad'); p.gold -= 500; p.classes.secondary = k; p.classXp[k] = p.classXp[k] || { lvl: 1, xp: 0, sp: 0 }; UI().closeAll(); UI().cutin(C.name.toUpperCase(), 'Другий клас!', '#7cd6ff'); } } }, h('div', { class: 'ic' }, C.icon), h('div', { class: 'nm' }, C.name), h('div', { class: 'ds' }, C.desc)))));
    return w;
  }
  function chooseClass(B) {
    const p = G().player;
    UI().modal({ title: 'Обери бойову професію', icon: '⚔️', sub: 'Мірра: «Обирайте уважно! З 10 рівня класу — підвищення, з 20 — вознесіння.»', body: () => h('div', { class: 'choice-grid' }, Object.entries(D().CLASSES).map(([k, C]) => h('div', { class: 'choice', onclick: async () => {
      if (!(await UI().confirm(`${C.icon} ${C.name}: ${C.desc}\n\nПідвищення: ${C.adv.map((a) => a.name).join(' або ')}.\nВознесіння: ${C.ascend.name}.\n\nОбрати?`))) return;
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
        const w = h('div', { class: 'col' }, h('div', { class: 'muted' }, `Товариші б\'ються поруч і ростуть у рівнях. Щоденна платня. Загін: ${p.party.length}/2.`));
        for (const c of GM().hireOptions(g, B.id)) w.appendChild(h('div', { class: 'item' }, SP().img(SP().forCompanion(c), 44), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${c.name} — ${c.roleName}, рів. ${c.lvl}`), h('div', { class: 'ds' }, `${c.traitName}: «${c.line}» · платня ${Math.round(c.wage * (p.cheat === 'harem' ? 0.5 : 1))}🪙/день`)),
          h('div', { class: 'acts' }, h('button', { class: 'btn small primary', onclick: () => { const e = GM().hire(g, c); if (e) UI().toast(e, 'bad'); else { A().play('coin'); UI().toast(`🤝 ${c.name} приєднується до загону!`, 'epic'); reopen(() => tavern(B)); } } }, `Найняти ${Math.round(c.fee * (p.cheat === 'harem' ? 0.5 : 1))}🪙`))));
        return w;
      } },
    ] });
  }

  function store(B, kind) {
    const g = G(), p = g.player; const titles = { shop: ['Крамниця', '🛒'], smith: ['Кузня', '⚒️'], alchemist: ['Лавка алхіміка', '⚗️'], market: ['Ринок', '🏪'], magic: ['Лавка магії', '🔮'] };
    const mod = GM().priceMod(g, B);
    const tabs = [
      { id: 'buy', label: '🛍️ Купити', render: () => { const list = h('div', { class: 'items' }); for (const id of GM().shopStock(g, B, kind)) { const price = PL().buyPrice(p, id, mod); list.appendChild(itemEl(id, 1, [h('button', { class: 'btn small primary', disabled: p.gold < price, onclick: () => { p.gold -= price; PL().addItem(p, id); A().play('coin'); UI().toast(`Куплено: ${PL().item(id).name}`, 'good'); UI().refresh(); reopen(() => store(B, kind)); } }, `${price} 🪙`)])); } return list; } },
      { id: 'sell', label: '💰 Продати', render: () => { const list = h('div', { class: 'items' }); const ents = Object.entries(p.inventory).filter(([id]) => { const it = PL().item(id); return it && it.price > 0; }); for (const [id, n] of ents) { const price = PL().sellPrice(p, id); list.appendChild(itemEl(id, n, [h('button', { class: 'btn small', onclick: () => { PL().removeItem(p, id); p.gold += price; A().play('coin'); reopen(() => store(B, kind)); setTimeout(() => document.querySelector('.tabs button[data-id="sell"]')?.click(), 10); } }, `+${price}`), n > 1 ? h('button', { class: 'btn small ghost', onclick: () => { PL().removeItem(p, id, n); p.gold += price * n; A().play('coin'); reopen(() => store(B, kind)); setTimeout(() => document.querySelector('.tabs button[data-id="sell"]')?.click(), 10); } }, `усі +${price * n}`) : null])); } if (!ents.length) list.appendChild(h('div', { class: 'muted' }, 'Нічого продати.')); return list; } },
    ];
    if (kind === 'smith') tabs.push({ id: 'forge', label: '🔥 Кувати', render: forgeTab });
    if (kind === 'alchemist') tabs.push({ id: 'brew', label: '🧪 Варити', render: () => craftTab('alchemy') });
    if (kind === 'magic') tabs.push({ id: 'scribe', label: '📜 Писати сувої', render: () => craftTab('scribing') });
    UI().modal({ title: titles[kind][0], icon: titles[kind][1], sub: `${B.name} · 🪙 ${Math.floor(p.gold)}${mod > 1.05 ? ' · воєнні ціни!' : mod < 1 ? ' · знижка за репутацію/титул' : ''}`, tabs });
  }
  function forgeTab() {
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
      const ok = GM().canCraft(p, r) && lvl >= r.lvl; const needs = Object.entries(r.needs).map(([id, n]) => `${D().MATERIALS[id].icon}${p.inventory[id] || 0}/${n}`).join(' ');
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
        if (cx.lvl >= 20 && !cx.ascended) w.appendChild(h('div', { class: 'quest main' }, h('div', { class: 't' }, `🌟 Вознесіння: ${C.ascend.name}`), h('div', { class: 'd' }, `Ритуал вознесіння: 3000🪙 і 800⭐ слави. Дає +4 до всіх характеристик і навичку «${C.ascend.skill.name}».`),
          h('button', { class: 'btn primary', disabled: p.gold < 3000 || p.fame < 800, onclick: () => { p.gold -= 3000; cx.ascended = true; A().play('win'); UI().closeAll(); UI().cutin(C.ascend.name.toUpperCase(), 'ВОЗНЕСІННЯ!', '#fff6a0'); UI().sparkle(innerWidth / 2, innerHeight / 2, 40); } }, '🌟 Вознестися')));
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
        w.appendChild(h('div', { class: 'row' }, H.upgrades.bed ? h('button', { class: 'btn primary', onclick: () => { p.hp = PL().maxHp(p); p.mp = PL().maxMp(p); for (const c of p.party) c.hp = undefined; UI().showNews(GM().passTime(g, 1)); autosave(); A().play('heal'); UI().toast('😴 Найкращий сон — удома. (Автозбереження)', 'good'); } }, '🛏️ Спати') : null,
          H.upgrades.kitchen ? h('button', { class: 'btn', onclick: () => { UI().closeAll(); cooking(); } }, '🍳 Кухня') : null,
          H.upgrades.lab ? h('button', { class: 'btn', onclick: () => { UI().closeAll(); UI().modal({ title: 'Лабораторія', icon: '⚗️', tabs: [{ id: 'a', label: '⚗️ Алхімія', render: () => craftTab('alchemy') }, { id: 's', label: '📜 Сувої', render: () => craftTab('scribing') }] }); } }, '⚗️ Лабораторія') : null,
          H.upgrades.forge ? h('button', { class: 'btn', onclick: () => { UI().closeAll(); UI().modal({ title: 'Домашня кузня', icon: '⚒️', body: forgeTab }); } }, '⚒️ Кузня') : null,
          H.upgrades.incubator && PL().hasItem(p, 'dragon_egg') ? h('button', { class: 'btn pink', onclick: () => { PL().removeItem(p, 'dragon_egg'); if (!p.pets.some((x) => x.key === 'dragon')) { p.pets.push({ key: 'dragon', name: 'Іскорка', lvl: Math.max(1, p.level - 3), xp: 0 }); p.activePet = p.pets.length - 1; } GM().unlock(g, 'pet'); UI().closeAll(); UI().cutin('ДРАКОНЧИК!', 'З яйця вилупилася Іскорка! Вона вже підпалила килим.', '#ff9a3c'); } }, '🥚 Висидіти яйце') : null));
        w.appendChild(h('h4', null, 'Покращення'));
        const grid = h('div', { class: 'items' });
        for (const [k, U] of Object.entries(D().HOUSE_UPGRADES)) { const lvl = H.upgrades[k] || 0; const max = U.max || 1; const c = GM().upgradeCost(g, k); grid.appendChild(itemElRaw(U.icon, `${U.name}${lvl ? ` (рів. ${lvl}/${max})` : ''}`, `${U.desc}${lvl < max ? ` · ${c.gold}🪙 🪵${c.wood} 🪨${c.stone}` : ''}`, [lvl < max ? h('button', { class: 'btn small primary', onclick: () => { const e = GM().upgradeHouse(g, k); if (e) UI().toast(e, 'bad'); else { A().play('clang'); UI().toast(`🔨 Збудовано: ${U.name}!`, 'good'); reopen(house); } } }, 'Будувати') : h('span', { class: 'good' }, '✔')])); }
        w.appendChild(grid);
        w.appendChild(h('div', { class: 'muted', style: { fontSize: '12px' } }, 'Деревину добувай лісорубством 🪓, камінь — гірництвом ⛏️, або купуй на ринку.'));
        return w;
      } },
      { id: 'garden', label: '🌱 Город', render: () => {
        const w = h('div', { class: 'col' });
        if (!H.plots.length) { w.appendChild(h('div', { class: 'muted' }, 'Збудуй «Город» у вкладці кімнат, щоб отримати грядки.')); return w; }
        const seeds = Object.keys(D().CROPS).filter((s) => PL().hasItem(p, s));
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
      { id: 'chest', label: '🧰 Скриня', render: () => {
        const w = h('div', { class: 'grid2' }); if (!H.upgrades.chest) return h('div', { class: 'muted' }, 'Збудуй скриню.');
        const inv = h('div', { class: 'items' }), ch = h('div', { class: 'items' });
        for (const [id, n] of Object.entries(p.inventory)) { const it = PL().item(id); if (!it || it.kind === 'material' && D().MATERIALS[id].kind === 'quest') continue; inv.appendChild(itemEl(id, n, [h('button', { class: 'btn small', onclick: () => { PL().removeItem(p, id, n); H.chest[id] = (H.chest[id] || 0) + n; reopen(house); setTimeout(() => document.querySelector('.tabs button[data-id="chest"]')?.click(), 10); } }, '→')])); }
        for (const [id, n] of Object.entries(H.chest)) ch.appendChild(itemEl(id, n, [h('button', { class: 'btn small', onclick: () => { PL().addItem(p, id, n); delete H.chest[id]; reopen(house); setTimeout(() => document.querySelector('.tabs button[data-id="chest"]')?.click(), 10); } }, '←')]));
        w.append(h('div', null, h('h4', null, 'Рюкзак'), inv), h('div', null, h('h4', null, 'Скриня'), ch)); return w;
      } },
    ] });
  }

  function land(bid) {
    const g = G(), p = g.player, B = g.world.baronies[bid], L = p.land[bid];
    UI().modal({ title: `Баронство ${B.name}`, icon: '🏰', size: 'mid', sub: `Твої землі · сюзерен: ${g.world.realms[B.owner].fullName}`, body: () => h('div', { class: 'col' },
      h('div', { class: 'kv' }, h('div', { class: 'k' }, 'Розвиток'), h('div', null, `${B.dev}/10`), h('div', { class: 'k' }, 'Укріплення'), h('div', null, String(B.fort)), h('div', { class: 'k' }, 'Лояльність'), h('div', { style: { color: L.loyalty < 30 ? 'var(--bad)' : 'var(--good)' } }, `${Math.round(L.loyalty)}%`), h('div', { class: 'k' }, 'Дохід'), h('div', { class: 'gold' }, `${GM().landIncome(g, bid)}🪙/день`)),
      h('div', { class: 'row' }, 'Податки: ', ['Низькі', 'Звичайні', 'Високі'].map((t, i) => h('button', { class: 'btn small' + (L.tax === i ? ' primary' : ''), onclick: () => { L.tax = i; reopen(() => land(bid)); } }, t))),
      h('div', { class: 'muted', style: { fontSize: '12px' } }, 'Високі податки — більше золота, але селяни злі. Нижче 12% лояльності — повстання з вилами.'),
      h('h4', null, 'Будівництво'),
      h('div', { class: 'items' }, Object.entries(D().LAND_BUILDINGS).map(([k, Bd]) => { const lvl = L.buildings[k] || 0; const cost = Math.round(Bd.cost * (1 + lvl * 0.7)); return itemElRaw(Bd.icon, `${Bd.name} ${lvl}/${Bd.max}`, Bd.desc, [lvl < Bd.max ? h('button', { class: 'btn small primary', disabled: p.gold < cost, onclick: () => { const e = GM().buildOnLand(g, bid, k); if (e) UI().toast(e, 'bad'); else { A().play('clang'); UI().toast(`🔨 ${Bd.name} збудовано!`, 'good'); reopen(() => land(bid)); } } }, `${cost}🪙`) : h('span', { class: 'good' }, '✔')]); }))) });
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

  ISK.panels = { open, openService, gather, explore, talk, attackArmy, campfire, waitDays, save, load, autosave, slotInfo, itemEl, chooseClass, guild, store, cooking, settings, loadDialog, help, character, inventory, quests, realms, party, achievements, house, land, skills };
})();
