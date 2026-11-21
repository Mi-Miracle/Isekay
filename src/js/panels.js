// Panels (character, inventory, quests, realms...) and settlement services (guild, tavern, shops...).
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = () => ISK.ui;
  const h = (...a) => ISK.ui.h(...a);
  const D = () => ISK.data;
  const PL = () => ISK.player;
  const GM = () => ISK.game;
  const A = () => ISK.audio;
  const G = () => ISK.ui.G;

  const STAT_NAMES = { str: '💪 Сила', agi: '🌀 Спритність', int: '🧠 Інтелект', vit: '❤️ Витривалість', luk: '🍀 Удача' };

  function reopen(fn) { UI().closeTop(); fn(); }

  function itemDesc(it) {
    const parts = [];
    if (it.kind === 'weapon') parts.push(`⚔️ ${it.atk}${it.matk ? ' (магія)' : ''}`, it.crit ? `крит +${it.crit}%` : '', it.def ? `🛡 ${it.def}` : '');
    if (it.kind === 'armor') parts.push(`🛡 ${it.def}`, it.mp ? `🔷 +${it.mp}` : '', it.dodge ? `ухил. +${it.dodge}%` : '');
    if (it.statBonus) for (const [k, v] of Object.entries(it.statBonus)) parts.push(`${STAT_NAMES[k].split(' ')[0]}+${v}`);
    if (it.lvl && (it.kind === 'weapon' || it.kind === 'armor')) parts.push(`рів. ${it.lvl}`);
    if (it.use) {
      const u = it.use;
      if (u.hp) parts.push(`+${u.hp}❤️`); if (u.mp) parts.push(`+${u.mp}🔷`); if (u.dmg) parts.push(`${u.dmg} шкоди всім`);
      if (u.buff) parts.push(`баф ${u.buff}`); if (u.food) parts.push(`ситість: ${u.food.battles} боїв`); if (u.revive) parts.push('воскресіння');
    }
    if (it.desc) parts.push(it.desc);
    return parts.filter(Boolean).join(' · ');
  }

  function itemEl(id, count, acts, extra) {
    const it = PL().item(id); if (!it) return h('div');
    return h('div', { class: 'item r' + (it.rarity || 0) },
      h('div', { class: 'ic' }, it.icon),
      h('div', { style: { minWidth: 0 } }, h('div', { class: 'nm' }, it.name), h('div', { class: 'ds' }, extra || itemDesc(it))),
      count > 1 ? h('div', { class: 'cnt' }, '×' + count) : null,
      acts && acts.length ? h('div', { class: 'acts' }, acts) : null);
  }

  // ======================= Main panels =======================
  function open(name) {
    if (UI().modalStack.length) UI().closeAll();
    ({ character, inventory, skills, professions, quests, realms, chronicle, system }[name] || (() => {}))();
  }

  function character() {
    const p = G().player;
    const m = UI().modal({ title: p.name, sub: `${p.gender === 'f' ? 'Героїня' : 'Герой'} з іншого світу · колись ${p.origin}`, icon: p.gender === 'f' ? '👩' : '🧑', body: () => {
      const d = PL().derived(p);
      const stats = h('div', { class: 'card' }, h('h4', null, `Характеристики ${p.statPoints ? `(вільних очок: ${p.statPoints})` : ''}`));
      for (const k of Object.keys(STAT_NAMES)) {
        stats.appendChild(h('div', { class: 'stat-row' }, h('div', { class: 'nm' }, STAT_NAMES[k]), h('div', { class: 'v' }, String(d.s[k])), h('div', { class: 'muted', style: { fontSize: '12px' } }, `(база ${p.stats[k]})`), h('div', { class: 'spacer' }),
          p.statPoints > 0 ? h('button', { class: 'plus', onclick: () => { p.stats[k]++; p.statPoints--; reopen(character); } }, '+') : null));
      }
      const der = h('div', { class: 'card' }, h('h4', null, 'Бойові показники'),
        ...[['⚔️ Атака', d.atk], ['✨ Магічна атака', d.matk], ['🛡️ Захист', d.def], ['💥 Шанс криту', d.crit.toFixed(1) + '%'], ['💨 Ухилення', d.dodge.toFixed(1) + '%'], ['❤️ Здоров\'я', d.maxHp], ['🔷 Мана', d.maxMp]]
          .map(([a, b]) => h('div', { class: 'stat-row' }, h('div', { class: 'nm', style: { width: '160px' } }, a), h('div', { class: 'v' }, String(b)))));
      const eq = h('div', { class: 'card' }, h('h4', null, 'Спорядження'));
      for (const [slot, nm] of [['weapon', 'Зброя'], ['armor', 'Броня'], ['accessory', 'Аксесуар']]) {
        const id = p.equipment[slot];
        eq.appendChild(h('div', { class: 'muted', style: { fontSize: '12px', margin: '6px 0 3px' } }, nm));
        eq.appendChild(id ? itemEl(id, 1, [h('button', { class: 'btn small', onclick: () => { PL().unequip(p, slot); reopen(character); } }, 'Зняти')]) : h('div', { class: 'muted' }, '— порожньо —'));
      }
      const cl = h('div', { class: 'card' }, h('h4', null, 'Класи та чит'));
      const ch = D().CHEATS[p.cheat];
      cl.appendChild(h('div', { class: 'item' }, h('div', { class: 'ic' }, ch.icon), h('div', null, h('div', { class: 'nm' }, 'Благословення: ' + ch.name), h('div', { class: 'ds' }, ch.desc))));
      for (const c of [p.classes.primary, p.classes.secondary]) {
        if (!c) continue; const C = D().CLASSES[c]; const cx = p.classXp[c] || { lvl: 1, xp: 0 };
        cl.appendChild(h('div', { class: 'item', style: { marginTop: '6px' } }, h('div', { class: 'ic' }, C.icon), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${C.name} — рівень ${cx.lvl}/15`), h('div', { class: 'prog', style: { marginTop: '4px' } }, h('div', { style: { width: (cx.lvl >= 15 ? 100 : cx.xp / PL().classXpNeed(cx.lvl) * 100) + '%' } })))));
      }
      if (!p.classes.primary) cl.appendChild(h('div', { class: 'muted', style: { marginTop: '6px' } }, 'Обери бойову професію в Гільдії шукачів пригод.'));
      if (p.companion) cl.appendChild(h('div', { class: 'muted', style: { marginTop: '6px' } }, `🟢 Супутник: ${p.companion.name} (рів. ${p.companion.lvl})`));
      const st = p.stat;
      const rec = h('div', { class: 'card' }, h('h4', null, 'Літопис героя'), h('div', { class: 'kv' },
        ...[['Перемог', st.wins], ['Поразок', st.deaths], ['Підземель', st.dungeons], ['Створено', st.crafted], ['Зібрано', st.gathered], ['Квестів', p.guild.done], ['Осколків', p.relics + '/3'], ['Днів у світі', GM().day(G()) - (G().startDay || 0)]].flatMap(([a, b]) => [h('div', { class: 'k' }, a), h('div', null, String(b))])));
      return h('div', { class: 'grid3' }, h('div', { class: 'col' }, stats, der), h('div', { class: 'col' }, eq), h('div', { class: 'col' }, cl, rec));
    } });
    return m;
  }

  function inventory(filter = 'all') {
    const p = G().player;
    const kinds = { all: 'Усе', equip: 'Спорядження', cons: 'Витратні', mat: 'Матеріали' };
    UI().modal({ title: 'Інвентар', icon: '🎒', sub: `🪙 ${Math.floor(p.gold)} золота`, tabs: Object.entries(kinds).map(([id, label]) => ({ id, label, render: () => {
      const list = h('div', { class: 'items' });
      const entries = Object.entries(p.inventory).filter(([iid]) => {
        const it = PL().item(iid); if (!it) return false;
        if (id === 'equip') return ['weapon', 'armor', 'accessory'].includes(it.kind);
        if (id === 'cons') return it.kind === 'consumable';
        if (id === 'mat') return it.kind === 'material';
        return true;
      }).sort((a, b) => (PL().item(b[0]).price || 0) - (PL().item(a[0]).price || 0));
      for (const [iid, n] of entries) {
        const it = PL().item(iid); const acts = [];
        if (['weapon', 'armor', 'accessory'].includes(it.kind)) acts.push(h('button', { class: 'btn small primary', disabled: it.lvl > p.level + 2, title: it.lvl > p.level + 2 ? `Потрібен рівень ${it.lvl - 2}` : '', onclick: () => { PL().equip(p, iid); A().play('clang'); reopen(() => inventory(id)); } }, 'Вдягти'));
        if (it.kind === 'consumable' && !it.use.dmg && !it.use.revive && !(it.use.buff && !it.use.food)) acts.push(h('button', { class: 'btn small', onclick: () => { const r = PL().useConsumable(p, iid); if (r) { A().play('heal'); UI().toast(`${it.icon} ${r.text}`, 'good'); } reopen(() => inventory(id)); } }, 'Вжити'));
        list.appendChild(itemEl(iid, n, acts));
      }
      if (!entries.length) list.appendChild(h('div', { class: 'muted' }, 'Порожньо. Як у гаманці після таверни.'));
      return list;
    } })), tab: filter });
  }

  function skills() {
    const p = G().player;
    UI().modal({ title: 'Навички', icon: '📖', size: 'mid', body: () => {
      const wrap = h('div', { class: 'col' });
      const cls = [p.classes.primary, p.classes.secondary].filter(Boolean);
      if (!cls.length) wrap.appendChild(h('div', { class: 'muted' }, 'Поки що ти вмієш тільки махати палицею і кричати. Обери клас у Гільдії!'));
      for (const c of cls) {
        const C = D().CLASSES[c]; const L = PL().classLevel(p, c);
        wrap.appendChild(h('h3', { style: { margin: '4px 0', fontFamily: 'Georgia' } }, `${C.icon} ${C.name} (рів. ${L})`));
        const grid = h('div', { class: 'items' });
        for (const sk of C.skills) {
          const ok = sk.lvl <= L;
          grid.appendChild(h('div', { class: 'item', style: { opacity: ok ? 1 : 0.45 } }, h('div', { class: 'ic' }, sk.icon),
            h('div', null, h('div', { class: 'nm' }, sk.name + (ok ? '' : ` 🔒 рів. ${sk.lvl}`)), h('div', { class: 'ds' }, `🔷${sk.mp}${sk.cd ? ` · ⏱${sk.cd}` : ''} · ${sk.desc}`))));
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
        const s = p.professions[k];
        grid.appendChild(h('div', { class: 'card' }, h('div', { class: 'row' }, h('div', { style: { fontSize: '30px' } }, pr.icon), h('div', { style: { flex: 1 } },
          h('div', { style: { fontWeight: 800 } }, `${pr.name} — рівень ${s.lvl}`), h('div', { class: 'muted', style: { fontSize: '12.5px' } }, pr.desc),
          h('div', { class: 'prog', style: { marginTop: '6px' } }, h('div', { style: { width: (s.xp / PL().profXpNeed(s.lvl) * 100) + '%' } }))))));
      }
      return h('div', null, h('div', { class: 'muted', style: { marginBottom: '10px' } }, 'Збиральні професії працюють у поселеннях з відповідними ресурсами. Ремесла — у кузні, в алхіміка та біля вогнища.'), grid);
    } });
  }

  function questEl(q, opts = {}) {
    const g = G(); const done = GM().questDone(g, q);
    let prog = '';
    if (q.type === 'hunt') prog = `${Math.min(q.count, (g.player.kills[q.target] || 0) - q.base)}/${q.count}`;
    if (q.type === 'gather') prog = `${Math.min(q.count, g.player.inventory[q.item] || 0)}/${q.count}`;
    if (['deliver', 'clear', 'bounty', 'merc'].includes(q.type)) prog = q.progress ? 'виконано' : 'в процесі';
    return h('div', { class: 'quest' + (done ? ' done' : '') },
      h('div', { class: 'row' }, h('div', { class: 't' }, q.title), h('div', { class: 'spacer' }), opts.board ? null : h('span', { class: 'tag' }, prog)),
      h('div', { class: 'd' }, q.desc, q.deadline ? ` Термін: до ${GM().dateStr(q.deadline)}.` : ''),
      h('div', { class: 'row' }, h('span', { class: 'gold' }, `🪙 ${q.gold}`), h('span', null, `⭐ ${q.xp}`), h('span', { class: 'muted' }, `🛡️ +${q.pts} очок гільдії`), h('div', { class: 'spacer' }), opts.actions));
  }

  function quests() {
    const g = G(), p = g.player;
    UI().modal({ title: 'Журнал квестів', icon: '📜', size: 'mid', body: () => {
      const w = h('div');
      w.appendChild(h('div', { class: 'quest main' }, h('div', { class: 't' }, '🌸 Головний квест: Доручення богині'), h('div', { class: 'd' }, mainQuestText(p))));
      if (!p.quests.length) w.appendChild(h('div', { class: 'muted' }, 'Активних квестів немає. Зазирни до дошки оголошень у Гільдії.'));
      for (const q of p.quests) {
        const acts = [];
        if (q.type === 'deliver') acts.push(h('button', { class: 'btn small', onclick: () => { UI().closeAll(); UI().showInfo(q.to); } }, '🧭 Показати'));
        if (q.type === 'bounty') acts.push(h('button', { class: 'btn small', onclick: () => { UI().closeAll(); UI().showInfo(q.at); } }, '🧭 Показати'));
        if (q.type === 'clear') acts.push(h('button', { class: 'btn small', onclick: () => { UI().closeAll(); g.discovered['d:' + q.dungeon] = 1; UI().showInfo('d:' + q.dungeon); } }, '🧭 Показати'));
        acts.push(h('button', { class: 'btn small ghost', onclick: async () => { if (await UI().confirm('Відмовитись від квесту?')) { p.quests = p.quests.filter((x) => x !== q); if (q.type === 'deliver') PL().removeItem(p, 'package'); UI().closeAll(); quests(); } } }, 'Відмовитись'));
        w.appendChild(questEl(q, { actions: acts }));
      }
      return w;
    } });
  }

  function mainQuestText(p) {
    if (!p.guild.registered) return 'Знайди найближче містечко з Гільдією шукачів пригод і зареєструйся. Богиня каже, що це «обов\'язкова програма кожного ісекайника».';
    if (!p.classes.primary) return 'Обери бойову професію в Гільдії.';
    if (p.guild.rank < 2) return `Досягни рангу D у Гільдії (зараз ${PL().guildRank(p)}, очок: ${p.guild.points}). Виконуй квести, складай іспити.`;
    if (p.relics < 3) return `Знайди 3 Осколки Печаті в позначених рожевим підземеллях (${p.relics}/3). Підземелля сильні — підготуйся!`;
    if (!p.flags.demonKing) return 'Відправляйся до Цитаделі Короля Демонів у Попелищах і перемож Малдраґора!';
    return '✨ Ти переміг Короля Демонів! Світ врятовано (до наступного сезону). Тепер живи як хочеш: купи баронство, стань легендою SSS або відкрий таверну.';
  }

  function realms() {
    const g = G(), w = g.world, P = g.P;
    const POL = ISK.politics;
    UI().modal({ title: 'Держави континенту', icon: '👑', tabs: [
      { id: 'list', label: 'Держави', render: () => {
        const wrap = h('div');
        const order = P.realms.slice().sort((a, b) => POL.ownedBaronies(w, b.id).length - POL.ownedBaronies(w, a.id).length);
        for (const st of order) {
          const R = w.realms[st.id];
          const owned = POL.ownedBaronies(w, st.id);
          const army = P.armies.filter((a) => a.realm === st.id).reduce((s, a) => s + a.size, 0);
          const wars = POL.warsOf(P, st.id);
          wrap.appendChild(h('div', { class: 'realm-card', style: { opacity: st.dead ? 0.45 : 1 } }, h('div', { class: 'stripe', style: { background: R.color } }),
            h('div', null,
              h('div', { class: 'row' }, h('h4', null, R.fullName), st.dead ? h('span', { class: 'tag war' }, 'знищено') : null, R.isEmpire ? h('span', { class: 'tag rank' }, 'Імперія') : null, h('div', { class: 'spacer' }), h('span', { class: 'muted' }, `Репутація: ${st.playerRep || 0}`)),
              h('div', { class: 'muted', style: { fontSize: '13px', margin: '2px 0 6px' } }, `«${R.motto}» · Народ: ${R.race}`),
              h('div', { class: 'kv', style: { gridTemplateColumns: '140px 1fr' } },
                h('div', { class: 'k' }, 'Правитель'), h('div', null, `${POL.rulerFull(w, st)}, ${st.ruler.age} р. (${st.ruler.traits.map((t) => POL.TRAITS[t].name).join(', ')})`),
                h('div', { class: 'k' }, 'Землі'), h('div', null, `${owned.length} баронств · ${w.realms[st.id].duchies.length} герцогств де-юре · столиця: ${w.baronies[R.capital].name}${w.baronies[R.capital].owner !== st.id ? ' (втрачена!)' : ''}`),
                h('div', { class: 'k' }, 'Казна / військо'), h('div', null, `🪙 ${Math.round(st.gold).toLocaleString('uk')} · ⚔️ резерв ${Math.round(st.manpower).toLocaleString('uk')}${army ? ` · у полі ${army.toLocaleString('uk')}` : ''}`),
                h('div', { class: 'k' }, 'Стабільність'), h('div', null, `${Math.round(st.stability)}% · втома від війни ${Math.round(st.exhaustion)}%`),
                h('div', { class: 'k' }, 'Союзники'), h('div', null, st.alliances.length ? st.alliances.map((a) => h('span', { class: 'tag ally', style: { marginRight: '4px' } }, w.realms[a].name)) : '—'),
                h('div', { class: 'k' }, 'Війни'), h('div', null, wars.length ? wars.map((x) => h('span', { class: 'tag war', style: { marginRight: '4px' } }, x.name)) : 'мир')))));
        }
        return wrap;
      } },
      { id: 'wars', label: 'Війни', render: () => {
        const wrap = h('div');
        if (!P.wars.length) wrap.appendChild(h('div', { class: 'muted' }, '🕊️ Зараз на континенті мир. Ну, офіційно.'));
        for (const war of P.wars) {
          const side = (list) => list.map((r) => h('span', { style: { color: w.realms[r].color, fontWeight: 700 } }, w.realms[r].name)).reduce((acc, el, i) => acc.concat(i ? [', ', el] : [el]), []);
          const sc = war.score; // -100..100 attacker POV
          wrap.appendChild(h('div', { class: 'card', style: { marginBottom: '10px' } },
            h('div', { class: 'row' }, h('b', null, '⚔️ ' + war.name), h('div', { class: 'spacer' }), h('span', { class: 'muted' }, `з ${GM().dateStr(war.start)} · битв: ${war.battles}`)),
            h('div', { class: 'muted', style: { margin: '4px 0' } }, 'Привід: ' + war.reason),
            h('div', { class: 'row', style: { margin: '6px 0' } }, h('div', null, 'Нападники: ', side(war.attackers)), h('div', { class: 'spacer' }), h('div', null, 'Захисники: ', side(war.defenders))),
            h('div', { class: 'war-bar' }, h('div', { style: { left: '50%', width: Math.abs(sc) / 2 + '%', background: sc >= 0 ? w.realms[war.leaderA].color : w.realms[war.leaderD].color, transform: sc >= 0 ? 'none' : 'translateX(-100%)' } })),
            h('div', { class: 'muted', style: { fontSize: '12px', marginTop: '4px', textAlign: 'center' } }, `Рахунок війни: ${sc > 0 ? '+' : ''}${sc} (${sc > 20 ? 'перевага нападників' : sc < -20 ? 'перевага захисників' : 'рівновага'})`)));
        }
        return wrap;
      } },
      { id: 'rel', label: 'Відносини', render: () => {
        const alive = P.realms.filter((r) => !r.dead);
        const t = h('table', { class: 'rel-matrix' }, h('tr', null, h('th'), alive.map((r) => h('th', { style: { color: w.realms[r.id].color } }, w.realms[r.id].name))));
        for (const a of alive) {
          t.appendChild(h('tr', null, h('th', { style: { color: w.realms[a.id].color, textAlign: 'left' } }, w.realms[a.id].name), alive.map((b) => {
            if (a.id === b.id) return h('td', { class: 'muted' }, '—');
            const v = Math.round(a.relations[b.id] || 0);
            const war = POL.atWar(P, a.id, b.id), ally = a.alliances.includes(b.id);
            return h('td', { style: { background: war ? 'rgba(255,92,108,.3)' : ally ? 'rgba(89,227,154,.22)' : `rgba(${v < 0 ? '255,92,108' : '89,227,154'},${Math.abs(v) / 250})` } }, war ? '⚔️' : ally ? '🤝' : String(v));
          })));
        }
        return h('div', null, h('div', { class: 'muted', style: { marginBottom: '10px' } }, '⚔️ — війна, 🤝 — союз, число — відносини від -100 до 100. Держави самі вирішують, з ким дружити, а кого завойовувати.'), t);
      } },
    ] });
  }

  function chronicle() {
    const g = G();
    UI().modal({ title: 'Хроніка світу', icon: '📰', size: 'mid', body: () => {
      const w = h('div');
      for (const c of g.P.chronicle.slice(0, 200)) w.appendChild(h('div', { class: 'chron' }, h('span', { class: 'd' }, GM().dateStr(c.day)), c.text));
      return w;
    } });
  }

  function system() {
    UI().modal({ title: 'Меню', icon: '⚙️', size: 'narrow', body: () => h('div', { class: 'col' },
      h('button', { class: 'btn', onclick: () => { UI().closeAll(); saveDialog(); } }, '💾 Зберегти гру'),
      h('button', { class: 'btn', onclick: () => { UI().closeAll(); loadDialog(); } }, '📂 Завантажити'),
      h('button', { class: 'btn', onclick: () => { UI().closeAll(); settings(); } }, '🔊 Налаштування'),
      h('button', { class: 'btn', onclick: () => { UI().closeAll(); help(); } }, '❓ Як грати'),
      h('button', { class: 'btn ghost', onclick: async () => { if (await UI().confirm('Вийти в головне меню? Незбережений прогрес буде втрачено.')) { UI().closeAll(); autosave(); UI().showScreen('screen-title'); ISK.story.titleRefresh(); } } }, '🏠 Головне меню')) });
  }

  function help() {
    UI().alert('Як грати', [
      '🗺️ Мапа: тягни мишкою, коліщатко — масштаб. Клікни на поселення чи підземелля — побачиш інфо та шлях. Подвійний клік — одразу в дорогу.',
      '🏳️ Режими мапи (1-4): рельєф, політична (поточні власники, штриховка — окупація), де-юре (герцогства і графства), небезпека.',
      '🛡️ Гільдія: реєстрація, вибір класу, квести, іспити на ранг.',
      '⚒️ Професії: трави/руда/риба (мініігри), алхімія, ковальство, кулінарія.',
      '⚔️ Бій: Атака — натисни ПРОБІЛ/клік, коли стрілка в золотій зоні. Навички витрачають ману.',
      '👑 Держави живуть самі: воюють, укладають союзи, помирають королі. Слідкуй за хронікою.',
      '⌨️ C — персонаж, I — інвентар, K — навички, P — професії, J — квести, R — держави, H — хроніка, Space — до гравця, Esc — меню.',
    ].join('\n\n'), '❓');
  }

  function settings() {
    const s = A().settings;
    const slider = (kind, label) => h('div', { class: 'field' }, h('label', null, label), h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s[kind], oninput: (e) => { A().setVolume(kind, +e.target.value); if (kind === 'sfx') A().play('click'); } }));
    UI().modal({ title: 'Налаштування', icon: '🔊', size: 'narrow', body: () => h('div', { class: 'col' }, slider('sfx', 'Звукові ефекти'), slider('music', 'Музика'),
      h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: !!UI().fastTravel, onchange: (e) => { UI().fastTravel = e.target.checked; } }), 'Швидка анімація подорожей'),
      h('div', { class: 'muted', style: { fontSize: '12px' } }, 'F11 — повноекранний режим.')) });
  }

  // ---------------- Save / Load ----------------
  const SLOTS = ['auto', '1', '2', '3'];
  function slotInfo(slot) {
    try { const s = localStorage.getItem('isekay_save_' + slot); if (!s) return null; const j = JSON.parse(s); return { name: j.player.name, level: j.player.level, time: j.time, savedAt: j.savedAt }; } catch (e) { return null; }
  }
  function save(slot) {
    try { localStorage.setItem('isekay_save_' + slot, GM().serialize(G())); localStorage.setItem('isekay_last', slot); return true; } catch (e) { UI().toast('Помилка збереження: ' + e.message, 'bad'); return false; }
  }
  function autosave() { if (G()) save('auto'); }
  function load(slot) {
    const s = localStorage.getItem('isekay_save_' + slot); if (!s) return false;
    const g = GM().deserialize(s);
    UI().startGame(g);
    return true;
  }
  function saveDialog() {
    UI().modal({ title: 'Зберегти гру', icon: '💾', size: 'narrow', body: () => h('div', { class: 'col' }, SLOTS.filter((s) => s !== 'auto').map((slot) => {
      const i = slotInfo(slot);
      return h('button', { class: 'btn', onclick: () => { if (save(slot)) { UI().toast('💾 Збережено!', 'good'); UI().closeAll(); } } }, `Слот ${slot}: ${i ? `${i.name}, рів. ${i.level}, ${GM().dateStr(i.time)}` : 'порожньо'}`);
    })) });
  }
  function loadDialog() {
    UI().modal({ title: 'Завантажити гру', icon: '📂', size: 'narrow', body: () => h('div', { class: 'col' }, SLOTS.map((slot) => {
      const i = slotInfo(slot);
      return h('button', { class: 'btn', disabled: !i, onclick: () => { UI().closeAll(); load(slot); UI().toast('📂 Завантажено', 'good'); } }, `${slot === 'auto' ? 'Автозбереження' : 'Слот ' + slot}: ${i ? `${i.name}, рів. ${i.level}, ${GM().dateStr(i.time)}` : 'порожньо'}`);
    })) });
  }

  // ======================= Services =======================
  function openService(s, B) {
    ({ guild, tavern, shop: (b) => store(b, 'shop'), smith, alchemist, trainer, temple, arena, court, market: (b) => store(b, 'market') }[s])(B);
  }

  function guild(B) {
    const g = G(), p = g.player;
    if (!p.guild.registered) {
      UI().modal({ title: 'Гільдія шукачів пригод', icon: '🛡️', size: 'mid', sub: B.name, body: () => h('div', null,
        h('div', { class: 'quest' }, h('div', { class: 't' }, '👩‍💼 Реєстраторка Мірра'), h('div', { class: 'd', style: { fontSize: '15px' } }, '«Ласкаво просимо! Ще один герой з іншого світу? Третій за сьогодні. Заповніть анкету... Так, графа «Причина смерті: вантажівка» вже надрукована заздалегідь. Реєстрація — 10 золотих.»')),
        h('button', { class: 'btn primary', disabled: p.gold < 10, onclick: async () => {
          p.gold -= 10; p.guild.registered = true; A().play('level');
          UI().closeAll();
          await UI().alert('Кристал оцінки', `Ти торкаєшся кристала... Він спалахує ${['рожевим', 'золотим', 'веселковим'][Math.floor(Math.random() * 3)]} світлом!\n\nМірра: «О-о-о! Неймовірно! Ваші показники... ну, абсолютно середні. Але кристал чомусь показує «${D().CHEATS[p.cheat].name}». Що б це не означало.»\n\nТи отримуєш картку гільдії рангу F!`, '🔮');
          chooseClass(B);
        } }, '📝 Зареєструватися (10 🪙)')) });
      return;
    }
    if (!p.classes.primary) return chooseClass(B);
    const nr = PL().nextRank(p);
    UI().modal({ title: 'Гільдія шукачів пригод', icon: '🛡️', sub: `${B.name} · твій ранг: ${PL().guildRank(p)} · очки: ${p.guild.points}${nr ? ' / ' + nr.pts : ''}`, tabs: [
      { id: 'board', label: '📋 Дошка оголошень', render: () => {
        const bd = GM().board(g, B.id); const w = h('div');
        if (!bd.quests.length) w.appendChild(h('div', { class: 'muted' }, 'Дошка порожня. Нові оголошення з\'являться згодом.'));
        for (const q of bd.quests) w.appendChild(questEl(q, { board: true, actions: [h('button', { class: 'btn small primary', onclick: () => { const err = GM().acceptQuest(g, B.id, q.id); if (err) UI().toast(err, 'bad'); else { UI().toast('📜 Квест прийнято!', 'good'); reopen(() => guild(B)); } } }, 'Прийняти')] }));
        return w;
      } },
      { id: 'turn', label: '✅ Здати квести', render: () => {
        const w = h('div');
        const doneQ = p.quests.filter((q) => GM().questDone(g, q));
        if (!doneQ.length) w.appendChild(h('div', { class: 'muted' }, 'Немає виконаних квестів.'));
        for (const q of doneQ) w.appendChild(questEl(q, { actions: [h('button', { class: 'btn small primary', onclick: () => {
          const r = GM().turnInQuest(g, q.id);
          if (r) { A().play('coin'); UI().toast(`✅ ${q.title}: +${q.gold}🪙 +${q.xp}⭐`, 'good'); if (r.xr.ups.length) levelUpToast(r.xr.ups); }
          if (q.type === 'merc') applyMerc(q);
          reopen(() => guild(B));
        } }, 'Здати')] }));
        return w;
      } },
      { id: 'rank', label: '🏅 Ранг', render: () => {
        const w = h('div');
        w.appendChild(h('div', { class: 'row', style: { gap: '6px', marginBottom: '12px' } }, D().GUILD_RANKS.map((r, i) => h('span', { class: 'tag' + (i === p.guild.rank ? ' rank' : ''), style: { fontSize: '15px', padding: '6px 12px', opacity: i <= p.guild.rank ? 1 : 0.4 } }, r.r))));
        if (!nr) w.appendChild(h('div', { class: 'gold' }, 'Ти досяг рангу SSS! Барди вже складають пісні. Погані, але пісні.'));
        else {
          w.appendChild(h('div', null, `Наступний ранг: ${nr.r} — потрібно ${nr.pts} очок (є ${p.guild.points}).`));
          w.appendChild(h('div', { class: 'prog', style: { margin: '8px 0' } }, h('div', { style: { width: Math.min(100, p.guild.points / nr.pts * 100) + '%' } })));
          if (p.guild.points >= nr.pts) {
            const examLvl = 2 + p.guild.rank * 4;
            w.appendChild(h('div', { class: 'quest main' }, h('div', { class: 't' }, `Іспит на ранг ${nr.r}`), h('div', { class: 'd' }, `Екзаменатор ${['Борис Залізний Лоб', 'Ліна Блискавка', 'Старий Ґром', 'Таємнича Маска'][p.guild.rank % 4]} чекає на арені гільдії (рівень ${examLvl}).`),
              h('button', { class: 'btn primary', onclick: async () => {
                UI().closeAll();
                const ex = ISK.combat.makeEnemy('bandit', examLvl, { elite: true, name: 'Екзаменатор гільдії' }); ex.icon = '🧔'; ex.drops = [];
                const r = await ISK.combatUI.run([ex], { biome: 'plains', noFlee: true, noDeath: true });
                if (r === 'win') {
                  p.guild.rank++; p.guild.examPending = false; A().play('level');
                  await UI().alert('Новий ранг!', `Вітаємо! Тепер ти — шукач пригод рангу ${PL().guildRank(p)}!\nМірра вручає нову картку. Вона блищить. Ти теж трохи блищиш.`, '🏅');
                  UI().checkMainQuest();
                } else UI().toast('Іспит провалено. Спробуй ще раз, коли станеш сильнішим.', 'bad');
              } }, '⚔️ Скласти іспит')));
          }
        }
        return w;
      } },
      { id: 'class', label: '⚔️ Класи', render: () => classTab(B) },
    ] });
  }

  function classTab(B) {
    const p = G().player; const w = h('div');
    w.appendChild(h('div', { class: 'muted', style: { marginBottom: '8px' } }, p.level >= 15 && !p.classes.secondary ? 'Ти досяг 15 рівня — можеш опанувати другий клас!' : `Основний клас: ${D().CLASSES[p.classes.primary].name}. Другий клас доступний з 15 рівня.`));
    if (p.level >= 15 && !p.classes.secondary) {
      const g2 = h('div', { class: 'choice-grid' });
      for (const [k, C] of Object.entries(D().CLASSES)) {
        if (k === p.classes.primary) continue;
        g2.appendChild(h('div', { class: 'choice', onclick: async () => { if (await UI().confirm(`Обрати другий клас: ${C.name}? (500 🪙)`)) { if (p.gold < 500) return UI().toast('Недостатньо золота', 'bad'); p.gold -= 500; p.classes.secondary = k; p.classXp[k] = p.classXp[k] || { lvl: 1, xp: 0 }; A().play('level'); UI().closeAll(); UI().toast(`Новий клас: ${C.name}!`, 'epic'); } } },
          h('div', { class: 'ic' }, C.icon), h('div', { class: 'nm' }, C.name), h('div', { class: 'ds' }, C.desc)));
      }
      w.appendChild(g2);
    }
    return w;
  }

  function chooseClass(B) {
    const p = G().player;
    const m = UI().modal({ title: 'Обери бойову професію', icon: '⚔️', sub: 'Мірра: «Обирайте уважно! Переобрати можна... ну, теоретично. За гроші. Великі.»', body: () => {
      const g2 = h('div', { class: 'choice-grid' });
      for (const [k, C] of Object.entries(D().CLASSES)) {
        g2.appendChild(h('div', { class: 'choice', onclick: async () => {
          if (!(await UI().confirm(`${C.icon} ${C.name}: ${C.desc}\n\nОбрати цей клас? Отримаєш стартову зброю.`))) return;
          p.classes.primary = k; p.classXp[k] = { lvl: 1, xp: 0 };
          const wid = `w_${C.weapon}_0_0`; PL().addItem(p, wid); PL().equip(p, wid);
          const at = C.main === 'int' ? 'cloth' : C.main === 'agi' ? 'leather' : 'plate';
          PL().addItem(p, `a_${at}_0_0`); PL().equip(p, `a_${at}_0_0`);
          p.hp = PL().maxHp(p); p.mp = PL().maxMp(p);
          A().play('level'); UI().closeAll();
          await UI().alert('Клас обрано!', `Тепер ти — ${C.name}! ${C.icon}\n\nПерша навичка: ${C.skills[0].icon} ${C.skills[0].name}.\nНові навички відкриваються з рівнем класу (досвід з боїв).\n\nЗазирни на дошку оголошень — там є робота!`, C.icon);
          guild(B);
        } }, h('div', { class: 'ic' }, C.icon), h('div', { class: 'nm' }, C.name), h('div', { class: 'ds' }, C.desc),
          h('div', { class: 'ds', style: { marginTop: '6px', color: 'var(--cyan)' } }, `Головна: ${STAT_NAMES[C.main]} · Зброя: ${D().WEAPON_TYPES[C.weapon].name}`)));
      }
      return g2;
    } });
    return m;
  }

  function applyMerc(q) {
    const g = G();
    const armies = g.P.armies.filter((a) => a.realm === q.realmFor);
    if (armies.length) { const a = armies.sort((x, y) => y.size - x.size)[0]; a.size += 600 + g.player.level * 40; a.bonus = 1.25; a.morale = Math.min(1.2, a.morale + 0.15); }
    const en = g.P.armies.filter((a) => a.realm === q.against);
    if (en.length) { const a = en[0]; a.size = Math.max(150, Math.floor(a.size * 0.85)); }
    g.P.realms[q.realmFor].playerRep = Math.min(100, (g.P.realms[q.realmFor].playerRep || 0) + 12);
    g.P.realms[q.against].playerRep = Math.max(-100, (g.P.realms[q.against].playerRep || 0) - 15);
    ISK.politics.log(g.P, GM().day(g), `🦸 Найманець ${g.player.name} відзначився у бою на боці ${g.world.realms[q.realmFor].fullName}. Барди вже переплутали ім'я.`, 'battle', [q.realmFor, q.against]);
  }

  function levelUpToast(ups) {
    A().play('level');
    UI().toast(`🎉 НОВИЙ РІВЕНЬ ${ups[ups.length - 1]}! +${ups.length * 3} очок характеристик`, 'epic', 4500);
  }

  function tavern(B) {
    const g = G(), p = g.player;
    const restCost = Math.round(5 + B.dev * 2 + p.level);
    const rumorsFromWorld = () => {
      const out = [];
      for (const war of g.P.wars.slice(0, 2)) out.push(`Чув? Іде «${war.name}». ${g.world.realms[war.leaderA].name} проти ${g.world.realms[war.leaderD].name}. Ціни на мечі вже злетіли!`);
      const ch = g.P.chronicle.find((c) => c.type === 'dynasty');
      if (ch) out.push('Кажуть при дворах: ' + ch.text.replace(/^\S+\s/, ''));
      const undone = g.world.dungeons.filter((d) => !g.cleared[d.id] && !d.final && Math.hypot(d.x - B.x, d.y - B.y) < 25);
      if (undone.length) { const d = undone[Math.floor(Math.random() * undone.length)]; g.discovered['d:' + d.id] = 1; out.push(`Неподалік є «${d.name}». Кажуть, там скарби. І щось велике, що любить хрумтіти героями.`); }
      return out;
    };
    UI().modal({ title: `Таверна «${['П\'яний Слиз', 'Вантажівка і Кухоль', 'Сонний Дракон', 'Три Гобліни', 'Ісекай Інн', 'Кривий Меч'][B.id % 6]}»`, icon: '🍺', size: 'mid', sub: B.name, body: () => h('div', { class: 'col' },
      h('div', { class: 'quest' }, h('div', { class: 't' }, '🧔 Корчмар'), h('div', { class: 'd', style: { fontSize: '14.5px' } }, `«${D().JOKES[Math.floor(Math.random() * D().JOKES.length)]}»`)),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', disabled: p.gold < restCost, onclick: () => {
          p.gold -= restCost; p.hp = PL().maxHp(p); p.mp = PL().maxMp(p);
          const news = GM().passTime(g, 1); UI().showNews(news); A().play('heal'); autosave();
          UI().toast('😴 Ти чудово виспався. Здоров\'я і мана відновлені. (Автозбереження)', 'good'); reopen(() => tavern(B));
        } }, `🛏️ Відпочити (${restCost} 🪙)`),
        h('button', { class: 'btn', onclick: () => { const r = rumorsFromWorld(); UI().alert('Чутки', (r.length ? r : ['Нічого цікавого. Хіба що кіт корчмаря знову вкрав ковбасу.']).join('\n\n'), '👂'); } }, '👂 Послухати чутки'),
        h('button', { class: 'btn', disabled: p.gold < 8, onclick: () => { p.gold -= 8; PL().addItem(p, 'food_bread'); UI().toast('🍞 Куплено хліб', 'good'); UI().refresh(); } }, '🍞 Хліб (8 🪙)'),
        h('button', { class: 'btn pink', onclick: () => ISK.minigames.dice() }, '🎲 Кості з п\'яничкою'),
        h('button', { class: 'btn', onclick: () => cooking() }, '🍳 Кухня таверни'))) });
  }

  function store(B, kind) {
    const g = G(), p = g.player;
    const titles = { shop: ['Крамниця', '🛒'], smith: ['Кузня', '⚒️'], alchemist: ['Лавка алхіміка', '⚗️'], market: ['Ринок', '🏪'] };
    const mod = GM().priceMod(g, B);
    const tabs = [
      { id: 'buy', label: '🛍️ Купити', render: () => {
        const list = h('div', { class: 'items' });
        for (const id of GM().shopStock(g, B, kind)) {
          const price = PL().buyPrice(p, id, mod);
          list.appendChild(itemEl(id, 1, [h('button', { class: 'btn small primary', disabled: p.gold < price, onclick: () => { p.gold -= price; PL().addItem(p, id); A().play('coin'); UI().toast(`Куплено: ${PL().item(id).name}`, 'good'); UI().refresh(); reopen(() => store(B, kind)); } }, `${price} 🪙`)]));
        }
        return list;
      } },
      { id: 'sell', label: '💰 Продати', render: () => {
        const list = h('div', { class: 'items' });
        const ents = Object.entries(p.inventory).filter(([id]) => { const it = PL().item(id); return it && it.price > 0; });
        for (const [id, n] of ents) {
          const price = PL().sellPrice(p, id);
          list.appendChild(itemEl(id, n, [h('button', { class: 'btn small', onclick: () => { PL().removeItem(p, id); p.gold += price; A().play('coin'); reopen(() => { store(B, kind); }); setTimeout(() => document.querySelector('.tabs button[data-id="sell"]')?.click(), 10); } }, `+${price} 🪙`),
            n > 1 ? h('button', { class: 'btn small ghost', onclick: () => { PL().removeItem(p, id, n); p.gold += price * n; A().play('coin'); reopen(() => { store(B, kind); }); setTimeout(() => document.querySelector('.tabs button[data-id="sell"]')?.click(), 10); } }, `усі +${price * n}`) : null]));
        }
        if (!ents.length) list.appendChild(h('div', { class: 'muted' }, 'Нічого продати.'));
        return list;
      } },
    ];
    if (kind === 'smith') tabs.push({ id: 'forge', label: '🔥 Кувати', render: forgeTab });
    if (kind === 'alchemist') tabs.push({ id: 'brew', label: '🧪 Варити', render: () => craftTab('alchemy') });
    UI().modal({ title: titles[kind][0], icon: titles[kind][1], sub: `${B.name} · 🪙 ${Math.floor(p.gold)}${mod > 1.05 ? ' · воєнні ціни!' : mod < 1 ? ' · знижка за репутацію' : ''}`, tabs });
  }
  const smith = (B) => store(B, 'smith');
  const alchemist = (B) => store(B, 'alchemist');

  function forgeTab() {
    const p = G().player; const w = h('div');
    const lvl = p.professions.smithing.lvl;
    w.appendChild(h('div', { class: 'muted', style: { marginBottom: '8px' } }, `Ковальство: рівень ${lvl}. Якість у мініігрі визначає шанс на рідкісну річ.`));
    const grid = h('div', { class: 'items' });
    for (let tier = 0; tier < 6; tier++) {
      const r = D().smithRecipe(tier);
      const have = p.inventory[r.ore] || 0;
      const ore = D().MATERIALS[r.ore];
      const can = have >= r.count && p.gold >= r.gold && lvl >= r.lvl;
      const types = [...Object.keys(D().WEAPON_TYPES).map((t) => ['weapon', t]), ...Object.keys(D().ARMOR_TYPES).map((t) => ['armor', t])];
      for (const [kind, type] of types) {
        if (tier > 0 && !['sword', 'plate', 'staff', 'leather', 'bow', 'cloth', 'dagger', 'mace', 'knuckles', 'holy'].includes(type)) continue;
        const id = kind === 'weapon' ? `w_${type}_${tier}_0` : `a_${type}_${tier}_0`;
        const it = PL().item(id);
        if (lvl + 4 < r.lvl) continue;
        grid.appendChild(itemEl(id, 1, [h('button', { class: 'btn small primary', disabled: !can, onclick: async () => {
          UI().closeAll();
          const q = await ISK.minigames.forge(tier);
          const res = GM().smith(G(), kind, type, tier, q);
          if (res.fail) UI().toast('💥 Метал тріснув! Руду втрачено. Коваль співчутливо кашляє.', 'bad');
          else { A().play('clang'); UI().toast(`⚒️ Викувано: ${PL().item(res.id).name}!`, res.rarity >= 2 ? 'epic' : 'good', 4000); }
          if (res.ups && res.ups.length) UI().toast(`⚒️ Ковальство: рівень ${res.ups[res.ups.length - 1]}!`, 'good');
          UI().refresh();
        } }, 'Кувати')], `${ore.icon} ${have}/${r.count} ${ore.name} · ${r.gold}🪙 · рів. ${r.lvl}`));
      }
    }
    w.appendChild(grid);
    return w;
  }

  function craftTab(prof) {
    const p = G().player; const w = h('div');
    const lvl = p.professions[prof].lvl;
    w.appendChild(h('div', { class: 'muted', style: { marginBottom: '8px' } }, `${D().PROFESSIONS[prof].name}: рівень ${lvl}. Ідеальна мінігра — подвійний результат.`));
    const grid = h('div', { class: 'items' });
    for (const r of D().RECIPES[prof]) {
      const ok = GM().canCraft(p, r) && lvl >= r.lvl;
      const needs = Object.entries(r.needs).map(([id, n]) => `${D().MATERIALS[id].icon}${p.inventory[id] || 0}/${n}`).join(' ');
      grid.appendChild(itemEl(r.out, 1, [h('button', { class: 'btn small primary', disabled: !ok, onclick: async () => {
        UI().closeAll();
        const q = prof === 'alchemy' ? await ISK.minigames.alchemy(r.lvl) : await ISK.minigames.cooking(r.lvl);
        const res = GM().craft(G(), prof, r, q);
        UI().toast(res.count ? `✨ Створено: ${PL().item(r.out).name} ×${res.count}` : '💨 Невдача... Вийшло щось сіре і сумне.', res.count ? 'good' : 'bad');
        if (res.ups.length) UI().toast(`${D().PROFESSIONS[prof].icon} ${D().PROFESSIONS[prof].name}: рівень ${res.ups[res.ups.length - 1]}!`, 'good');
        UI().refresh();
      } }, 'Створити')], `${needs} · рів. ${r.lvl}`));
    }
    w.appendChild(grid);
    return w;
  }

  function cooking() {
    UI().modal({ title: 'Кухня', icon: '🍳', size: 'mid', body: () => craftTab('cooking') });
  }

  function trainer(B) {
    const p = G().player;
    const cost = 200 + p.level * 30;
    UI().modal({ title: 'Тренер', icon: '🥋', size: 'mid', sub: B.name, body: () => h('div', { class: 'col' },
      h('div', { class: 'quest' }, h('div', { class: 't' }, '🧓 Майстер Ґо'), h('div', { class: 'd', style: { fontSize: '14.5px' } }, '«Сила — у тренуванні. Тренування — у силі. Платити — наперед.»')),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', disabled: p.gold < cost || !p.classes.primary, onclick: () => {
          p.gold -= cost; const xp = 30 + p.level * 12; const res = PL().addClassXp(p, xp); GM().passTime(G(), 1);
          A().play('level'); UI().toast(`🥋 Тренування завершено: +${xp} досвіду класу`, 'good');
          for (const r of res) UI().toast(`${D().CLASSES[r.cls].icon} ${D().CLASSES[r.cls].name}: рівень ${r.lvl}!${r.skills.length ? ' Нова навичка: ' + r.skills.map((s) => s.name).join(', ') : ''}`, 'epic', 5000);
          reopen(() => trainer(B));
        } }, `🏋️ Тренуватися день (${cost} 🪙)`),
        h('button', { class: 'btn', disabled: p.gold < 300, onclick: async () => {
          if (!(await UI().confirm('Скинути всі очки характеристик за 300 🪙?'))) return;
          p.gold -= 300; const total = Object.values(p.stats).reduce((a, b) => a + b, 0) - 25 - (p.cheat === 'luck' ? 8 : 0);
          p.stats = { str: 5, agi: 5, int: 5, vit: 5, luk: 5 + (p.cheat === 'luck' ? 8 : 0) }; p.statPoints += total;
          p.hp = Math.min(p.hp, PL().maxHp(p)); p.mp = Math.min(p.mp, PL().maxMp(p)); UI().toast('Очки скинуто. Розподіли їх у вікні персонажа.', 'good'); UI().refresh();
        } }, '🔄 Перерозподіл характеристик (300 🪙)'))) });
  }

  function temple(B) {
    const p = G().player;
    const cost = Math.round(p.level * 4);
    UI().modal({ title: 'Храм Богині Люмі', icon: '⛪', size: 'mid', sub: B.name, body: () => h('div', { class: 'col' },
      h('div', { class: 'quest' }, h('div', { class: 't' }, '🙏 Жриця Аделія'), h('div', { class: 'd', style: { fontSize: '14.5px' } }, '«Богиня любить усіх своїх дітей. Особливо тих, хто жертвує.» На статуї богині хтось намалював вуса.')),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', disabled: p.gold < cost, onclick: () => { p.gold -= cost; p.hp = PL().maxHp(p); p.mp = PL().maxMp(p); A().play('heal'); UI().toast('✨ Тебе зцілено святим світлом.', 'good'); UI().refresh(); } }, `💚 Зцілення (${cost} 🪙)`),
        h('button', { class: 'btn', disabled: p.gold < 100, onclick: () => { p.gold -= 100; p.food = { buff: 'all', amt: 0.08, battles: 5 }; A().play('magic'); UI().toast('🌸 Благословення Люмі: +8% до всіх характеристик на 5 боїв.', 'good'); UI().refresh(); } }, '🌸 Благословення (100 🪙)'),
        h('button', { class: 'btn ghost', onclick: () => { UI().alert('Молитва', ['Ти молишся... У голові лунає: «Абонент тимчасово недоступний». Дивно.', 'Голос Люмі: «Я зайнята! Пиши в листі!»', 'Ти відчуваєш тепло. Або це просто свічки.'][Math.floor(Math.random() * 3)], '🙏'); } }, '🙏 Помолитися'))) });
  }

  function arena(B) {
    const g = G(), p = g.player;
    const lvl = Math.max(p.level, 3);
    UI().modal({ title: 'Арена', icon: '🏟️', size: 'mid', sub: `${B.name} · Хліба і видовищ!`, body: () => h('div', { class: 'col' },
      h('div', { class: 'quest' }, h('div', { class: 't' }, '📣 Ведучий'), h('div', { class: 'd', style: { fontSize: '14.5px' } }, '«Пані та панове! Сьогодні на арені — герой з іншого світу! Ставки приймаються! Ставки здебільшого на монстрів!»')),
      h('div', { class: 'row' }, [['Бронзовий кубок', 0, 3, 80], ['Срібний кубок', 3, 4, 200], ['Золотий кубок', 6, 5, 500]].map(([nm, add, waves, prize]) =>
        h('button', { class: 'btn' + (add === 0 ? ' primary' : ''), onclick: async () => {
          UI().closeAll();
          for (let wv = 1; wv <= waves; wv++) {
            const keys = Object.keys(D().MONSTERS).filter((k) => k !== 'mimic');
            const ens = Array.from({ length: Math.min(3, 1 + Math.floor(wv / 2)) }, () => ISK.combat.makeEnemy(keys[Math.floor(Math.random() * keys.length)], lvl + add + wv - 2));
            UI().toast(`🏟️ Хвиля ${wv}/${waves}!`, 'epic');
            const r = await ISK.combatUI.run(ens, { biome: 'plains', noFlee: true, noDeath: true, arena: true });
            if (r !== 'win') { UI().toast('Тебе винесли з арени на ношах. Натовп аплодує... монстрам.', 'bad'); return; }
          }
          p.gold += prize; A().play('win');
          UI().alert('Перемога на арені!', `${nm} — твій! +${prize} 🪙\nНатовп скандує твоє ім'я. Неправильно, але скандує.`, '🏆');
        } }, `${nm} · ${waves} хвиль · ${prize}🪙`)))) });
  }

  function court(B) {
    const g = G(), p = g.player, w = g.world;
    const realmId = B.owner; if (realmId < 0) return;
    const st = g.P.realms[realmId]; const R = w.realms[realmId];
    const rep = st.playerRep || 0;
    const POL = ISK.politics;
    const titleCost = (b) => 1500 + b.dev * 700;
    const lands = w.baronies.filter((b) => b.owner === realmId && b.occ < 0 && b.type !== 'capital' && b.id !== p.ownedBarony).sort((a, b) => a.dev - b.dev).slice(0, 6);
    UI().modal({ title: `Двір: ${R.fullName}`, icon: '👑', size: 'mid', sub: `${POL.rulerFull(w, st)} · твоя репутація: ${rep}`, body: () => h('div', { class: 'col' },
      h('div', { class: 'quest' }, h('div', { class: 't' }, `👑 ${POL.rulerFull(w, st)}`), h('div', { class: 'd', style: { fontSize: '14.5px' } },
        rep < 10 ? '«Хто пустив цього простолюдина? А, ісекайник. Ну, кажи швидше, у нас бенкет.»' : rep < 40 ? '«А, той самий герой! Чули про тебе. Здебільшого добре.»' : '«Мій вірний герою! Корона в боргу перед тобою. Ну, не в грошовому сенсі.»')),
      h('div', { class: 'card' }, h('h4', null, 'Стан королівства'), h('div', null, `Казна: ${Math.round(st.gold)} · Військо: ${Math.round(st.manpower + g.P.armies.filter((a) => a.realm === realmId).reduce((s, a) => s + a.size, 0))} · ${POL.warsOf(g.P, realmId).length ? 'Іде війна!' : 'Мир'}`)),
      h('div', { class: 'card' }, h('h4', null, 'Купити дворянський титул (потрібна репутація 40+, ранг C+)'),
        p.ownedBarony >= 0 ? h('div', { class: 'good', style: { marginBottom: '6px' } }, `Ти вже барон(еса) ${w.baronies[p.ownedBarony].name}! Прибуток: ${w.baronies[p.ownedBarony].dev * 3}🪙/день.`) : null,
        lands.map((b) => h('div', { class: 'row', style: { margin: '4px 0' } }, h('span', null, `${ISK.world.SETTLEMENT[b.type].icon} ${b.name} (розвиток ${b.dev}, дохід ${b.dev * 3}🪙/день)`), h('div', { class: 'spacer' }),
          h('button', { class: 'btn small primary', disabled: rep < 40 || p.guild.rank < 3 || p.gold < titleCost(b), onclick: async () => {
            if (!(await UI().confirm(`Купити титул барона ${b.name} за ${titleCost(b)} 🪙?${p.ownedBarony >= 0 ? ' (Старий титул буде продано)' : ''}`))) return;
            p.gold -= titleCost(b); p.ownedBarony = b.id; p.title = 'Барон ' + b.name; st.gold += titleCost(b) * 0.8;
            POL.log(g.P, GM().day(g), `🏠 ${p.name} отримує титул барона ${b.name} від ${POL.rulerFull(w, st)}. Селяни в шоці, гуси — в захваті.`, 'dynasty', [realmId]);
            A().play('level'); UI().closeAll(); UI().alert('Титул!', `Відтепер ти — ${p.title}! Щодня отримуєш прибуток з баронства.`, '🏠');
          } }, `${titleCost(b)} 🪙`)))),
      h('div', { class: 'card' }, h('h4', null, 'Пожертва короні'), h('button', { class: 'btn', disabled: p.gold < 200, onclick: () => { p.gold -= 200; st.gold += 200; st.playerRep = Math.min(100, rep + 4); UI().toast('Корона вдячна. +4 репутації', 'good'); reopen(() => court(B)); } }, 'Пожертвувати 200 🪙 (+4 репутації)'))) });
  }

  function market(B) { store(B, 'market'); }

  // ---------------- Location actions ----------------
  async function gather(prof) {
    const g = G();
    const q = prof === 'fishing' ? await ISK.minigames.fishing(g.player.professions.fishing.lvl) : prof === 'mining' ? await ISK.minigames.mining(g.player.professions.mining.lvl) : await ISK.minigames.herbs(g.player.professions.herbalism.lvl);
    const res = GM().gatherYield(g, prof, q);
    GM().passTime(g, 0.25);
    const txt = Object.entries(res.items).map(([id, n]) => `${PL().item(id).icon}${PL().item(id).name} ×${n}`).join(', ');
    UI().toast(txt ? `Здобуто: ${txt}` : 'Нічого не вдалося зібрати. Буває.', txt ? 'good' : 'bad', 4200);
    if (res.ups.length) UI().toast(`${D().PROFESSIONS[prof].icon} ${D().PROFESSIONS[prof].name}: рівень ${res.ups[res.ups.length - 1]}!`, 'epic');
    UI().refresh();
  }

  async function explore() {
    const g = G(); const hr = GM().here(g); const B = hr.B;
    GM().passTime(g, 0.3);
    const biome = UI().biomeAt(g.player.location);
    const keys = Object.entries(D().MONSTERS).filter(([k, m]) => m.biome.includes(biome)).map(([k]) => k);
    const pool = keys.length ? keys : ['slime', 'rabbit'];
    const lvl = Math.max(1, B.danger + Math.floor(Math.random() * 3) - 1);
    const n = lvl < 3 ? 1 : 1 + Math.floor(Math.random() * 2);
    const ens = Array.from({ length: n }, () => ISK.combat.makeEnemy(pool[Math.floor(Math.random() * pool.length)], lvl));
    await ISK.combatUI.run(ens, { biome });
    UI().refresh();
  }

  function campfire() {
    const p = G().player;
    UI().modal({ title: 'Табір', icon: '🔥', size: 'mid', body: () => h('div', { class: 'col' },
      h('div', { class: 'muted' }, 'Розпали вогнище: відпочинок відновлює 50% здоров\'я та мани (пів дня). Тут же можна готувати.'),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => {
        p.hp = Math.min(PL().maxHp(p), p.hp + Math.round(PL().maxHp(p) * 0.5)); p.mp = Math.min(PL().maxMp(p), p.mp + Math.round(PL().maxMp(p) * 0.5));
        const news = GM().passTime(G(), 0.5); UI().showNews(news); A().play('heal'); UI().toast('🔥 Ти відпочив біля вогнища. Комарі були вдячні.', 'good'); reopen(campfire);
      } }, '😴 Відпочити біля вогнища')),
      craftTab('cooking')) });
  }

  function waitDays() {
    UI().modal({ title: 'Чекати', icon: '⏳', size: 'narrow', body: () => h('div', { class: 'col' },
      h('div', { class: 'muted' }, 'Світ живе, поки ти чекаєш. Війни, союзи, змови...'),
      h('div', { class: 'row' }, [1, 3, 7, 30].map((d) => h('button', { class: 'btn', onclick: () => {
        const news = GM().passTime(G(), d); UI().closeAll(); UI().showNews(news); UI().toast(`⏳ Минуло ${d} дн. Подій у світі: ${news.length}`, ''); UI().refresh();
      } }, `${d} дн.`)))) });
  }

  ISK.panels = { open, openService, gather, explore, campfire, waitDays, save, load, autosave, slotInfo, levelUpToast, itemEl, chooseClass, guild, store, cooking, settings, loadDialog, help, character, inventory, quests, realms };
})();
