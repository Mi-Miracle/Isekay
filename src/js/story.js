// Story v2: title, isekai intro (truck-kun!), goddess Lumi, race (Бог→гоблін!), appearance editor, blessing roulette, voices, calls, ending.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = () => ISK.ui; const h = (...a) => ISK.ui.h(...a); const A = () => ISK.audio; const D = () => ISK.data; const SP = () => ISK.sprites;
  const $ = (s) => document.querySelector(s);

  function titleBg() {
    const c = $('#title-bg'); const g = c.getContext('2d'); const parts = [];
    const resize = () => { c.width = c.clientWidth; c.height = c.clientHeight; }; resize(); window.addEventListener('resize', resize);
    for (let i = 0; i < 160; i++) parts.push({ x: Math.random(), y: Math.random(), s: Math.random() * 2 + 0.3, v: Math.random() * 0.0004 + 0.0001, petal: Math.random() < 0.3, a: Math.random() * 6 });
    (function frame(t) {
      if ($('#screen-title').classList.contains('active')) {
        g.clearRect(0, 0, c.width, c.height);
        for (const p of parts) {
          p.y += p.v * (p.petal ? 3 : 1); p.x += Math.sin(t / 2000 + p.a) * 0.0003; if (p.y > 1.02) { p.y = -0.02; p.x = Math.random(); }
          if (p.petal) { g.save(); g.translate(p.x * c.width, p.y * c.height); g.rotate(t / 900 + p.a); g.fillStyle = 'rgba(255,170,205,0.7)'; g.beginPath(); g.ellipse(0, 0, 5 * p.s, 2.6 * p.s, 0, 0, 7); g.fill(); g.restore(); }
          else { g.fillStyle = `rgba(255,240,210,${0.4 + Math.sin(t / 500 + p.a) * 0.3})`; g.fillRect(p.x * c.width, p.y * c.height, p.s, p.s); }
        }
        const bw = c.width, bh = c.height; g.fillStyle = 'rgba(8,8,20,0.88)';
        g.beginPath(); g.moveTo(0, bh); g.lineTo(0, bh * 0.82); for (let x = 0; x <= bw; x += bw / 40) g.lineTo(x, bh * (0.82 + Math.sin(x / 90) * 0.02)); g.lineTo(bw, bh); g.fill();
        const cx = bw * 0.82, cy = bh * 0.8;
        g.fillRect(cx - 60, cy - 90, 120, 90); g.fillRect(cx - 80, cy - 140, 30, 140); g.fillRect(cx + 50, cy - 160, 30, 160); g.fillRect(cx - 15, cy - 190, 30, 100);
        for (const [a, b2, c2] of [[cx - 85, cy - 140, cy - 180], [cx + 45, cy - 160, cy - 205], [cx - 20, cy - 190, cy - 240]]) { g.beginPath(); g.moveTo(a, b2); g.lineTo(a + 20, c2); g.lineTo(a + 40, b2); g.fill(); }
        g.fillStyle = 'rgba(255,210,120,0.8)'; g.fillRect(cx - 4, cy - 170, 8, 12); g.fillRect(cx + 60, cy - 130, 6, 10);
        // walking pixel hero
        const hx = ((t / 40) % (bw + 200)) - 100; const hero = SP().hero({ race: 'human', gender: 'm', look: { hair: 3, hairColor: 6, eyes: 0, costume: 'c_school' }, equipment: { weapon: 'w_sword_0_0' }, classes: {} });
        g.imageSmoothingEnabled = false; g.drawImage(hero, hx, bh * 0.82 - 62 - Math.abs(Math.sin(t / 150)) * 4, 64, 64);
        const sl = SP().monster('slime'); g.drawImage(sl, hx - 70, bh * 0.82 - 44 - Math.abs(Math.sin(t / 120)) * 10, 48, 48);
      }
      requestAnimationFrame(frame);
    })(0);
  }
  function titleRefresh() {
    const last = localStorage.getItem('dyvo_last'); const info = last ? ISK.panels.slotInfo(last) : null;
    const b = $('#btn-continue'); b.disabled = !info; b.textContent = info ? `📜 Продовжити (${info.name}, рів. ${info.level})` : '📜 Продовжити';
  }

  // ---------- Dialog ----------
  function dialog(lines, opts = {}) {
    return (async () => {
      const stage = opts.stage || $('#story-stage');
      for (const line of lines) {
        const L = typeof line === 'string' ? { text: line } : line;
        if (L.bg) $('#story-bg').className = L.bg;
        if (L.fx) await L.fx();
        if (L.portrait !== undefined) setPortrait(stage, L.portrait);
        await say(stage, L.who || opts.who || 'Оповідач', L.text, L.choices);
      }
    })();
  }
  function setPortrait(stage, p) {
    let el = stage.querySelector('.portrait-big');
    if (!p) { if (el) el.remove(); return; }
    if (!el) { el = h('div', { class: 'portrait-big' }); stage.appendChild(el); }
    el.innerHTML = ''; if (p instanceof HTMLCanvasElement) el.appendChild(SP().img(p, 200)); else el.textContent = p;
  }
  function say(stage, who, text, choices) {
    return new Promise((resolve) => {
      stage.querySelectorAll('.dialog').forEach((d) => d.remove());
      const txt = h('div', { class: 'text' });
      const dl = h('div', { class: 'dialog' }, h('div', { class: 'speaker' }, who), txt, choices ? null : h('div', { class: 'next' }, '▼'));
      stage.appendChild(dl);
      const tts = ISK.voice.say(who, text);
      let i = 0, done = false;
      const full = () => { done = true; txt.textContent = text; };
      const iv = setInterval(() => { if (done) return clearInterval(iv); i += 2; txt.textContent = text.slice(0, i); if (!tts) ISK.voice.blip(who, text[i]); if (i >= text.length) { done = true; clearInterval(iv); } }, 18);
      const advance = (e) => { if (e && e.type === 'keydown' && !['Space', 'Enter'].includes(e.code)) return; if (!done) { full(); return; } if (choices) return; cleanup(); ISK.voice.stop(); resolve(); };
      const cleanup = () => { window.removeEventListener('keydown', advance); dl.removeEventListener('click', advance); };
      window.addEventListener('keydown', advance); dl.addEventListener('click', advance);
      if (choices) dl.appendChild(h('div', { class: 'choices' }, choices.map((c) => h('button', { class: 'btn', onclick: (e) => { e.stopPropagation(); cleanup(); resolve(c.value); } }, c.label))));
      if (globalThis.ISK_AUTOPLAY) { full(); setTimeout(() => { cleanup(); resolve(choices ? choices[0].value : undefined); }, 10); }
    });
  }

  // ---------- New game ----------
  async function newGameFlow() {
    UI().showScreen('screen-story');
    const stage = $('#story-stage'); stage.innerHTML = ''; A().ensure(); A().music('calm');
    const origins = ['офісний працівник', 'студент-програміст', 'стрімер', 'кур\'єр піци', 'бариста', 'бухгалтер', 'вчителька фізкультури', 'геймер-задрот'];
    await dialog([{ bg: 'night', text: 'Звичайний вечір. Місто. Дощ. Ти повертаєшся додому після ще одного нескінченного дня...', portrait: '🌧️' }], { stage });
    const origin = await say(stage, 'Оповідач', 'Хто ти в цьому житті?', origins.map((o) => ({ label: o, value: o })));
    await dialog([{ text: `Ти — ${origin}. Ти мрієш про відпустку, нормальний сон і щоб тебе ніхто не чіпав.`, portrait: '🧑‍💼' }, { text: 'Ти переходиш дорогу. Зелене світло. Все добре. Все цілком безпечно...', portrait: '🚦' }], { stage });
    setPortrait(stage, null);
    const truck = h('div', { class: 'truck' }, '🚚'); const flash = h('div', { class: 'flash' }); stage.append(truck, flash);
    A().play('truck'); await UI().sleep(50); truck.classList.add('go');
    await UI().sleep(700); flash.classList.add('on'); $('#screen-story').classList.add('shake'); await UI().sleep(400); truck.remove();
    await dialog([{ who: '???', text: 'ВАНТАЖІВКА-КУН! 🚚💥\n\n(...класика жанру)' }], { stage });
    flash.classList.remove('on'); await UI().sleep(300); flash.remove(); $('#screen-story').classList.remove('shake');
    A().play('goddess');
    await dialog([
      { bg: 'void', who: 'Богиня Люмі', portrait: '👼', text: 'Ой! Ой-ой-ой! Привіт! Ти мене чуєш? Чудово! Ти, е-е-е... трохи помер. Вибач. Я відволіклася, коли керувала вантажівкою долі.' },
      { who: 'Богиня Люмі', text: 'Але гарна новина! Я — Люмі, богиня перероджень, — відправлю тебе в чарівний світ ДИВОСВІТ! Мечі, магія, ельфи, гільдії, королівства й Імперія з десятком васалів!' },
      { who: 'Богиня Люмі', text: 'Там, щоправда, Володар Демонів шле легіони з-за моря, орди вилазять з Лісу Смерті, і податки. Але це дрібниці!' },
    ], { stage });
    stage.querySelectorAll('.dialog').forEach((d) => d.remove()); setPortrait(stage, null);
    const pdata = await creation(stage, origin);
    if (pdata.race === 'god') {
      setPortrait(stage, '👼');
      await dialog([{ who: 'Богиня Люмі', text: 'Бог? Ти хочеш бути БОГОМ? Ну... гаразд! Натискаю кнопку «Божественність»... ой.' }, { who: 'Богиня Люмі', text: '...кнопка заїла. Ти тепер гоблін. Зелений. Маленький. З великими вухами. Але ж який милий! Гоблін — це майже бог, тільки... ні.' }], { stage });
      pdata.race = 'goblin'; pdata.flags = { godGoblin: true };
      stage.querySelectorAll('.dialog').forEach((d) => d.remove()); setPortrait(stage, null);
    }
    const cheat = await roulette(stage); pdata.cheat = cheat;
    setPortrait(stage, '👼');
    await dialog([
      { who: 'Богиня Люмі', text: `Чудово, ${pdata.name}! Твоє благословення — «${D().CHEATS[cheat].name}». ${D().CHEATS[cheat].desc}` },
      { who: 'Богиня Люмі', text: 'Порада: знайди Гільдію шукачів пригод (я позначу ❗ на мапі). Зареєструйся, обери клас, здобувай славу і титули. І не помирай одразу — у мене звітність.' },
      { who: 'Богиня Люмі', text: 'Ну все, па-па! Тримай кулачки! ✨ *штовхає тебе в портал*' },
    ], { stage });
    $('#story-bg').className = 'world'; setPortrait(stage, null);
    stage.querySelectorAll('.dialog').forEach((d) => d.remove());
    stage.appendChild(h('div', { class: 'dialog' }, h('div', { class: 'speaker' }, 'Світ народжується'), h('div', { class: 'text' }, 'Формуються континенти, острови, королівства й імперія... Боги грають у кості... ⏳')));
    await UI().sleep(80);
    const G = ISK.game.newGame(pdata.seed || Math.floor(Math.random() * 1e9), pdata);
    if (pdata.flags) Object.assign(G.player.flags, pdata.flags);
    const S0 = G.world.baronies[G.world.startBarony];
    await dialog([
      { who: 'Оповідач', portrait: SP().hero(G.player), text: `Ти розплющуєш очі в селі ${S0.name}, що в ${G.world.realms[S0.owner].fullName} — одному з королівств Імперії. У кишені — ${G.player.gold} монет і два шматки хліба.` },
      { who: 'Місцевий дід', portrait: SP().npc('дід'), text: `«О, ще один з неба впав!${G.player.race === 'goblin' ? ' Ще й гоблін... Ну, буває.' : ''} Гільдія? У найближчому містечку. Іди дорогою і не чіпай слизів. Хоча... можеш і чіпати. Вони слабкі.»` },
    ], { stage });
    setPortrait(stage, null);
    UI().startGame(G); ISK.panels.autosave();
    UI().toast('❗ Головний квест: знайди Гільдію шукачів пригод (маркер на мапі)!', 'epic', 6000);
    if (G.player.flags.godGoblin) ISK.game.unlock(G, 'goblin_god');
    const town = ISK.game.questMarkers(G).find((m) => m.main); if (town) { G.discovered[town.node] = 1; setTimeout(() => UI().showInfo(town.node), 600); }
  }

  function creation(stage, origin) {
    return new Promise((resolve) => {
      const st = { gender: 'm', race: 'human', look: { hair: 0, hairColor: 0, eyes: 0, costume: 'c_default' } };
      const name = h('input', { value: 'Хіро', maxlength: 18 }); const seedIn = h('input', { placeholder: 'випадковий', inputmode: 'numeric' });
      const preview = h('div', { class: 'preview' });
      const fake = () => ({ race: st.race === 'god' ? 'human' : st.race, gender: st.gender, look: st.look, equipment: { weapon: 'w_sword_0_0' }, classes: {} });
      const upd = () => { preview.innerHTML = ''; preview.appendChild(SP().img(SP().hero(fake()), 160, 'bob')); if (st.race === 'god') preview.appendChild(h('div', { class: 'godglow' }, '✨')); raceDesc.textContent = D().RACES[st.race].desc; };
      const raceDesc = h('div', { class: 'muted', style: { fontSize: '13px', minHeight: '36px' } });
      const choiceRow = (items, cur, set) => { const row = h('div', { class: 'row wrap' }); items.forEach(([v, label]) => row.appendChild(h('button', { class: 'btn small' + (cur() === v ? ' primary' : ''), onclick: () => { set(v); [...row.children].forEach((b) => b.classList.remove('primary')); row.children[items.findIndex((x) => x[0] === v)].classList.add('primary'); upd(); } }, label))); return row; };
      const swatches = (cols, cur, set) => { const row = h('div', { class: 'row wrap' }); cols.forEach((c, i) => row.appendChild(h('div', { class: 'sw' + (cur() === i ? ' sel' : ''), style: { background: c }, onclick: (e) => { set(i); [...row.children].forEach((b) => b.classList.remove('sel')); e.currentTarget.classList.add('sel'); upd(); } }))); return row; };
      const card = h('div', { class: 'create-card' }, h('h2', null, 'Анкета переродженця'),
        h('div', { class: 'muted', style: { marginBottom: '10px' } }, 'Люмі: «Заповни, будь ласка. Бюрократія існує навіть на небесах.»'),
        h('div', { class: 'create-flex' },
          h('div', { class: 'create-left' }, preview, raceDesc),
          h('div', { class: 'create-grid' },
            h('div', { class: 'field' }, h('label', null, 'Ім\'я в новому світі'), name),
            h('div', { class: 'field' }, h('label', null, 'Тіло'), choiceRow([['m', '🧑 Чоловіче'], ['f', '👩 Жіноче']], () => st.gender, (v) => { st.gender = v; if (name.value === 'Хіро' || name.value === 'Сакура') name.value = v === 'f' ? 'Сакура' : 'Хіро'; })),
            h('div', { class: 'field span2' }, h('label', null, 'Раса'), choiceRow(Object.entries(D().RACES).filter(([k]) => k !== 'goblin').map(([k, R]) => [k, `${R.icon} ${R.name}`]), () => st.race, (v) => { st.race = v; })),
            h('div', { class: 'field' }, h('label', null, 'Зачіска'), choiceRow(D().HAIR_STYLES.map((n, i) => [i, n]), () => st.look.hair, (v) => { st.look.hair = v; })),
            h('div', { class: 'field' }, h('label', null, 'Колір волосся'), swatches(D().HAIR_COLORS, () => st.look.hairColor, (v) => { st.look.hairColor = v; })),
            h('div', { class: 'field' }, h('label', null, 'Очі'), swatches(D().EYE_COLORS, () => st.look.eyes, (v) => { st.look.eyes = v; })),
            h('div', { class: 'field' }, h('label', null, 'Вбрання'), choiceRow([['c_default', '👕 Подорожній'], ['c_school', '🎽 Шкільна форма'], ['c_hoodie', '🧥 Худі'], ['c_pajama', '😺 Піжама']], () => st.look.costume, (v) => { st.look.costume = v; })),
            h('div', { class: 'field' }, h('label', null, 'Зерно світу (необов\'язково)'), seedIn),
            h('div', { class: 'field' }, h('label', null, 'Минуле життя'), h('div', { style: { padding: '8px 0' } }, origin)))),
        h('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: '14px' } }, h('button', { class: 'btn primary big', style: { minWidth: '220px' }, onclick: () => {
          card.remove(); resolve({ name: (name.value || 'Хіро').trim().slice(0, 18), gender: st.gender, race: st.race, look: { ...st.look }, origin, seed: seedIn.value ? Math.abs(parseInt(seedIn.value, 10)) || 1 : null });
        } }, 'Далі ➜')));
      stage.appendChild(card); upd();
      if (globalThis.ISK_AUTOPLAY && !globalThis.ISK_HOLD) setTimeout(() => card.querySelector('.btn.primary.big').click(), 10);
    });
  }

  function roulette(stage) {
    return new Promise((resolve) => {
      const keys = Object.keys(D().CHEATS);
      const slots = keys.map((k) => h('div', { class: 'slot' }, h('div', { class: 'ic' }, D().CHEATS[k].icon), h('div', { class: 'nm' }, D().CHEATS[k].name)));
      const desc = h('div', { class: 'muted', style: { minHeight: '40px', textAlign: 'center' } }, 'Люмі: «А тепер — РУЛЕТКА БЛАГОСЛОВЕНЬ! Барабанний дріб!»');
      const btns = h('div', { class: 'row', style: { justifyContent: 'center' } });
      const card = h('div', { class: 'create-card' }, h('h2', null, `🎰 Рулетка благословень (${keys.length})`), h('div', { class: 'roulette' }, slots), desc, btns);
      stage.appendChild(card); let rerolled = false;
      const spin = async () => {
        btns.innerHTML = ''; let idx = 0; const total = 22 + Math.floor(Math.random() * keys.length);
        for (let i = 0; i < total; i++) { slots.forEach((s) => s.classList.remove('hot')); idx = i % keys.length; slots[idx].classList.add('hot'); A().play('click'); await UI().sleep(globalThis.ISK_AUTOPLAY ? 1 : 40 + i * 7); }
        const k = keys[idx]; desc.textContent = `${D().CHEATS[k].icon} ${D().CHEATS[k].name}: ${D().CHEATS[k].desc}`; A().play('goddess'); UI().sparkle(innerWidth / 2, innerHeight / 2, 16);
        btns.append(h('button', { class: 'btn primary', onclick: () => { card.remove(); resolve(k); } }, 'Беру!'));
        if (!rerolled) btns.append(h('button', { class: 'btn', onclick: () => { rerolled = true; desc.textContent = 'Люмі: «Ну гаразд, ще разок. Але тільки один! У мене ліміт.»'; spin(); } }, '🔄 Ще раз (один раз)'));
        btns.append(h('button', { class: 'btn ghost', onclick: () => { desc.textContent = 'Люмі: «Ох, ці твої очі... Обирай, тільки нікому не кажи!»'; btns.innerHTML = ''; slots.forEach((s, i) => { s.style.cursor = 'pointer'; s.onclick = () => { card.remove(); resolve(keys[i]); }; }); } }, '🥺 Будь ласка, можна самому?'));
        if (globalThis.ISK_AUTOPLAY) setTimeout(() => btns.querySelector('.btn.primary').click(), 5);
      };
      btns.append(h('button', { class: 'btn pink big', style: { minWidth: '200px' }, onclick: spin }, '🎰 Крутити!'));
      if (globalThis.ISK_AUTOPLAY) setTimeout(spin, 5);
    });
  }

  function overlayStage(bg) {
    const stage = h('div', { class: 'story-overlay', style: { background: bg } }); document.body.appendChild(stage); return stage;
  }
  async function goddessCall(lines) {
    if (globalThis.ISK_AUTOPLAY) return;
    A().play('goddess'); const stage = overlayStage('radial-gradient(circle at 50% 35%, rgba(255,240,250,.92), rgba(120,100,200,.85))');
    setPortrait(stage, '👼'); await dialog(lines.map((t) => ({ who: 'Богиня Люмі', text: t })), { stage }); stage.remove();
  }
  async function npcTalk(name, text, sprite) {
    const stage = overlayStage('rgba(6,8,16,.55)'); setPortrait(stage, sprite); await dialog([{ who: name, text }], { stage }); stage.remove();
  }
  async function ending() {
    const G = UI().G; const p = G.player; A().play('win');
    const stage = overlayStage('linear-gradient(180deg, #ffd9ec, #b9a6ff 60%, #4b3d8f)');
    setPortrait(stage, SP().boss('citadel'));
    await dialog([
      { who: 'Володар Демонів Малдраґор', text: '«Ні-і-і! Як?! Я ж прочитав «Як перемогти героя за 7 днів»! ...Слухай, а можна я просто піду на пенсію? Розводитиму кактуси.»' },
      { who: 'Богиня Люмі', portrait: '👼', text: `${p.name}! ТИ ЗРОБИВ ЦЕ! Володаря Демонів переможено! Легіони Темряви розбігаються! Я отримаю премію! Ой, тобто — ти отримаєш вічну славу!` },
      { who: 'Богиня Люмі', text: 'Можу повернути тебе додому... або лишайся в Дивосвіті. Тобі тут явно подобається. Стань герцогом, відкрий таверну, досягни рангу SSS!' },
      { who: 'Оповідач', portrait: SP().hero(p), text: `І так ${p.name}, колишній ${p.origin}, став Легендою Дивосвіту. Барди співають про героя, якого збила вантажівка. Пісня має 47 куплетів. Жоден не римується.\n\n✨ КІНЕЦЬ (але світ живе далі!) ✨` },
    ], { stage });
    ISK.politics.log(G.P, ISK.game.day(G), `🌟 ${p.name} переміг Володаря Демонів Малдраґора! По всьому Дивосвіту — свята.`, 'dynasty', []);
    p.gold += 5000; p.flags.hero = true; stage.remove();
    UI().cutin('ПЕРЕМОГА!', 'Головний квест завершено. Світ живе далі!', '#ffd36e'); UI().sparkle(innerWidth / 2, innerHeight / 2, 50, ['🌸', '✦', '★', '♥']);
    ISK.game.checkAchievements(G); UI().checkMainQuest(); UI().refresh();
  }

  ISK.story = { titleBg, titleRefresh, newGameFlow, dialog, goddessCall, ending, npcTalk };
})();
