// Хроніки Дивосвіту v4 — panels II: lords audience & quests, own army & war, family & dynasty, naval battles,
// shipyard, per-voice settings, right-click context menu, goddess calls.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = () => ISK.ui, GM = () => ISK.game, PL = () => ISK.player, D = () => ISK.data, A = () => ISK.audio, SP = () => ISK.sprites, LF = () => ISK.life, POL = () => ISK.politics;
  const G = () => UI().G;
  const h = (...a) => UI().h(...a);
  const reopen = (fn) => { UI().closeTop(); fn(); };
  const portrait = (cv, size = 72) => h('div', { class: 'px-portrait' }, SP().img(cv, size));

  // ---------------- lords ----------------
  function lordSprite(l) { const g = G(); return SP().lord({ ...l, race: g.world.realms[l.realm] ? g.world.realms[l.realm].raceKey : 'human' }); }
  function lords(bid) {
    const g = G(); const ls = LF().lordsAt(g, bid); if (!ls.length) return UI().toast('Тут немає лордів. Тільки кури.', 'bad');
    UI().modal({ title: 'Аудієнція', icon: '👑', size: 'mid', sub: `${g.world.baronies[bid].name} · хто приймає сьогодні`, body: () => h('div', { class: 'col' }, ls.map((l) => {
      const rel = LF().lordRel(g, l.key); const tr = LF().lordTrait(l);
      return h('div', { class: 'item lord-row', onclick: () => audience(l.key) }, portrait(lordSprite(l), 56), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${LF().lordTitle(l)} ${l.name}`), h('div', { class: 'ds' }, `${l.domain} · ${tr.name} · ${l.age} р. · ставлення ${rel >= 0 ? '+' : ''}${rel}`)), h('button', { class: 'btn small primary' }, '🗣️ Говорити'));
    })) });
  }
  function audience(key) {
    const g = G(), p = g.player; const l = LF().lordByKey(g, key); if (!l) return;
    UI().closeAll();
    const say = (text) => { ISK.voice.say(l.name, text, l.female ? 'f' : 'm'); box.querySelector('.lord-say').textContent = `«${text}»`; };
    const relBar = () => { const r = LF().lordRel(g, key); return h('div', { class: 'rel-bar' }, h('div', { style: { width: (r + 100) / 2 + '%', background: r >= 50 ? 'var(--good)' : r < 0 ? 'var(--bad)' : '#ffd36e' } }), h('span', null, `Ставлення: ${r}`)); };
    const box = h('div', { class: 'col' });
    const draw = () => {
      box.innerHTML = ''; const tr = LF().lordTrait(l); const q = LF().lordQuest(g, key); const mine = p.quests.filter((x) => x.lordKey === key);
      box.append(h('div', { class: 'row', style: { gap: '14px', alignItems: 'flex-start' } }, portrait(lordSprite(l), 120),
        h('div', { style: { flex: 1 } }, h('h3', null, `${LF().lordTitle(l)} ${l.name}`), h('div', { class: 'muted' }, l.kind === 'king' ? l.domain : `${l.domain} · ${g.world.realms[l.realm] ? g.world.realms[l.realm].fullName : ''}`), h('div', { class: 'muted' }, `Риса: ${tr.name} — ${tr.desc}`), relBar(), h('div', { class: 'lord-say' }, `«${LF().lordLine(g, l, 'greet')}»`))));
      const acts = h('div', { class: 'row wrap', style: { gap: '6px' } });
      acts.append(
        h('button', { class: 'btn', onclick: () => say(LF().lordLine(g, l, 'gossip')) }, '🗞️ Плітки'),
        h('button', { class: 'btn', onclick: () => say(pick(['Ха! Смішно. Мій блазень розповідає краще, але ти теж нічого.', 'Ха-ха... ні, не смішно. Але я посміюсь з ввічливості.', 'О, ти жартівник! Мені подобаються жартівники. Їх весело кидати в рів.', `Колись один ісекайник розповів мені жарт про вантажівку. Я досі не зрозумів.`])) }, '😄 Пожартувати'),
        h('button', { class: 'btn', onclick: () => { const cost = Math.round(100 * LF().RANK[l.kind].mul); const e = LF().lordGift(g, key, cost); if (e) return UI().toast(e, 'bad'); A().play('coin'); say(tr.id === 'greedy' ? 'О-о-о! Золото! Ти мій найкращий друг!' : tr.id === 'glutton' ? 'Гроші? А тістечко не було?.. Ну гаразд, дякую.' : 'Щедрий дарунок. Я запам\'ятаю.'); draw(); } }, `🎁 Подарунок (${Math.round(100 * LF().RANK[l.kind].mul)}🪙)`),
      );
      if (q && !q.taken && !mine.length) acts.append(h('button', { class: 'btn primary', onclick: () => { const e = LF().acceptLordQuest(g, key); if (e) return UI().toast(e, 'bad'); A().play('quest'); say('Чудово. Не підведи мене.'); UI().toast(`📜 Новий квест: ${q.title}`, 'epic'); draw(); } }, '📜 Попросити завдання'));
      for (const mq of mine) {
        if (mq.type === 'duel' && !mq.progress) acts.append(h('button', { class: 'btn pink', onclick: async () => { UI().closeAll(); const e = ISK.combat.makeEnemy('soldier', mq.lvl, { elite: true, name: mq.champion, icon: '🤺' }); e.drops = []; const r = await ISK.combatUI.run([e], { biome: 'plains', noFlee: true, noDeath: true, questId: mq.id }); UI().toast(r === 'win' ? '🏅 Чемпіона переможено! Повертайся до лорда.' : 'Чемпіон переміг. Спробуй ще!', r === 'win' ? 'epic' : 'bad'); audience(key); } }, `⚔️ Поєдинок: ${mq.champion}`));
        else if (GM().questDone(g, mq)) acts.append(h('button', { class: 'btn primary', onclick: () => { const res = LF().turnInLord(g, key); A().play('coin'); if (res.length) { UI().toast(`✅ Завдання виконано! +${mq.gold}🪙 +${mq.xp}✨ · ставлення +${mq.relGain}`, 'good', 5000); say('Відмінно! Ти довів свою вірність.'); } draw(); UI().refresh(); } }, `✅ Здати: ${mq.title}`));
        else acts.append(h('div', { class: 'tag' }, `⏳ ${mq.title}`));
      }
      if (LF().lordCanGrant(g, key)) acts.append(h('button', { class: 'btn gold-btn', onclick: async () => { if (!(await UI().confirm('Попросити в лорда землю? (ставлення −30)'))) return; const e = LF().lordGrant(g, key); if (e) return UI().toast(e, 'bad'); UI().cutin('НОВІ ЗЕМЛІ!', 'Лорд дарує тобі баронство!', '#ffd36e'); draw(); } }, '🏰 Попросити землю'));
      if (!p.spouse) {
        const ok = LF().canMarry(g, key); const female = p.gender === 'm';
        acts.append(h('button', { class: 'btn' + (ok ? ' pink' : ' ghost'), title: ok ? '' : `Потрібно ставлення ≥60 і титул не нижче ${D().SOCIAL[LF().RANK[l.kind].social].name}`, onclick: async () => {
          if (!ok) return say(pick(['Руку моєї дитини? Тобі? Ха! Спершу стань кимось.', 'Ти мені подобаєшся, але не настільки.', 'Може, колись. Коли в тебе буде замок. Або хоча б нормальні чоботи.']));
          const nm = LF().childName(l, female);
          if (!(await UI().confirm(`Посвататися до: ${nm}?\nВесілля коштуватиме ${Math.round(500 * LF().RANK[l.kind].mul)}🪙.`))) return;
          const e = LF().marryLordChild(g, key); if (e) return UI().toast(e, 'bad'); A().play('win'); UI().cutin('ВЕСІЛЛЯ!', `${p.name} ❤ ${p.spouse.name}`, '#ff7eb6'); UI().sparkle(innerWidth / 2, innerHeight / 2, 50); draw();
        } }, `💍 Посвататися (${female ? 'донька' : 'син'})`));
      }
      const lg = LF().liegeOf(g);
      if (l.kind === 'king' && lg >= 0 && l.realm !== lg && p.social >= 4) acts.append(h('button', { class: 'btn danger', onclick: async () => { if (!(await UI().confirm(`Оголосити війну ${g.world.realms[l.realm].fullName} від імені свого сюзерена?`))) return; const e = LF().declareWarOn(g, l.realm); if (e) return UI().toast(e, 'bad'); say('Війна?! Як ти смієш!.. Варта! ВАРТА!'); UI().toast('⚔️ Війну оголошено!', 'epic'); } }, '⚔️ Оголосити війну'));
      box.append(acts);
    };
    UI().modal({ title: `${LF().lordTitle(l)} ${l.name}`, icon: l.kind === 'king' ? '👑' : '🏰', size: 'mid', body: () => { draw(); return box; } });
  }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // ---------------- army ----------------
  function army() {
    const g = G(), p = g.player; const hr = GM().here(g);
    const body = () => {
      const w = h('div', { class: 'col' }); const cap = LF().armyCap(g); const cnt = LF().armyCount(p);
      w.append(h('div', { class: 'kv' }, h('div', { class: 'k' }, 'Військо'), h('div', null, p.army ? p.army.name : 'немає'), h('div', { class: 'k' }, 'Загонів'), h('div', null, `${cnt}/${cap} (1 загін = 10 вояків)`), h('div', { class: 'k' }, 'Сила'), h('div', { class: 'gold' }, `⚔️ ${LF().armyPower(g).toLocaleString('uk')}`), h('div', { class: 'k' }, 'Утримання'), h('div', null, `${LF().armyUpkeep(p)}🪙/день`), h('div', { class: 'k' }, 'Бойовий дух'), h('div', null, p.army ? `${Math.round((p.army.morale || 1) * 100)}%` : '—')));
      if (p.army) w.append(h('div', { class: 'items' }, Object.entries(p.army.units).filter(([, n]) => n > 0).map(([k, n]) => { const U = D().UNITS[k]; return h('div', { class: 'item' }, h('div', { class: 'ic' }, U.icon), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${U.name} ×${n}`), h('div', { class: 'ds' }, U.desc)), h('button', { class: 'btn small ghost', onclick: () => { LF().dismiss(g, k, Math.max(1, Math.ceil(n / 2))); reopen(army); } }, 'Розпустити ½')); })));
      if (LF().canRecruitHere(g)) {
        w.append(h('div', { class: 'loc-section' }, 'Найняти загони'));
        w.append(h('div', { class: 'items' }, Object.entries(D().UNITS).map(([k, U]) => h('div', { class: 'item' }, h('div', { class: 'ic' }, U.icon), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${U.name} · сила ${U.power}`), h('div', { class: 'ds' }, `${U.desc} · ${U.cost * 10}🪙/загін`)),
          h('div', { class: 'acts' }, [1, 5, 10].map((n) => h('button', { class: 'btn small primary', onclick: () => { const e = LF().recruit(g, k, n); if (e) return UI().toast(e, 'bad'); A().play('coin'); reopen(army); } }, `+${n}`)))))));
      } else w.append(h('div', { class: 'muted' }, 'Наймати військо можна у своїх землях, містах і фортецях.'));
      if (p.army && hr.kind === 'barony') {
        const foes = g.P.armies.filter((a) => a.node === hr.B.id);
        if (foes.length) { w.append(h('div', { class: 'loc-section' }, 'Армії тут')); for (const a of foes) w.append(h('div', { class: 'item' }, h('div', { class: 'ic' }, a.icon || '⚑'), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, a.name), h('div', { class: 'ds' }, `${a.size.toLocaleString('uk')} вояків · ${g.world.realms[a.realm].name}`)), h('button', { class: 'btn small danger', onclick: async () => { if (!(await UI().confirm(`Атакувати «${a.name}» своїм військом?`))) return; const r = LF().battleArmy(g, a.id); A().play(r.won ? 'win' : 'hit'); UI().cutin(r.won ? 'ПЕРЕМОГА!' : 'ВІДСТУП...', `Знищено ${r.killed.toLocaleString('uk')} ворогів`, r.won ? '#ffd36e' : '#ff6b85'); UI().showNews([]); reopen(army); } }, '⚔️ Атакувати'))); }
        const ctrl = hr.B.occ >= 0 ? hr.B.occ : hr.B.owner;
        if (ctrl !== LF().liegeOf(g) && !hr.B.holder) w.append(h('button', { class: 'btn danger', onclick: async () => { if (!(await UI().confirm(`Взяти в облогу і штурмувати ${hr.B.name}?`))) return; const r = LF().siege(g, hr.B.id); if (r.err) return UI().toast(r.err, 'bad'); A().play(r.won ? 'win' : 'hit'); UI().cutin(r.won ? 'МІСТО ЗДОБУТО!' : 'ШТУРМ ВІДБИТО', hr.B.name, r.won ? '#ffd36e' : '#ff6b85'); UI().refresh(); reopen(army); } }, `🏰 Штурмувати ${hr.B.name}`));
      }
      return w;
    };
    UI().modal({ title: 'Моє військо', icon: '⚔️', size: 'mid', sub: 'Набирай загони, бий ворожі армії, бери міста', body });
  }

  // ---------------- family ----------------
  function family() {
    const g = G(), p = g.player;
    UI().modal({ title: 'Родина і династія', icon: '💞', size: 'mid', body: () => {
      const w = h('div', { class: 'col' });
      if (p.spouse) { const SB = D().SPOUSE_BONUS[p.spouse.kind]; w.append(h('div', { class: 'item' }, portrait(SP().npc('sp' + p.spouse.portrait, { female: p.spouse.female, crown: p.spouse.kind === 'noble' }), 64), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${p.spouse.icon || '💍'} ${p.spouse.name}`), h('div', { class: 'ds' }, `${SB ? SB[0] + ': ' + SB[1] : ''} · у шлюбі з ${GM().dateStr(p.spouse.day)}`)), h('button', { class: 'btn small', onclick: () => ISK.voice.say(p.spouse.name, pick(['Я сумую, коли ти в походах. Привези щось смачне!', 'Не забудь: у п\'ятницю вечеря з моїми батьками.', 'Ти знову врятував світ? Молодець. Тепер винеси сміття.', 'Люблю тебе. Навіть коли від тебе пахне слизом.']), p.spouse.female ? 'f' : 'm') }, '💬'))); }
      else w.append(h('div', { class: 'muted' }, 'Ти ще неодружений(а). Посвататися можна до дітей лордів (аудієнція) або до товариша, з яким пройшов багато боїв (прихильність ≥25).'));
      if (!p.spouse && p.party.length) w.append(h('div', { class: 'items' }, p.party.map((c, i) => h('div', { class: 'item' }, h('div', { class: 'ic' }, c.icon), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, c.name), h('div', { class: 'ds' }, `Прихильність: ${'❤️'.repeat(Math.min(5, Math.floor((c.affection || 0) / 5)))} ${c.affection || 0}/25`)), h('button', { class: 'btn small pink', onclick: () => { const e = LF().proposeCompanion(g, i); if (e) return UI().toast(e, 'bad', 5000); A().play('win'); UI().cutin('ВЕСІЛЛЯ!', `${p.name} ❤ ${p.spouse.name}`, '#ff7eb6'); reopen(family); } }, '💍 Освідчитись')))));
      if (p.children.length) { w.append(h('div', { class: 'loc-section' }, 'Діти')); for (const [i, c] of p.children.entries()) { const age = LF().childAge(g, c); w.append(h('div', { class: 'item' }, portrait(SP().npc('ch' + c.name + c.born, { female: c.female }), 48), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${c.female ? '👧' : '👦'} ${c.name}`), h('div', { class: 'ds' }, `${age} р. ${age < 16 ? `· спадкоємцем можна стати з 16` : '· готовий(а) прийняти спадщину!'}`)), age >= 16 ? h('button', { class: 'btn small primary', onclick: async () => { if (!(await UI().confirm(`Передати спадщину ${c.name}? Ти продовжиш гру за спадкоємця (60% рівня, усе майно збережеться).`))) return; const e = LF().takeHeir(g, i); if (e) return UI().toast(e, 'bad'); UI().closeAll(); UI().cutin('НОВЕ ПОКОЛІННЯ', p.name, '#ffd36e'); UI().refresh(); } }, '👑 Спадщина') : null)); } }
      const dyn = (g.life && g.life.dynasty) || []; if (dyn.length) w.append(h('div', { class: 'card' }, h('h4', null, '📜 Династія'), dyn.map((x) => h('div', null, `${x.name} — рів. ${x.level}, ⭐${x.fame}`))));
      return w;
    } });
  }

  // ---------------- naval ----------------
  function naval(foeKey, lvl) {
    return new Promise((resolve) => {
      const g = G(); const s = LF().startNaval(g, foeKey, lvl); s.foe.hp = s.foe.maxHp; UI().inCombat = true; A().setMood('battle');
      const log = h('div', { class: 'naval-log' }); const bars = h('div');
      const bar = (lbl, v, m, col) => h('div', { class: 'naval-bar' }, h('span', null, `${lbl} ${Math.max(0, v)}/${m}`), h('div', { style: { width: Math.max(0, v / m * 100) + '%', background: col } }));
      const draw = () => { bars.innerHTML = ''; bars.append(h('div', { class: 'naval-ships' }, h('div', { class: 'ship me' + (s.evade ? ' evade' : '') }, '⛵'), h('div', { class: 'waves' }, '〰️〰️〰️'), h('div', { class: 'ship foe' }, s.foe.icon)), bar('Твій корабель', s.ship.hp, s.ship.maxHp, '#5fd38a'), bar(s.foe.name, s.foe.hp, s.foe.maxHp, '#ff6b85')); };
      let fin = false; const act = (a) => { if (s.over || fin) return; const ev = LF().navalAct(g, s, a); for (const t of ev) log.prepend(h('div', null, t)); A().play(a === 'volley' ? 'hit' : a === 'board' ? 'crit' : 'magic'); draw(); if (s.over && !fin) { fin = true; finish(); } };
      const btns = h('div', { class: 'row wrap', style: { gap: '6px', justifyContent: 'center' } },
        h('button', { class: 'btn primary', onclick: () => act('volley') }, '💣 Залп'), h('button', { class: 'btn pink', onclick: () => act('board') }, '🏴‍☠️ Абордаж'), h('button', { class: 'btn', onclick: () => act('evade') }, '⛵ Маневр і ремонт'), h('button', { class: 'btn danger', onclick: () => act('ram') }, '💥 Таран'));
      const m = UI().modal({ title: 'Морський бій!', icon: '⚓', size: 'mid', noClose: true, sub: s.foe.line, body: () => { draw(); return h('div', { class: 'col' }, bars, btns, log); } });
      const finish = () => { const r = LF().navalRewards(g, s); setTimeout(() => { m.close(); UI().inCombat = false; UI().refresh(); if (s.over === 'win') { A().play('win'); UI().toast(`🏆 Морська перемога! +${r.gold}🪙 ${Object.entries(r.items).map(([k, n]) => PL().item(k).icon + '×' + n).join(' ')}`, 'epic', 5000); } else UI().toast(`🌊 Корабель ледь доплив. Втрачено ${r.lost}🪙 і гідність.`, 'bad', 5000); resolve(s.over); }, 700); };
      if (globalThis.ISK_AUTOFIGHT) (async () => { while (!s.over) { act('volley'); await UI().sleep(5); } })();
    });
  }
  function shipyard(B) {
    const g = G(), p = g.player;
    UI().modal({ title: 'Верф і морське полювання', icon: '⚓', size: 'mid', sub: B.name, body: () => {
      const w = h('div', { class: 'col' });
      if (!p.ship) { w.append(h('div', { class: 'muted' }, 'Спершу купи корабель у гавані.')); return w; }
      const st = LF().shipStats(p); w.append(h('div', { class: 'kv' }, h('div', { class: 'k' }, 'Міцність'), h('div', null, String(st.maxHp)), h('div', { class: 'k' }, 'Гармати'), h('div', null, String(st.atk)), h('div', { class: 'k' }, 'Абордаж'), h('div', null, Math.round(st.board * 100) + '%'), h('div', { class: 'k' }, 'Швидкість'), h('div', null, '×' + st.speed.toFixed(2))));
      w.append(h('div', { class: 'items' }, Object.entries(D().SHIP_UPGRADES).map(([k, U]) => { const lvl = (p.shipUp || {})[k] || 0; return h('div', { class: 'item' }, h('div', { class: 'ic' }, U.icon), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${U.name} ${'★'.repeat(lvl)}${'☆'.repeat(U.cost.length - lvl)}`), h('div', { class: 'ds' }, U.desc)), lvl < U.cost.length ? h('button', { class: 'btn small primary', disabled: p.gold < U.cost[lvl], onclick: () => { const e = LF().shipUpgrade(g, k); if (e) return UI().toast(e, 'bad'); A().play('clang'); reopen(() => shipyard(B)); } }, `${U.cost[lvl]}🪙`) : h('span', { class: 'tag' }, 'MAX')); })));
      w.append(h('div', { class: 'loc-section' }, 'Вийти в море'));
      w.append(h('div', { class: 'row wrap', style: { gap: '6px' } },
        h('button', { class: 'btn', onclick: async () => { UI().closeAll(); GM().passTime(g, 1); await naval(Math.random() < 0.7 ? 'pirate' : 'ghost', Math.max(3, p.level)); } }, '🏴‍☠️ Полювати на піратів (нагорода)'),
        h('button', { class: 'btn danger', onclick: async () => { if (!(await UI().confirm('Стати піратом і напасти на торговий корабель? Королівство цього порту розгнівається.'))) return; UI().closeAll(); GM().passTime(g, 1); await naval('merchant', Math.max(3, p.level)); } }, '💰 Піратський рейд на купців'),
        h('button', { class: 'btn pink', onclick: async () => { UI().closeAll(); GM().passTime(g, 1); await naval('kraken', p.level + 4); } }, '🦑 Шукати кракена')));
      if ((p.flags.pirate || 0) >= 3) w.append(h('div', { class: 'tag' }, `🏴‍☠️ Слава пірата: ${p.flags.pirate} рейдів`));
      return w;
    } });
  }

  // ---------------- voice settings (pitch & speed per voice) ----------------
  function voices() {
    const V = ISK.voice; const list = V.voiceList();
    UI().modal({ title: 'Голоси персонажів', icon: '🎙️', size: 'mid', sub: 'Тембр і швидкість кожного голосу окремо', body: () => {
      const w = h('div', { class: 'col' });
      w.append(h('div', { class: 'muted' }, V.settings.mode === 'neural' && V.settings.installed ? 'Нейроозвучка активна.' : 'Налаштування діють для нейроозвучки, системного голосу й аніме-бурмотіння.'));
      for (const v of list) {
        const cur = V.getCustom(v.id);
        const pitch = h('input', { type: 'range', min: 0.6, max: 1.5, step: 0.01, value: cur.pr });
        const speed = h('input', { type: 'range', min: 0.6, max: 1.6, step: 0.01, value: cur.sp });
        const lbl = h('span', { class: 'muted' }, `тембр ${(+cur.pr).toFixed(2)} · швидкість ${(1 / cur.sp).toFixed(2)}`);
        const upd = () => { V.setCustom(v.id, { pr: +pitch.value, sp: +speed.value }); lbl.textContent = `тембр ${(+pitch.value).toFixed(2)} · швидкість ${(1 / +speed.value).toFixed(2)}`; };
        pitch.oninput = upd; speed.oninput = upd;
        w.append(h('div', { class: 'voice-row' }, h('div', { class: 'nm' }, `${v.icon} ${v.name}`), h('label', null, '🎚️ Тембр', pitch), h('label', null, '⏩ Повільно ↔ швидко', speed), lbl,
          h('div', { class: 'row', style: { gap: '4px' } }, h('button', { class: 'btn small', onclick: () => V.say(v.speaker, v.sample, v.g) }, '▶ Прослухати'), h('button', { class: 'btn small ghost', onclick: () => { V.resetCustom(v.id); reopen(voices); } }, '↺'))));
      }
      return w;
    } });
  }

  // ---------------- context menu (right click) ----------------
  function contextMenu(x, y, items) {
    document.querySelectorAll('.ctx-menu').forEach((e) => e.remove());
    const el = h('div', { class: 'ctx-menu', style: { left: Math.min(x, innerWidth - 240) + 'px', top: Math.min(y, innerHeight - items.length * 34 - 20) + 'px' } },
      items.filter(Boolean).map((it) => it === '-' ? h('div', { class: 'ctx-sep' }) : h('div', { class: 'ctx-item' + (it.disabled ? ' off' : ''), onclick: (e) => { e.stopPropagation(); el.remove(); if (!it.disabled) it.fn(); } }, h('span', { class: 'ci' }, it.icon || '•'), it.label)));
    document.body.appendChild(el);
    const off = (e) => { if (!el.contains(e.target)) { el.remove(); window.removeEventListener('mousedown', off, true); } };
    setTimeout(() => window.addEventListener('mousedown', off, true), 0);
    return el;
  }
  function mapContext(e, node, extras) {
    const g = G(); if (!g) return; const p = g.player; const items = [];
    if (node) {
      const [k, id] = node.split(':'); const here = p.location === node; const known = g.discovered[node];
      const name = UI().nodeName(node);
      items.push({ icon: '📍', label: `${known ? name : '???'}`, disabled: true }, '-');
      items.push({ icon: 'ℹ️', label: 'Інформація', fn: () => UI().showInfo(node) });
      if (!here) items.push({ icon: '🧭', label: 'Подорожувати сюди', fn: () => UI().startTravel(node) });
      items.push({ icon: '🔍', label: 'Центрувати мапу', fn: () => ISK.render.centerOn(node) });
      if (ISK.nav) items.push('-', ...ISK.nav.contextItems(node), '-');
      if (here && k === 'b') {
        const B = g.world.baronies[+id];
        if (LF().lordsAt(g, B.id).length) items.push({ icon: '👑', label: 'Аудієнція у лордів', fn: () => lords(B.id) });
        items.push({ icon: '⚔️', label: 'Моє військо', fn: army });
        if (p.house && p.house.barony === B.id) items.push({ icon: '🏡', label: 'Додому (садиба)', fn: () => ISK.estate.open('house') });
        if (p.holdings.includes(B.id)) items.push({ icon: '🏰', label: 'Мої землі', fn: () => ISK.estate.open('land', B.id) });
        items.push({ icon: '⏳', label: 'Відпочити день', fn: () => { UI().showNews(GM().passTime(g, 1)); p.hp = Math.min(PL().maxHp(p), p.hp + Math.round(PL().maxHp(p) * 0.3)); UI().refresh(); } });
      }
      if (here && k === 'd') items.push({ icon: '🕳️', label: 'Увійти в підземелля', fn: () => ISK.dungeonUI.enter(+id) });
    }
    for (const a of extras || []) items.push(a);
    contextMenu(e.clientX, e.clientY, items);
  }

  // ---------------- goddess call popup ----------------
  function goddessPopup() {
    const g = G(); if (!g || !g.life || !g.life.call || UI().modalStack.length || UI().inCombat || UI().travelling) return;
    const c = g.life.call; g.life.call = null;
    const expr = { lowhp: 'shock', death: 'sad', rich: 'wink', married: 'happy2', levelup: 'happy2', winter: 'happy' }[c.ctx] || pick(['happy', 'wink', 'happy2']);
    A().play('goddess'); ISK.voice.say('Богиня Люмі', c.text, 'f');
    const el = h('div', { class: 'goddess-call' }, SP().img(SP().goddess(expr), 96), h('div', null, h('div', { class: 'gc-title' }, '📞 Дзвінок від богині Люмі'), h('div', { class: 'gc-text' }, c.text), c.gift ? h('div', { class: 'gold' }, `🎁 Подарунок: ${PL().item(c.gift).name}`) : null), h('button', { class: 'close-x', onclick: () => el.remove() }, '✕'));
    document.body.appendChild(el); setTimeout(() => el.classList.add('in'), 20); setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 500); }, 9000);
  }

  ISK.panels2 = { lords, audience, army, family, naval, shipyard, voices, contextMenu, mapContext, goddessPopup };
})();
