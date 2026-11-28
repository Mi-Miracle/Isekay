// Core UI v2: DOM helpers, modals, toasts, anime cut-ins, HUD, location & info panels, travel (mounts/ships), map input (mouse, WASD, minimap).
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const $ = (s, r = document) => r.querySelector(s);
  const A = () => ISK.audio;
  const GM = () => ISK.game;
  const PL = () => ISK.player;

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), (e) => { if (k === 'onclick' && el.tagName === 'BUTTON') A().play('click'); v(e); });
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) { if (kid === null || kid === undefined || kid === false) continue; el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid))); }
    return el;
  }
  const UI = { G: null, modalStack: [] };

  function modal(opts) {
    const root = $('#modal-root'); $('#overlay').classList.remove('hidden');
    const close = () => { el.remove(); UI.modalStack = UI.modalStack.filter((m) => m.el !== el); if (!UI.modalStack.length) $('#overlay').classList.add('hidden'); opts.onClose && opts.onClose(); refresh(); };
    const body = h('div', { class: 'modal-body' });
    const el = h('div', { class: 'modal ' + (opts.size || '') },
      h('div', { class: 'modal-head' }, opts.iconEl || (opts.icon ? h('div', { style: { fontSize: '30px' } }, opts.icon) : null),
        h('div', null, h('h2', null, opts.title), opts.sub ? h('div', { class: 'sub' }, opts.sub) : null), h('div', { class: 'spacer' }),
        opts.noClose ? null : h('button', { class: 'close-x', onclick: close, title: 'Закрити (Esc)' }, '✕')),
      opts.tabs ? tabsEl(opts.tabs, body, opts.tab) : null, body, opts.foot ? h('div', { class: 'modal-foot' }, opts.foot) : null);
    if (!opts.tabs) { const b = typeof opts.body === 'function' ? opts.body(body) : opts.body; if (b) body.appendChild(b); }
    root.appendChild(el);
    const m = { el, close, body, noClose: opts.noClose }; UI.modalStack.push(m); return m;
  }
  function tabsEl(tabs, body, initial) {
    const bar = h('div', { class: 'tabs' });
    const show = (t) => { [...bar.children].forEach((b) => b.classList.toggle('active', b.dataset.id === t.id)); body.innerHTML = ''; body.appendChild(t.render()); };
    for (const t of tabs) bar.appendChild(h('button', { 'data-id': t.id, onclick: () => show(t) }, t.label));
    setTimeout(() => show(tabs.find((t) => t.id === initial) || tabs[0]), 0);
    return bar;
  }
  function closeTop() { const m = UI.modalStack[UI.modalStack.length - 1]; if (m && !m.noClose) { m.close(); return true; } return false; }
  function closeAll() { while (UI.modalStack.length) UI.modalStack[UI.modalStack.length - 1].close(); }
  function confirmBox(text, yes = 'Так', no = 'Ні') {
    if (globalThis.ISK_AUTOPLAY) return Promise.resolve(true);
    return new Promise((res) => { const m = modal({ title: 'Підтвердження', size: 'narrow', body: h('div', { style: { fontSize: '16px', lineHeight: 1.5, whiteSpace: 'pre-wrap' } }, text), noClose: true, foot: [h('button', { class: 'btn', onclick: () => { m.close(); res(false); } }, no), h('button', { class: 'btn primary', onclick: () => { m.close(); res(true); } }, yes)] }); });
  }
  function alertBox(title, text, icon) {
    return new Promise((res) => { const m = modal({ title, icon, size: 'narrow', body: h('div', { style: { fontSize: '15.5px', lineHeight: 1.55, whiteSpace: 'pre-wrap' } }, text), onClose: res, foot: [h('button', { class: 'btn primary', onclick: () => m.close() }, 'Гаразд')] }); if (globalThis.ISK_AUTOPLAY) setTimeout(() => m.close(), 30); });
  }
  function toast(text, cls = '', ms = 3200) {
    const t = h('div', { class: 'toast ' + cls }, text); $('#toasts').appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, ms);
    while ($('#toasts').children.length > 5) $('#toasts').firstChild.remove();
  }
  // anime-style diagonal cut-in banner
  function cutin(big, small, color) {
    const el = h('div', { class: 'cutin', style: color ? { '--c': color } : null }, h('div', { class: 'cutin-band' }, h('div', { class: 'cutin-big' }, big), small ? h('div', { class: 'cutin-small' }, small) : null));
    document.body.appendChild(el); setTimeout(() => el.remove(), 1600);
  }
  function sparkle(x, y, n = 14, chars = ['✦', '✧', '★', '♥']) {
    for (let i = 0; i < n; i++) {
      const s = h('div', { class: 'spark', style: { left: x + 'px', top: y + 'px', '--dx': (Math.random() * 240 - 120) + 'px', '--dy': (Math.random() * -200 - 30) + 'px' } }, chars[i % chars.length]);
      document.body.appendChild(s); setTimeout(() => s.remove(), 1100);
    }
  }
  function levelUp(level) { A().play('level'); cutin('LEVEL UP!', `Рівень ${level} · +3 очки характеристик`, '#ffd36e'); sparkle(innerWidth / 2, innerHeight / 2, 24); }

  // ---------------- HUD ----------------
  function refresh() {
    const G = UI.G; if (!G) return;
    const p = G.player, d = PL().derived(p);
    $('#hud-name').textContent = p.name;
    $('#hud-level').textContent = 'Рів. ' + p.level;
    $('#hud-rank').textContent = p.guild.registered ? 'Ранг ' + PL().guildRank(p) : 'Без гільдії';
    $('#hud-social').textContent = `${PL().socialName(p)} · ⭐${Math.floor(p.fame)}`;
    const cls = [p.classes.primary, p.classes.secondary].filter(Boolean).map((c) => { const C = ISK.data.CLASSES[c]; const cx = p.classXp[c]; const adv = cx && cx.adv ? C.adv.find((a) => a.id === cx.adv) : null; const ms = adv && cx.master && adv.master ? adv.master : null; const t = ISK.data.classTier && ISK.data.classTier(c, cx); if (t) return t.icon + ' ' + t.title; return (ms ? ms.icon + ' ' + ms.name : adv ? adv.icon + ' ' + adv.name : C.icon + ' ' + C.name); }).join(' / ');
    $('#hud-class').textContent = cls || 'Без класу';
    const port = $('#hud-portrait'); port.innerHTML = ''; port.appendChild(ISK.sprites.img(ISK.sprites.hero(p), 56));
    const pct = (a, b) => Math.max(0, Math.min(100, (a / b) * 100)) + '%';
    $('#bar-hp').style.width = pct(p.hp, d.maxHp); $('#txt-hp').textContent = `❤️ ${p.hp}/${d.maxHp}`;
    $('#bar-mp').style.width = pct(p.mp, d.maxMp); $('#txt-mp').textContent = `🔷 ${p.mp}/${d.maxMp}`;
    const need = PL().xpNeed(p.level); $('#bar-xp').style.width = pct(p.xp, need); $('#txt-xp').textContent = `✨ ${p.xp}/${need}`;
    $('#hud-gold').textContent = Math.floor(p.gold).toLocaleString('uk');
    $('#hud-date').textContent = GM().dateStr(G.time);
    if (ISK.life) { const env = ISK.life.environment(G); let we = $('#hud-weather'); if (!we) { we = h('div', { id: 'hud-weather', class: 'muted' }); $('#hud-date').after(we); } we.textContent = `${env.season.icon} ${env.season.name} · ${env.weather.icon} ${env.weather.name}`; we.title = `Швидкість подорожі ×${env.travel.toFixed(2)}`; document.body.dataset.season = env.season.id; document.body.dataset.weather = env.weatherKey; }
    const hr = GM().here(G); const realm = GM().realmOfNode(G, p.location);
    $('#hud-loc').textContent = `📍 ${nodeName(p.location)}${realm >= 0 ? ' · ' + G.world.realms[realm].name : ''} · ${ISK.data.MOUNTS[p.mount].icon}`;
    const party = $('#hud-party'); party.innerHTML = '';
    for (const c of p.party) party.appendChild(h('div', { class: 'pmini', title: `${c.name} (${c.roleName}, рів. ${c.lvl})` }, ISK.sprites.img(ISK.sprites.forCompanion(c), 30)));
    const pet = p.pets[p.activePet]; if (pet) party.appendChild(h('div', { class: 'pmini', title: `${pet.name} (рів. ${pet.lvl})` }, ISK.sprites.img(ISK.sprites.forPet(pet.key), 30)));
    const dot = (panel, on) => { const b = document.querySelector(`#side-menu [data-panel="${panel}"]`); if (!b) return; let d0 = b.querySelector('.dot'); if (on && !d0) b.appendChild(h('div', { class: 'dot' })); if (!on && d0) d0.remove(); };
    dot('character', p.statPoints > 0);
    dot('skills', [p.classes.primary, p.classes.secondary].some((c) => c && p.classXp[c] && (p.classXp[c].sp > 0 || (p.classXp[c].lvl >= 10 && !p.classXp[c].adv) || (p.classXp[c].lvl >= 20 && p.classXp[c].adv && !p.classXp[c].master))));
    dot('quests', p.quests.some((q) => GM().questDone(G, q)));
    if (!UI.travelling) renderLocation();
    if (!UI.inCombat && !UI.inDungeon && !UI.inEstate && $('#screen-game').classList.contains('active')) {
      const hb = GM().here(G); let mood = 'field';
      const env = ISK.life ? ISK.life.environment(G) : null;
      let bio = 'plains'; try { bio = biomeAt(p.location); } catch (e) { /* ignore */ }
      if (bio === 'desert') mood = 'desert'; else if (bio === 'forest' || bio === 'jungle') mood = 'forest'; else if (bio === 'beach' || (hb.kind === 'barony' && hb.B.type === 'port')) mood = 'sea'; else if (bio === 'tundra') mood = 'winter';
      if (env && env.season.id === 'winter' && mood === 'field') mood = 'winter';
      if (hb.kind === 'barony') { if (ISK.politics.isDemon(G.P, hb.B.owner)) mood = 'demon'; else if (ISK.life && (ISK.life.eventAt(G, hb.B.id) || {}).key === 'festival') mood = 'festival'; else if (['capital', 'city', 'town', 'port'].includes(hb.B.type)) mood = 'town'; }
      if (p.hp < PL().maxHp(p) * 0.2) mood = 'sad';
      A().setMood(mood);
    }
  }

  const SVC = {
    guild: { icon: '🛡️', name: 'Гільдія' }, tavern: { icon: '🍺', name: 'Таверна' }, shop: { icon: '🛒', name: 'Крамниця' }, smith: { icon: '⚒️', name: 'Кузня' },
    alchemist: { icon: '⚗️', name: 'Алхімік' }, trainer: { icon: '🥋', name: 'Тренер' }, temple: { icon: '⛪', name: 'Храм' }, arena: { icon: '🏟️', name: 'Арена' },
    court: { icon: '👑', name: 'Двір' }, market: { icon: '🏪', name: 'Ринок' }, stable: { icon: '🐎', name: 'Стайня' }, estate: { icon: '🏠', name: 'Нерухомість' },
    magic: { icon: '🔮', name: 'Лавка магії' }, harbor: { icon: '⛵', name: 'Гавань' }, elder: { icon: '👴', name: 'Староста' },
  };

  function renderLocation() {
    const G = UI.G; const el = $('#location-panel'); el.innerHTML = '';
    el.appendChild(h('button', { class: 'close-x', title: 'Згорнути / розгорнути', onclick: () => { UI.locCollapsed = !UI.locCollapsed; renderLocation(); } }, UI.locCollapsed ? '▴' : '▾'));
    el.classList.toggle('collapsed', !!UI.locCollapsed);
    const hr = GM().here(G); const p = G.player;
    if (hr.kind === 'barony') {
      const B = hr.B, w = G.world; const st = ISK.world.SETTLEMENT[B.type]; const owner = B.owner >= 0 ? w.realms[B.owner] : null;
      const lm = ISK.world.landmarkAt(w, B.cell);
      el.appendChild(h('div', { class: 'row' }, ISK.sprites.img(ISK.sprites.icon(['capital', 'city', 'fortress', 'town', 'port', 'mine', 'hellfort'].includes(B.type) ? B.type : 'village'), 40), h('div', null, h('h3', null, B.name),
        h('div', { class: 'loc-sub' }, `${st.name} · графство ${w.counties[B.county].name}, герцогство ${w.duchies[B.duchy].name}`, h('br'), owner ? owner.fullName + (owner.liege >= 0 ? ' (Імперія)' : '') : 'Нічийна земля', B.occ >= 0 ? h('span', { class: 'bad' }, ` · окуповано: ${w.realms[B.occ].name}`) : null, lm ? h('div', { class: 'gold' }, `${lm.icon} ${lm.name}`) : null))));
      if (ISK.politics.isDemon(G.P, B.owner)) el.appendChild(h('div', { class: 'quest main' }, '😈 Землі Темряви. Тут немає закладів — лише біль і погана погода.'));
      el.appendChild(h('button', { class: 'btn primary enter-town', title: 'Мапа поселення: заклади стоять як будівлі (клавіша E)', onclick: () => ISK.estate.open('town', B.id) }, `🚪 Увійти в ${B.name}`));
      const ev = ISK.life && ISK.life.eventAt(G, B.id);
      if (ev) el.appendChild(h('div', { class: 'quest' }, { festival: '🎉 Ярмарок! Ціни в крамницях нижчі.', goblin_market: '👺 Гоблінський базар: дивні товари, підозрілі гобліни.', tournament: '🏆 Лицарський турнір! Слава переможцям.', dragon: '🐉 Над містом кружляє дракон. Не виходь без шолома.' }[ev.key] || '✨ Тут щось відбувається!'));
      const svcs = h('div', { class: 'svc-grid' });
      for (const s of st.services) { const S = SVC[s]; svcs.appendChild(h('div', { class: 'svc', onclick: () => { A().play('click'); ISK.panels.openService(s, B); } }, h('span', { class: 'i' }, S.icon), S.name)); }
      if (p.house && p.house.barony === B.id) svcs.appendChild(h('div', { class: 'svc hl', onclick: () => ISK.estate.open('house') }, h('span', { class: 'i' }, '🏡'), 'Мій дім'));
      if (p.holdings.includes(B.id)) svcs.appendChild(h('div', { class: 'svc hl', onclick: () => ISK.estate.open('land', B.id) }, h('span', { class: 'i' }, '🏰'), 'Мої землі'));
      if (['capital', 'city', 'town', 'port', 'fortress'].includes(B.type) && !ISK.politics.isDemon(G.P, B.owner)) svcs.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels.cartographer(B.id) }, h('span', { class: 'i' }, '🗺️'), 'Картограф'));
      if (st.services.includes('guild') && !ISK.politics.isDemon(G.P, B.owner)) svcs.appendChild(h('div', { class: 'svc', title: `Телепорт між відвіданими містами з гільдією (з рангу ${ISK.data.GUILD_RANKS[GM().PORTAL_RANK].r})`, onclick: () => ISK.nav.portals() }, h('span', { class: 'i' }, '🌀'), 'Портал гільдії'));
      if (GM().hasTower(B) && !ISK.politics.isDemon(G.P, B.owner)) svcs.appendChild(h('div', { class: 'svc' + (GM().nav(p).towers[B.id] ? '' : ' hl'), title: 'Залізти на вежу й роздивитися околиці', onclick: () => ISK.nav.tower(B.id) }, h('span', { class: 'i' }, '🗼'), 'Оглядова вежа'));
      if (B.type === 'port') svcs.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels2.shipyard(B) }, h('span', { class: 'i' }, '⚓'), 'Верф і море'));
      if (ISK.life && ISK.life.lordsAt(G, B.id).length && !ISK.politics.isDemon(G.P, B.owner)) svcs.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels2.lords(B.id) }, h('span', { class: 'i' }, '👑'), 'Двір лордів'));
      if (st.services.length || p.house) { el.appendChild(h('div', { class: 'loc-section' }, 'Заклади')); el.appendChild(svcs); }
      el.appendChild(h('div', { class: 'loc-section' }, 'Дії'));
      const acts = h('div', { class: 'svc-grid' });
      // v5.2: збір ресурсів — лише в природі (стежками до лісосік, шахт, лугів, озер)
      const spots = (w.graph['b:' + B.id] || []).filter((e) => e.to[0] === 'r');
      if (spots.length) acts.appendChild(h('div', { class: 'svc hl', title: 'Ресурси збирають у природі: ліс, шахта, луг, озеро. Обери, куди йти.', onclick: () => ISK.panels.spotsNear(B.id) }, h('span', { class: 'i' }, '🧺'), `Угіддя поруч (${spots.length})`));
      acts.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels.explore() }, h('span', { class: 'i' }, '🌲'), 'Полювати'));
      acts.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels.talk(B) }, h('span', { class: 'i' }, '💬'), 'Поговорити'));
      acts.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels.campfire() }, h('span', { class: 'i' }, '🔥'), 'Табір'));
      acts.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels.waitDays() }, h('span', { class: 'i' }, '⏳'), 'Чекати'));
      acts.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels2.army() }, h('span', { class: 'i' }, '⚔️'), 'Військо' + (p.army && ISK.life.armyCount(p) ? ` (${ISK.life.armyCount(p)})` : '')));
      acts.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels2.family() }, h('span', { class: 'i' }, '💞'), 'Родина'));
      const hostile = G.P.armies.filter((a) => a.node === B.id && ISK.politics.isDemon(G.P, a.realm));
      for (const a of hostile) acts.appendChild(h('div', { class: 'svc danger', onclick: () => ISK.panels.attackArmy(a.id) }, h('span', { class: 'i' }, a.icon || '😈'), 'В бій з ордою!'));
      el.appendChild(acts);
      const heroes = ISK.heroes.at(G.P, 'b:' + B.id);
      if (heroes.length) {
        el.appendChild(h('div', { class: 'loc-section' }, 'Герої тут'));
        for (const hh of heroes.slice(0, 4)) el.appendChild(h('div', { class: 'item', style: { padding: '6px' } }, h('div', { class: 'ic' }, hh.icon), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${hh.name} · рів. ${hh.lvl}`), h('div', { class: 'ds' }, `${ISK.data.CLASSES[hh.cls].name} · ${ISK.data.RACES[hh.race] ? ISK.data.RACES[hh.race].name : hh.race} · ⭐${hh.fame}${hh.rival ? ' · ісекайник!' : ''}`)),
          h('div', { class: 'acts' }, h('button', { class: 'btn small', onclick: () => ISK.panels.heroTalk(hh.id) }, '💬'), h('button', { class: 'btn small', onclick: () => ISK.panels.heroSpar(hh.id) }, '⚔️'), h('button', { class: 'btn small primary', onclick: () => ISK.panels.heroRecruit(hh.id) }, '🤝'))));
      }
    } else if (hr.kind === 'res') {
      const Rn = hr.Rn, S2 = ISK.data.RESOURCE_SITES[Rn.key], left = GM().rnodeLeft(G, Rn.id); const prof = ISK.data.PROFESSIONS[S2.prof];
      el.appendChild(h('div', { class: 'row' }, h('div', { style: { fontSize: '34px' } }, S2.icon), h('div', null, h('h3', null, S2.name), h('div', { class: 'loc-sub' }, `Угіддя біля ${hr.B.name} · ${prof ? prof.icon + ' ' + prof.name : ''}`))));
      el.appendChild(h('div', { class: 'muted', style: { margin: '6px 0' } }, `Тут можна добути: ${S2.mats.map((m) => `${PL().item(m[0]).icon} ${PL().item(m[0]).name}`).join(', ')}`));
      el.appendChild(h('div', { class: 'kv' }, h('div', { class: 'k' }, 'Запас'), h('div', null, `${'🟩'.repeat(left)}${'⬛'.repeat(Math.max(0, Rn.rich - left))} ${left}/${Rn.rich}`), h('div', { class: 'k' }, 'Відновлення'), h('div', null, '+1 кожні 3 дні')));
      const acts = h('div', { class: 'svc-grid', style: { marginTop: '8px' } });
      acts.appendChild(h('div', { class: 'svc' + (left ? ' hl' : ' locked'), onclick: () => (left ? ISK.panels.gatherNode(Rn.id) : toast('Виснажено. Повертайся за кілька днів.', 'bad')) }, h('span', { class: 'i' }, S2.icon), S2.verb || 'Збирати'));
      if (ISK.depths && ISK.depths.canMine(G, Rn.id)) { const best = (ISK.depths.progress(p)['r' + Rn.id] || { best: 0 }).best; acts.appendChild(h('div', { class: 'svc hl', title: 'Окрема мапа печер: підходь до рудних жил і копай. Глибше — краща руда. Монстри з\'являються самі.', onclick: () => ISK.depthsUI.enter('r' + Rn.id) }, h('span', { class: 'i' }, '🕳️'), `Спуститися в шахту${best ? ` (до ${best + 1})` : ''}`)); }
      acts.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels.explore() }, h('span', { class: 'i' }, '🌲'), 'Полювати'));
      acts.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels.campfire() }, h('span', { class: 'i' }, '🔥'), 'Табір'));
      acts.appendChild(h('div', { class: 'svc', onclick: () => startTravel('b:' + hr.B.id) }, h('span', { class: 'i' }, '🏘️'), 'Назад до ' + hr.B.name));
      el.appendChild(acts);
    } else {
      const Dg = hr.Dg;
      el.appendChild(h('div', { class: 'row' }, h('div', { style: { fontSize: '34px' } }, Dg.icon), h('div', null, h('h3', null, Dg.name), h('div', { class: 'loc-sub' }, `Підземелля · рекомендований рівень ${ISK.combat.mobLvl(Dg.level)} · поверхів: ${Dg.floors}`, G.cleared[Dg.id] ? h('span', { class: 'good' }, ' · зачищено') : null))));
      if (Dg.relic && p.flags.relicsRevealed && !G.cleared[Dg.id]) el.appendChild(h('div', { class: 'quest main' }, '🔱 Тут зберігається Осколок Печаті!'));
      const seasonOk = Dg.season === undefined || Dg.season === null || !ISK.life || ISK.life.environment(G).seasonIdx === Dg.season;
      if (Dg.season !== undefined && Dg.season !== null) el.appendChild(h('div', { class: 'quest' + (seasonOk ? '' : ' main') }, `${ISK.data.SEASONS[Dg.season].icon} Сезонне підземелля: відчиняється лише в сезон «${ISK.data.SEASONS[Dg.season].name}».${seasonOk ? ' Двері відчинені!' : ' Зараз на дверях табличка: «Зачинено. Пішли на обід (на три місяці)».'}`));
      if (Dg.artifact && !G.cleared[Dg.id]) el.appendChild(h('div', { class: 'quest main' }, `🏺 Кажуть, у глибині лежить артефакт: ${PL().item(Dg.artifact).name}`));
      const canEnter = (!Dg.final || p.relics >= 3) && seasonOk;
      el.appendChild(h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn primary', disabled: !canEnter, onclick: () => ISK.dungeonUI.enter(Dg.id) }, Dg.final ? '🌋 Увійти до Цитаделі' : '⚔️ Увійти в підземелля'), !canEnter ? h('span', { class: 'muted' }, seasonOk ? 'Печать: потрібні 3 Осколки' : 'Не сезон') : null));
      if (ISK.depths && !Dg.final) { const best = (ISK.depths.progress(p)['d' + Dg.id] || { best: 0 }).best; el.appendChild(h('div', { class: 'card', style: { marginTop: '8px' } }, h('div', { class: 'gold' }, `🕳️ Глибини: ${ISK.depths.MAX_DEPTH} рівнів`), h('div', { class: 'muted', style: { fontSize: '13px' } }, 'Окрема мапа з туманом війни. На кожному рівні Вартовий стереже сходи, кожен 10-й — бос і контрольна точка.' + (best ? ` Твій рекорд: ${best}.` : '')), h('button', { class: 'btn', style: { marginTop: '6px', width: '100%' }, onclick: () => ISK.depthsUI.enter('d' + Dg.id) }, best ? `🕳️ У Глибини (рекорд ${best})` : '🕳️ Спуститися в Глибини'))); }
    }
  }

  // ---------------- Info panel ----------------
  function showInfo(node) {
    const G = UI.G, w = G.world; const el = $('#info-panel'); const p = G.player;
    ISK.render.R.selected = node; el.classList.remove('hidden'); el.innerHTML = '';
    el.appendChild(h('button', { class: 'close-x', onclick: () => { el.classList.add('hidden'); ISK.render.R.selected = null; ISK.render.R.route = null; } }, '✕'));
    const [k, id] = node.split(':');
    const route = node !== p.location ? GM().routeTo(G, node) : null; ISK.render.R.route = route;
    if (k === 'b') {
      const B = w.baronies[+id]; const st = ISK.world.SETTLEMENT[B.type]; const known = G.discovered[node];
      const C = w.counties[B.county], Du = w.duchies[B.duchy], dj = w.realms[B.realm]; const owner = B.owner >= 0 ? w.realms[B.owner] : null;
      const lm = ISK.world.landmarkAt(w, B.cell);
      el.appendChild(h('h3', null, `${st.icon} ${B.name}`));
      el.appendChild(h('div', { class: 'muted' }, st.name + (known ? '' : ' · (не досліджено)')));
      el.appendChild(h('div', { class: 'hier' },
        h('div', null, h('span', { class: 'lvl' }, 'Баронство'), B.name, B.holder === 'player' ? ' 🏠 (твоє!)' : ''),
        h('div', null, h('span', { class: 'lvl' }, 'Графство'), C.name, C.seat === B.id ? ' ★' : ''),
        h('div', null, h('span', { class: 'lvl' }, 'Герцогство'), Du.name, Du.seat === B.id ? ' ★' : ''),
        h('div', null, h('span', { class: 'lvl' }, 'Королівство'), h('span', { style: { color: dj.color } }, '■ '), dj.fullName, ` (${dj.race})`),
        owner && owner.liege >= 0 ? h('div', null, h('span', { class: 'lvl' }, 'Імперія'), h('span', { style: { color: w.realms[owner.liege].color } }, '■ '), w.realms[owner.liege].fullName) : null,
        h('div', null, h('span', { class: 'lvl' }, 'Власник'), owner ? [h('span', { style: { color: owner.color } }, '■ '), owner.fullName] : '—'),
        B.occ >= 0 ? h('div', { class: 'bad' }, h('span', { class: 'lvl' }, 'Окупант'), w.realms[B.occ].fullName) : null));
      const res = B.resources;
      el.appendChild(h('div', { class: 'kv' },
        h('div', { class: 'k' }, 'Розвиток'), h('div', null, '★'.repeat(Math.ceil(B.dev / 2)) + ` (${B.dev}/10)`),
        h('div', { class: 'k' }, 'Укріплення'), h('div', null, '🧱'.repeat(Math.min(8, B.fort))),
        h('div', { class: 'k' }, 'Небезпека'), h('div', { style: { color: ISK.combat.mobLvl(B.danger) > p.level + 3 ? 'var(--bad)' : ISK.combat.mobLvl(B.danger) > p.level ? 'var(--gold)' : 'var(--good)' } }, `монстри ~${ISK.combat.mobLvl(B.danger)} рівня`),
        lm ? [h('div', { class: 'k' }, 'Місцевість'), h('div', { class: 'gold' }, `${lm.icon} ${lm.name}`)] : null,
        h('div', { class: 'k' }, 'Угіддя'), h('div', null, (w.graph[node] || []).filter((e) => e.to[0] === 'r' && G.discovered[e.to]).map((e) => ISK.data.RESOURCE_SITES[w.rnodes[+e.to.slice(2)].key].icon).join(' ') || (known ? '—' : '?')),
        h('div', { class: 'k' }, 'Заклади'), h('div', null, st.services.map((s) => SVC[s].icon).join(' ') || '—')));
      const hs = (G.P.heroes || []).filter((x) => x.alive && !x.joined && x.node === B.id);
      if (hs.length) el.appendChild(h('div', { class: 'card' }, h('h4', null, 'Герої'), hs.map((x) => h('div', null, `${x.icon} ${x.name}, рів. ${x.lvl}${x.path.length ? ' (в дорозі)' : ''}`))));
      const armiesHere = G.P.armies.filter((a) => a.node === B.id);
      if (armiesHere.length) el.appendChild(h('div', { class: 'card' }, h('h4', null, 'Армії тут'), armiesHere.map((a) => h('div', null, h('span', { style: { color: w.realms[a.realm].color } }, (a.icon || '⚑') + ' '), `${a.name}: ${a.size.toLocaleString('uk')}`, a.siege > 0 ? ` (облога ${Math.round(a.siege * 100)}%)` : ''))));
    } else if (k === 'r') {
      const Rn = w.rnodes[+id], S2 = ISK.data.RESOURCE_SITES[Rn.key];
      el.appendChild(h('h3', null, `${S2.icon} ${S2.name}`));
      el.appendChild(h('div', { class: 'muted' }, `Угіддя біля ${w.baronies[Rn.barony].name}`));
      el.appendChild(h('div', { class: 'kv' }, h('div', { class: 'k' }, 'Здобич'), h('div', null, S2.mats.map((m) => PL().item(m[0]).icon + ' ' + PL().item(m[0]).name).join(', ')), h('div', { class: 'k' }, 'Запас'), h('div', null, `${GM().rnodeLeft(G, Rn.id)}/${Rn.rich}`), h('div', { class: 'k' }, 'Професія'), h('div', null, (ISK.data.PROFESSIONS[S2.prof] || { name: S2.prof }).name)));
    } else {
      const Dg = w.dungeons[+id];
      el.appendChild(h('h3', null, `${Dg.icon} ${Dg.name}`));
      el.appendChild(h('div', { class: 'kv' }, h('div', { class: 'k' }, 'Рівень'), h('div', null, String(ISK.combat.mobLvl(Dg.level))), h('div', { class: 'k' }, 'Поверхи'), h('div', null, String(Dg.floors)),
        h('div', { class: 'k' }, 'Стан'), h('div', null, G.cleared[Dg.id] ? '✔️ Зачищено' : 'Не досліджено'), Dg.island ? [h('div', { class: 'k' }, 'Острів'), h('div', null, '🏝️ тільки морем')] : null,
        Dg.relic && p.flags.relicsRevealed ? [h('div', { class: 'k' }, 'Реліквія'), h('div', { class: 'gold' }, '🔱 Осколок Печаті')] : null));
    }
    for (const m of GM().questMarkers(G).filter((x) => x.node === node)) el.appendChild(h('div', { class: 'quest' + (m.main ? ' main' : '') }, `${m.icon} ${m.title}`));
    if (route) {
      const cost = GM().routeCost(G, route); const sea = route.legs.filter((l) => l.kind === 'sea').length;
      el.appendChild(h('div', { class: 'card', style: { marginTop: '10px' } },
        h('div', null, `🧭 ${route.legs.length} ділянок · ~${Math.max(1, Math.round(cost.days))} дн. · ${ISK.data.MOUNTS[p.mount].icon} ${ISK.data.MOUNTS[p.mount].name}`),
        sea ? h('div', { class: 'gold', style: { fontSize: '13px' } }, p.ship ? `⛵ Морем на власному кораблі (${sea})` : `⛴️ Морські переправи: ${sea}, квитки ~${cost.gold}🪙`) : null,
        route.air ? h('div', { class: 'gold', style: { fontSize: '13px' } }, `${ISK.data.MOUNTS[p.mount].icon} Прямий політ — над горами, лісами й річками`) : null,
        GM().nav(p).hurry && !route.air ? h('div', { class: 'gold', style: { fontSize: '13px' } }, '🏃 Поспіх: швидше, але засідок більше (Z)') : null,
        h('button', { class: 'btn primary', style: { marginTop: '8px', width: '100%' }, onclick: () => startTravel(node) }, route.air ? '🪽 Летіти сюди' : '🚶 Подорожувати сюди')));
      const co = GM().coachOffer(G, node);
      if (co && co.days < cost.days * 0.95) el.appendChild(h('button', { class: 'btn', style: { marginTop: '6px', width: '100%' }, disabled: p.gold < co.gold, title: 'Швидше і без засідок. Ходить лише між містами зі стайнями.', onclick: () => startTravel(node, { coach: co }) }, `🐎 Поштова карета · ~${Math.max(1, Math.round(co.days))} дн. · ${co.gold}🪙`));
    } else if (node === p.location) el.appendChild(h('div', { class: 'good', style: { marginTop: '8px' } }, 'Ти тут.'));
    else el.appendChild(h('div', { class: 'bad' }, 'Шляху немає.'));
    if (ISK.nav && node !== p.location) el.appendChild(ISK.nav.infoButtons(node));
  }

  // ---------------- Travel ----------------
  // opts.coach — поштова карета (ціна/дні з GM().coachOffer, без засідок); opts.route — готовий маршрут
  async function startTravel(target, opts = {}) {
    const G = UI.G; const p = G.player; if (UI.travelling) return;
    const coach = opts.coach || null;
    const route = coach ? coach.route : (opts.route || GM().routeTo(G, target)); if (!route || !route.legs.length) return;
    const cost = coach ? { days: coach.days, gold: 0 } : GM().routeCost(G, route);
    if (coach) { if (p.gold < coach.gold) { toast(`Квиток на карету коштує ${coach.gold}🪙.`, 'bad'); return; } p.gold -= coach.gold; toast(`🐎 Поштова карета: -${coach.gold}🪙. Кучер обіцяє «без пригод». Кучери завжди брешуть, але цей — ні.`, 'good', 3500); A().play('coin'); }
    if (cost.gold > 0) {
      if (p.gold < cost.gold) { toast(`Не вистачає на морські квитки (${cost.gold}🪙)!`, 'bad'); return; }
      if (!(await confirmBox(`Маршрут має морські переправи. Квитки коштують ~${cost.gold}🪙. Плисти?`, 'Пливемо!', 'Ні'))) return;
    }
    UI.travelling = true; UI.stopTravel = false; UI.dirPending = null; ISK.render.R.follow = true;
    $('#info-panel').classList.add('hidden'); $('#location-panel').classList.add('hidden'); $('#travel-bar').classList.remove('hidden');
    const R = ISK.render.R; R.travel = { route, leg: 0, pos: null };
    const totalDays = cost.days; let doneDays = 0;
    for (let li = 0; li < route.legs.length; li++) {
      const leg = route.legs[li]; R.travel.leg = li;
      if (leg.kind === 'sea' && !p.ship) { const t = GM().seaTicket(leg); p.gold -= t; toast(`⛴️ Квиток на корабель: -${t}🪙`, ''); p.flags.sailed = true; GM().unlock(G, 'sailor'); }
      const days = coach ? coach.days * (leg.cost / Math.max(0.01, route.cost)) : GM().legDays(leg, p); const steps = leg.path.length;
      const encAt = Math.floor(steps * (0.3 + Math.random() * 0.4));
      const hurry = GM().nav(p).hurry;
      let enc = coach ? null : GM().rollEncounter(G, leg.path[encAt] ?? leg.path[0], leg.kind === 'air' ? 'land' : leg.kind, days);
      if (enc && enc.type === 'combat' && leg.kind !== 'sea' && Math.random() < (leg.kind === 'air' ? 0.75 : hurry ? 0.15 : 0.5)) enc = null; // частину бійок тепер дають видимі монстри; у польоті — рідше, у поспіху — частіше
      $('#travel-text').textContent = `${coach ? '🐎 Поштова карета' : leg.kind === 'sea' ? '⛵ Морем' : leg.kind === 'air' ? ISK.data.MOUNTS[p.mount].icon + ' Політ' : hurry ? '🏃 Поспіхом' : '🚶 Подорож'} до ${nodeName(target)} · ${GM().dateStr(G.time)}`;
      // v5.7: пішки герой іде дуже повільно й плавно (клітинка за клітинкою); верхи, морем і в польоті — як раніше
      const onFoot = p.mount === 'feet' && !coach && leg.kind === 'land' && !UI.fastTravel;
      const stride = onFoot ? 1 : Math.max(1, Math.round(PL().travelSpeed(p)));
      let spent = 0; const stepMs = UI.fastTravel ? 4 : onFoot ? (hurry ? FOOT_MS * 0.7 : FOOT_MS) : Math.max(8, Math.min(leg.kind === 'sea' ? 14 : 24, 2600 / steps));
      for (let s = 0; s < steps; s += stride) {
        const tgt = days * Math.min(1, (s + stride) / steps); if (tgt - spent > 0.02) { showNews(GM().passTime(G, tgt - spent)); spent = tgt; }
        const px = ISK.render.cellToPx(leg.path[s]);
        if (onFoot && s > 0) { const a = ISK.render.cellToPx(leg.path[s - 1]); const t0 = performance.now(); for (;;) { const t = Math.min(1, (performance.now() - t0) / stepMs); R.travel.pos = { x: a.x + (px.x - a.x) * t, y: a.y + (px.y - a.y) * t }; if (t >= 1 || UI.stopTravel) break; await sleep(16); } }
        R.travel.pos = px;
        // v5.2: туман розвіюється на ходу; монстри, що бродять, нападають, якщо пройти поруч
        GM().revealAt(G, leg.path[s]);
        if (leg.kind !== 'sea' && leg.kind !== 'air' && !coach && s > 1) { const mon = GM().monsterNear(G, leg.path[s], 1); if (mon) { const res = await fightMonster(mon, true); if (res === 'dead') { endTravel(); return; } if (res === 'fled') { toast('Ти відступив і повернувся назад.', ''); endTravel(); return; } } }
        if (s % 4 === 0) A().play(leg.kind === 'sea' ? 'splash' : 'step');
        $('#travel-fill').style.width = (((doneDays + days * (s / steps)) / totalDays) * 100).toFixed(1) + '%';
        if (!onFoot || s === 0) await sleep(onFoot ? 16 : stepMs);
        if (s <= encAt && s + stride > encAt && enc) { const res = await handleEncounter(enc); if (res === 'dead') { endTravel(); return; } }
      }
      if (days - spent > 0) showNews(GM().passTime(G, days - spent)); doneDays += days;
      p.location = route.nodes[li + 1]; GM().discoverAround(G); refresh();
      { const xr = GM().exploreReward(G); if (xr) { toast(`🧭 Дослідник! Нові землі на мапі: +${xr.xp} ✨`, 'good', 3500); if (xr.ups.length) levelUp(p.level); } }
      if (UI.stopTravel && li < route.legs.length - 1 && route.legs[li + 1].kind !== 'sea' && leg.kind !== 'sea') { toast('Ти зупинився перепочити.', ''); break; }
    }
    const firstVisit = p.location[0] === 'b' && !GM().nav(p).visited[p.location];
    const evs = GM().arrive(G, p.location); endTravel();
    if (ISK.nav) ISK.nav.banner(p.location, firstVisit);
    for (const e of evs) {
      if (e.type === 'quest') toast(e.text, 'good');
      if (e.type === 'bounty') {
        await alertBox('Ціль виявлено!', `${e.q.name} тут! Дивиться так, ніби ти йому винен гроші.`, '🎯');
        const r = await ISK.combatUI.run([ISK.combat.makeEnemy(e.q.monster, e.q.lvl, { elite: true, name: e.q.name })], { biome: biomeAt(p.location) });
        if (r === 'win') { e.q.progress = 1; toast('🎯 Ціль знешкоджено! Повертайся до гільдії.', 'good'); }
      }
    }
    checkMainQuest(); refresh();
  }
  // ---- v5.1: WASD — герой іде до сусіднього поселення в обраному напрямку (затиснув — іде далі) ----
  const FOOT_MS = 480; // мс на клітинку пішки
  const WASD = { KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0] };
  function heldDir() {
    const R = ISK.render.R; let x = 0, y = 0;
    for (const [k, v] of Object.entries(WASD)) if (R.keys.has(k)) { x += v[0]; y += v[1]; }
    const l = Math.hypot(x, y); return l ? { x: x / l, y: y / l } : null;
  }
  function neighborToward(v) {
    const G = UI.G, w = G.world, from = G.player.location, a = ISK.world.nodeXY(w, from); let best = null, bs = 0.55;
    for (const e of w.graph[from] || []) {
      const b = ISK.world.nodeXY(w, e.to), dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
      const sc = (dx * v.x + dy * v.y) / l - (e.kind === 'sea' ? 0.25 : 0) - l / 400; // суша й ближчі — в пріоритеті
      if (sc > bs) { bs = sc; best = e.to; }
    }
    return best;
  }
  // v5.7: пересування з двох натискань — перше обирає напрямок (показує шлях), друге підтверджує
  function chooseDest(node) {
    const G = UI.G; if (!node || UI.travelling) return false;
    if (node === G.player.location) { showInfo(node); UI.dirPending = null; return false; }
    if (UI.dirPending === node && ISK.render.R.selected === node) { UI.dirPending = null; startTravel(node); return true; }
    UI.dirPending = node; showInfo(node);
    if (!ISK.render.R.route) { toast('🧭 Туди шляху немає.', ''); UI.dirPending = null; return false; }
    toast(`👣 Напрямок: ${nodeName(node)}. Ще раз — іти.`, '', 1800); return false;
  }
  async function walkDir() {
    if (UI.travelling || UI.walking) return; UI.walking = true;
    try {
      const v = heldDir(); if (!v) return;
      const to = neighborToward(v); if (!to) { toast('🧭 У той бік доріг нема. Хіба що вплав… без корабля — ні.', ''); return; }
      chooseDest(to);
    } finally { UI.walking = false; }
  }

  // клік у порожнє місце — найближче відоме поселення/угіддя в тому напрямку
  function nearestKnown(sx, sy) {
    const G = UI.G, w = G.world, S = ISK.render.S; const [wx, wy] = ISK.render.screenToWorld(sx, sy); let best = null, bd = Infinity;
    const chk = (o, key) => { if (!G.discovered[key] || key === G.player.location) return; const d = Math.hypot(o.x * S + S / 2 - wx, o.y * S + S / 2 - wy); if (d < bd) { bd = d; best = key; } };
    for (const B of w.baronies) chk(B, 'b:' + B.id); for (const Dg of w.dungeons) chk(Dg, 'd:' + Dg.id); for (const Rn of w.rnodes || []) chk(Rn, 'r:' + Rn.id);
    return best;
  }
  function endTravel() { UI.travelling = false; const R = ISK.render.R; R.travel = null; R.route = null; R.selected = null; $('#travel-bar').classList.add('hidden'); $('#location-panel').classList.remove('hidden'); refresh(); }

  // ---- v5.2: монстри на мапі ----
  async function fightMonster(m, ambush) {
    const G = UI.G, p = G.player;
    if (ambush) toast(`⚠️ ${m.icon} ${m.name} (рів. ${ISK.combat.mobLvl(m.lvl)}) перегородили шлях!`, 'bad', 3500);
    const r = await ISK.combatUI.run(GM().monsterEnemies(m), { biome: ISK.data.BIOME_OF_TERRAIN[G.world.terrain[m.cell]] || 'plains' });
    if (r === 'win') { GM().killMonster(G, m); toast(`🏆 ${m.name} розбито! Дорога вільна.`, 'good'); refresh(); return 'ok'; }
    if (r === 'lose') return 'dead';
    if (r === 'flee') return 'fled';
    return 'ok';
  }
  function showMonster(m) {
    const G = UI.G, w = G.world, p = G.player; const el = $('#info-panel'); el.classList.remove('hidden'); el.innerHTML = ''; ISK.render.R.selected = null;
    el.appendChild(h('button', { class: 'close-x', onclick: () => el.classList.add('hidden') }, '✕'));
    const W0 = ISK.world.W; const at = ISK.world.nodeXY(w, p.location); const dist = Math.hypot((m.cell % W0) - at.x, ((m.cell / W0) | 0) - at.y);
    const dl = ISK.combat.mobLvl(m.lvl) - p.level;
    el.appendChild(h('h3', null, `${m.icon} ${m.name}`));
    el.appendChild(h('div', { class: 'kv' }, h('div', { class: 'k' }, 'Рівень'), h('div', { style: { color: dl > 5 ? 'var(--bad)' : dl > 1 ? 'var(--gold)' : 'var(--good)' } }, String(ISK.combat.mobLvl(m.lvl)) + (m.elite ? ' ⭐ еліта' : '')), h('div', { class: 'k' }, 'Кількість'), h('div', null, String(m.n)), h('div', { class: 'k' }, 'Відстань'), h('div', null, `~${Math.round(dist)} кл.`)));
    el.appendChild(h('div', { class: 'muted', style: { margin: '6px 0' } }, dl > 5 ? 'Виглядають так, ніби їдять героїв на сніданок. Краще обійти.' : 'Бродять околицями. Можна обійти іншою дорогою — або напасти першим.'));
    const near = dist <= 14 && !UI.travelling;
    el.appendChild(h('button', { class: 'btn primary', disabled: !near, style: { width: '100%' }, onclick: async () => { el.classList.add('hidden'); showNews(GM().passTime(G, Math.max(0.1, dist / 40))); const r = await fightMonster(m, false); if (r === 'dead') refresh(); } }, near ? '⚔️ Напасти першим' : 'Занадто далеко — підійди ближче'));
  }

  async function handleEncounter(enc) {
    const G = UI.G, p = G.player;
    if (enc.type === 'event') {
      const e = enc.event; const parts = [e.text];
      if (e.gold) { const g = rr(e.gold); p.gold = Math.max(0, p.gold + g); parts.push(g >= 0 ? `+${g} 🪙` : `${g} 🪙`); }
      if (e.xp) { const x = rr(e.xp); const r = PL().addXp(p, x); parts.push(`+${x} ✨`); if (r.ups.length) levelUp(p.level); }
      if (e.hp) { const x = rr(e.hp); p.hp = Math.max(1, p.hp + x); parts.push(`${x} ❤️`); }
      if (e.heal) { p.hp = PL().maxHp(p); parts.push('Здоров\'я відновлено!'); }
      if (e.item) { const n = rr(e.n); PL().addItem(p, e.item, n); parts.push(`+${n} ${PL().item(e.item).name}`); }
      if (e.fame) parts.push(`+${PL().addFame(p, e.fame)} ⭐ слави`);
      toast('✨ ' + parts.join(' '), 'good', 4500); A().play('coin'); refresh(); return 'ok';
    }
    if (enc.type === 'rival') {
      const lvl = Math.max(2, p.level + 1);
      await alertBox('Суперник-ісекайник!', `«Ха! Ще один переродженець? Я — Кіріто-ні-сан, рівень 99 (у своїй голові)! Битимемось за звання Головного Героя!»`, '🧑‍🎤');
      const rival = ISK.combat.makeEnemy('bandit', lvl, { elite: true, name: 'Ісекайник-суперник', icon: '🧑‍🎤' }); rival.drops = [['scroll_haste', 0.5], ['elixir_luck', 0.4]];
      const r = await ISK.combatUI.run([rival], { biome: biomeAt(p.location), noFlee: true, noDeath: true });
      if (r === 'win') { PL().addFame(p, 15); toast('«Нечесно! Я ще повернуся! Із сиквелом!» +15 ⭐', 'epic', 5000); }
      return 'ok';
    }
    if (enc.type === 'naval') {
      const F = ISK.life.FOES[enc.foe];
      await alertBox('На обрії вітрила!', `${F ? F.icon + ' ' + F.name : 'Ворожий корабель'} іде на зближення. Капітан кричить: «Гармати до бою! Хто взяв мою папугу?!»`, '🌊');
      const r = await ISK.panels2.naval(enc.foe, enc.lvl); A().setMood('sea'); refresh();
      return r === 'lose' && p.hp <= 0 ? 'dead' : 'ok';
    }
    toast('⚠️ ' + enc.text, 'bad');
    const r = await ISK.combatUI.run(enc.enemies, { biome: enc.enemies.some((e) => e.key === 'pirate' || e.key === 'naga') ? 'sea' : biomeAt(p.location) });
    return r === 'lose' ? 'dead' : 'ok';
  }
  const rr = (a) => Math.round(a[0] + Math.random() * (a[1] - a[0]));

  function biomeAt(node) {
    const G = UI.G; const [k, id] = node.split(':'); if (k === 'd') return 'dungeon';
    if (k === 'r') { const Rn = G.world.rnodes[+id]; return ISK.data.BIOME_OF_TERRAIN[G.world.terrain[Rn.cell]] || 'plains'; }
    const B = G.world.baronies[+id]; const lm = ISK.world.landmarkAt(G.world, B.cell);
    if (lm) return { deathforest: 'ash', boneplains: 'tundra', despair: 'swamp', crystal: 'mountain', bonedesert: 'desert', dragonridge: 'mountain', feygrove: 'forest', frost: 'tundra', volcano: 'ash', graveyard: 'swamp', banditwoods: 'forest' }[lm.key];
    const top = Object.entries(B.terrain).sort((a, b) => b[1] - a[1])[0];
    return ISK.data.BIOME_OF_TERRAIN[top[0]] || 'plains';
  }
  function nodeName(node) { const [k, id] = node.split(':'); const w = UI.G.world; return k === 'b' ? w.baronies[+id].name : k === 'r' ? ISK.data.RESOURCE_SITES[w.rnodes[+id].key].name : w.dungeons[+id].name; }

  function showNews(news) {
    const G = UI.G; if (!G) return; const box = $('#news-ticker');
    const here = GM().realmOfNode(G, G.player.location);
    const imp = (news || []).filter((n) => ['war', 'peace', 'dynasty', 'disaster'].includes(n.type) || n.realms.includes(here)).slice(0, 4);
    for (const n of imp.reverse()) {
      const el = h('div', { class: 'news ' + n.type }, n.text); box.appendChild(el);
      if (n.type === 'war') A().play('war');
      setTimeout(() => { el.style.transition = 'opacity .6s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 600); }, 9000);
    }
    while (box.children.length > 5) box.firstChild.remove();
    for (const msg of G.notices.splice(0)) toast(msg, msg.startsWith('🏆') ? 'epic' : msg.startsWith('🌱') || msg.startsWith('🏠') ? 'good' : 'bad', 5200);
  }
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  async function checkMainQuest() {
    const G = UI.G, p = G.player;
    if (p.guild.registered && p.guild.rank >= 2 && !p.flags.relicsRevealed) {
      p.flags.relicsRevealed = true;
      await ISK.story.goddessCall(['Ой! Привіт-привіт! Це я, Люмі! Бачу, ти вже ранг D. Пишаюсь! Ну, трохи.', 'Володар Демонів Малдраґор шле легіони з Демонії за море, а орди лізуть із проклятих місць. І він ДУЖЕ голосно хропе.', 'Його Цитадель запечатана. Знайди три Осколки Печаті — я позначила підземелля рожевим сяйвом на мапі! 🌸', 'І ні, сама не можу. У мене манікюр. Удачі!']);
      toast('🔱 Головний квест: знайди 3 Осколки Печаті!', 'epic', 6000);
    }
    if (p.relics >= 3 && !p.flags.citadelOpen) { p.flags.citadelOpen = true; await ISK.story.goddessCall(['Усі три осколки! Печать Цитаделі тремтить! Пливи до Демонії. Візьми зілля. Багато зілля. І товаришів.']); toast('🌋 Цитадель Володаря Демонів відкрита!', 'epic', 6000); }
    // social auto-promotions for the first ranks
    for (let i = 0; i < 2; i++) { const nx = p.social + 1; if (nx <= 2 && !GM().socialCheck(G, nx, -1).length) { const S = GM().promote(G, -1); if (S) cutin(S.name.toUpperCase(), 'Новий соціальний статус!', '#7cd6ff'); } }
    refresh();
  }

  // ---------------- Input ----------------
  function bindMap() {
    const c = $('#map'); const R = ISK.render.R; let drag = null, moved = false;
    c.addEventListener('contextmenu', (e) => { e.preventDefault(); if (UI.travelling) return; const node = ISK.render.pick(e.clientX, e.clientY); ISK.panels2.mapContext(e, node); });
    // v5.7: камера йде за героєм; Ctrl + перетягування — оглянути мапу, Ctrl + коліщатко — наблизити/віддалити
    c.addEventListener('mousedown', (e) => { if (e.button !== 0) return; drag = { x: e.clientX, y: e.clientY, cx: R.cam.x, cy: R.cam.y, ctrl: e.ctrlKey }; moved = false; });
    window.addEventListener('mousemove', (e) => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) moved = true; if (!drag.ctrl || !moved) return; c.classList.add('drag'); ISK.render.freeCam(); R.cam.x = drag.cx - dx / R.cam.z; R.cam.y = drag.cy - dy / R.cam.z; ISK.render.clampCam(); });
    window.addEventListener('mouseup', (e) => {
      if (drag && !moved && e.target === c) {
        const mon = ISK.render.pickMonster(e.clientX, e.clientY); if (mon) { A().play('click'); showMonster(mon); drag = null; return; }
        const node = ISK.render.pick(e.clientX, e.clientY) || nearestKnown(e.clientX, e.clientY); if (node) { A().play('click'); chooseDest(node); }
      }
      drag = null; c.classList.remove('drag');
    });
    c.addEventListener('wheel', (e) => { e.preventDefault(); if (!e.ctrlKey) return; ISK.render.freeCam(); ISK.render.zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 0.89); }, { passive: false });
    window.addEventListener('keydown', (e) => { if (e.key === 'Control') { R.ctrlHeld = true; c.classList.add('ctrl'); } });
    window.addEventListener('keyup', (e) => { if (e.key === 'Control') { R.ctrlHeld = false; c.classList.remove('ctrl'); ISK.render.freeCam(1500); } });
    window.addEventListener('blur', () => { R.ctrlHeld = false; c.classList.remove('ctrl'); });
    const mini = $('#minimap'); if (mini) mini.addEventListener('mousedown', (e) => ISK.render.miniClick(e));
    window.addEventListener('resize', () => ISK.render.resize());
    document.querySelectorAll('#map-modes [data-mode]').forEach((b) => b.addEventListener('click', () => { document.querySelectorAll('#map-modes [data-mode]').forEach((x) => x.classList.remove('active')); b.classList.add('active'); R.mode = b.dataset.mode; A().play('click'); }));
    $('#btn-center').addEventListener('click', () => ISK.render.centerOn(UI.G.player.location));
    document.querySelectorAll('#time-ctrl [data-speed]').forEach((b) => b.addEventListener('click', () => { A().play('click'); setSpeed(+b.dataset.speed); }));
    $('#travel-stop').addEventListener('click', () => { UI.stopTravel = true; });
    $('#hl-toggle').addEventListener('click', () => { R.hl = !R.hl; $('#hl-toggle').classList.toggle('active', R.hl); A().play('click'); toast(R.hl ? '⛏️ Підсвічено: шахти, підземелля (колір = складність), родовища, артефакти 🏺' : 'Підсвітку вимкнено', ''); });
    document.querySelectorAll('#side-menu [data-panel]').forEach((b) => b.addEventListener('click', () => { A().play('click'); ISK.panels.open(b.dataset.panel); }));
    const gameActive = () => UI.G && $('#screen-game').classList.contains('active') && !UI.inCombat && !UI.inMinigame && !UI.inDungeon && !UI.inEstate;
    window.addEventListener('keydown', (e) => {
      if (!gameActive() || e.target.tagName === 'INPUT') return;
      if (WASD[e.code] && !UI.modalStack.length && !e.ctrlKey) { R.keys.add(e.code); e.preventDefault(); if (!e.repeat) walkDir(); return; }
      if (['KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && !UI.modalStack.length && (e.ctrlKey || !['KeyQ', 'KeyE'].includes(e.code))) { if (!e.ctrlKey) return; R.keys.add(e.code); ISK.render.freeCam(); e.preventDefault(); return; }
      if (e.key === 'Escape') { if (!closeTop()) ISK.panels.open('system'); return; }
      if (UI.modalStack.length) return;
      const byCode = { KeyC: 'character', KeyI: 'inventory', KeyK: 'skills', KeyP: 'professions', KeyJ: 'quests', KeyR: 'realms', KeyH: 'chronicle', KeyT: 'party', KeyY: 'achievements' };
      if (byCode[e.code]) ISK.panels.open(byCode[e.code]);
      if (e.code === 'Space') { e.preventDefault(); setSpeed(UI.timeSpeed ? 0 : 1); return; }
      if (e.code === 'KeyG') { $('#hl-toggle').click(); return; }
      if (e.code === 'KeyE' && !e.ctrlKey && UI.G.player.location[0] === 'b' && !UI.travelling) { ISK.estate.open('town'); return; }
      if (e.code === 'KeyM') { ISK.panels.worldMap(); return; }
      if (e.code === 'KeyF') { ISK.render.centerOn(UI.G.player.location); return; }
      if (e.code === 'Equal' || e.code === 'NumpadAdd') { setSpeed(Math.min(3, UI.timeSpeed + 1)); return; }
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') { setSpeed(Math.max(0, UI.timeSpeed - 1)); return; }
      if (e.code === 'Backquote' || e.code === 'F10') { e.preventDefault(); ISK.panels.cheats(); return; }
      const modes = { Digit1: 'terrain', Digit2: 'political', Digit3: 'dejure', Digit4: 'danger' };
      if (modes[e.code]) document.querySelector(`[data-mode="${modes[e.code]}"]`).click();
    });
    window.addEventListener('keyup', (e) => R.keys.delete(e.code));
    window.addEventListener('blur', () => R.keys.clear());
  }
  // ---- world clock: time flows by itself (armies march, heroes wander) ----
  UI.timeSpeed = 0; const SPEEDS = [0, 0.2, 0.6, 2]; let lastT = 0, acc = 0, lastDay = -1;
  function setSpeed(i) {
    UI.timeSpeed = i; try { localStorage.setItem('dyvo_speed', String(i)); } catch (e) { /* ignore */ } document.querySelectorAll('#time-ctrl [data-speed]').forEach((b) => b.classList.toggle('active', +b.dataset.speed === i));
  }
  function timeFlow(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    const G = UI.G; if (!G || !UI.timeSpeed || UI.travelling || UI.inCombat || UI.inDungeon || UI.inMinigame || UI.modalStack.length || !$('#screen-game').classList.contains('active')) return;
    acc += dt * SPEEDS[UI.timeSpeed];
    if (acc < 0.04) return;
    const news = GM().passTime(G, acc); acc = 0; showNews(news);
    const d = Math.floor(G.time);
    if (d !== lastDay) {
      lastDay = d; refresh(); if (ISK.panels2) ISK.panels2.goddessPopup();
      const hr = GM().here(G); if (hr.kind === 'barony' && G.P.armies.some((a) => a.node === hr.B.id && ISK.politics.isDemon(G.P, a.realm))) { setSpeed(0); toast('⚠️ Ворожа орда прийшла туди, де ти стоїш! Час зупинено.', 'bad', 5000); }
    } else $('#hud-date').textContent = GM().dateStr(G.time);
  }
  let gpT = 0;
  function loop(now) {
    timeFlow(now || 0);
    if ($('#screen-game').classList.contains('active') && !UI.inCombat && !UI.inDungeon && !UI.inEstate) ISK.render.draw();
    if (now - gpT > 4000) { gpT = now; if (UI.G && ISK.panels2) ISK.panels2.goddessPopup(); }
    requestAnimationFrame(loop);
  }
  function showScreen(id) { document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id)); }
  function startGame(G) {
    UI.G = G; showScreen('screen-game'); ISK.render.init($('#map'), G); refresh(); A().setMood('calm');
    if (ISK.estate) ISK.estate.close();
    // v4: світ живе сам — годинник іде за замовчуванням (повільно); пауза кнопкою ⏸ або пробілом
    let sp = 1; try { const v = localStorage.getItem('dyvo_speed'); if (v !== null) sp = +v; } catch (e) { /* ignore */ }
    setSpeed(sp);
    if (ISK.twitch) ISK.twitch.autoStart();
  }

  // generic right-click: any item row / service tile gets a context menu mirroring its buttons
  window.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#map')) return;
    e.preventDefault();
    const row = e.target.closest('.item, .svc, .slot, .choice');
    if (!row) return;
    const btns = [...row.querySelectorAll('button')].filter((b) => !b.disabled);
    const name = (row.querySelector('.nm') || row).textContent.trim().slice(0, 40);
    const items = [{ icon: '📌', label: name, disabled: true }, '-'];
    if (!btns.length) items.push({ icon: '👆', label: 'Відкрити', fn: () => row.click() });
    for (const b of btns) items.push({ icon: '▸', label: b.textContent.trim().slice(0, 34) || b.title || 'Дія', fn: () => b.click() });
    ISK.panels2.contextMenu(e.clientX, e.clientY, items);
  });
  Object.assign(UI, { fightMonster, showMonster, setSpeed, h, $, modal, closeTop, closeAll, confirm: confirmBox, alert: alertBox, toast, cutin, sparkle, levelUp, refresh, renderLocation, showInfo, startTravel, walkDir, sleep, bindMap, loop, showScreen, startGame, showNews, checkMainQuest, biomeAt, nodeName, SVC });
  ISK.ui = UI;
})();
