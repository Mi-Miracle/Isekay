// Combat overlay: enemy cards, action bar, timing minigame for attacks, floating numbers, rewards.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = () => ISK.ui;
  const h = (...a) => ISK.ui.h(...a);
  const PL = () => ISK.player;
  const A = () => ISK.audio;
  const D = () => ISK.data;

  function run(enemies, opts = {}) {
    return new Promise((resolve) => {
      const G = UI().G; const p = G.player;
      UI().inCombat = true; A().setMood('battle');
      p.stat.battles++;
      const b = ISK.combat.startBattle(p, enemies, opts);
      let target = 0; let busy = false; let menu = 'main';
      const root = h('div', { class: 'combat biome-' + (opts.biome || 'plains') });
      const top = h('div', { class: 'combat-top' });
      const enemyRow = h('div', { class: 'enemies' });
      const playerBox = h('div', { class: 'cb-player' });
      const actions = h('div', { class: 'cb-actions' });
      const log = h('div', { class: 'cb-log' });
      root.append(top, enemyRow, h('div', { class: 'combat-bottom' }, playerBox, actions, log));
      document.body.appendChild(root);
      const boss = enemies.find((e) => e.boss);
      top.textContent = boss ? `👑 БОС: ${boss.name}` : opts.arena ? '🏟️ Бій на арені!' : enemies.length > 1 ? `⚔️ Бій! Ворогів: ${enemies.length}` : `⚔️ ${enemies[0].name} нападає!`;
      if (boss && boss.line) addLog(`${boss.icon} ${boss.line}`, true);
      const appraise = p.cheat === 'appraisal';

      const cards = enemies.map((e, i) => {
        const card = h('div', { class: 'enemy' + (e.boss ? ' boss' : ''), onclick: () => { target = i; draw(); } });
        return card;
      });
      cards.forEach((c) => enemyRow.appendChild(c));

      function addLog(text, big) { log.prepend(h('div', { style: big ? { color: 'var(--gold2)', fontWeight: 700 } : null }, text)); }

      function draw() {
        if (enemies[target] && enemies[target].hp <= 0) target = enemies.findIndex((e) => e.hp > 0);
        enemies.forEach((e, i) => {
          const c = cards[i]; c.innerHTML = '';
          c.className = 'enemy' + (e.boss ? ' boss' : '') + (e.hp <= 0 ? ' dead' : '') + (i === target && e.hp > 0 ? ' sel' : '');
          const st = Object.keys(e.status).map((s) => ({ poison: '☠️', burn: '🔥', freeze: '❄️', stun: '💫' }[s])).join('');
          c.append(...[h('div', { class: 'status-icons' }, st), h('div', { class: 'sprite' }, e.icon), h('div', { class: 'ename' }, e.name), h('div', { class: 'elvl' }, `Рівень ${e.lvl}${e.elite ? ' · ЕЛІТА' : ''}`),
            h('div', { class: 'bar hp' }, h('div', { class: 'fill', style: { width: (e.hp / e.maxHp * 100) + '%' } }), h('span', null, `${e.hp}/${e.maxHp}`)),
            appraise ? h('div', { class: 'stats' }, `⚔${e.atk} 🛡${e.def}${e.weak.length ? ' · слабкість: ' + e.weak.map(elName).join(', ') : ''}${e.resist.length ? ' · опір: ' + e.resist.map(elName).join(', ') : ''}`) : null].filter(Boolean));
        });
        const d = PL().derived(p);
        playerBox.innerHTML = '';
        const buffs = Object.entries(b.buffs).map(([k, v]) => `${{ atk: '⚔️', def: '🛡️', crit: '🎯', dodge: '💨', shield: '🔷', regen: '🌿', counter: '↩️' }[k] || k}${v.turns}`).join(' ');
        playerBox.append(h('div', { class: 'row' }, h('div', { style: { fontSize: '34px' } }, p.gender === 'f' ? '👩' : '🧑'), h('div', null, h('div', { style: { fontWeight: 800 } }, `${p.name} · рів. ${p.level}`), h('div', { class: 'muted', style: { fontSize: '12px' } }, `⚔${d.atk} ✨${d.matk} 🛡${d.def} 💥${d.crit.toFixed(0)}%`))),
          h('div', { class: 'bar hp' }, h('div', { class: 'fill', style: { width: (p.hp / d.maxHp * 100) + '%' } }), h('span', null, `❤️ ${p.hp}/${d.maxHp}`)),
          h('div', { class: 'bar mp' }, h('div', { class: 'fill', style: { width: (p.mp / d.maxMp * 100) + '%' } }), h('span', null, `🔷 ${p.mp}/${d.maxMp}`)),
          h('div', { class: 'muted', style: { fontSize: '13px', minHeight: '18px' } }, buffs, b.slime ? ' 🟢 Слизько поруч' : '', p.food ? ` 🍲 ситість (${p.food.battles})` : ''));
        drawActions();
      }

      function drawActions() {
        actions.innerHTML = '';
        const mainActs = h('div', { class: 'main-acts' },
          h('button', { class: 'btn primary', disabled: busy, onclick: () => attack() }, '⚔️ Атака'),
          h('button', { class: 'btn', disabled: busy, onclick: () => { menu = 'skills'; drawActions(); } }, '📖 Навички'),
          h('button', { class: 'btn', disabled: busy, onclick: () => { menu = 'items'; drawActions(); } }, '🎒 Предмети'),
          h('button', { class: 'btn', disabled: busy, onclick: () => doAct({ type: 'defend' }) }, '🛡️ Захист'),
          h('button', { class: 'btn ghost', disabled: busy || boss || opts.noFlee, onclick: () => doAct({ type: 'flee' }) }, '💨 Втеча'));
        const sub = h('div', { class: 'sub-acts' });
        if (menu === 'skills') {
          const sks = PL().knownSkills(p);
          if (!sks.length) sub.appendChild(h('span', { class: 'muted' }, 'Немає навичок. Обери клас у гільдії!'));
          for (const sk of sks) {
            const cd = b.cd[sk.id];
            sub.appendChild(h('button', { class: 'btn small', disabled: busy || p.mp < sk.mp || cd > 0, title: sk.desc, onclick: () => doAct({ type: 'skill', id: sk.id, target }) }, `${sk.icon} ${sk.name} · 🔷${sk.mp}${cd > 0 ? ` ⏱${cd}` : ''}`));
          }
        } else if (menu === 'items') {
          const its = Object.entries(p.inventory).filter(([id]) => { const it = PL().item(id); return it && it.kind === 'consumable' && !it.use.revive; });
          if (!its.length) sub.appendChild(h('span', { class: 'muted' }, 'Немає витратних предметів.'));
          for (const [id, n] of its) { const it = PL().item(id); sub.appendChild(h('button', { class: 'btn small', disabled: busy, onclick: () => doAct({ type: 'item', id, target }) }, `${it.icon} ${it.name} ×${n}`)); }
        } else sub.appendChild(h('span', { class: 'muted', style: { fontSize: '13px' } }, 'Клікни на ворога, щоб обрати ціль. Атака: натисни ПРОБІЛ, коли стрілка в золотій зоні!'));
        actions.append(mainActs, sub);
      }

      function attack() {
        if (busy) return;
        busy = true; drawActions();
        const e = enemies[target];
        const gold = Math.max(6, 14 - (e ? e.agi * 0.25 : 0));
        const box = h('div', { class: 'timing' }, h('div', { style: { fontWeight: 800 } }, 'Влучи в золото! [ПРОБІЛ / клік]'));
        const track = h('div', { class: 'track' },
          h('div', { class: 'z', style: { left: '0', width: '100%', background: 'linear-gradient(90deg,#4a2030,#2a2440,#4a2030)' } }),
          h('div', { class: 'z', style: { left: `${30}%`, width: `40%`, background: 'rgba(255,201,77,0.25)' } }),
          h('div', { class: 'z', style: { left: `${50 - gold / 2}%`, width: `${gold}%`, background: 'linear-gradient(90deg,#ffc94d,#fff1b0,#ffc94d)' } }));
        const needle = h('div', { class: 'needle' }); track.appendChild(needle); box.appendChild(track);
        root.appendChild(box);
        const t0 = performance.now(); let raf;
        const speed = 1.15 + Math.random() * 0.35;
        const posAt = (t) => { const ph = ((t - t0) / 1000) * speed; const f = ph % 2; return (f < 1 ? f : 2 - f) * 100; };
        const step = (t) => { needle.style.left = `calc(${posAt(t)}% - 2px)`; if (t - t0 > 3200) finish(); else raf = requestAnimationFrame(step); };
        raf = requestAnimationFrame(step);
        let done = false;
        function finish() {
          if (done) return; done = true; cancelAnimationFrame(raf);
          const x = posAt(performance.now());
          const dist = Math.abs(x - 50);
          const q = dist <= gold / 2 ? 1.3 : dist <= 20 ? 1.0 : 0.7;
          box.querySelector('div').textContent = q >= 1.3 ? '✨ ІДЕАЛЬНО! ✨' : q >= 1 ? 'Добре!' : 'Мимо зони...';
          window.removeEventListener('keydown', key); box.removeEventListener('mousedown', finish);
          setTimeout(() => { box.remove(); busy = false; doAct({ type: 'attack', target, quality: q }); }, 260);
        }
        const key = (ev) => { if (ev.code === 'Space' || ev.code === 'Enter') { ev.preventDefault(); finish(); } };
        window.addEventListener('keydown', key); box.addEventListener('mousedown', finish); root.addEventListener('mousedown', function once(ev) { if (!box.contains(ev.target)) { root.removeEventListener('mousedown', once); finish(); } });
      }

      function elName(e) { return { fire: 'вогонь', ice: 'лід', light: 'блискавка', holy: 'святість', blunt: 'дробильна' }[e] || e; }

      function floatAt(el, text, cls) {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const f = h('div', { class: 'float ' + cls, style: { left: (r.left + r.width / 2 - 20 + (Math.random() * 40 - 20)) + 'px', top: (r.top + r.height * 0.3) + 'px' } }, text);
        document.body.appendChild(f); setTimeout(() => f.remove(), 1000);
      }

      async function doAct(action) {
        if (busy) return;
        busy = true; menu = 'main'; drawActions();
        const evs = ISK.combat.act(b, p, action);
        for (const ev of evs) {
          await playEvent(ev);
        }
        busy = false;
        if (b.over) return end();
        draw();
      }

      async function playEvent(ev) {
        const sleep = UI().sleep;
        switch (ev.kind) {
          case 'skill': addLog(`${ev.icon} ${p.name} використовує «${ev.name}»!`); A().play('magic'); top.textContent = `${ev.icon} ${ev.name}!`; await sleep(220); break;
          case 'dmg': {
            if (ev.side === 'enemy') {
              const card = cards[ev.target]; const e = enemies[ev.target];
              card.classList.remove('hit'); void card.offsetWidth; card.classList.add('hit');
              floatAt(card, (ev.crit ? '💥' : '') + ev.amount + (ev.weak ? '!' : ''), ev.crit ? 'crit' : '');
              A().play(ev.crit ? 'crit' : 'hit');
              addLog(`${ev.by === 'slime' ? '🟢 Слизько' : ev.dot ? (ev.dot === 'poison' ? '☠️ Отрута' : '🔥 Вогонь') : '⚔️ Ти'} → ${e.name}: ${ev.amount}${ev.crit ? ' (КРИТ!)' : ''}${ev.weak ? ' (слабкість!)' : ''}${ev.resist ? ' (опір)' : ''}`);
              if (ev.crit) { root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake'); }
            } else {
              floatAt(playerBox, '-' + ev.amount, 'pdmg'); A().play('hurt');
              const e = ev.by >= 0 ? enemies[ev.by] : null;
              addLog(`${e ? e.icon + ' ' + e.name : '☠️ Отрута'} → ти: ${ev.amount}`);
              root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake');
            }
            draw(); await sleep(260); break;
          }
          case 'heal': floatAt(ev.side === 'player' ? playerBox : cards[ev.target], '+' + (ev.amount || ''), 'heal'); A().play('heal'); addLog(ev.text || `💚 +${ev.amount}`); draw(); await sleep(230); break;
          case 'miss': floatAt(playerBox, 'Ухилення!', 'miss'); A().play('miss'); addLog(`💨 Ти ухиляєшся від атаки!`); await sleep(200); break;
          case 'status': addLog(ev.text); if (ev.target >= 0) floatAt(cards[ev.target], ev.text, 'miss'); draw(); await sleep(160); break;
          case 'buff': addLog(ev.text); A().play('magic'); draw(); await sleep(160); break;
          case 'die': addLog(`💀 ${ev.name} переможено!`); draw(); await sleep(200); break;
          case 'text': addLog(ev.text, ev.big); if (ev.big) { top.textContent = ev.text; await sleep(1800); } else await sleep(120); break;
          case 'end': break;
        }
      }

      async function end() {
        const G2 = UI().G;
        if (b.over === 'win') {
          A().play('win');
          const res = ISK.game.applyRewards(G2, b);
          const r = b.rewards;
          const itemsTxt = Object.entries(r.items).map(([id, n]) => { const it = PL().item(id); return `${it.icon} ${it.name}${n > 1 ? ' ×' + n : ''}`; }).join('\n');
          let msg = `+${r.xp} ⭐ досвіду${p.cheat === 'exp' ? ' (×1.6)' : ''}\n+${r.gold} 🪙 золота${itemsTxt ? '\n\nЗдобич:\n' + itemsTxt : ''}`;
          if (res.xr.ups.length) msg += `\n\n🎉 НОВИЙ РІВЕНЬ: ${p.level}! (+${res.xr.ups.length * 3} очок характеристик)`;
          for (const c of res.cr) msg += `\n${D().CLASSES[c.cls].icon} ${D().CLASSES[c.cls].name}: рівень ${c.lvl}${c.skills.length ? ' — нова навичка: ' + c.skills.map((s) => s.icon + ' ' + s.name).join(', ') : ''}`;
          root.remove(); UI().inCombat = false; A().setMood('calm');
          if (res.xr.ups.length) A().play('level');
          await UI().alert(['Перемога!', 'Чиста перемога!', 'Ворог повержений!', 'Ти — легенда! (локальна)'][Math.floor(Math.random() * 4)], msg, '🏆');
          UI().refresh();
          resolve('win');
        } else if (b.over === 'flee') {
          root.remove(); UI().inCombat = false; A().setMood('calm'); UI().refresh(); resolve('flee');
        } else {
          A().play('lose');
          root.remove(); UI().inCombat = false; A().setMood('calm');
          if (opts.noDeath) { p.hp = 1; await UI().alert('Поразка', 'Ти програв, але це був лише тренувальний бій. Гордість постраждала більше, ніж тіло.', '😵'); UI().refresh(); resolve('lose'); return; }
          const r = ISK.game.onDefeat(G2);
          await UI().alert('Ти впав...', `Темрява... Голос богині: «Ой-ой! Не помирай так швидко, я ж на тебе ставила!»\n\nТи прокидаєшся в храмі міста ${r.where}. Хтось «позичив» ${r.lost} 🪙, поки ти був непритомний.`, '💀');
          ISK.render.centerOn(G2.player.location);
          UI().refresh();
          resolve('lose');
        }
      }

      draw();
    });
  }

  ISK.combatUI = { run };
})();
