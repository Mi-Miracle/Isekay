// Combat overlay v2: pixel sprites, party row, enemy intents, limit-break gauge with anime cut-in, timing attacks, floating numbers.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = () => ISK.ui; const h = (...a) => ISK.ui.h(...a); const PL = () => ISK.player; const A = () => ISK.audio; const D = () => ISK.data; const SP = () => ISK.sprites;

  function run(enemies, opts = {}) {
    return new Promise((resolve) => {
      const G = UI().G; const p = G.player;
      UI().inCombat = true; A().setMood(enemies.some((e) => e.boss) ? 'boss' : 'battle'); p.stat.battles++;
      const b = ISK.combat.startBattle(p, enemies, opts);
      let target = 0, busy = false, menu = 'main', boost = 0;
      const root = h('div', { class: 'combat biome-' + (opts.biome || 'plains') });
      const top = h('div', { class: 'combat-top' });
      const enemyRow = h('div', { class: 'enemies' });
      const allyRow = h('div', { class: 'allies' });
      const timeline = h('div', { class: 'cb-timeline' }); const comboBox = h('div', { class: 'cb-combo' });
      const playerBox = h('div', { class: 'cb-player' }); const actions = h('div', { class: 'cb-actions' }); const log = h('div', { class: 'cb-log' });
      root.append(top, timeline, comboBox, enemyRow, allyRow, h('div', { class: 'combat-bottom' }, playerBox, actions, log));
      document.body.appendChild(root);
      const boss = enemies.find((e) => e.boss);
      top.textContent = boss ? `👑 БОС: ${boss.name}` : opts.arena ? '🏟️ Бій на арені!' : opts.horde ? '🔥 Битва з ордою!' : enemies.length > 1 ? `⚔️ Бій! Ворогів: ${enemies.length}` : `⚔️ ${enemies[0].name} нападає!`;
      if (boss) { UI().cutin(boss.name.toUpperCase(), boss.line || 'БОС', '#ff5c6c'); addLog(`${boss.icon} ${boss.line}`, true); }
      const appraise = p.cheat === 'appraisal' || p.pets.some((x) => x.key === 'owl');
      let cards = [];

      function addLog(text, big) { log.prepend(h('div', { style: big ? { color: 'var(--gold2)', fontWeight: 700 } : null }, text)); }
      function elName(e) { return { fire: 'вогонь', ice: 'лід', light: 'блискавка', holy: 'святість', blunt: 'дробильна', slash: 'ріжуча', pierce: 'колюча', dark: 'темрява', magic: 'магія' }[e] || e; }
      const DT = ISK.combat.DTYPES;

      function draw() {
        if (!b.enemies[target] || b.enemies[target].hp <= 0) target = b.enemies.findIndex((e) => e.hp > 0);
        if (cards.length !== b.enemies.length) { enemyRow.innerHTML = ''; cards = b.enemies.map((e, i) => { const c = h('div', { class: 'enemy' + (e.boss ? ' boss' : ''), onclick: () => { target = i; draw(); } }); enemyRow.appendChild(c); return c; }); }
        b.enemies.forEach((e, i) => {
          const c = cards[i]; c.innerHTML = '';
          c.className = 'enemy' + (e.boss ? ' boss' : '') + (e.hp <= 0 ? ' dead' : '') + (i === target && e.hp > 0 ? ' sel' : '');
          const st = Object.keys(e.status).map((s) => ({ poison: '☠️', burn: '🔥', freeze: '❄️', stun: '💫' }[s])).join('') + (e.buffs.atk ? '⬆️' : '');
          const intent = e.hp > 0 && e.intent ? h('div', { class: 'intent', title: 'Намір ворога' }, `${e.intent.icon} ${appraise || e.intent.kind !== 'attack' ? e.intent.name : ''}`) : null;
          const shield = e.hp > 0 ? h('div', { class: 'shield-row' + (e.broken ? ' broken' : '') }, h('span', { class: 'shield', title: 'Щит: влучай у слабкості, щоб зламати' }, e.broken ? '💥' : `🛡️${e.shield}`),
            e.weak.map((w) => h('span', { class: 'wk' + (e.known.includes(w) ? ' known' : ''), title: e.known.includes(w) ? 'Слабкість: ' + elName(w) : 'Невідома слабкість — спробуй різні атаки' }, e.known.includes(w) ? DT[w] : '❔'))) : null;
          c.append(...[intent, shield, h('div', { class: 'status-icons' }, st), h('div', { class: 'sprite' }, SP().img(SP().forEnemy(e), e.boss ? 176 : 120, 'bob')), h('div', { class: 'ename' }, e.name), h('div', { class: 'elvl' }, `Рівень ${e.lvl}${e.elite ? ' · ЕЛІТА' : ''}`),
            h('div', { class: 'bar hp' }, h('div', { class: 'fill', style: { width: (e.hp / e.maxHp * 100) + '%' } }), h('span', null, `${e.hp}/${e.maxHp}`)),
            appraise ? h('div', { class: 'stats' }, `⚔${e.atk} 🛡${e.def}${e.weak.length ? ' · слабкість: ' + e.weak.map(elName).join(', ') : ''}${e.resist.length ? ' · опір: ' + e.resist.map(elName).join(', ') : ''}`) : null].filter(Boolean));
        });
        allyRow.innerHTML = '';
        b.allies.forEach((a, i) => {
          if (a.kind === 'player') return;
          const hp = ISK.combat.allyHp(a, p), max = a.maxHp;
          const spr = a.kind === 'comp' ? SP().forCompanion(a.ref) : SP().forPet(a.ref.key);
          allyRow.appendChild(h('div', { class: 'ally' + (hp <= 0 ? ' dead' : ''), 'data-ally': i }, SP().img(spr, 64, 'bob'), h('div', { class: 'aname' }, a.name), h('div', { class: 'bar hp' }, h('div', { class: 'fill', style: { width: (hp / max * 100) + '%' } }), h('span', null, `${hp}/${max}`))));
        });
        timeline.innerHTML = ''; timeline.append(h('span', { class: 'tl-l' }, 'Черга:'));
        for (const o of b.order || []) {
          if (o.side === 'ally') { const a = b.allies[o.i]; if (!a || ISK.combat.allyHp(a, p) <= 0) continue; timeline.append(h('span', { class: 'tl ally' }, o.i === 0 ? SP().img(SP().hero(p), 26) : a.icon)); }
          else { const e = b.enemies[o.i]; if (!e || e.hp <= 0) continue; timeline.append(h('span', { class: 'tl enemy' + (e.broken ? ' broken' : '') }, e.broken ? '💥' : e.icon)); }
        }
        comboBox.textContent = b.combo >= 2 ? `🔗 КОМБО ×${b.combo}` : '';
        const d = PL().derived(p); playerBox.innerHTML = '';
        const buffs = Object.entries(b.buffs).map(([k, v]) => `${{ atk: '⚔️', def: '🛡️', crit: '🎯', dodge: '💨', shield: '🔷', regen: '🌿', counter: '↩️', taunt: '😤', haste: '⚡' }[k] || k}${v.turns}`).join(' ');
        playerBox.append(h('div', { class: 'row' }, SP().img(SP().hero(p), 56, 'bob'), h('div', null, h('div', { style: { fontWeight: 800 } }, `${p.name} · рів. ${p.level}`), h('div', { class: 'muted', style: { fontSize: '12px' } }, `⚔${d.atk} ✨${d.matk} 🛡${d.def} 💥${d.crit.toFixed(0)}%`))),
          h('div', { class: 'bar hp' }, h('div', { class: 'fill', style: { width: (p.hp / d.maxHp * 100) + '%' } }), h('span', null, `❤️ ${p.hp}/${d.maxHp}`)),
          h('div', { class: 'bar mp' }, h('div', { class: 'fill', style: { width: (p.mp / d.maxMp * 100) + '%' } }), h('span', null, `🔷 ${p.mp}/${d.maxMp}`)),
          h('div', { class: 'bp-row', title: 'Бойові очки (BP): +1 щоходу, якщо не підсилюєш. Витрать 1–3, щоб бити кілька разів або посилити навичку.' }, h('span', { class: 'muted' }, 'BP'), [0, 1, 2, 3, 4].map((i) => h('span', { class: 'bp' + (i < b.bp ? ' on' : '') + (i < boost ? ' use' : '') }))),
          h('div', { class: 'bar limit' + (b.limit >= 100 ? ' full' : '') }, h('div', { class: 'fill', style: { width: b.limit + '%' } }), h('span', null, `🌟 УЛЬТА ${b.limit}%`)),
          h('div', { class: 'muted', style: { fontSize: '13px', minHeight: '18px' } }, buffs, b.pStatus.poison ? ' ☠️' : '', p.food ? ` 🍲(${p.food.battles})` : ''));
        drawActions();
      }

      function drawActions() {
        actions.innerHTML = '';
        const boostRow = h('div', { class: 'boost-acts' }, h('span', { class: 'muted', style: { fontSize: '12px' } }, '⚡ Підсилення:'),
          [0, 1, 2, 3].map((n) => h('button', { class: 'btn small' + (boost === n ? ' pink' : ' ghost'), disabled: busy || n > b.bp, title: n ? `Витратити ${n} BP: атака б'є ${n + 1} рази, навичка +${n * 55}%` : 'Без підсилення', onclick: () => { boost = n; draw(); } }, n ? '⚡'.repeat(n) : '—')));
        const main = h('div', { class: 'main-acts' },
          h('button', { class: 'btn primary', disabled: busy, onclick: () => attack() }, '⚔️ Атака'),
          h('button', { class: 'btn', disabled: busy, onclick: () => { menu = 'skills'; drawActions(); } }, '📖 Навички'),
          h('button', { class: 'btn', disabled: busy, onclick: () => { menu = 'items'; drawActions(); } }, '🎒 Предмети'),
          h('button', { class: 'btn', disabled: busy, onclick: () => doAct({ type: 'defend' }) }, '🛡️ Захист'),
          h('button', { class: 'btn pink' + (b.limit >= 100 ? ' glow' : ''), disabled: busy || b.limit < 100, onclick: () => doAct({ type: 'limit' }) }, '🌟 УЛЬТА'),
          h('button', { class: 'btn ghost', disabled: busy || !!boss || opts.noFlee, onclick: () => doAct({ type: 'flee' }) }, '💨 Втеча'));
        const sub = h('div', { class: 'sub-acts' });
        if (menu === 'skills') {
          const sks = PL().knownSkills(p);
          if (!sks.length) sub.appendChild(h('span', { class: 'muted' }, 'Немає навичок. Обери клас у гільдії!'));
          for (const sk of sks) { const cd = b.cd[sk.id]; sub.appendChild(h('button', { class: 'btn small' + (sk.ascend ? ' pink' : ''), disabled: busy || p.mp < sk.mp || cd > 0, title: sk.desc, onclick: () => doAct({ type: 'skill', id: sk.id, target }) }, `${sk.icon} ${sk.name} ★${sk.rank} · 🔷${sk.mp}${cd > 0 ? ` ⏱${cd}` : ''}`)); }
        } else if (menu === 'items') {
          const its = Object.entries(p.inventory).filter(([id]) => { const it = PL().item(id); return it && it.kind === 'consumable' && !it.use.revive && !it.use.teleport && !it.use.reveal; });
          if (!its.length) sub.appendChild(h('span', { class: 'muted' }, 'Немає витратних предметів.'));
          for (const [id, n] of its) { const it = PL().item(id); sub.appendChild(h('button', { class: 'btn small', disabled: busy, onclick: () => doAct({ type: 'item', id, target }) }, `${it.icon} ${it.name} ×${n}`)); }
        } else sub.appendChild(h('span', { class: 'muted', style: { fontSize: '13px' } }, 'Клікни на ворога — обрати ціль. Значок над ворогом — його намір на цей хід. Атака: ПРОБІЛ у золотій зоні!'));
        actions.append(boostRow, main, sub);
      }

      function attack() {
        if (busy) return; busy = true; drawActions();
        const e = b.enemies[target]; const gold = Math.max(6, 14 - (e ? e.agi * 0.25 : 0));
        const box = h('div', { class: 'timing' }, h('div', { style: { fontWeight: 800 } }, 'Влучи в золото! [ПРОБІЛ / клік]'));
        const track = h('div', { class: 'track' }, h('div', { class: 'z', style: { left: '0', width: '100%', background: 'linear-gradient(90deg,#4a2030,#2a2440,#4a2030)' } }), h('div', { class: 'z', style: { left: '30%', width: '40%', background: 'rgba(255,201,77,0.25)' } }), h('div', { class: 'z', style: { left: `${50 - gold / 2}%`, width: `${gold}%`, background: 'linear-gradient(90deg,#ffc94d,#fff1b0,#ffc94d)' } }));
        const needle = h('div', { class: 'needle' }); track.appendChild(needle); box.appendChild(track); root.appendChild(box);
        const t0 = performance.now(); let raf, done = false; const speed = 1.15 + Math.random() * 0.35;
        const posAt = (t) => { const f = (((t - t0) / 1000) * speed) % 2; return (f < 1 ? f : 2 - f) * 100; };
        const step = (t) => { needle.style.left = `calc(${posAt(t)}% - 2px)`; if (t - t0 > 3200) finish(); else raf = requestAnimationFrame(step); };
        raf = requestAnimationFrame(step);
        function finish() {
          if (done) return; done = true; cancelAnimationFrame(raf);
          const dist = Math.abs(posAt(performance.now()) - 50); const q = globalThis.ISK_AUTOPLAY ? 1.3 : dist <= gold / 2 ? 1.3 : dist <= 20 ? 1.0 : 0.7;
          box.querySelector('div').textContent = q >= 1.3 ? '✨ ІДЕАЛЬНО! ✨' : q >= 1 ? 'Добре!' : 'Мимо зони...';
          window.removeEventListener('keydown', key);
          setTimeout(() => { box.remove(); busy = false; doAct({ type: 'attack', target, quality: q }); }, 260);
        }
        const key = (ev) => { if (ev.code === 'Space' || ev.code === 'Enter') { ev.preventDefault(); finish(); } };
        window.addEventListener('keydown', key); box.addEventListener('mousedown', finish);
        root.addEventListener('mousedown', function once(ev) { if (!box.contains(ev.target)) { root.removeEventListener('mousedown', once); finish(); } });
        if (globalThis.ISK_AUTOPLAY) setTimeout(finish, 50);
      }

      function floatAt(el, text, cls) {
        if (!el) return; const r = el.getBoundingClientRect();
        const f = h('div', { class: 'float ' + cls, style: { left: (r.left + r.width / 2 - 20 + (Math.random() * 40 - 20)) + 'px', top: (r.top + r.height * 0.3) + 'px' } }, text);
        document.body.appendChild(f); setTimeout(() => f.remove(), 1000);
      }
      const allyEl = (i) => (i === 0 || i === undefined ? playerBox : allyRow.querySelector(`[data-ally="${i}"]`) || playerBox);

      async function doAct(action) {
        if (busy) return; busy = true; menu = 'main'; action.boost = boost; boost = 0; drawActions();
        const evs = ISK.combat.act(b, p, action);
        for (const ev of evs) await playEvent(ev);
        busy = false;
        if (b.over) return end();
        draw();
      }

      async function playEvent(ev) {
        const sleep = UI().sleep;
        switch (ev.kind) {
          case 'skill': addLog(`${ev.icon} «${ev.name}»!`); A().play('magic'); top.textContent = `${ev.icon} ${ev.name}!`; if (ev.big) UI().cutin(ev.name.toUpperCase(), p.name, '#b77bff'); await sleep(ev.big ? 700 : 220); break;
          case 'break': { draw(); const card = cards[ev.target]; if (card) { card.classList.remove('broke'); void card.offsetWidth; card.classList.add('broke'); floatAt(card, 'BREAK!', 'crit'); } A().play('crit'); addLog(ev.text, true); top.textContent = ev.text; root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake'); await sleep(420); break; }
          case 'boost': addLog(ev.text, true); A().play('magic'); UI().sparkle(innerWidth / 2, innerHeight * 0.62, 10 * ev.amount); await sleep(160); break;
          case 'combo': addLog(ev.text, true); comboBox.textContent = `🔗 КОМБО ×${ev.amount}`; comboBox.classList.remove('pop'); void comboBox.offsetWidth; comboBox.classList.add('pop'); await sleep(200); break;
          case 'limit': A().play('crit'); UI().cutin('СИЛА ПРОТАГОНІСТА!!!', 'Ульта', '#ff7eb6'); UI().sparkle(innerWidth / 2, innerHeight * 0.4, 30); root.classList.add('flashy'); await sleep(900); root.classList.remove('flashy'); break;
          case 'dmg': {
            if (ev.side === 'enemy') {
              draw(); const card = cards[ev.target]; const e = b.enemies[ev.target]; if (!card || !e) break;
              card.classList.remove('hit'); void card.offsetWidth; card.classList.add('hit');
              floatAt(card, (ev.crit ? '💥' : '') + ev.amount + (ev.weak ? '!' : ''), ev.crit ? 'crit' : '');
              A().play(ev.crit ? 'crit' : 'hit');
              const who = ev.dot ? (ev.dot === 'poison' ? '☠️ Отрута' : '🔥 Вогонь') : ev.by && ev.by.startsWith('comp:') ? '🤝 ' + ev.by.slice(5) : ev.by && ev.by.startsWith('pet:') ? '🐾 ' + ev.by.slice(4) : '⚔️ Ти';
              addLog(`${who} → ${e.name}: ${ev.amount}${ev.crit ? ' (КРИТ!)' : ''}${ev.weak ? ' (слабкість!)' : ''}${ev.resist ? ' (опір)' : ''}`);
              if (ev.crit) { root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake'); }
            } else {
              const el = allyEl(ev.ally); floatAt(el, '-' + ev.amount, 'pdmg'); A().play('hurt');
              const e = ev.by >= 0 ? b.enemies[ev.by] : null; const a = b.allies[ev.ally];
              addLog(`${e ? e.icon + ' ' + e.name : '☠️ Отрута'} → ${a && a.kind !== 'player' ? a.name : 'ти'}: ${ev.amount}`);
              if (!a || a.kind === 'player') { root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake'); }
              draw();
            }
            await sleep(240); break;
          }
          case 'heal': floatAt(ev.side === 'enemy' ? cards[ev.target] : allyEl(ev.ally), '+' + (ev.amount || ''), 'heal'); A().play('heal'); addLog(ev.text || `💚 +${ev.amount}`); draw(); await sleep(200); break;
          case 'miss': floatAt(playerBox, 'Ухилення!', 'miss'); A().play('miss'); addLog('💨 Ти ухиляєшся від атаки!'); await sleep(200); break;
          case 'status': addLog(ev.text); if (ev.target >= 0) floatAt(cards[ev.target], ev.text, 'miss'); draw(); await sleep(160); break;
          case 'buff': addLog(ev.text); A().play('magic'); draw(); await sleep(160); break;
          case 'summon': addLog(ev.text, true); A().play('bubble'); cards = []; draw(); await sleep(300); break;
          case 'die': addLog(`💀 ${ev.name} переможено!`); draw(); await sleep(200); break;
          case 'text': addLog(ev.text, ev.big); if (ev.big) { top.textContent = ev.text; await sleep(1800); } else await sleep(110); break;
          default: break;
        }
      }

      async function end() {
        const G2 = UI().G; root.remove(); UI().inCombat = false; A().setMood('calm');
        if (b.over === 'win') {
          A().play('win');
          const res = ISK.game.applyRewards(G2, b); const r = b.rewards;
          const itemsTxt = Object.entries(r.items).map(([id, n]) => { const it = PL().item(id); return it ? `${it.icon} ${it.name}${n > 1 ? ' ×' + n : ''}` : ''; }).join('\n');
          let msg = `${b.breaks ? `💥 Зламів: ${b.breaks} · ` : ''}${b.maxCombo >= 2 ? `🔗 Макс. комбо ×${b.maxCombo} · ` : ''}+${r.xp} ✨ досвіду${p.cheat === 'exp' ? ' (×1.6)' : ''}\n+${r.gold} 🪙${res.fame ? `\n+${res.fame} ⭐ слави` : ''}${itemsTxt ? '\n\nЗдобич:\n' + itemsTxt : ''}`;
          for (const c of res.cr) msg += `\n${D().CLASSES[c.cls].icon} Рівень класу ${c.lvl}! +1 очко навичок${c.skills.length ? ' · нова навичка: ' + c.skills.map((s) => s.icon + ' ' + s.name).join(', ') : ''}${c.advReady ? '\n⬆️ ДОСТУПНЕ ПІДВИЩЕННЯ КЛАСУ ІІ (вікно K)!' : ''}${c.masterReady ? '\n⏫ ДОСТУПНИЙ КЛАС ІІІ (вікно K)!' : ''}${c.ascendReady ? '\n🌟 Доступне вознесіння у тренера!' : ''}`;
          if (res.petUp) msg += `\n🐾 ${res.petUp.name}: рівень ${res.petUp.lvl}!`;
          for (const c of res.compUps) msg += `\n🤝 ${c.name}: рівень ${c.lvl}!`;
          if (res.xr.ups.length) UI().levelUp(p.level);
          await UI().alert(['Перемога!', 'Чиста перемога!', 'Ворог повержений!', 'Ти — легенда! (локальна)'][Math.floor(Math.random() * 4)], msg, '🏆');
          UI().showNews([]); UI().refresh(); resolve('win');
        } else if (b.over === 'flee') { UI().refresh(); resolve('flee'); }
        else {
          A().play('lose');
          if (opts.noDeath) { p.hp = 1; await UI().alert('Поразка', 'Ти програв, але це був тренувальний бій. Гордість постраждала більше, ніж тіло.', '😵'); UI().refresh(); resolve('lose'); return; }
          const r = ISK.game.onDefeat(G2);
          if (ISK.goddess) ISK.goddess.react('death');
          await UI().alert('Ти впав...', `Темрява... Голос богині: «Ой-ой! Не помирай так швидко, я ж на тебе ставила!»\n\nТи прокидаєшся в храмі (${r.where}). Хтось «позичив» ${r.lost} 🪙, поки ти був непритомний.`, '💀');
          ISK.render.centerOn(G2.player.location); UI().showNews([]); UI().refresh(); resolve('lose');
        }
      }
      draw();
      if (globalThis.ISK_AUTOFIGHT) (async () => { for (let i = 0; i < 60 && !b.over; i++) { await UI().sleep(60); if (!busy) { const sk = PL().knownSkills(p).find((s) => p.mp >= s.mp && !b.cd[s.id] && s.power); doAct(b.limit >= 100 ? { type: 'limit' } : sk ? { type: 'skill', id: sk.id, target } : { type: 'attack', target, quality: 1 }); } } })();
    });
  }
  ISK.combatUI = { run };
})();
