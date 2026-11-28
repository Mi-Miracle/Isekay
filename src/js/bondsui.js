// Хроніки Дивосвіту v5.9 — інтерфейс легендарних супутників («Серця») і власного клану.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = () => ISK.ui, D = () => ISK.data, PL = () => ISK.player, GM = () => ISK.game, SP = () => ISK.sprites, A = () => ISK.audio, B = () => ISK.bonds;
  const G = () => UI().G;
  const h = (...a) => UI().h(...a);
  const reopen = (fn) => { UI().closeAll(); fn(); };

  // ---------- портрети ----------
  const cache = new Map();
  function sprite(id) {
    if (cache.has(id)) return cache.get(id);
    const L = D().LEGENDS[id]; const c = SP().humanoid({ ...L.look }); cache.set(id, c); return c;
  }
  // підміняємо портрет товариша, якщо це легенда
  function patchSprites() {
    const S = SP(); if (!S || S._legendPatched) return; const orig = S.forCompanion;
    S.forCompanion = (c) => (c && c.legend && D().LEGENDS[c.legend] ? sprite(c.legend) : orig(c)); S._legendPatched = true;
  }

  // ---------- сцени ----------
  const BG = { f: 'radial-gradient(circle at 50% 30%, rgba(255,215,235,.93), rgba(120,70,160,.88))', m: 'radial-gradient(circle at 50% 30%, rgba(210,225,255,.93), rgba(40,50,110,.9))' };
  async function scene(id, lines, choices) {
    const L = D().LEGENDS[id]; const stage = ISK.story.overlayStage(BG[L.gender] || BG.f);
    ISK.story.setPortrait(stage, sprite(id));
    let res;
    for (let i = 0; i < lines.length; i++) {
      const ln = typeof lines[i] === 'string' ? { who: lines[i].includes('«') ? L.name : 'Оповідач', text: lines[i] } : lines[i];
      const last = i === lines.length - 1;
      res = await ISK.story.dialog([{ who: ln.who, text: ln.text, choices: last && choices ? choices : undefined }], { stage });
    }
    stage.remove(); return res;
  }
  let busy = false;
  async function trigger(when, ctx = {}) {
    if (busy || !G() || ((globalThis.ISK_AUTOPLAY || globalThis.ISK_NOENCOUNTER) && !ctx.force)) return null;
    const id = ctx.force || B().rollMeet(G(), when, ctx); if (!id) return null;
    busy = true;
    try { await playMeet(id); } finally { busy = false; }
    return id;
  }
  async function playMeet(id) {
    const L = D().LEGENDS[id], g = G(), p = g.player;
    A().play('goddess'); UI().cutin(L.name.toUpperCase(), `«${L.title}» з'являється!`, L.gender === 'm' ? '#7cb8ff' : '#ff8ad0');
    await UI().sleep(globalThis.ISK_AUTOPLAY ? 10 : 900);
    const full = p.party.length >= B().partyCap(p);
    const pick = await scene(id, L.intro.map((x) => ({ who: x.who, text: x.text })), [
      { label: full ? '💞 Домовитись зустрітися пізніше (загін повний)' : '💞 Ходімо разом!', value: full ? 'later' : 'join' },
      { label: '🤔 Може, іншим разом', value: 'later' },
    ]);
    B().meet(g, id);
    if (pick === 'join') { const e = B().join(g, id); if (e) UI().toast(e, 'bad'); else { A().play('win'); UI().toast(`💘 ${L.name} приєднується до загону!`, 'epic', 3500); } }
    else UI().toast(`💌 ${L.name}: «Знайдеш мене через вікно «Серця» (U). Не змушуй чекати!»`, 'good', 4500);
    UI().refresh();
  }
  async function playChapter(id) {
    const g = G(), p = g.player, L = D().LEGENDS[id]; const ch = B().nextChapter(p, id); if (!ch) return;
    const intro = ch.boss ? ch.text.slice(0, 1) : ch.text;
    await scene(id, [{ who: `📖 Розділ ${ch.idx + 1}: ${ch.title}`, text: intro[0] }, ...intro.slice(1).map((t) => ({ who: t.includes('«') ? L.name : 'Оповідач', text: t }))]);
    if (ch.boss) {
      const lvl = p.level + (ch.boss.lvlAdd || 3);
      const r = await ISK.combatUI.run([ISK.combat.makeEnemy(ch.boss.key, lvl, { elite: true, noScale: true, name: ch.boss.name })], { boss: true, noLegend: true, biome: 'plains' });
      if (r !== 'win') { UI().toast(`💔 ${L.name}: «Нічого... спробуємо ще раз. Разом.»`, 'bad', 4000); return; }
      await scene(id, ch.text.slice(1).map((t) => ({ who: t.includes('«') ? L.name : 'Оповідач', text: t })));
    }
    const res = B().completeChapter(g, id); if (!res) return;
    const r = res.reward; const STN = { str: 'Сила', agi: 'Спритність', int: 'Інтелект', vit: 'Витривалість', luk: 'Удача' };
    A().play('level');
    UI().cutin(`РОЗДІЛ ${ch.idx + 1}: ${ch.title.toUpperCase()}`, `${L.name} · ${B().TIER_NAMES[B().bondTier(B().st(p, id).bond)]}`, '#ff8ad0');
    UI().toast(`📖 Нагорода: +${r.n} ${STN[r.stat]}${r.gold ? ` · +${r.gold}🪙` : ''}${r.fame ? ` · +${r.fame}⭐` : ''}${r.sigUp ? ` · фірмовий прийом «${L.sig.name}» посилено!` : ''}`, 'epic', 5000);
    UI().refresh();
  }

  // ---------- вікно «Серця» ----------
  function bar(v, max, col) { return h('div', { class: 'bond-bar' }, h('div', { class: 'fill', style: { width: Math.round((v / max) * 100) + '%', background: col } })); }
  function hintFor(L) {
    const m = L.meet; const T = { town: 'містечка', city: 'міста', capital: 'столиці', village: 'села', fortress: 'фортеці', port: 'порти', mine: 'шахтарські поселення' };
    const where = m.when === 'arrive' ? `приходь у ${(m.types || []).map((t) => T[t] || t).join(', ')}` : m.when === 'res' ? 'досліджуй угіддя в природі' : m.when === 'win' ? (m.lowHp ? 'вигравай бої на межі сил' : 'перемагай у боях') : 'відпочивай';
    return `З\'являється з ${m.minLvl || 1} рівня: ${where}.`;
  }
  function legendCard(id, onChange) {
    const g = G(), p = g.player, L = D().LEGENDS[id], s = B().st(p, id);
    if (!s) return h('div', { class: 'item legend locked' }, h('div', { class: 'legend-portrait silhouette' }, SP().img(sprite(id), 56)), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `❓ ??? — ${L.type}`), h('div', { class: 'ds' }, hintFor(L))));
    const c = B().inParty(p, id); const tier = B().bondTier(s.bond); const nxt = L.chapters[s.ch];
    const ready = B().nextChapter(p, id);
    const acts = h('div', { class: 'acts col' },
      c ? h('button', { class: 'btn small ghost', onclick: () => { B().leave(g, id); onChange(); } }, '🏡 Відпочити') : h('button', { class: 'btn small primary', onclick: () => { const e = B().join(g, id); if (e) UI().toast(e, 'bad'); else { A().play('coin'); onChange(); } } }, '🤝 У загін'),
      h('button', { class: 'btn small', onclick: () => doTalk(id, onChange) }, '💬 Розмова'),
      h('button', { class: 'btn small', onclick: () => giftPicker(id, onChange) }, '🎁 Подарунок'),
      ready ? h('button', { class: 'btn small primary glow', onclick: async () => { UI().closeAll(); await playChapter(id); legendsPanel(); } }, `📖 Розділ ${ready.idx + 1}${ready.boss ? ' ⚔️' : ''}`) : null);
    return h('div', { class: 'item legend' + (c ? ' r2' : '') },
      h('div', { class: 'legend-portrait' }, SP().img(sprite(id), 56)),
      h('div', { style: { flex: 1 } },
        h('div', { class: 'nm' }, `${L.icon} ${L.name} — «${L.title}»`, c ? h('span', { class: 'tag ally', style: { marginLeft: '6px' } }, 'у загоні') : null),
        h('div', { class: 'ds' }, `${L.type} · ${D().CLAN.roles[L.role][0]} ${D().CLAN.roles[L.role][1]} · рів. ${c ? c.lvl : s.lvl} · фірмовий прийом: ${L.sig.icon} ${L.sig.name}${s.sig === 2 ? ' ★' : ''}`),
        h('div', { class: 'ds', style: { fontStyle: 'italic', margin: '3px 0' } }, L.bio),
        h('div', { class: 'row', style: { gap: '8px', alignItems: 'center' } }, h('span', { class: 'muted', style: { fontSize: '12px', minWidth: '118px' } }, `💗 ${B().TIER_NAMES[tier]} ${s.bond}/100`), bar(s.bond, 100, 'linear-gradient(90deg,#ff7ab8,#ffb0e0)')),
        h('div', { class: 'ds' }, s.ch >= L.chapters.length ? '🌟 Історію завершено. Ви — легенда разом.' : `📖 Розділ ${s.ch + 1} «${nxt.title}» — з прихильності ${nxt.bond}${nxt.boss ? ' (особистий ворог!)' : ''}`)),
      acts);
  }
  function doTalk(id, onChange) {
    const r = B().talk(G(), id); if (!r) return; const L = D().LEGENDS[id];
    ISK.story.npcTalk(L.name, r.line + (r.gain ? `\n\n💗 +${r.gain}` : '\n\n(Сьогодні ви вже говорили — прихильність не росте, але їй приємно.)'), sprite(id)).then(async () => {
      if (r.jealous) await ISK.story.npcTalk(r.jealous.name, '😤 ' + r.jealous.text, sprite(r.jealous.id));
      onChange();
    });
  }
  function giftPicker(id, onChange) {
    const p = G().player, L = D().LEGENDS[id];
    const ids = Object.keys(p.inventory).filter((k) => p.inventory[k] > 0 && PL().item(k) && !Object.values(p.equipment).includes(k));
    ids.sort((a, b) => (B().likes(id, PL().item(b)) ? 1 : 0) - (B().likes(id, PL().item(a)) ? 1 : 0));
    const m = UI().modal({ title: `Подарунок для ${L.name}`, icon: '🎁', size: 'mid', body: () => h('div', { class: 'items' }, ids.length ? ids.slice(0, 60).map((k) => { const it = PL().item(k); const lk = B().likes(id, it); return h('div', { class: 'item' + (lk ? ' r3' : ''), style: { cursor: 'pointer' }, onclick: () => { const r = B().gift(G(), id, k); if (r.err) return UI().toast(r.err, 'bad'); m.close(); A().play('coin'); UI().toast(`${r.liked ? '😍' : '🙂'} ${L.name} ${r.liked ? 'у захваті' : 'дякує'}: ${it.icon} ${it.name}. 💗 +${r.gain}`, r.liked ? 'epic' : 'good', 3500); onChange(); } }, h('div', { class: 'ic' }, it.icon), h('div', null, h('div', { class: 'nm' }, `${it.name} ×${p.inventory[k]}`), h('div', { class: 'ds' }, lk ? '💗 Улюблене!' : 'Звичайний подарунок'))); }) : h('div', { class: 'muted' }, 'У торбі порожньо. Навіть лушпиння від насіння немає.')) });
  }
  function legendsPanel() {
    const p = G().player; const ids = Object.keys(D().LEGENDS);
    const met = ids.filter((id) => B().st(p, id)); const unmet = ids.filter((id) => !B().st(p, id));
    UI().modal({ title: 'Серця — легендарні супутники', icon: '💘', size: 'big', sub: `Зустрінуто: ${met.length}/${ids.length} · загін ${p.party.length}/${B().partyCap(p)} · легенди не беруть платні, ростуть з прихильністю й мають власні історії`, body: () => {
      const w = h('div', { class: 'col' });
      if (!met.length) w.appendChild(h('div', { class: 'quest' }, '💌 Поки що ти нікого не зустрів. Мандруй, заходь у міста, бийся — і доля сама впаде на тебе. Іноді буквально.'));
      for (const id of met) w.appendChild(legendCard(id, () => reopen(legendsPanel)));
      if (unmet.length) { w.appendChild(h('h4', null, 'Ще не зустрінуті')); for (const id of unmet) w.appendChild(legendCard(id, () => {})); }
      return w;
    } });
  }

  // ---------- вікно клану ----------
  function clanPanel(tab) {
    const g = G(), p = g.player;
    if (!p.clan) return foundPanel();
    const c = p.clan, C = D().CLAN;
    const tabs = [
      { id: 'main', label: '🏯 Огляд', render: () => tabMain() },
      { id: 'members', label: `👥 Члени (${c.members.length}/${B().memberCap(c)})`, render: () => tabMembers() },
      { id: 'missions', label: `📋 Контракти${c.missions.length ? ` (${c.missions.length})` : ''}`, render: () => tabMissions() },
      { id: 'hall', label: '🏗️ Зала', render: () => tabHall() },
      { id: 'war', label: '⚔️ Війна гільдій', render: () => tabWar() },
      { id: 'log', label: '📰 Літопис', render: () => h('div', null, c.log.map((l) => h('div', { class: 'chron' }, h('span', { class: 'd' }, GM().dateStr(l.d)), l.text))) },
    ];
    UI().modal({ title: `${c.icon} Клан «${c.name}»`, icon: '🏯', size: 'big', sub: `«${c.motto}» · рівень ${c.lvl} · зала в ${B().seatName(g)}`, tabs, tab: tab || 'main' });
    function again(t) { reopen(() => clanPanel(t)); }
    function tabMain() {
      const need = C.xpNeed(c.lvl); const pk = B().perks(p);
      const w = h('div', { class: 'col' });
      w.appendChild(h('div', { class: 'row', style: { alignItems: 'center', gap: '14px' } }, h('div', { class: 'clan-emblem' }, c.icon), h('div', { style: { flex: 1 } }, h('h3', null, c.name), h('div', { class: 'muted' }, `Засновано ${GM().dateStr(c.founded)} · перемог у війнах: ${c.wars}`), h('div', { class: 'row', style: { gap: '8px', alignItems: 'center', marginTop: '6px' } }, h('span', { class: 'muted', style: { fontSize: '12px' } }, `Рів. ${c.lvl}${c.lvl >= C.maxLvl ? ' (макс.)' : ` · ${c.xp}/${need}`}`), bar(c.lvl >= C.maxLvl ? 1 : c.xp, c.lvl >= C.maxLvl ? 1 : need, 'linear-gradient(90deg,#ffd36e,#ff9a3a)')))));
      w.appendChild(h('div', { class: 'kv' }, h('div', { class: 'k' }, '💰 Скарбниця'), h('div', null, `${c.bank} 🪙`), h('div', { class: 'k' }, '✨ Досвід у боях'), h('div', null, `+${Math.round(pk.xp * 100)}%`), h('div', { class: 'k' }, '🪙 Золото з боїв'), h('div', null, `+${Math.round(pk.gold * 100)}%`), h('div', { class: 'k' }, '👥 Місць у загоні'), h('div', null, String(pk.slots))));
      const amt = h('input', { type: 'number', value: '100', min: '1', style: { width: '90px' } });
      w.appendChild(h('div', { class: 'row', style: { gap: '6px', alignItems: 'center' } }, '🪙', amt,
        h('button', { class: 'btn small', onclick: () => { const e = B().deposit(g, +amt.value); if (e) UI().toast(e, 'bad'); else { A().play('coin'); again('main'); } } }, '⬇️ Покласти'),
        h('button', { class: 'btn small', onclick: () => { const e = B().withdraw(g, +amt.value); if (e) UI().toast(e, 'bad'); else { A().play('coin'); again('main'); } } }, '⬆️ Забрати'),
        pk.portal ? h('button', { class: 'btn small primary', title: 'Телепорт до зали клану (півдня)', onclick: () => portal() }, '🌀 До зали клану') : null));
      w.appendChild(h('h4', null, 'Переваги клану'));
      for (const pr of C.perks) w.appendChild(h('div', { class: 'ds', style: { opacity: c.lvl >= pr.lvl ? 1 : 0.45 } }, `${c.lvl >= pr.lvl ? '✅' : '🔒'} Рів. ${pr.lvl}: ${pr.icon} ${pr.text}`));
      w.appendChild(h('div', { class: 'muted', style: { marginTop: '8px' } }, 'Клан росте від твоїх перемог, контрактів, будівництва зали та війн з іншими гільдіями. Почесні члени — усі легенди, яких ти зустрів: ' + (Object.keys(B().legends(p)).map((id) => D().LEGENDS[id] && D().LEGENDS[id].icon + ' ' + D().LEGENDS[id].name).join(', ') || 'поки нікого') + '.'));
      return w;
    }
    function tabMembers() {
      const w = h('div', { class: 'col' }); const d = Math.floor(g.time);
      if (!c.members.length) w.appendChild(h('div', { class: 'muted' }, 'У клані поки лише ти. Самотній, але гордий. Найми когось нижче.'));
      for (const m of c.members) { const R = C.roles[m.role]; const race = D().RACES[m.race]; w.appendChild(h('div', { class: 'item' }, SP().img(SP().npc('clan' + m.id, { female: m.gender === 'f', race: m.race, weapon: { warrior: 'sword', mage: 'staff', healer: 'holy', archer: 'bow', rogue: 'dagger' }[m.role] }), 36), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${m.name} — ${R[0]} ${R[1]}, рів. ${m.lvl}`), h('div', { class: 'ds' }, `${race ? race.name : ''} · ${m.quirk}${m.busy > d ? ` · 🧭 на контракті ще ${m.busy - d} дн.` : ' · вільний(а)'}`)), h('div', { class: 'acts' }, h('button', { class: 'btn small ghost', onclick: async () => { if (await UI().confirm(`Виключити ${m.name} з клану?`)) { const e = B().dismiss(g, m.id); if (e) UI().toast(e, 'bad'); else again('members'); } } }, 'Виключити')))); }
      w.appendChild(h('h4', null, `Кандидати цього тижня (оплата зі скарбниці або з гаманця)`));
      for (const k of B().candidates(g)) { const R = C.roles[k.role]; w.appendChild(h('div', { class: 'item' }, SP().img(SP().npc('clan' + k.id, { female: k.gender === 'f', race: k.race }), 36), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${k.name} — ${R[0]} ${R[1]}, рів. ${k.lvl}`), h('div', { class: 'ds' }, `${D().RACES[k.race] ? D().RACES[k.race].name : ''} · ${k.quirk}`)), h('div', { class: 'acts' }, h('button', { class: 'btn small primary', onclick: () => { const e = B().recruitMember(g, k.id); if (e) UI().toast(e, 'bad'); else { A().play('coin'); UI().toast(`🤝 ${k.name} вступає до клану!`, 'good'); again('members'); } } }, `Прийняти ${k.fee}🪙`)))); }
      return w;
    }
    function tabMissions() {
      const w = h('div', { class: 'col' }); const d = Math.floor(g.time);
      if (c.missions.length) { w.appendChild(h('h4', null, 'В дорозі')); for (const ms of c.missions) w.appendChild(h('div', { class: 'quest' }, `${ms.icon} ${ms.name} · повернуться через ${Math.max(0, ms.until - d)} дн. · шанс ${Math.round(ms.chance * 100)}%`)); }
      w.appendChild(h('h4', null, 'Контракти тижня'));
      const free = c.members.filter((m) => !(m.busy > d));
      for (const con of B().contracts(g)) {
        const taken = c.missions.some((m) => m.uid === con.uid);
        const sel = new Set(); const chanceEl = h('span', { class: 'tag' }, '—');
        const upd = () => { const ms = free.filter((m) => sel.has(m.id)); chanceEl.textContent = ms.length ? `шанс ${Math.round(B().chanceOf(g, con, ms) * 100)}%` : 'обери загін'; };
        const picks = h('div', { class: 'row', style: { flexWrap: 'wrap', gap: '4px' } }, free.map((m) => h('label', { class: 'tag', style: { cursor: 'pointer' } }, h('input', { type: 'checkbox', onchange: (e) => { if (e.target.checked) sel.add(m.id); else sel.delete(m.id); upd(); } }), ` ${C.roles[m.role][0]} ${m.name} ${m.lvl}`)));
        w.appendChild(h('div', { class: 'item', style: { flexDirection: 'column', alignItems: 'stretch' } },
          h('div', { class: 'row', style: { alignItems: 'center', gap: '8px' } }, h('div', { style: { fontSize: '26px' } }, con.icon), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${con.name} ${'💀'.repeat(con.diff)}`), h('div', { class: 'ds' }, `${con.days} дн. · ~${con.gold}🪙 у скарбницю · ${con.xp} досвіду клану${con.item && D().getItem(con.item[0]) ? ` · ${PL().item(con.item[0]).icon}×${con.item[1]}` : ''}${con.fame ? ` · ⭐${con.fame}` : ''}`)), chanceEl),
          taken ? h('div', { class: 'muted' }, '✅ Уже виконується') : free.length ? picks : h('div', { class: 'muted' }, 'Немає вільних членів клану.'),
          taken || !free.length ? null : h('div', { class: 'row' }, h('button', { class: 'btn small primary', onclick: () => { const e = B().sendMission(g, con.uid, [...sel]); if (e) UI().toast(e, 'bad'); else { A().play('click'); UI().toast(`${con.icon} Загін вирушив!`, 'good'); again('missions'); } } }, '🚩 Відправити'))));
      }
      w.appendChild(h('div', { class: 'muted' }, 'Контракти оновлюються щотижня. Різні ролі в загоні дають бонус, цілитель — особливо. Результат прийде в новинах.'));
      return w;
    }
    function tabHall() {
      const w = h('div', { class: 'col' }, h('div', { class: 'muted' }, `Будівництво оплачується зі скарбниці клану (зараз ${c.bank}🪙). Рівень будівлі не може перевищувати рівень клану + 1.`));
      for (const [k, H] of Object.entries(C.hall)) { const l = B().hallLvl(c, k); w.appendChild(h('div', { class: 'item' }, h('div', { class: 'ic' }, H.icon), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${H.name} ${'★'.repeat(l)}${'☆'.repeat(H.max - l)}`), h('div', { class: 'ds' }, H.desc)), h('div', { class: 'acts' }, l < H.max ? h('button', { class: 'btn small primary', onclick: () => { const e = B().upgradeHall(g, k); if (e) UI().toast(e, 'bad'); else { A().play('clang'); UI().toast(`${H.icon} ${H.name}: рівень ${l + 1}!`, 'good'); again('hall'); } } }, `${l ? 'Покращити' : 'Збудувати'} ${H.cost[l]}🪙`) : h('span', { class: 'tag ally' }, 'Макс.')))); }
      return w;
    }
    function tabWar() {
      const w = h('div', { class: 'col' }, h('div', { class: 'muted' }, 'Виклич чемпіонів іншої гільдії на показовий бій. Перемога — золото в скарбницю, слава і досвід клану. Перерва між боями — 5 днів.'));
      const ready = B().warReady(g);
      for (const R of D().RIVAL_GUILDS || []) w.appendChild(h('div', { class: 'item' }, h('div', { class: 'ic' }, R.icon), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${R.name} · перемог над ними: ${c.rep[R.id] || 0}`), h('div', { class: 'ds' }, `«${R.motto}»`)), h('div', { class: 'acts' }, h('button', { class: 'btn small primary', disabled: !ready, onclick: () => war(R.id) }, ready ? '⚔️ Виклик' : `⏳ з ${GM().dateStr(c.warCool)}`))));
      return w;
    }
  }
  async function war(rid) {
    const g = G(); const en = B().warEnemies(g, rid); if (!en) return; UI().closeAll();
    const R = D().RIVAL_GUILDS.find((x) => x.id === rid);
    await UI().alert('Війна гільдій!', `${R.icon} «${R.name}» приймає виклик клану «${g.player.clan.name}». Натовп роздає ставки й попкорн.`, '⚔️');
    const r = await ISK.combatUI.run(en, { noLegend: true, biome: 'plains' });
    const res = B().warResult(g, rid, r === 'win');
    if (r === 'win') UI().toast(`🏯 Клан переміг «${R.name}»! +${res.gold}🪙 у скарбницю`, 'epic', 4000); else UI().toast('💢 Поразка. Чемпіони суперників показують язики.', 'bad');
    UI().refresh();
  }
  function portal() {
    const g = G(), p = g.player, c = p.clan; const node = 'b:' + c.seat; if (p.location === node) return UI().toast('Ти вже біля зали клану.', '');
    UI().closeAll(); UI().showNews(GM().passTime(g, 0.5)); GM().arrive(g, node); A().play('goddess'); UI().toast(`🌀 Клановий портал: ${B().seatName(g)}`, 'good'); ISK.render.centerOn(node); UI().refresh();
  }
  function foundPanel() {
    const g = G(), p = g.player, C = D().CLAN; const err = B().clanCan(g);
    const inGuildTown = (() => { const hr = GM().here(g); return hr.kind === 'barony' && ISK.world.SETTLEMENT[hr.B.type].services.includes('guild'); })();
    let icon = C.icons[0];
    const name = h('input', { type: 'text', placeholder: 'Напр.: Нічні Сови', maxlength: '28', style: { width: '100%' } });
    const motto = h('input', { type: 'text', placeholder: 'Девіз (необов\'язково)', maxlength: '60', style: { width: '100%' } });
    const icons = h('div', { class: 'row', style: { flexWrap: 'wrap', gap: '4px' } });
    const drawIcons = () => { icons.innerHTML = ''; for (const ic of C.icons) icons.appendChild(h('button', { class: 'btn small' + (ic === icon ? ' primary' : ''), onclick: () => { icon = ic; drawIcons(); } }, ic)); };
    drawIcons();
    UI().modal({ title: 'Заснувати власний клан', icon: '🏯', size: 'mid', body: () => h('div', { class: 'col' },
      h('div', { class: 'muted' }, `Клан — твоя власна гільдія: члени клану ходять на контракти й приносять золото, зала клану росте, а переваги посилюють тебе і загін (до 5 товаришів!). Вартість: ${C.cost}🪙, потрібен ${C.minLvl} рівень і ранг гільдії ${D().GUILD_RANKS[C.minRank].r}. Засновується в місті з гільдією — там буде зала клану.`),
      h('label', null, 'Назва клану'), name, h('label', null, 'Девіз'), motto, h('label', null, 'Герб'), icons,
      err ? h('div', { class: 'bad' }, '⚠️ ' + err) : !inGuildTown ? h('div', { class: 'bad' }, '⚠️ Прийди в місто з гільдією авантюристів.') : null,
      h('div', { class: 'row' }, h('button', { class: 'btn primary', disabled: !!err || !inGuildTown, onclick: () => { const e = B().foundClan(g, { name: name.value, motto: motto.value, icon }); if (e) return UI().toast(e, 'bad'); A().play('win'); UI().closeAll(); UI().cutin('КЛАН ЗАСНОВАНО!', `${icon} ${p.clan.name}`, '#ffd36e'); UI().refresh(); setTimeout(() => clanPanel(), globalThis.ISK_AUTOPLAY ? 0 : 1200); } }, `🏯 Заснувати (${C.cost}🪙)`))) });
  }

  patchSprites();
  ISK.bondsUI = { sprite, patchSprites, trigger, playMeet, playChapter, legends: legendsPanel, clan: clanPanel, war, portal };
})();
