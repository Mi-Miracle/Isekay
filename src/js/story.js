// Title screen, isekai intro (truck-kun!), goddess roulette, character creation, goddess calls and ending.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = () => ISK.ui;
  const h = (...a) => ISK.ui.h(...a);
  const A = () => ISK.audio;
  const D = () => ISK.data;
  const $ = (s) => document.querySelector(s);

  // ---------- Title background: drifting stars & sakura petals ----------
  function titleBg() {
    const c = $('#title-bg'); const g = c.getContext('2d');
    let parts = [];
    const resize = () => { c.width = c.clientWidth; c.height = c.clientHeight; };
    resize(); window.addEventListener('resize', resize);
    for (let i = 0; i < 140; i++) parts.push({ x: Math.random(), y: Math.random(), s: Math.random() * 2 + 0.3, v: Math.random() * 0.0004 + 0.0001, petal: Math.random() < 0.25, a: Math.random() * 6 });
    (function frame(t) {
      if ($('#screen-title').classList.contains('active')) {
        g.clearRect(0, 0, c.width, c.height);
        for (const p of parts) {
          p.y += p.v * (p.petal ? 3 : 1); p.x += Math.sin(t / 2000 + p.a) * 0.0003; if (p.y > 1.02) { p.y = -0.02; p.x = Math.random(); }
          if (p.petal) { g.save(); g.translate(p.x * c.width, p.y * c.height); g.rotate(t / 900 + p.a); g.fillStyle = 'rgba(255,170,205,0.7)'; g.beginPath(); g.ellipse(0, 0, 5 * p.s, 2.6 * p.s, 0, 0, 7); g.fill(); g.restore(); }
          else { g.fillStyle = `rgba(255,240,210,${0.4 + Math.sin(t / 500 + p.a) * 0.3})`; g.fillRect(p.x * c.width, p.y * c.height, p.s, p.s); }
        }
        // silhouette castle
        g.fillStyle = 'rgba(8,8,20,0.85)';
        const bw = c.width, bh = c.height;
        g.beginPath(); g.moveTo(0, bh); g.lineTo(0, bh * 0.82);
        for (let x = 0; x <= bw; x += bw / 40) g.lineTo(x, bh * (0.82 + Math.sin(x / 90) * 0.02));
        g.lineTo(bw, bh); g.fill();
        const cx = bw * 0.82, cy = bh * 0.8;
        g.fillRect(cx - 60, cy - 90, 120, 90); g.fillRect(cx - 80, cy - 140, 30, 140); g.fillRect(cx + 50, cy - 160, 30, 160); g.fillRect(cx - 15, cy - 190, 30, 100);
        g.beginPath(); g.moveTo(cx - 85, cy - 140); g.lineTo(cx - 65, cy - 180); g.lineTo(cx - 45, cy - 140); g.fill();
        g.beginPath(); g.moveTo(cx + 45, cy - 160); g.lineTo(cx + 65, cy - 205); g.lineTo(cx + 85, cy - 160); g.fill();
        g.beginPath(); g.moveTo(cx - 20, cy - 190); g.lineTo(cx, cy - 240); g.lineTo(cx + 20, cy - 190); g.fill();
        g.fillStyle = 'rgba(255,210,120,0.8)'; g.fillRect(cx - 4, cy - 170, 8, 12); g.fillRect(cx + 60, cy - 130, 6, 10);
      }
      requestAnimationFrame(frame);
    })(0);
  }

  function titleRefresh() {
    const last = localStorage.getItem('isekay_last');
    const info = last ? ISK.panels.slotInfo(last) : null;
    const b = $('#btn-continue');
    b.disabled = !info;
    b.textContent = info ? `📜 Продовжити (${info.name}, рів. ${info.level})` : '📜 Продовжити';
  }

  // ---------- Dialog helper ----------
  function dialog(lines, opts = {}) {
    return new Promise(async (resolve) => {
      const stage = opts.stage || $('#story-stage');
      for (const line of lines) {
        const L = typeof line === 'string' ? { text: line } : line;
        if (L.bg) $('#story-bg').className = L.bg;
        if (L.fx) await L.fx();
        if (L.portrait !== undefined) setPortrait(stage, L.portrait);
        await say(stage, L.who || opts.who || 'Оповідач', L.text, L.choices);
      }
      resolve();
    });
  }
  function setPortrait(stage, p) {
    let el = stage.querySelector('.portrait-big');
    if (!p) { el && el.remove(); return; }
    if (!el) { el = h('div', { class: 'portrait-big' }); stage.appendChild(el); }
    el.textContent = p;
  }
  function say(stage, who, text, choices) {
    return new Promise((resolve) => {
      stage.querySelectorAll('.dialog').forEach((d) => d.remove());
      const txt = h('div', { class: 'text' });
      const dl = h('div', { class: 'dialog' }, h('div', { class: 'speaker' }, who), txt, choices ? null : h('div', { class: 'next' }, '▼'));
      stage.appendChild(dl);
      let i = 0, done = false;
      const full = () => { done = true; txt.textContent = text; };
      const iv = setInterval(() => { if (done) return clearInterval(iv); i += 2; txt.textContent = text.slice(0, i); if (i % 6 === 0) A().play('hover'); if (i >= text.length) { done = true; clearInterval(iv); } }, 16);
      const advance = (e) => {
        if (e && e.type === 'keydown' && !['Space', 'Enter'].includes(e.code)) return;
        if (!done) { full(); return; }
        if (choices) return;
        cleanup(); resolve();
      };
      const cleanup = () => { window.removeEventListener('keydown', advance); dl.removeEventListener('click', advance); };
      window.addEventListener('keydown', advance); dl.addEventListener('click', advance);
      if (choices) {
        const box = h('div', { class: 'choices' }, choices.map((c) => h('button', { class: 'btn', onclick: (e) => { e.stopPropagation(); cleanup(); resolve(c.value); c.fn && c.fn(); } }, c.label)));
        dl.appendChild(box);
      }
      if (globalThis.ISK_AUTOPLAY) { full(); setTimeout(() => { cleanup(); resolve(choices ? choices[0].value : undefined); }, 10); }
    });
  }

  // ---------- Intro ----------
  async function newGameFlow() {
    UI().showScreen('screen-story');
    const stage = $('#story-stage'); stage.innerHTML = '';
    A().ensure(); A().music('calm');
    const origins = ['офісний працівник', 'студент-програміст', 'стрімер', 'кур\'єр піци', 'бариста', 'бухгалтер'];
    let origin = origins[Math.floor(Math.random() * origins.length)];
    await dialog([
      { bg: 'night', text: 'Звичайний вечір. Місто. Дощ. Ти повертаєшся додому після ще одного нескінченного дня...', portrait: '🌧️' },
    ], { stage });
    origin = await new Promise((res) => say(stage, 'Оповідач', 'Хто ти в цьому житті?', origins.map((o) => ({ label: o, value: o }))).then(res));
    await dialog([
      { text: `Ти — ${origin}. Ти мрієш про відпустку, нормальний сон і щоб тебе ніхто не чіпав.`, portrait: '🧑‍💼' },
      { text: 'Ти переходиш дорогу. Зелене світло. Все добре. Все цілком безпечно...', portrait: '🚦' },
    ], { stage });
    // TRUCK-KUN
    setPortrait(stage, null);
    const truck = h('div', { class: 'truck' }, '🚚'); const flash = h('div', { class: 'flash' });
    stage.append(truck, flash);
    A().play('truck');
    await UI().sleep(50); truck.classList.add('go');
    await UI().sleep(700); flash.classList.add('on'); $('#screen-story').classList.add('shake');
    await UI().sleep(400); truck.remove();
    await dialog([{ who: '???', text: 'ВАНТАЖІВКА-КУН! 🚚💥\n\n(...класика жанру)' }], { stage });
    flash.classList.remove('on'); await UI().sleep(300); flash.remove(); $('#screen-story').classList.remove('shake');
    A().play('goddess');
    await dialog([
      { bg: 'void', who: 'Богиня Люмі', portrait: '👼', text: 'Ой! Ой-ой-ой! Привіт! Ти мене чуєш? Чудово! Ти, е-е-е... трохи помер. Вибач. Це я відволіклася, коли керувала вантажівкою долі.' },
      { who: 'Богиня Люмі', text: 'Але є гарна новина! Я — Люмі, богиня перероджень, — відправлю тебе в чарівний світ Ельдорію! Мечі, магія, ельфи, гільдія шукачів пригод! Усе як у твоїх улюблених аніме!' },
      { who: 'Богиня Люмі', text: 'Там, щоправда, прокидається Король Демонів. І держави постійно воюють. І податки. Але це дрібниці!' },
    ], { stage });
    stage.querySelectorAll('.dialog').forEach((d) => d.remove());
    const pdata = await creation(stage, origin);
    const cheat = await roulette(stage);
    pdata.cheat = cheat;
    await dialog([
      { who: 'Богиня Люмі', text: `Чудово, ${pdata.name}! Твоє благословення — «${D().CHEATS[cheat].name}». ${D().CHEATS[cheat].desc}` },
      { who: 'Богиня Люмі', text: 'Перша порада: знайди найближче містечко з Гільдією шукачів пригод. Зареєструйся, обери клас. І... не помирай одразу, гаразд? У мене звітність.' },
      { who: 'Богиня Люмі', text: 'Ну все, па-па! Тримай кулачки! ✨ *штовхає тебе в портал*' },
    ], { stage });
    $('#story-bg').className = 'world';
    setPortrait(stage, '🌅');
    // build world
    stage.querySelectorAll('.dialog').forEach((d) => d.remove());
    stage.appendChild(h('div', { class: 'dialog' }, h('div', { class: 'speaker' }, 'Світ народжується'), h('div', { class: 'text' }, 'Формуються континенти, ріки, королівства... Боги грають у кості... ⏳')));
    await UI().sleep(60);
    const seed = pdata.seed || Math.floor(Math.random() * 1e9);
    const G = ISK.game.newGame(seed, pdata);
    await dialog([
      { who: 'Оповідач', portrait: G.player.gender === 'f' ? '👩' : '🧑', text: `Ти розплющуєш очі в селі ${G.world.baronies[G.world.startBarony].name}. Небо — блакитне. Трава — зелена. Ти — у середньовічному одязі. А в кишені — ${G.player.gold} мідяків і два шматки хліба.` },
      { who: 'Місцевий дід', portrait: '👴', text: `«О, ще один з неба впав! Ласкаво просимо до ${G.world.realms[G.world.baronies[G.world.startBarony].owner].fullName}. Гільдія? У найближчому містечку. Іди дорогою і не чіпай слизів. Хоча... можеш і чіпати. Вони слабкі.»` },
    ], { stage });
    setPortrait(stage, null);
    UI().startGame(G);
    ISK.panels.autosave();
    UI().toast('🌸 Головний квест: знайди Гільдію шукачів пригод!', 'epic', 6000);
    // hint: find nearest guild town
    const start = G.world.baronies[G.world.startBarony];
    const guildTown = G.world.baronies.filter((b) => ISK.world.SETTLEMENT[b.type].services.includes('guild')).sort((a, b) => Math.hypot(a.x - start.x, a.y - start.y) - Math.hypot(b.x - start.x, b.y - start.y))[0];
    if (guildTown) { G.discovered['b:' + guildTown.id] = 1; setTimeout(() => UI().showInfo('b:' + guildTown.id), 600); }
  }

  function creation(stage, origin) {
    return new Promise((resolve) => {
      let gender = 'm';
      const name = h('input', { value: 'Хіро', maxlength: 18 });
      const seedIn = h('input', { placeholder: 'випадковий', inputmode: 'numeric' });
      const gBtns = [['m', '🧑 Хлопець'], ['f', '👩 Дівчина']].map(([g, l]) => h('div', { class: 'choice' + (g === gender ? ' sel' : ''), onclick: (e) => { gender = g; gBtns.forEach((b) => b.classList.remove('sel')); e.currentTarget.classList.add('sel'); if (name.value === 'Хіро' || name.value === 'Сакура') name.value = g === 'f' ? 'Сакура' : 'Хіро'; } }, h('div', { class: 'nm' }, l)));
      const card = h('div', { class: 'create-card' }, h('h2', null, 'Анкета переродженця'),
        h('div', { class: 'muted', style: { marginBottom: '14px' } }, 'Люмі: «Заповни, будь ласка. Бюрократія існує навіть на небесах.»'),
        h('div', { class: 'create-grid' },
          h('div', { class: 'field' }, h('label', null, 'Ім\'я в новому світі'), name),
          h('div', { class: 'field' }, h('label', null, 'Зерно світу (необов\'язково)'), seedIn),
          h('div', { class: 'field' }, h('label', null, 'Тіло'), h('div', { class: 'row' }, gBtns)),
          h('div', { class: 'field' }, h('label', null, 'Минуле життя'), h('div', { style: { padding: '10px 0' } }, origin))),
        h('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: '16px' } }, h('button', { class: 'btn primary big', style: { minWidth: '220px' }, onclick: () => {
          card.remove(); resolve({ name: (name.value || 'Хіро').trim().slice(0, 18), gender, origin, seed: seedIn.value ? Math.abs(parseInt(seedIn.value, 10)) || 1 : null });
        } }, 'Далі ➜')));
      stage.appendChild(card);
      if (globalThis.ISK_AUTOPLAY) setTimeout(() => card.querySelector('.btn.primary').click(), 10);
    });
  }

  function roulette(stage) {
    return new Promise((resolve) => {
      const keys = Object.keys(D().CHEATS);
      const slots = keys.map((k) => h('div', { class: 'slot' }, h('div', { class: 'ic' }, D().CHEATS[k].icon), h('div', { class: 'nm' }, D().CHEATS[k].name)));
      const desc = h('div', { class: 'muted', style: { minHeight: '40px', textAlign: 'center' } }, 'Люмі: «А тепер — РУЛЕТКА БЛАГОСЛОВЕНЬ! Барабанний дріб!»');
      const btns = h('div', { class: 'row', style: { justifyContent: 'center' } });
      const card = h('div', { class: 'create-card' }, h('h2', null, '🎰 Рулетка благословень'), h('div', { class: 'roulette' }, slots), desc, btns);
      stage.appendChild(card);
      let rerolled = false;
      const spin = async () => {
        btns.innerHTML = '';
        let idx = 0; const total = 18 + Math.floor(Math.random() * keys.length);
        for (let i = 0; i < total; i++) {
          slots.forEach((s) => s.classList.remove('hot')); idx = i % keys.length; slots[idx].classList.add('hot');
          A().play('click'); await UI().sleep(globalThis.ISK_AUTOPLAY ? 1 : 50 + i * 9);
        }
        const k = keys[idx];
        desc.textContent = `${D().CHEATS[k].icon} ${D().CHEATS[k].name}: ${D().CHEATS[k].desc}`;
        A().play('goddess');
        btns.append(h('button', { class: 'btn primary', onclick: () => { card.remove(); resolve(k); } }, 'Беру!'));
        if (!rerolled) btns.append(h('button', { class: 'btn', onclick: () => { rerolled = true; desc.textContent = 'Люмі: «Ну гаразд, ще разок. Але тільки один! У мене ліміт.»'; spin(); } }, '🔄 Ще раз (один раз)'));
        btns.append(h('button', { class: 'btn ghost', onclick: () => chooseManually() }, '🥺 Будь ласка, можна самому?'));
        if (globalThis.ISK_AUTOPLAY) setTimeout(() => btns.querySelector('.btn.primary').click(), 5);
      };
      const chooseManually = () => {
        desc.textContent = 'Люмі: «Ох, ці твої очі... Добре-добре! Обирай, тільки нікому не кажи!»';
        btns.innerHTML = '';
        slots.forEach((s, i) => { s.style.cursor = 'pointer'; s.onclick = () => { card.remove(); resolve(keys[i]); }; });
      };
      btns.append(h('button', { class: 'btn pink big', style: { minWidth: '200px' }, onclick: spin }, '🎰 Крутити!'));
      if (globalThis.ISK_AUTOPLAY) setTimeout(spin, 5);
    });
  }

  // ---------- In-game goddess calls ----------
  function goddessCall(lines) {
    return new Promise(async (resolve) => {
      if (globalThis.ISK_AUTOPLAY) return resolve();
      A().play('goddess');
      const stage = h('div', { style: { position: 'fixed', inset: 0, zIndex: 55, background: 'radial-gradient(circle at 50% 35%, rgba(255,240,250,.92), rgba(120,100,200,.85))', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '40px' } });
      document.body.appendChild(stage);
      setPortrait(stage, '👼');
      await dialog(lines.map((t) => ({ who: 'Богиня Люмі', text: t })), { stage });
      stage.remove(); resolve();
    });
  }

  async function ending() {
    const G = UI().G; const p = G.player;
    A().play('win');
    const stage = h('div', { style: { position: 'fixed', inset: 0, zIndex: 55, background: 'linear-gradient(180deg, #ffd9ec, #b9a6ff 60%, #4b3d8f)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '40px' } });
    document.body.appendChild(stage);
    setPortrait(stage, '👿');
    await dialog([
      { who: 'Король Демонів Малдраґор', text: '«Ні-і-і! Як?! Я ж навіть прочитав «Як перемогти героя за 7 днів»! ...Слухай, а можна я просто піду на пенсію? Розводитиму кактуси.»' },
      { who: 'Богиня Люмі', portrait: '👼', text: `${p.name}! ТИ ЗРОБИВ ЦЕ! Король Демонів переможений! Світ урятовано! Я отримаю премію! Ой, тобто — ти отримаєш вічну славу!` },
      { who: 'Богиня Люмі', text: 'Можу повернути тебе додому, у твій світ... або можеш лишитися тут. Знаєш, мені здається, тобі тут подобається. Купи баронство, відкрий таверну, досягни рангу SSS!' },
      { who: 'Оповідач', portrait: '🌅', text: `І так ${p.name}, колишній ${p.origin}, став легендою Ельдорії. Барди співають про героя, якого збила вантажівка. Пісня має 47 куплетів. Жоден не римується.\n\n✨ КІНЕЦЬ (але світ живе далі!) ✨` },
    ], { stage });
    ISK.politics.log(G.P, ISK.game.day(G), `🌟 ${p.name} переміг Короля Демонів Малдраґора! По всьому континенту — свята. Навіть вороги на день уклали перемир'я.`, 'dynasty', []);
    p.gold += 5000; p.flags.hero = true;
    stage.remove();
    UI().toast('🏆 Головний квест завершено! +5000 🪙. Світ продовжує жити — грай далі!', 'epic', 8000);
    UI().refresh();
  }

  ISK.story = { titleBg, titleRefresh, newGameFlow, dialog, goddessCall, ending };
})();
