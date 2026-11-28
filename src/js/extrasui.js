// Хроніки Дивосвіту v6.0 — UI: вікна сюжетних подій і Колізею.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = () => ISK.ui, D = () => ISK.data, PL = () => ISK.player, A = () => ISK.audio, X = () => ISK.extras;
  const G = () => UI().G;
  const h = (...a) => UI().h(...a);

  // ---------- сюжетна подія: вікно з вибором ----------
  function storyEvent(ev) {
    if (!ev) return Promise.resolve('ok');
    return new Promise((resolve) => {
      const g = G();
      let m = null;
      const pick = async (i) => {
        m.close(); const r = X().choose(g, ev, i); if (r.err) { UI().toast(r.err, 'bad'); return resolve('ok'); }
        if (r.fight) {
          await UI().alert(ev.title, r.o.text, ev.icon);
          const res = await ISK.combatUI.run(r.fight, { noLegend: true, biome: UI().biomeAt(g.player.location) });
          if (res === 'win') { const parts = X().afterWin(g, r.o); if (parts.length) UI().toast(`${ev.icon} ${parts.join(' · ')}`, 'good', 4500); if (parts.levelUp) UI().levelUp(g.player.level); }
          UI().refresh(); return resolve(res === 'lose' ? 'dead' : 'ok');
        }
        A().play(r.parts.some((t) => t.startsWith('-')) ? 'hurt' : 'coin');
        await UI().alert(ev.title, `${r.o.text}${r.parts.length ? '\n\n' + r.parts.join('\n') : ''}`, ev.icon);
        if (r.parts.levelUp) UI().levelUp(g.player.level);
        UI().refresh(); resolve('ok');
      };
      m = UI().modal({ title: ev.title, icon: ev.icon, size: 'mid', noClose: true, body: () => h('div', { class: 'col' },
        h('div', { class: 'event-text' }, ev.text),
        h('div', { class: 'col', style: { gap: '6px', marginTop: '8px' } }, ev.opts.map((o, i) => { const ok = X().optionOk(g, o); return h('button', { class: 'btn' + (i === 0 ? ' primary' : ''), disabled: !ok, title: ok ? '' : 'Бракує потрібної речі', onclick: () => pick(i) }, o.label + (ok ? '' : ' 🔒')); }))) });
      if (globalThis.ISK_AUTOPLAY) setTimeout(() => pick(ev.opts.findIndex((o) => X().optionOk(g, o) && !o.out.some((x) => x.fight)) >= 0 ? ev.opts.findIndex((o) => X().optionOk(g, o) && !o.out.some((x) => x.fight)) : 0), 30);
    });
  }
  async function townEvent() {
    const g = G(); if (!g || globalThis.ISK_NOENCOUNTER || globalThis.ISK_AUTOPLAY) return;
    if (Math.random() > 0.1) return;
    await storyEvent(X().pickEvent(g, 'town'));
  }

  // ---------- Колізей ----------
  function colosseum(B, tab) {
    const g = G(), p = g.player, S = X().cs(p), CO = D().COLOSSEUM;
    const tabs = [
      { id: 'cups', label: '🏆 Турніри', render: () => {
        const w = h('div', { class: 'col' }, h('div', { class: 'muted' }, 'Плати внесок і пройди сітку турніру. Між раундами — 40% здоров\'я й мани. Поразка не вбиває — лише ганьбить. Кожен кубок можна грати раз на 7 днів.'));
        for (const c of CO.cups) { const err = X().canEnter(g, c.key); w.appendChild(h('div', { class: 'item' }, h('div', { class: 'ic' }, c.icon), h('div', { style: { flex: 1 } }, h('div', { class: 'nm' }, `${c.name} · ${c.rounds} раундів · з ${c.minLvl} рівня`), h('div', { class: 'ds' }, `Внесок ${c.fee}🪙 · приз ~${Math.round(c.prize * (1 + p.level * 0.02))}🪙, ⭐${c.fame}${c.item && D().getItem(c.item[0]) ? `, ${PL().item(c.item[0]).icon}×${c.item[1]}` : ''} · титул «${CO.titles[c.key]}» · перемог: ${S.wins[c.key] || 0}`)),
          h('div', { class: 'acts' }, h('button', { class: 'btn small primary', disabled: !!err, title: err || '', onclick: () => runCup(B, c.key) }, err ? '🔒 ' + err : '⚔️ Вийти на арену')))); }
        return w;
      } },
      { id: 'bets', label: '🎲 Ставки', render: () => betsTab(B) },
      { id: 'fame', label: '🌟 Зала слави', render: () => h('div', { class: 'col' },
        h('div', { class: 'kv' }, h('div', { class: 'k' }, 'Титул'), h('div', null, S.title ? `🏅 ${S.title}` : '—'), ...CO.cups.flatMap((c) => [h('div', { class: 'k' }, `${c.icon} ${c.name}`), h('div', null, `${S.wins[c.key] || 0} перемог`)])),
        h('h4', null, 'Гладіатори сезону'), ...CO.gladiators.map((gl) => h('div', { class: 'ds' }, `${gl.icon} ${gl.name} — ${gl.line}`))) },
    ];
    UI().modal({ title: `🏟️ Колізей ${B.name}`, icon: '🏟️', size: 'big', sub: 'Хліба й видовищ! Переважно видовищ. Хліб — у таверні.', tabs, tab: tab || 'cups' });
  }
  function betsTab(B) {
    const g = G(); const w = h('div', { class: 'col' }); const left = X().betsLeft(g);
    w.appendChild(h('div', { class: 'muted' }, `Постав на одного з гладіаторів. Букмекер чесний (майже). Ставок сьогодні лишилось: ${left}.`));
    if (left <= 0) return w;
    const m = X().betMatch(g); const amt = h('select', null, D().COLOSSEUM.bets.map((b) => h('option', { value: String(b) }, `${b} 🪙`)));
    const side = (s) => h('div', { class: 'choice', onclick: () => { const r = X().placeBet(g, m, s, +amt.value); if (r.err) return UI().toast(r.err, 'bad'); A().play(r.won ? 'win' : 'lose'); UI().alert('Бій гладіаторів', `${m.a.icon} ${m.a.name} проти ${m.b.icon} ${m.b.name}...\n\nПереміг ${r.winner.icon} ${r.winner.name}!\n${r.won ? `Ти виграв(ла) ${r.pay} 🪙!` : 'Ставка згоріла. Букмекер співчутливо всміхається.'}`, r.won ? '🤑' : '😭').then(() => { UI().closeAll(); colosseum(B, 'bets'); UI().refresh(); }); } },
      h('div', { class: 'ic' }, (s === 'a' ? m.a : m.b).icon), h('div', { class: 'nm' }, (s === 'a' ? m.a : m.b).name), h('div', { class: 'ds' }, (s === 'a' ? m.a : m.b).line), h('div', { class: 'ds', style: { color: 'var(--gold)' } }, `коефіцієнт ×${s === 'a' ? m.oddsA : m.oddsB}`));
    w.appendChild(h('div', { class: 'row', style: { gap: '8px', alignItems: 'center' } }, 'Ставка:', amt));
    w.appendChild(h('div', { class: 'choice-grid' }, side('a'), side('b')));
    return w;
  }
  async function runCup(B, key) {
    const g = G(), p = g.player; const e = X().startCup(g, key, B.id); if (e) return UI().toast(e, 'bad');
    UI().closeAll(); const c = X().cupOf(key); A().play('war');
    UI().cutin(c.name.toUpperCase(), `Колізей ${B.name}`, '#ffd36e');
    await UI().alert(c.name, `Сітка турніру:\n${g.colos.opp.map((o, i) => `${i + 1}. ${o.icon} ${o.name}`).join('\n')}\n\nВедучий: «Пані та панове! На арені — ${p.name}! Ставки приймаються! Ліки — ні!»`, '🏟️');
    while (g.colos) {
      const R = g.colos, gl = R.opp[R.round]; const rn = X().roundName(g);
      await UI().alert(`${rn}: ${gl.name}`, `${gl.icon} ${gl.name}: ${gl.line}`, '⚔️');
      const en = X().roundEnemies(g);
      const res = await ISK.combatUI.run(en, { noLegend: true, noDeath: true, noFlee: true, biome: 'plains', arena: true });
      if (res !== 'win') { X().loseCup(g); UI().toast('😵 Ти вибув(ла) з турніру. Натовп кидає помідори, але з повагою.', 'bad', 4500); p.hp = Math.max(p.hp, 1); break; }
      const w = X().winRound(g);
      if (w.done) { A().play('win'); UI().cutin('ЧЕМПІОН!', `${c.icon} ${c.name}`, '#ffd36e'); UI().sparkle(innerWidth / 2, innerHeight / 2, 40); await UI().alert('Перемога в турнірі!', `+${w.prize} 🪙 · +${w.fame} ⭐${w.item && D().getItem(w.item[0]) ? ` · ${PL().item(w.item[0]).icon} ×${w.item[1]}` : ''}\nТитул: «${w.title}»\n\nНатовп реве твоє ім'я. Хтось кидає троянди. Хтось — бутерброди.`, '🏆'); break; }
      if (!(await UI().confirm(`Перемога! Ти відновив(ла) трохи сил (❤️ ${p.hp}/${PL().maxHp(p)}). Далі — ${X().roundName(g)}. Продовжити? (Відмова = вибуваєш без призу)`))) { X().loseCup(g); UI().toast('Ти покинув(ла) арену. Розумно. Нудно, але розумно.', ''); break; }
    }
    UI().refresh();
  }

  ISK.extrasUI = { storyEvent, townEvent, colosseum, runCup };
})();
