// Dungeon screen v2: fog-of-war rooms, merchants, traps, shrines, bosses, relics, pixel hero.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = () => ISK.ui; const h = (...a) => ISK.ui.h(...a); const PL = () => ISK.player; const GM = () => ISK.game; const A = () => ISK.audio;
  const ICON = { start: '🚪', monster: '👾', treasure: '💰', trap: '⚠️', shrine: '⛲', mimic: '💰', lore: '📜', ore: '⛏️', stairs: '🔽', boss: '👑', merchant: '🧙', empty: '·' };
  let root = null, logEl = null, busy = false;

  async function enter(did) {
    const G = UI().G; const Dg = G.world.dungeons[did];
    if (G.player.level + 4 < Dg.level && !(await UI().confirm(`Рекомендований рівень — ${Dg.level}, а в тебе ${G.player.level}. Богиня вже готує квіти на похорон. Точно заходиш?`, 'Заходжу!', 'Ні, я ще жити хочу'))) return;
    if (!G.dungeon || G.dungeon.did !== did) GM().genDungeon(G, did);
    UI().inDungeon = true; A().setMood('dark'); logEl = null;
    root = h('div', { class: 'dungeon' }); document.body.appendChild(root); draw();
    log(`Ти входиш у «${Dg.name}». ${['Тут холодно і пахне пліснявою.', 'Десь капає вода. Або кров. Краще вода.', 'Стіни шепочуть. Здається, пліткують про тебе.'][did % 3]}`);
  }
  function log(t) { if (logEl) logEl.prepend(h('div', null, t)); }
  function close() { if (root) root.remove(); root = null; UI().inDungeon = false; A().setMood('calm'); UI().refresh(); }
  function leave() { close(); }

  function draw() {
    const G = UI().G; const ds = G.dungeon; if (!ds || !root) return;
    const Dg = G.world.dungeons[ds.did]; const fl = ds.floors[ds.floor]; const [px, py] = ds.pos.split(',').map(Number);
    root.innerHTML = '';
    const grid = h('div', { class: 'dg-grid' });
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const key = x + ',' + y; const room = fl.rooms[key]; const vk = ds.floor + ':' + key;
      if (!room) { grid.appendChild(h('div', { class: 'dg-cell' })); continue; }
      const visited = ds.visited[vk] || key === fl.start; const adj = Math.abs(x - px) + Math.abs(y - py) === 1;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => ds.visited[ds.floor + ':' + (x + dx) + ',' + (y + dy)] || (x + dx === px && y + dy === py));
      let cls = 'dg-cell', content = '';
      if (key === ds.pos) { cls += ' room here'; content = ISK.sprites.img(ISK.sprites.hero(G.player), 50, 'bob'); }
      else if (visited) { cls += ' room' + (ds.done[vk] ? ' done' : ''); content = ds.done[vk] ? (room.type === 'stairs' ? '🔽' : '·') : (room.type === 'mimic' ? ICON.treasure : ICON[room.type]); }
      else if (near) { cls += ' room'; content = room.type === 'boss' ? '❓' : '❔'; }
      else cls += ' fog';
      if (adj && !busy) cls += ' adj';
      grid.appendChild(h('div', { class: cls, onclick: adj ? () => move(key) : null }, content));
    }
    const p = G.player; const d = PL().derived(p);
    logEl = logEl || h('div', { class: 'dg-log' });
    const side = h('div', { class: 'dg-side' }, h('div', { style: { fontWeight: 800 } }, `${p.name} · рів. ${p.level}`),
      h('div', { class: 'bar hp', style: { margin: '6px 0' } }, h('div', { class: 'fill', style: { width: (p.hp / d.maxHp * 100) + '%' } }), h('span', null, `❤️ ${p.hp}/${d.maxHp}`)),
      h('div', { class: 'bar mp', style: { margin: '6px 0' } }, h('div', { class: 'fill', style: { width: (p.mp / d.maxMp * 100) + '%' } }), h('span', null, `🔷 ${p.mp}/${d.maxMp}`)),
      h('div', { class: 'muted', style: { fontSize: '13px' } }, `🪙 ${Math.floor(p.gold)} · 🧪 ${p.inventory.potion_s || 0}/${p.inventory.potion_m || 0}/${p.inventory.potion_l || 0} · загін: ${p.party.length}`),
      h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn small', onclick: quickPotion }, '🧪 Зілля'), h('button', { class: 'btn small', onclick: () => ISK.panels.open('inventory') }, '🎒'),
        h('button', { class: 'btn small ghost', onclick: async () => { if (await UI().confirm('Покинути підземелля? Прогрес поверху збережеться, поки не підеш в інше.')) leave(); } }, '🚪 Вийти')),
      h('div', { class: 'muted', style: { fontSize: '12px', marginTop: '10px' } }, 'Клікай на сусідні кімнати з золотою рамкою. ❔ — невідома кімната.'), logEl);
    root.append(h('div', { class: 'dg-head' }, h('h2', null, `${Dg.icon} ${Dg.name}`), h('div', { class: 'muted' }, `Поверх ${ds.floor + 1}/${ds.floors.length} · вороги ~${Dg.level + ds.floor} рівня`)), h('div', { class: 'dg-body' }, grid, side));
  }
  function quickPotion() {
    const p = UI().G.player;
    for (const id of ['potion_s', 'potion_m', 'potion_l']) if (PL().hasItem(p, id)) { const r = PL().useConsumable(p, id); A().play('heal'); log(`🧪 ${r.text}`); draw(); return; }
    UI().toast('Немає зілля здоров\'я!', 'bad');
  }

  async function move(key) {
    if (busy) return; busy = true;
    const G = UI().G; const ds = G.dungeon; A().play('step');
    const ev = GM().dungeonMove(G, key); draw();
    if (!ev) { busy = false; return; }
    const Dg = G.world.dungeons[ds.did]; const markDone = () => { if (ev.doneKey) ds.done[ev.doneKey] = 1; };
    const dead = () => { busy = false; if (root) { root.remove(); root = null; UI().inDungeon = false; } };
    switch (ev.type) {
      case 'combat': {
        if (ev.text) await UI().alert('Що?!', ev.text, '😱');
        const r = await ISK.combatUI.run(ev.enemies, { biome: 'dungeon' });
        if (r === 'lose') return dead();
        if (r === 'win') { markDone(); log('⚔️ Кімнату очищено.'); }
        if (r === 'flee') { ds.pos = ds.floors[ds.floor].start; log('💨 Ти втік до входу на поверх.'); }
        break;
      }
      case 'boss': {
        const r = await ISK.combatUI.run(ev.enemies, { biome: Dg.final || Dg.type === 'hellgate' ? 'ash' : 'dungeon' });
        if (r === 'lose') return dead();
        markDone(); const res = GM().completeDungeon(G); close();
        if (res.final) await ISK.story.ending();
        else {
          let msg = `«${Dg.name}» зачищено! ${res.first ? 'Слава про тебе ширяє гільдіями.' : 'Монстри знову розбіглися.'}`;
          if (res.relic) msg += `\n\n🔱 Ти знайшов ОСКОЛОК ПЕЧАТІ! (${G.player.relics}/3)\nВін теплий і тихенько гуде, як кіт.`;
          if (G.player.quests.some((q) => q.type === 'clear' && q.dungeon === Dg.id)) msg += '\n\n✅ Квест гільдії виконано — повертайся по нагороду.';
          UI().cutin('ПІДЗЕМЕЛЛЯ ПРОЙДЕНО!', Dg.name, '#7cd67c');
          await UI().alert('Перемога!', msg, '🏆'); UI().checkMainQuest();
        }
        busy = false; UI().refresh(); return;
      }
      case 'treasure': { const q = await ISK.minigames.lockpick(Dg.tier); const loot = GM().treasureLoot(G, ev.lvl, q); markDone(); A().play('coin'); const t = Object.entries(loot.items).map(([id, n]) => PL().item(id).name + (n > 1 ? ' ×' + n : '')).join(', '); log(`💰 Скриня: +${loot.gold}🪙 ${t}`); UI().toast(`💰 +${loot.gold} 🪙 · ${t}`, 'good', 4000); break; }
      case 'trap': {
        const p = G.player; const dd = PL().derived(p);
        if (Math.random() < 0.3 + dd.s.agi * 0.012) log('⚠️ Ти помітив пастку і спритно обійшов!');
        else { const dmg = Math.round(PL().maxHp(p) * (0.08 + Math.random() * 0.1)); p.hp = Math.max(1, p.hp - dmg); A().play('hurt'); log(`⚠️ ${['Стріли зі стіни!', 'Підлога провалилась!', 'Хмара отрути!', 'Камінь на голову! Класика.', 'Банан на підлозі! Підступно.'][Math.floor(Math.random() * 5)]} -${dmg} ❤️`); }
        markDone(); break;
      }
      case 'shrine': { const p = G.player; p.hp = PL().maxHp(p); p.mp = PL().maxMp(p); for (const c of p.party) c.hp = undefined; A().play('heal'); log('⛲ Святе джерело відновлює сили всього загону.'); markDone(); break; }
      case 'lore': log('📜 ' + ev.text); markDone(); break;
      case 'ore': { const p = G.player; const ores = ['ore_copper', 'ore_iron', 'ore_silver', 'ore_mithril', 'ore_adamant']; const id = ores[Math.min(4, Math.max(0, Dg.tier - 1 + (Math.random() < 0.3 ? 1 : 0)))]; const n = 1 + Math.floor(Math.random() * 3); PL().addItem(p, id, n); PL().addProfXp(p, 'mining', 10); log(`⛏️ Жила руди: ${PL().item(id).name} ×${n}`); markDone(); break; }
      case 'merchant': {
        const p = G.player; markDone();
        const offers = [['potion_m', 90], ['ether', 55], ['scroll_fire', 140], ['phoenix', 700]];
        await new Promise((res) => {
          const m = UI().modal({ title: 'Підземний торговець', icon: '🧙', size: 'narrow', onClose: res, body: () => h('div', { class: 'col' }, h('div', { class: 'muted' }, '«Хе-хе. Ціни в підземеллі... підземні. Тобто високі. Логіка!»'),
            offers.map(([id, pr]) => h('button', { class: 'btn', disabled: p.gold < pr, onclick: () => { p.gold -= pr; PL().addItem(p, id); A().play('coin'); UI().toast(`Куплено: ${PL().item(id).name}`, 'good'); m.close(); } }, `${PL().item(id).icon} ${PL().item(id).name} — ${pr}🪙`))) });
        });
        break;
      }
      case 'stairs': if (await UI().confirm('Спуститися на наступний поверх? Там небезпечніше.', 'Вниз!', 'Ще ні')) { ds.floor++; ds.pos = ds.floors[ds.floor].start; ds.visited[ds.floor + ':' + ds.pos] = 1; log(`🔽 Поверх ${ds.floor + 1}. Темніше. Холодніше. Цікавіше.`); } break;
      default: break;
    }
    busy = false; draw();
  }
  ISK.dungeonUI = { enter, leave };
})();
