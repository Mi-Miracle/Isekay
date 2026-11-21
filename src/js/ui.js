// Core UI: DOM helpers, modals, toasts, HUD, map interaction, travel, location & info panels.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const $ = (s, r = document) => r.querySelector(s);
  const A = () => ISK.audio;

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
    for (const kid of kids.flat(Infinity)) {
      if (kid === null || kid === undefined || kid === false) continue;
      el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }

  const UI = { G: null, busy: false, modalStack: [] };

  // ---------------- Modals ----------------
  function modal(opts) {
    const root = $('#modal-root');
    $('#overlay').classList.remove('hidden');
    const close = () => {
      el.remove();
      UI.modalStack = UI.modalStack.filter((m) => m.el !== el);
      if (!UI.modalStack.length) $('#overlay').classList.add('hidden');
      opts.onClose && opts.onClose();
      refresh();
    };
    const body = h('div', { class: 'modal-body' });
    const el = h('div', { class: 'modal ' + (opts.size || '') },
      h('div', { class: 'modal-head' }, opts.icon ? h('div', { style: { fontSize: '30px' } }, opts.icon) : null,
        h('div', null, h('h2', null, opts.title), opts.sub ? h('div', { class: 'sub' }, opts.sub) : null),
        h('div', { class: 'spacer' }), opts.noClose ? null : h('button', { class: 'close-x', onclick: close, title: 'Закрити (Esc)' }, '✕')),
      opts.tabs ? tabsEl(opts.tabs, body, opts.tab) : null,
      body,
      opts.foot ? h('div', { class: 'modal-foot' }, opts.foot) : null);
    if (!opts.tabs) { const b = typeof opts.body === 'function' ? opts.body(body) : opts.body; if (b) body.appendChild(b); }
    root.appendChild(el);
    const m = { el, close, body, noClose: opts.noClose };
    UI.modalStack.push(m);
    return m;
  }
  function tabsEl(tabs, body, initial) {
    const bar = h('div', { class: 'tabs' });
    const show = (t) => {
      [...bar.children].forEach((b) => b.classList.toggle('active', b.dataset.id === t.id));
      body.innerHTML = ''; body.appendChild(t.render());
    };
    for (const t of tabs) bar.appendChild(h('button', { 'data-id': t.id, onclick: () => show(t) }, t.label));
    setTimeout(() => show(tabs.find((t) => t.id === initial) || tabs[0]), 0);
    return bar;
  }
  function closeTop() { const m = UI.modalStack[UI.modalStack.length - 1]; if (m && !m.noClose) { m.close(); return true; } return false; }
  function closeAll() { while (UI.modalStack.length) UI.modalStack[UI.modalStack.length - 1].close(); }

  function confirmBox(text, yes = 'Так', no = 'Ні') {
    return new Promise((res) => {
      const m = modal({ title: 'Підтвердження', size: 'narrow', body: h('div', { style: { fontSize: '16px', lineHeight: 1.5 } }, text), noClose: true,
        foot: [h('button', { class: 'btn', onclick: () => { m.close(); res(false); } }, no), h('button', { class: 'btn primary', onclick: () => { m.close(); res(true); } }, yes)] });
    });
  }
  function alertBox(title, text, icon) {
    return new Promise((res) => {
      const m = modal({ title, icon, size: 'narrow', body: h('div', { style: { fontSize: '15.5px', lineHeight: 1.55, whiteSpace: 'pre-wrap' } }, text), onClose: res,
        foot: [h('button', { class: 'btn primary', onclick: () => m.close() }, 'Гаразд')] });
    });
  }

  function toast(text, cls = '', ms = 3200) {
    const t = h('div', { class: 'toast ' + cls }, text);
    $('#toasts').appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, ms);
  }

  // ---------------- HUD ----------------
  function refresh() {
    const G = UI.G; if (!G) return;
    const p = G.player, d = ISK.player.derived(p);
    $('#hud-name').textContent = p.name;
    $('#hud-level').textContent = 'Рів. ' + p.level;
    $('#hud-rank').textContent = p.guild.registered ? 'Ранг ' + ISK.player.guildRank(p) : 'Без гільдії';
    const cls = [p.classes.primary, p.classes.secondary].filter(Boolean).map((c) => ISK.data.CLASSES[c].icon + ' ' + ISK.data.CLASSES[c].name).join(' / ');
    $('#hud-class').textContent = cls || 'Без класу';
    $('#hud-portrait').textContent = p.gender === 'f' ? '👩' : '🧑';
    const pct = (a, b) => Math.max(0, Math.min(100, (a / b) * 100)) + '%';
    $('#bar-hp').style.width = pct(p.hp, d.maxHp); $('#txt-hp').textContent = `❤️ ${p.hp}/${d.maxHp}`;
    $('#bar-mp').style.width = pct(p.mp, d.maxMp); $('#txt-mp').textContent = `🔷 ${p.mp}/${d.maxMp}`;
    const need = ISK.player.xpNeed(p.level);
    $('#bar-xp').style.width = pct(p.xp, need); $('#txt-xp').textContent = `⭐ ${p.xp}/${need}`;
    $('#hud-gold').textContent = Math.floor(p.gold).toLocaleString('uk');
    $('#hud-date').textContent = ISK.game.dateStr(G.time);
    const hr = ISK.game.here(G);
    const locName = hr.kind === 'barony' ? hr.B.name : hr.Dg.name;
    const realm = ISK.game.realmOfNode(G, p.location);
    $('#hud-loc').textContent = `📍 ${locName}${realm >= 0 ? ' · ' + G.world.realms[realm].name : ''}`;
    // menu dots
    const dot = (panel, on) => {
      const b = document.querySelector(`#side-menu [data-panel="${panel}"]`); if (!b) return;
      let d0 = b.querySelector('.dot'); if (on && !d0) b.appendChild(h('div', { class: 'dot' })); if (!on && d0) d0.remove();
    };
    dot('character', p.statPoints > 0);
    dot('quests', p.quests.some((q) => ISK.game.questDone(G, q)));
    if (!UI.travelling) renderLocation();
  }

  // ---------------- Location panel ----------------
  const SVC = {
    guild: { icon: '🛡️', name: 'Гільдія' }, tavern: { icon: '🍺', name: 'Таверна' }, shop: { icon: '🛒', name: 'Крамниця' },
    smith: { icon: '⚒️', name: 'Кузня' }, alchemist: { icon: '⚗️', name: 'Алхімік' }, trainer: { icon: '🥋', name: 'Тренер' },
    temple: { icon: '⛪', name: 'Храм' }, arena: { icon: '🏟️', name: 'Арена' }, court: { icon: '👑', name: 'Двір' }, market: { icon: '🏪', name: 'Ринок' },
  };

  function renderLocation() {
    const G = UI.G; const el = $('#location-panel'); el.innerHTML = '';
    el.appendChild(h('button', { class: 'close-x', title: 'Згорнути / розгорнути', onclick: () => { UI.locCollapsed = !UI.locCollapsed; renderLocation(); } }, UI.locCollapsed ? '▴' : '▾'));
    el.classList.toggle('collapsed', !!UI.locCollapsed);
    const hr = ISK.game.here(G);
    if (hr.kind === 'barony') {
      const B = hr.B; const w = G.world;
      const st = ISK.world.SETTLEMENT[B.type];
      const owner = B.owner >= 0 ? w.realms[B.owner] : null;
      el.appendChild(h('div', { class: 'row' }, h('div', { style: { fontSize: '34px' } }, st.icon), h('div', null, h('h3', null, B.name),
        h('div', { class: 'loc-sub' }, `${st.name} · Баронство ${B.name}, графство ${w.counties[B.county].name}`, h('br'), owner ? `${owner.fullName}` : 'Нічийна земля', B.occ >= 0 ? h('span', { class: 'bad' }, ` · окуповано: ${w.realms[B.occ].name}`) : null))));
      const svcs = h('div', { class: 'svc-grid' });
      for (const s of st.services) {
        const S = SVC[s];
        svcs.appendChild(h('div', { class: 'svc', onclick: () => { A().play('click'); ISK.panels.openService(s, B); } }, h('span', { class: 'i' }, S.icon), S.name));
      }
      el.appendChild(h('div', { class: 'loc-section' }, 'Заклади'));
      el.appendChild(svcs);
      el.appendChild(h('div', { class: 'loc-section' }, 'Ремесла та дії'));
      const acts = h('div', { class: 'svc-grid' });
      const gath = [['herbalism', '🌿', 'Збирати трави'], ['mining', '⛏️', 'Копати руду'], ['fishing', '🎣', 'Рибалити']];
      for (const [prof, ic, nm] of gath) {
        const ok = ISK.game.canGather(G, prof);
        acts.appendChild(h('div', { class: 'svc' + (ok ? '' : ' locked'), title: ok ? '' : 'Тут немає відповідних ресурсів', onclick: () => ok ? ISK.panels.gather(prof) : toast('Тут цього не знайти. Спробуй інше місце.', 'bad') }, h('span', { class: 'i' }, ic), nm));
      }
      acts.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels.explore() }, h('span', { class: 'i' }, '🌲'), 'Полювати поблизу'));
      acts.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels.campfire() }, h('span', { class: 'i' }, '🔥'), 'Табір і готування'));
      acts.appendChild(h('div', { class: 'svc', onclick: () => ISK.panels.waitDays() }, h('span', { class: 'i' }, '⏳'), 'Чекати'));
      el.appendChild(acts);
    } else {
      const Dg = hr.Dg;
      el.appendChild(h('div', { class: 'row' }, h('div', { style: { fontSize: '34px' } }, Dg.icon), h('div', null, h('h3', null, Dg.name),
        h('div', { class: 'loc-sub' }, `Підземелля · рекомендований рівень ${Dg.level} · поверхів: ${Dg.final ? 4 : Dg.floors}`, G.cleared[Dg.id] ? h('span', { class: 'good' }, ' · зачищено') : null))));
      if (Dg.relic && G.player.flags.relicsRevealed && !G.cleared[Dg.id]) el.appendChild(h('div', { class: 'quest main' }, '🔱 Тут зберігається Осколок Печаті!'));
      const canEnter = !Dg.final || G.player.relics >= 3;
      el.appendChild(h('div', { class: 'row', style: { marginTop: '10px' } },
        h('button', { class: 'btn primary', disabled: !canEnter, onclick: () => ISK.dungeonUI.enter(Dg.id) }, Dg.final ? '🌋 Увійти до Цитаделі' : '⚔️ Увійти в підземелля'),
        !canEnter ? h('span', { class: 'muted' }, 'Печать не пускає: потрібні 3 Осколки') : null));
      el.appendChild(h('div', { class: 'muted', style: { marginTop: '10px', fontSize: '13px' } }, ['💀 Звідси пахне неприємностями.', '🗝️ Кажуть, усередині повно скарбів. І зубів.', '🕯️ На вході табличка: «Героям вхід вільний. Вихід — як пощастить».'][Dg.id % 3]));
    }
  }

  // ---------------- Info panel (clicked node) ----------------
  function showInfo(node) {
    const G = UI.G, w = G.world; const el = $('#info-panel');
    ISK.render.R.selected = node;
    el.classList.remove('hidden'); el.innerHTML = '';
    el.appendChild(h('button', { class: 'close-x', onclick: () => { el.classList.add('hidden'); ISK.render.R.selected = null; ISK.render.R.route = null; } }, '✕'));
    const [k, id] = node.split(':');
    const route = node !== G.player.location ? ISK.game.routeTo(G, node) : null;
    ISK.render.R.route = route;
    const days = route ? route.legs.reduce((s, l) => s + ISK.game.legDays(l), 0) : 0;
    if (k === 'b') {
      const B = w.baronies[+id]; const st = ISK.world.SETTLEMENT[B.type];
      const known = G.discovered[node];
      const C = w.counties[B.county], Du = w.duchies[B.duchy], dj = w.realms[B.realm];
      const owner = B.owner >= 0 ? w.realms[B.owner] : null;
      el.appendChild(h('h3', null, `${st.icon} ${B.name}`));
      el.appendChild(h('div', { class: 'muted' }, st.name + (known ? '' : ' · (не досліджено)')));
      el.appendChild(h('div', { class: 'hier' },
        h('div', null, h('span', { class: 'lvl' }, 'Баронство'), B.name),
        h('div', null, h('span', { class: 'lvl' }, 'Графство'), C.name, C.seat === B.id ? ' ★' : ''),
        h('div', null, h('span', { class: 'lvl' }, 'Герцогство'), Du.name, Du.seat === B.id ? ' ★' : ''),
        h('div', null, h('span', { class: 'lvl' }, 'Де-юре'), h('span', { style: { color: dj.color } }, '■ '), dj.fullName),
        h('div', null, h('span', { class: 'lvl' }, 'Власник'), owner ? [h('span', { style: { color: owner.color } }, '■ '), owner.fullName] : '—'),
        B.occ >= 0 ? h('div', { class: 'bad' }, h('span', { class: 'lvl' }, 'Окупант'), w.realms[B.occ].fullName) : null));
      const res = B.resources;
      el.appendChild(h('div', { class: 'kv' },
        h('div', { class: 'k' }, 'Розвиток'), h('div', null, '★'.repeat(Math.ceil(B.dev / 2)) + ` (${B.dev}/10)`),
        h('div', { class: 'k' }, 'Укріплення'), h('div', null, '🧱'.repeat(B.fort)),
        h('div', { class: 'k' }, 'Небезпека'), h('div', { style: { color: B.danger > G.player.level + 3 ? 'var(--bad)' : B.danger > G.player.level ? 'var(--gold)' : 'var(--good)' } }, `монстри ~${B.danger} рівня`),
        h('div', { class: 'k' }, 'Ресурси'), h('div', null, [res.herbs > 0.15 ? '🌿' : '', res.ore > 0.12 || B.type === 'mine' ? '⛏️' : '', res.fish > 0.5 ? '🎣' : ''].join(' ') || '—'),
        h('div', { class: 'k' }, 'Заклади'), h('div', null, st.services.map((s) => SVC[s].icon).join(' '))));
      const armiesHere = G.P.armies.filter((a) => a.node === B.id);
      if (armiesHere.length) el.appendChild(h('div', { class: 'card' }, h('h4', null, 'Армії тут'), armiesHere.map((a) => h('div', null, h('span', { style: { color: w.realms[a.realm].color } }, '⚑ '), `${a.name}: ${a.size.toLocaleString('uk')}`, a.siege > 0 ? ` (облога ${Math.round(a.siege * 100)}%)` : ''))));
    } else {
      const Dg = w.dungeons[+id];
      el.appendChild(h('h3', null, `${Dg.icon} ${Dg.name}`));
      el.appendChild(h('div', { class: 'kv' },
        h('div', { class: 'k' }, 'Рівень'), h('div', null, String(Dg.level)),
        h('div', { class: 'k' }, 'Поверхи'), h('div', null, String(Dg.final ? 4 : Dg.floors)),
        h('div', { class: 'k' }, 'Стан'), h('div', null, G.cleared[Dg.id] ? '✔️ Зачищено (можна повторити)' : 'Не досліджено'),
        Dg.relic && G.player.flags.relicsRevealed ? [h('div', { class: 'k' }, 'Реліквія'), h('div', { class: 'gold' }, '🔱 Осколок Печаті')] : null));
    }
    if (route) {
      el.appendChild(h('div', { class: 'card', style: { marginTop: '10px' } },
        h('div', null, `🧭 Шлях: ${route.legs.length} ділянок · ~${Math.max(1, Math.round(days))} дн.`),
        h('div', { class: 'muted', style: { fontSize: '12px', marginTop: '4px' } }, 'Подорожуючи, ти можеш зустріти монстрів або пригоди. Час іде — держави живуть своїм життям.'),
        h('button', { class: 'btn primary', style: { marginTop: '8px', width: '100%' }, onclick: () => startTravel(node) }, '🚶 Подорожувати сюди')));
    } else if (node === G.player.location) el.appendChild(h('div', { class: 'good', style: { marginTop: '8px' } }, 'Ти тут.'));
    else el.appendChild(h('div', { class: 'bad' }, 'Шляху немає.'));
  }

  // ---------------- Travel ----------------
  async function startTravel(target) {
    const G = UI.G;
    if (UI.travelling) return;
    const route = ISK.game.routeTo(G, target);
    if (!route || !route.legs.length) return;
    UI.travelling = true; UI.stopTravel = false;
    $('#info-panel').classList.add('hidden');
    $('#location-panel').classList.add('hidden');
    $('#travel-bar').classList.remove('hidden');
    const R = ISK.render.R;
    R.travel = { route, leg: 0, pos: null };
    const totalDays = route.legs.reduce((s, l) => s + ISK.game.legDays(l), 0);
    let doneDays = 0;
    for (let li = 0; li < route.legs.length; li++) {
      const leg = route.legs[li]; R.travel.leg = li;
      const days = ISK.game.legDays(leg);
      const steps = leg.path.length;
      const encounterAt = Math.floor(steps * (0.3 + Math.random() * 0.4));
      const enc = ISK.game.rollEncounter(G, leg.path[encounterAt] ?? leg.path[0], leg.kind, days);
      $('#travel-text').textContent = `Подорож до ${nodeName(target)} · ${ISK.game.dateStr(G.time)}`;
      for (let s = 0; s < steps; s++) {
        const px = ISK.render.cellToPx(leg.path[s]);
        R.travel.pos = px;
        if (s % 2 === 0) A().play('step');
        // follow camera
        const z = R.cam.z; const vw = R.canvas.clientWidth / z, vh = R.canvas.clientHeight / z;
        R.cam.x += (px.x - vw / 2 - R.cam.x) * 0.12; R.cam.y += (px.y - vh / 2 - R.cam.y) * 0.12;
        const frac = (doneDays + days * (s / steps)) / totalDays;
        $('#travel-fill').style.width = (frac * 100).toFixed(1) + '%';
        await sleep(UI.fastTravel ? 4 : 26);
        if (s === encounterAt && enc) {
          const res = await handleEncounter(enc);
          if (res === 'dead') { endTravel(); return; }
        }
      }
      const news = ISK.game.passTime(G, days);
      doneDays += days;
      showNews(news);
      // arrive at intermediate node
      const node = route.nodes[li + 1];
      G.player.location = node;
      ISK.game.discoverAround(G);
      refresh();
      if (UI.stopTravel && li < route.legs.length - 1) { toast('Ти зупинився перепочити.', ''); break; }
    }
    const node = G.player.location;
    const evs = ISK.game.arrive(G, node);
    endTravel();
    for (const e of evs) {
      if (e.type === 'quest') toast(e.text, 'good');
      if (e.type === 'bounty') {
        await alertBox('Ціль виявлено!', `${e.q.name} тут! Він дивиться на тебе так, ніби ти йому винен гроші.`, '🎯');
        const en = ISK.combat.makeEnemy(e.q.monster, e.q.lvl, { elite: true, name: e.q.name });
        const r = await ISK.combatUI.run([en], { biome: biomeAt(node) });
        if (r === 'win') { e.q.progress = 1; toast('🎯 Ціль знешкоджено! Повертайся до гільдії.', 'good'); }
      }
    }
    checkMainQuest();
    refresh();
  }
  function endTravel() {
    UI.travelling = false; ISK.render.R.travel = null; ISK.render.R.route = null; ISK.render.R.selected = null;
    $('#travel-bar').classList.add('hidden'); $('#location-panel').classList.remove('hidden');
    refresh();
  }

  async function handleEncounter(enc) {
    const G = UI.G;
    if (enc.type === 'event') {
      const e = enc.event; const p = G.player; const parts = [e.text];
      const r = (a) => Math.round(a[0] + Math.random() * (a[1] - a[0]));
      if (e.gold) { const g = r(e.gold); p.gold = Math.max(0, p.gold + g); parts.push(g >= 0 ? `+${g} 🪙` : `${g} 🪙`); }
      if (e.xp) { const x = r(e.xp); ISK.player.addXp(p, x); parts.push(`+${x} ⭐`); }
      if (e.hp) { const x = r(e.hp); p.hp = Math.max(1, p.hp + x); parts.push(`${x} ❤️`); }
      if (e.heal) { p.hp = ISK.player.maxHp(p); parts.push('Здоров\'я відновлено!'); }
      if (e.item) { const n = r(e.n); ISK.player.addItem(p, e.item, n); parts.push(`+${n} ${ISK.player.item(e.item).name}`); }
      toast('✨ ' + parts.join(' '), 'good', 4200); A().play('coin'); refresh();
      return 'ok';
    }
    toast('⚠️ ' + enc.text, 'bad');
    const r = await ISK.combatUI.run(enc.enemies, { biome: biomeAt(G.player.location) });
    return r === 'lose' ? 'dead' : 'ok';
  }

  function biomeAt(node) {
    const G = UI.G; const [k, id] = node.split(':');
    if (k === 'd') return 'dungeon';
    const B = G.world.baronies[+id];
    const top = Object.entries(B.terrain).sort((a, b) => b[1] - a[1])[0];
    return ISK.data.BIOME_OF_TERRAIN[top[0]] || 'plains';
  }

  function nodeName(node) {
    const [k, id] = node.split(':');
    return k === 'b' ? UI.G.world.baronies[+id].name : UI.G.world.dungeons[+id].name;
  }

  function showNews(news) {
    if (!news || !news.length) return;
    const box = $('#news-ticker');
    const G = UI.G;
    // only important or nearby news
    const imp = news.filter((n) => ['war', 'peace', 'dynasty', 'battle', 'siege'].includes(n.type) || n.realms.includes(ISK.game.realmOfNode(G, G.player.location))).slice(0, 4);
    for (const n of imp.reverse()) {
      const el = h('div', { class: 'news ' + n.type }, n.text);
      box.appendChild(el);
      if (n.type === 'war') A().play('war');
      setTimeout(() => { el.style.transition = 'opacity .6s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 600); }, 9000);
    }
    while (box.children.length > 5) box.firstChild.remove();
    for (const msg of G.notices.splice(0)) toast(msg, 'bad', 5000);
  }

  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  // ---------------- Main quest progression ----------------
  async function checkMainQuest() {
    const G = UI.G, p = G.player;
    if (p.guild.registered && p.guild.rank >= 2 && !p.flags.relicsRevealed) {
      p.flags.relicsRevealed = true;
      await ISK.story.goddessCall([
        'Ой! Привіт-привіт! Це я, Люмі, твоя улюблена богиня! Бачу, ти вже ранг D. Пишаюсь! Ну, трохи.',
        'Слухай, тут така справа... Король Демонів Малдраґор знову прокинувся. І він ДУЖЕ голосно хропе. І ще хоче захопити світ.',
        'Його Цитадель запечатана. Щоб зламати печать, знайди три Осколки Печаті. Я позначила підземелля на твоїй мапі рожевим сяйвом! 🌸',
        'І ні, я не можу сама. У мене манікюр. Удачі, герою!',
      ]);
      toast('🔱 Головний квест оновлено: знайди 3 Осколки Печаті!', 'epic', 6000);
    }
    if (p.relics >= 3 && !p.flags.citadelOpen) {
      p.flags.citadelOpen = true;
      await ISK.story.goddessCall(['Усі три осколки! Ти неймовірний! Печать Цитаделі тремтить... Вона в Попелищах Демонів. Візьми зілля. Багато зілля.']);
      toast('🌋 Цитадель Короля Демонів відкрита!', 'epic', 6000);
    }
    refresh();
  }

  // ---------------- Map input ----------------
  function bindMap() {
    const c = $('#map'); const R = ISK.render.R;
    let drag = null, moved = false;
    c.addEventListener('mousedown', (e) => { drag = { x: e.clientX, y: e.clientY, cx: R.cam.x, cy: R.cam.y }; moved = false; });
    window.addEventListener('mousemove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) { moved = true; c.classList.add('drag'); }
      R.cam.x = drag.cx - dx / R.cam.z; R.cam.y = drag.cy - dy / R.cam.z; ISK.render.clampCam();
    });
    window.addEventListener('mouseup', (e) => {
      if (drag && !moved && e.target === c) {
        const node = ISK.render.pick(e.clientX, e.clientY);
        if (node) { A().play('click'); showInfo(node); }
      }
      drag = null; c.classList.remove('drag');
    });
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      const [wx, wy] = ISK.render.screenToWorld(e.clientX, e.clientY);
      R.cam.z = Math.max(0.45, Math.min(4, R.cam.z * (e.deltaY < 0 ? 1.12 : 0.89)));
      R.cam.x = wx - e.clientX / R.cam.z; R.cam.y = wy - e.clientY / R.cam.z; ISK.render.clampCam();
    }, { passive: false });
    c.addEventListener('dblclick', (e) => {
      const node = ISK.render.pick(e.clientX, e.clientY);
      if (node && node !== UI.G.player.location && !UI.travelling) startTravel(node);
    });
    window.addEventListener('resize', () => ISK.render.resize());
    document.querySelectorAll('#map-modes [data-mode]').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('#map-modes [data-mode]').forEach((x) => x.classList.remove('active'));
      b.classList.add('active'); R.mode = b.dataset.mode; A().play('click');
    }));
    $('#btn-center').addEventListener('click', () => ISK.render.centerOn(UI.G.player.location));
    $('#travel-stop').addEventListener('click', () => { UI.stopTravel = true; });
    document.querySelectorAll('#side-menu [data-panel]').forEach((b) => b.addEventListener('click', () => { A().play('click'); ISK.panels.open(b.dataset.panel); }));
    window.addEventListener('keydown', (e) => {
      if (!UI.G || !$('#screen-game').classList.contains('active')) return;
      if (e.target.tagName === 'INPUT') return;
      if (UI.inCombat || UI.inMinigame || UI.inDungeon) return;
      const map = { c: 'character', i: 'inventory', k: 'skills', p: 'professions', j: 'quests', r: 'realms', h: 'chronicle' };
      const key = e.key.toLowerCase();
      const keyByCode = { KeyC: 'character', KeyI: 'inventory', KeyK: 'skills', KeyP: 'professions', KeyJ: 'quests', KeyR: 'realms', KeyH: 'chronicle' };
      if (e.key === 'Escape') { if (!closeTop()) ISK.panels.open('system'); return; }
      if (UI.modalStack.length) return;
      const panel = map[key] || keyByCode[e.code];
      if (panel) ISK.panels.open(panel);
      if (e.code === 'Space') { e.preventDefault(); ISK.render.centerOn(UI.G.player.location); }
      if (e.code === 'Digit1') document.querySelector('[data-mode="terrain"]').click();
      if (e.code === 'Digit2') document.querySelector('[data-mode="political"]').click();
      if (e.code === 'Digit3') document.querySelector('[data-mode="dejure"]').click();
      if (e.code === 'Digit4') document.querySelector('[data-mode="danger"]').click();
    });
  }

  function loop() {
    if ($('#screen-game').classList.contains('active') && !UI.inCombat && !UI.inDungeon) ISK.render.draw();
    requestAnimationFrame(loop);
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  }

  function startGame(G) {
    UI.G = G;
    showScreen('screen-game');
    ISK.render.init($('#map'), G);
    refresh();
    A().setMood('calm');
  }

  Object.assign(UI, { h, $, modal, closeTop, closeAll, confirm: confirmBox, alert: alertBox, toast, refresh, renderLocation, showInfo, startTravel, sleep, bindMap, loop, showScreen, startGame, showNews, checkMainQuest, biomeAt, nodeName, SVC });
  ISK.ui = UI;
})();
