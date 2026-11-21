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
    const cls = [p.classes.primary, p.classes.secondary].filter(Boolean).map((c) => { const C = ISK.data.CLASSES[c]; const cx = p.classXp[c]; const adv = cx && cx.adv ? C.adv.find((a) => a.id === cx.adv) : null; return (adv ? adv.icon + ' ' + adv.name : C.icon + ' ' + C.name); }).join(' / ');
    $('#hud-class').textContent = cls || 'Без класу';
    const port = $('#hud-portrait'); port.innerHTML = ''; port.appendChild(ISK.sprites.img(ISK.sprites.hero(p), 56));
    const pct = (a, b) => Math.max(0, Math.min(100, (a / b) * 100)) + '%';
    $('#bar-hp').style.width = pct(p.hp, d.maxHp); $('#txt-hp').textContent = `❤️ ${p.hp}/${d.maxHp}`;
    $('#bar-mp').style.width = pct(p.mp, d.maxMp); $('#txt-mp').textContent = `🔷 ${p.mp}/${d.maxMp}`;
    const need = PL().xpNeed(p.level); $('#bar-xp').style.width = pct(p.xp, need); $('#txt-xp').textContent = `✨ ${p.xp}/${need}`;
    $('#hud-gold').textContent = Math.floor(p.gold).toLocaleString('uk');
    $('#hud-date').textContent = GM().dateStr(G.time);
    const hr = GM().here(G); const realm = GM().realmOfNode(G, p.location);
    $('#hud-loc').textContent = `📍 ${hr.kind === 'barony' ? hr.B.name : hr.Dg.name}${realm >= 0 ? ' · ' + G.world.realms[realm].name : ''} · ${ISK.data.MOUNTS[p.mount].icon}`;
    const party = $('#hud-party'); party.innerHTML = '';
    for (const c of p.party) party.appendChild(h('div', { class: 'pmini', title: `${c.name} (${c.roleName}, рів. ${c.lvl})` }, ISK.sprites.img(ISK.sprites.forCompanion(c), 30)));
    const pet = p.pets[p.activePet]; if (pet) party.appendChild(h('div', { class: 'pmini', title: `${pet.name} (рів. ${pet.lvl})` }, ISK.sprites.img(ISK.sprites.forPet(pet.key), 30)));
    const dot = (panel, on) => { const b = document.querySelector(`#side-menu [data-panel="${panel}"]`); if (!b) return; let d0 = b.querySelector('.dot'); if (on && !d0) b.appendChild(h('div', { class: 'dot' })); if (!on && d0) d0.remove(); };
    dot('character', p.statPoints > 0);
    dot('skills', [p.classes.primary, p.classes.secondary].some((c) => c && p.classXp[c] && (p.classXp[c].sp > 0 || (p.classXp[c].lvl >= 10 && !p.classXp[c].adv))));
    dot('quests', p.quests.some((q) => GM().questDone(G, q)));
    if (!UI.travelling) renderLocation();
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
      const svcs = h('div', { class: 'svc-grid' });
      for (const s of st.services) { const S = SVC[s]; svcs.appendChild(h('div', { class: 'svc', onclick: () => { A().play('click'); ISK.panels.openService(s, B); } }, h('span', { class: 'i' }, S.icon), S.name)); }
      if (p.house && p.house.barony === B.id) svcs.appendChild(h('div', { class: 'svc hl', onclick: () => ISK.panels.house() }, h('span', { class: 'i' }, '🏡'), 'Мій дім'));
      if (p.holdings.includes(B.id)) svcs.appendChild(h('div', { class: 'svc hl', onclick: () => ISK.panels.land(B.id) }, h('span', { class: 'i' }, '🏰'), 'Мої землі'));
      if (st.services.length || p.house) { el.appendChild(h('div', { class: 'loc-section' }, 'Заклади')); el.appendChild(svcs); }
      el.appendChild(h('div', { class: 'loc-section' }, 'Дії'));
      const acts = h('div', { class: 'svc-grid' });
      for (const [prof, ic, nm] of [['herbalism', '🌿', 'Трави'], ['mining', '⛏️', 'Руда'], ['fishing', '🎣', 'Риба'], ['lumber', '🪓', 'Деревина']]) {
        const ok = GM().canGather(G, prof);
        acts.appendChild(h('div', { class: 'svc' + (ok ? '' : ' locked'), title: ok ? '' : 'Тут немає відповідних ресурсів', onclick: () => (ok ? ISK.panels.gather(prof) : toast('Тут цього не знайти.', 'bad')) }, h('span', { class: 'i' }, ic), nm));
      }
      acts.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels.explore() }, h('span', { class: 'i' }, '🌲'), 'Полювати'));
      acts.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels.talk(B) }, h('span', { class: 'i' }, '💬'), 'Поговорити'));
      acts.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels.campfire() }, h('span', { class: 'i' }, '🔥'), 'Табір'));
      acts.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels.waitDays() }, h('span', { class: 'i' }, '⏳'), 'Чекати'));
      const hostile = G.P.armies.filter((a) => a.node === B.id && ISK.politics.isDemon(G.P, a.realm));
      for (const a of hostile) acts.appendChild(h('div', { class: 'svc danger', onclick: () => ISK.panels.attackArmy(a.id) }, h('span', { class: 'i' }, a.icon || '😈'), 'В бій з ордою!'));
      el.appendChild(acts);
    } else {
      const Dg = hr.Dg;
      el.appendChild(h('div', { class: 'row' }, h('div', { style: { fontSize: '34px' } }, Dg.icon), h('div', null, h('h3', null, Dg.name), h('div', { class: 'loc-sub' }, `Підземелля · рекомендований рівень ${Dg.level} · поверхів: ${Dg.floors}`, G.cleared[Dg.id] ? h('span', { class: 'good' }, ' · зачищено') : null))));
      if (Dg.relic && p.flags.relicsRevealed && !G.cleared[Dg.id]) el.appendChild(h('div', { class: 'quest main' }, '🔱 Тут зберігається Осколок Печаті!'));
      const canEnter = !Dg.final || p.relics >= 3;
      el.appendChild(h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn primary', disabled: !canEnter, onclick: () => ISK.dungeonUI.enter(Dg.id) }, Dg.final ? '🌋 Увійти до Цитаделі' : '⚔️ Увійти в підземелля'), !canEnter ? h('span', { class: 'muted' }, 'Печать: потрібні 3 Осколки') : null));
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
        h('div', null, h('span', { class: 'lvl' }, 'Королівство'), h('span', { style: { color: dj.color } }, '■ '), dj.fullName),
        owner && owner.liege >= 0 ? h('div', null, h('span', { class: 'lvl' }, 'Імперія'), h('span', { style: { color: w.realms[owner.liege].color } }, '■ '), w.realms[owner.liege].fullName) : null,
        h('div', null, h('span', { class: 'lvl' }, 'Власник'), owner ? [h('span', { style: { color: owner.color } }, '■ '), owner.fullName] : '—'),
        B.occ >= 0 ? h('div', { class: 'bad' }, h('span', { class: 'lvl' }, 'Окупант'), w.realms[B.occ].fullName) : null));
      const res = B.resources;
      el.appendChild(h('div', { class: 'kv' },
        h('div', { class: 'k' }, 'Розвиток'), h('div', null, '★'.repeat(Math.ceil(B.dev / 2)) + ` (${B.dev}/10)`),
        h('div', { class: 'k' }, 'Укріплення'), h('div', null, '🧱'.repeat(Math.min(8, B.fort))),
        h('div', { class: 'k' }, 'Небезпека'), h('div', { style: { color: B.danger > p.level + 3 ? 'var(--bad)' : B.danger > p.level ? 'var(--gold)' : 'var(--good)' } }, `монстри ~${B.danger} рівня`),
        lm ? [h('div', { class: 'k' }, 'Місцевість'), h('div', { class: 'gold' }, `${lm.icon} ${lm.name}`)] : null,
        h('div', { class: 'k' }, 'Ресурси'), h('div', null, [res.herbs > 0.15 ? '🌿' : '', res.ore > 0.12 || B.type === 'mine' ? '⛏️' : '', res.fish > 0.5 ? '🎣' : ''].join(' ') || '—'),
        h('div', { class: 'k' }, 'Заклади'), h('div', null, st.services.map((s) => SVC[s].icon).join(' ') || '—')));
      const armiesHere = G.P.armies.filter((a) => a.node === B.id);
      if (armiesHere.length) el.appendChild(h('div', { class: 'card' }, h('h4', null, 'Армії тут'), armiesHere.map((a) => h('div', null, h('span', { style: { color: w.realms[a.realm].color } }, (a.icon || '⚑') + ' '), `${a.name}: ${a.size.toLocaleString('uk')}`, a.siege > 0 ? ` (облога ${Math.round(a.siege * 100)}%)` : ''))));
    } else {
      const Dg = w.dungeons[+id];
      el.appendChild(h('h3', null, `${Dg.icon} ${Dg.name}`));
      el.appendChild(h('div', { class: 'kv' }, h('div', { class: 'k' }, 'Рівень'), h('div', null, String(Dg.level)), h('div', { class: 'k' }, 'Поверхи'), h('div', null, String(Dg.floors)),
        h('div', { class: 'k' }, 'Стан'), h('div', null, G.cleared[Dg.id] ? '✔️ Зачищено' : 'Не досліджено'), Dg.island ? [h('div', { class: 'k' }, 'Острів'), h('div', null, '🏝️ тільки морем')] : null,
        Dg.relic && p.flags.relicsRevealed ? [h('div', { class: 'k' }, 'Реліквія'), h('div', { class: 'gold' }, '🔱 Осколок Печаті')] : null));
    }
    for (const m of GM().questMarkers(G).filter((x) => x.node === node)) el.appendChild(h('div', { class: 'quest' + (m.main ? ' main' : '') }, `${m.icon} ${m.title}`));
    if (route) {
      const cost = GM().routeCost(G, route); const sea = route.legs.filter((l) => l.kind === 'sea').length;
      el.appendChild(h('div', { class: 'card', style: { marginTop: '10px' } },
        h('div', null, `🧭 ${route.legs.length} ділянок · ~${Math.max(1, Math.round(cost.days))} дн. · ${ISK.data.MOUNTS[p.mount].icon} ${ISK.data.MOUNTS[p.mount].name}`),
        sea ? h('div', { class: 'gold', style: { fontSize: '13px' } }, p.ship ? `⛵ Морем на власному кораблі (${sea})` : `⛴️ Морські переправи: ${sea}, квитки ~${cost.gold}🪙`) : null,
        h('button', { class: 'btn primary', style: { marginTop: '8px', width: '100%' }, onclick: () => startTravel(node) }, '🚶 Подорожувати сюди')));
    } else if (node === p.location) el.appendChild(h('div', { class: 'good', style: { marginTop: '8px' } }, 'Ти тут.'));
    else el.appendChild(h('div', { class: 'bad' }, 'Шляху немає.'));
  }

  // ---------------- Travel ----------------
  async function startTravel(target) {
    const G = UI.G; const p = G.player; if (UI.travelling) return;
    const route = GM().routeTo(G, target); if (!route || !route.legs.length) return;
    const cost = GM().routeCost(G, route);
    if (cost.gold > 0) {
      if (p.gold < cost.gold) { toast(`Не вистачає на морські квитки (${cost.gold}🪙)!`, 'bad'); return; }
      if (!(await confirmBox(`Маршрут має морські переправи. Квитки коштують ~${cost.gold}🪙. Плисти?`, 'Пливемо!', 'Ні'))) return;
    }
    UI.travelling = true; UI.stopTravel = false;
    $('#info-panel').classList.add('hidden'); $('#location-panel').classList.add('hidden'); $('#travel-bar').classList.remove('hidden');
    const R = ISK.render.R; R.travel = { route, leg: 0, pos: null };
    const totalDays = cost.days; let doneDays = 0;
    for (let li = 0; li < route.legs.length; li++) {
      const leg = route.legs[li]; R.travel.leg = li;
      if (leg.kind === 'sea' && !p.ship) { const t = GM().seaTicket(leg); p.gold -= t; toast(`⛴️ Квиток на корабель: -${t}🪙`, ''); p.flags.sailed = true; GM().unlock(G, 'sailor'); }
      const days = GM().legDays(leg, p); const steps = leg.path.length;
      const encAt = Math.floor(steps * (0.3 + Math.random() * 0.4));
      const enc = GM().rollEncounter(G, leg.path[encAt] ?? leg.path[0], leg.kind, days);
      $('#travel-text').textContent = `${leg.kind === 'sea' ? '⛵ Морем' : '🚶 Подорож'} до ${nodeName(target)} · ${GM().dateStr(G.time)}`;
      const stride = Math.max(1, Math.round(PL().travelSpeed(p)));
      for (let s = 0; s < steps; s += stride) {
        const px = ISK.render.cellToPx(leg.path[s]); R.travel.pos = px;
        if (s % 4 === 0) A().play(leg.kind === 'sea' ? 'splash' : 'step');
        const z = R.cam.z; const vw = R.canvas.clientWidth / z, vh = R.canvas.clientHeight / z;
        R.cam.x += (px.x - vw / 2 - R.cam.x) * 0.12; R.cam.y += (px.y - vh / 2 - R.cam.y) * 0.12;
        $('#travel-fill').style.width = (((doneDays + days * (s / steps)) / totalDays) * 100).toFixed(1) + '%';
        await sleep(UI.fastTravel ? 4 : leg.kind === 'sea' ? 14 : 24);
        if (s <= encAt && s + stride > encAt && enc) { const res = await handleEncounter(enc); if (res === 'dead') { endTravel(); return; } }
      }
      showNews(GM().passTime(G, days)); doneDays += days;
      p.location = route.nodes[li + 1]; GM().discoverAround(G); refresh();
      if (UI.stopTravel && li < route.legs.length - 1 && route.legs[li + 1].kind !== 'sea' && leg.kind !== 'sea') { toast('Ти зупинився перепочити.', ''); break; }
    }
    const evs = GM().arrive(G, p.location); endTravel();
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
  function endTravel() { UI.travelling = false; const R = ISK.render.R; R.travel = null; R.route = null; R.selected = null; $('#travel-bar').classList.add('hidden'); $('#location-panel').classList.remove('hidden'); refresh(); }

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
    toast('⚠️ ' + enc.text, 'bad');
    const r = await ISK.combatUI.run(enc.enemies, { biome: enc.enemies.some((e) => e.key === 'pirate' || e.key === 'naga') ? 'sea' : biomeAt(p.location) });
    return r === 'lose' ? 'dead' : 'ok';
  }
  const rr = (a) => Math.round(a[0] + Math.random() * (a[1] - a[0]));

  function biomeAt(node) {
    const G = UI.G; const [k, id] = node.split(':'); if (k === 'd') return 'dungeon';
    const B = G.world.baronies[+id]; const lm = ISK.world.landmarkAt(G.world, B.cell);
    if (lm) return { deathforest: 'ash', boneplains: 'tundra', despair: 'swamp', crystal: 'mountain', bonedesert: 'desert', dragonridge: 'mountain', feygrove: 'forest', frost: 'tundra', volcano: 'ash', graveyard: 'swamp', banditwoods: 'forest' }[lm.key];
    const top = Object.entries(B.terrain).sort((a, b) => b[1] - a[1])[0];
    return ISK.data.BIOME_OF_TERRAIN[top[0]] || 'plains';
  }
  function nodeName(node) { const [k, id] = node.split(':'); return k === 'b' ? UI.G.world.baronies[+id].name : UI.G.world.dungeons[+id].name; }

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
    c.addEventListener('mousedown', (e) => { drag = { x: e.clientX, y: e.clientY, cx: R.cam.x, cy: R.cam.y }; moved = false; });
    window.addEventListener('mousemove', (e) => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) { moved = true; c.classList.add('drag'); } R.cam.x = drag.cx - dx / R.cam.z; R.cam.y = drag.cy - dy / R.cam.z; ISK.render.clampCam(); });
    window.addEventListener('mouseup', (e) => { if (drag && !moved && e.target === c) { const node = ISK.render.pick(e.clientX, e.clientY); if (node) { A().play('click'); showInfo(node); } } drag = null; c.classList.remove('drag'); });
    c.addEventListener('wheel', (e) => { e.preventDefault(); const [wx, wy] = ISK.render.screenToWorld(e.clientX, e.clientY); R.cam.z = Math.max(0.35, Math.min(4, R.cam.z * (e.deltaY < 0 ? 1.12 : 0.89))); R.cam.x = wx - e.clientX / R.cam.z; R.cam.y = wy - e.clientY / R.cam.z; ISK.render.clampCam(); }, { passive: false });
    c.addEventListener('dblclick', (e) => { const node = ISK.render.pick(e.clientX, e.clientY); if (node && node !== UI.G.player.location && !UI.travelling) startTravel(node); });
    const mini = $('#minimap'); if (mini) mini.addEventListener('mousedown', (e) => ISK.render.miniClick(e));
    window.addEventListener('resize', () => ISK.render.resize());
    document.querySelectorAll('#map-modes [data-mode]').forEach((b) => b.addEventListener('click', () => { document.querySelectorAll('#map-modes [data-mode]').forEach((x) => x.classList.remove('active')); b.classList.add('active'); R.mode = b.dataset.mode; A().play('click'); }));
    $('#btn-center').addEventListener('click', () => ISK.render.centerOn(UI.G.player.location));
    $('#travel-stop').addEventListener('click', () => { UI.stopTravel = true; });
    document.querySelectorAll('#side-menu [data-panel]').forEach((b) => b.addEventListener('click', () => { A().play('click'); ISK.panels.open(b.dataset.panel); }));
    const gameActive = () => UI.G && $('#screen-game').classList.contains('active') && !UI.inCombat && !UI.inMinigame && !UI.inDungeon;
    window.addEventListener('keydown', (e) => {
      if (!gameActive() || e.target.tagName === 'INPUT') return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && !UI.modalStack.length) { R.keys.add(e.code); e.preventDefault(); return; }
      if (e.key === 'Escape') { if (!closeTop()) ISK.panels.open('system'); return; }
      if (UI.modalStack.length) return;
      const byCode = { KeyC: 'character', KeyI: 'inventory', KeyK: 'skills', KeyP: 'professions', KeyJ: 'quests', KeyR: 'realms', KeyH: 'chronicle', KeyT: 'party', KeyY: 'achievements' };
      if (byCode[e.code]) ISK.panels.open(byCode[e.code]);
      if (e.code === 'Space') { e.preventDefault(); ISK.render.centerOn(UI.G.player.location); }
      const modes = { Digit1: 'terrain', Digit2: 'political', Digit3: 'dejure', Digit4: 'danger' };
      if (modes[e.code]) document.querySelector(`[data-mode="${modes[e.code]}"]`).click();
    });
    window.addEventListener('keyup', (e) => R.keys.delete(e.code));
    window.addEventListener('blur', () => R.keys.clear());
  }
  function loop() { if ($('#screen-game').classList.contains('active') && !UI.inCombat && !UI.inDungeon) ISK.render.draw(); requestAnimationFrame(loop); }
  function showScreen(id) { document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id)); }
  function startGame(G) { UI.G = G; showScreen('screen-game'); ISK.render.init($('#map'), G); refresh(); A().setMood('calm'); }

  Object.assign(UI, { h, $, modal, closeTop, closeAll, confirm: confirmBox, alert: alertBox, toast, cutin, sparkle, levelUp, refresh, renderLocation, showInfo, startTravel, sleep, bindMap, loop, showScreen, startGame, showNews, checkMainQuest, biomeAt, nodeName, SVC });
  ISK.ui = UI;
})();
