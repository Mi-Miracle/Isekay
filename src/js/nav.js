// v5.3 Навігація: банер прибуття, трекер цілі в HUD, мітки, портали гільдії, оглядові вежі,
// поспіх (Z), швидка зміна транспорту (X), ціль-трекер (N / V), підтримка геймпада.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = () => ISK.ui, GM = () => ISK.game, A = () => ISK.audio;
  const h = (...a) => UI().h(...a);
  const PIN_ICONS = ['📌', '⭐', '💰', '⚠️', '❤️', '🏹'];

  // ---------------- банер прибуття ----------------
  let bannerT = 0;
  function banner(node, first) {
    const G = UI().G; if (!G || !node) return; const w = G.world; const [k, id] = node.split(':');
    let title = UI().nodeName(node), sub = '', color = '#ffdf8e';
    if (k === 'b') {
      const B = w.baronies[+id], st = ISK.world.SETTLEMENT[B.type], owner = B.owner >= 0 ? w.realms[B.owner] : null;
      sub = `${st.icon} ${st.name} · ${owner ? owner.fullName : 'Нічийна земля'}`; if (owner) color = owner.color;
      const lords = ISK.life && ISK.life.lordsAt ? ISK.life.lordsAt(G, B.id) : [];
      if (lords.length && lords[0].name) sub += ` · правитель: ${lords[0].name}`;
    } else if (k === 'd') sub = `🕳️ Підземелля · рівень ${w.dungeons[+id].level}`;
    else sub = '🧺 Угіддя';
    let el = document.getElementById('arrive-banner');
    if (!el) { el = h('div', { id: 'arrive-banner' }); document.getElementById('screen-game').appendChild(el); }
    el.innerHTML = '';
    el.appendChild(h('div', { class: 'ab-crest', style: { background: color } }));
    el.appendChild(h('div', null, first ? h('div', { class: 'ab-new' }, '✨ Нове місце!') : null, h('div', { class: 'ab-title' }, title), h('div', { class: 'ab-sub' }, sub)));
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(bannerT); bannerT = setTimeout(() => el.classList.remove('show'), first ? 3600 : 2600);
    trackLine();
  }

  // ---------------- трекер цілі ----------------
  function trackLine() {
    const G = UI().G; if (!G) return; const n = GM().nav(G.player);
    let el = document.getElementById('hud-track');
    if (!el) { const loc = document.getElementById('hud-loc'); if (!loc) return; el = h('div', { id: 'hud-track', class: 'muted', title: 'N — наступна ціль · V — іти до цілі', onclick: () => go() }); loc.after(el); }
    if (!n.track) { el.textContent = '🎯 N — обрати ціль'; el.classList.add('dim'); return; }
    el.classList.remove('dim');
    const t = GM().navTargets(G).find((x) => x.node === n.track);
    const route = GM().routeTo(G, n.track); const days = route ? Math.max(1, Math.round(GM().routeCost(G, route).days)) : null;
    el.textContent = `${t ? t.icon : '🎯'} ${t ? t.title : UI().nodeName(n.track)} · ${days ? '~' + days + ' дн.' : 'шляху нема'}`;
  }
  function setTrack(node) {
    const G = UI().G; const n = GM().nav(G.player); n.track = node; trackLine();
    if (node) { ISK.render.centerOn(node); UI().showInfo(node); }
  }
  function nextTarget(dir = 1) {
    const G = UI().G; const list = GM().navTargets(G);
    if (!list.length) { UI().toast('🎯 Немає цілей. Візьми квест у гільдії або постав мітку (ПКМ по мапі).', ''); return; }
    const n = GM().nav(G.player); const i = list.findIndex((x) => x.node === n.track);
    const t = list[(i + dir + list.length) % list.length]; setTrack(t.node); A().play('click');
    UI().toast(`${t.icon} Ціль: ${t.title}`, '', 1800);
  }
  function go() {
    const G = UI().G; const n = GM().nav(G.player);
    if (!n.track) { nextTarget(); return; }
    if (UI().travelling) return; UI().startTravel(n.track);
  }

  // ---------------- мітки, поспіх, транспорт ----------------
  function pin(node, icon) {
    const r = GM().togglePin(UI().G, node, icon); A().play('click');
    UI().toast(r ? `${r} Мітку поставлено: ${UI().nodeName(node)}` : 'Мітку прибрано', '', 1800); trackLine();
  }
  function hurry() {
    const n = GM().nav(UI().G.player); n.hurry = !n.hurry; A().play('click');
    UI().toast(n.hurry ? '🏃 Поспіх: подорожі на 25% швидші, але засідки частіші.' : '🚶 Звичайний крок. Нюхаєш квіточки.', '', 2600);
    const R = ISK.render.R; if (R.selected) UI().showInfo(R.selected);
  }
  function cycleMount() {
    const p = UI().G.player; if (UI().travelling) return; const list = p.mounts && p.mounts.length ? ['feet', ...p.mounts.filter((m) => m !== 'feet')] : ['feet'];
    if (list.length < 2) { UI().toast('🐴 Транспорту ще нема — купи у стайні.', ''); return; }
    p.mount = list[(list.indexOf(p.mount) + 1) % list.length]; const M = ISK.data.MOUNTS[p.mount];
    UI().toast(`${M.icon} ${M.name} · ×${M.speed}${M.fly ? ' · літає напряму' : ''}`, 'good', 1800); A().play('click'); UI().refresh();
    const R = ISK.render.R; if (R.selected) UI().showInfo(R.selected);
  }
  function infoButtons(node) {
    const G = UI().G; const n = GM().nav(G.player);
    return h('div', { class: 'row', style: { marginTop: '6px', gap: '6px' } },
      h('button', { class: 'btn small' + (n.track === node ? ' primary' : ''), title: 'Відстежувати в HUD (V — іти)', onclick: () => setTrack(n.track === node ? null : node) }, n.track === node ? '🎯 Відстежується' : '🎯 Відстежувати'),
      h('button', { class: 'btn small', title: 'Поставити/прибрати власну мітку', onclick: () => { pin(node); UI().showInfo(node); } }, n.pins[node] ? `${n.pins[node]} Прибрати мітку` : '📌 Мітка'));
  }
  function contextItems(node) {
    const G = UI().G; const n = GM().nav(G.player); const out = [];
    out.push({ icon: '🎯', label: n.track === node ? 'Не відстежувати' : 'Відстежувати ціль', fn: () => setTrack(n.track === node ? null : node) });
    if (n.pins[node]) out.push({ icon: '❌', label: 'Прибрати мітку', fn: () => pin(node) });
    else for (const ic of PIN_ICONS) out.push({ icon: ic, label: 'Мітка ' + ic, fn: () => pin(node, ic) });
    return out;
  }

  // ---------------- портали гільдії та вежі ----------------
  function portals() {
    const G = UI().G; const r = GM().portalList(G);
    if (r.err) { UI().toast('🌀 ' + r.err, 'bad', 3500); return; }
    UI().modal({ title: 'Портальний камінь гільдії', icon: '🌀', sub: '«Тицяєш пальцем у кристал — і ти вже деінде. Нудоту не повертаємо.» Працює між містами з гільдією, де ти вже бував.', body: () => r.list.length
      ? h('div', { class: 'items' }, r.list.map((o) => h('div', { class: 'item' }, h('div', { class: 'nm' }, `🛡️ ${o.B.name}`), h('div', { class: 'ds' }, `${Math.round(o.dist)} кл.${o.B.cont !== G.world.baronies[+G.player.location.slice(2)].cont ? ' · інший континент' : ''}`),
        h('button', { class: 'btn small primary', disabled: G.player.gold < o.gold, onclick: () => { const e = GM().usePortal(G, o.node); if (e) { UI().toast(e, 'bad'); return; } UI().closeAll(); A().play('magic'); ISK.render.centerOn(G.player.location); UI().refresh(); banner(G.player.location); } }, `${o.gold} 🪙`))))
      : h('div', { class: 'muted' }, 'Ти ще не бував у інших містах з гільдією. Камінь сумно мерехтить.') });
  }
  function tower(bid) {
    const G = UI().G; const r = GM().climbTower(G, bid);
    if (r.err) { UI().toast('🗼 ' + r.err, ''); return; }
    A().play('magic'); UI().toast(`🗼 З вежі видно далеко! Відкрито ${r.cells} клітинок мапи. Голова трохи паморочиться.`, 'good', 4000);
    UI().refresh();
  }

  // ---------------- клавіші ----------------
  const active = () => UI().G && document.getElementById('screen-game').classList.contains('active') && !UI().inCombat && !UI().inMinigame && !UI().inDungeon && !UI().inEstate && !UI().modalStack.length;
  window.addEventListener('keydown', (e) => {
    if (!active() || (e.target && e.target.tagName === 'INPUT')) return;
    if (e.code === 'KeyN') { nextTarget(e.shiftKey ? -1 : 1); e.preventDefault(); }
    else if (e.code === 'KeyV') { go(); e.preventDefault(); }
    else if (e.code === 'KeyZ') { hurry(); e.preventDefault(); }
    else if (e.code === 'KeyX') { cycleMount(); e.preventDefault(); }
  });

  // ---------------- геймпад ----------------
  // лівий стік / хрестовина — іти (як WASD), правий стік — камера, A — подорожувати до обраного, B — закрити,
  // Y — наступна ціль, X — іти до цілі, LB/RB — масштаб, Start — мапа світу, Select — зміна транспорту
  const DIRS = { KeyW: [1, -1, 12], KeyS: [1, 1, 13], KeyA: [0, -1, 14], KeyD: [0, 1, 15] };
  let prevBtn = [], padNoticed = false;
  function pollPad() {
    requestAnimationFrame(pollPad);
    const pads = navigator.getGamepads ? navigator.getGamepads() : []; const gp = [...pads].find((x) => x && x.connected); if (!gp || !UI() || !UI().G) return;
    if (!padNoticed) { padNoticed = true; UI().toast('🎮 Геймпад підключено! Стік — іти, A — в дорогу, Y — ціль.', 'good', 3500); }
    const R = ISK.render.R; const press = (i) => gp.buttons[i] && gp.buttons[i].pressed; const tap = (i) => press(i) && !prevBtn[i];
    if (!UI().modalStack.length && active() !== false) {
      let any = false;
      for (const [code, [ax, sign, btn]] of Object.entries(DIRS)) {
        const on = (gp.axes[ax] || 0) * sign > 0.55 || press(btn);
        if (on && !R.keys.has(code)) { R.keys.add(code); any = true; } else if (!on && R.keys.has(code) && R.keys.padHeld && R.keys.padHeld.has(code)) R.keys.delete(code);
        R.keys.padHeld = R.keys.padHeld || new Set(); if (on) R.keys.padHeld.add(code); else R.keys.padHeld.delete(code);
      }
      if (any && active()) UI().walkDir();
      const rx = gp.axes[2] || 0, ry = gp.axes[3] || 0;
      if (Math.abs(rx) > 0.2 || Math.abs(ry) > 0.2) { ISK.render.freeCam(); R.cam.x += rx * 9 / R.cam.z; R.cam.y += ry * 9 / R.cam.z; ISK.render.clampCam(); }
      if (tap(4)) R.cam.z = Math.max(ISK.render.ZMIN, R.cam.z * 0.85); if (tap(5)) R.cam.z = Math.min(ISK.render.ZMAX, R.cam.z * 1.18);
      if (active()) {
        if (tap(0) && R.selected && R.selected !== UI().G.player.location) UI().startTravel(R.selected);
        if (tap(3)) nextTarget(); if (tap(2)) go(); if (tap(8)) cycleMount();
        if (tap(9)) ISK.panels.worldMap();
      }
    }
    if (tap(1)) { if (!UI().closeTop()) { const ip = document.getElementById('info-panel'); if (ip) ip.classList.add('hidden'); } }
    prevBtn = gp.buttons.map((b) => b.pressed);
  }
  if (typeof window !== 'undefined' && typeof requestAnimationFrame === 'function') requestAnimationFrame(pollPad);
  setInterval(() => { try { if (UI() && UI().G && !UI().travelling) trackLine(); } catch (e) { /* ignore */ } }, 1500);

  ISK.nav = { banner, trackLine, setTrack, nextTarget, go, pin, hurry, cycleMount, infoButtons, contextItems, portals, tower, PIN_ICONS };
})();
