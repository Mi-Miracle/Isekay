// Boot v2: title wiring, GitHub auto-update UI, global keys, automated self-test with screenshots.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = ISK.ui; const $ = UI.$; const h = UI.h;
  const native = window.isekayNative || null;

  // ---- automatic update at launch: found → download → restart, no questions asked ----
  async function autoUpdate() {
    if (!native || !native.checkUpdate) return false;
    try { const v = await native.version(); $('#app-version').textContent = `v${v} · Зроблено з любов'ю, кавою і вантажівкою-куном`; } catch (e) { /* ignore */ }
    const info = await Promise.race([native.checkUpdate().catch(() => null), UI.sleep(6000).then(() => null)]);
    if (!info || !info.available) return false;
    const ov = $('#update-overlay'); ov.classList.remove('hidden');
    $('#upd-title').textContent = `Оновлення v${info.current} → v${info.latest}`;
    $('#upd-text').textContent = ['Богиня Люмі завантажує новий патч світу…', 'Гноми перекладають рейки реальності…', 'Слизи переїжджають у нові підземелля…', 'Вантажівка-кун везе оновлення…'][Math.floor(Math.random() * 4)];
    const bar = $('#upd-bar');
    return new Promise((resolve) => {
      native.onUpdateProgress((v) => { bar.style.width = v + '%'; $('#upd-pct').textContent = v + '%'; if (v >= 100) $('#upd-text').textContent = 'Готово! Перезапуск світу…'; });
      native.onUpdateError((e) => { $('#upd-text').textContent = 'Не вдалося оновитися: ' + e + '. Запускаю поточну версію.'; setTimeout(() => { ov.classList.add('hidden'); resolve(false); }, 2500); });
      native.installUpdate(info).then((ok) => { if (!ok) { ov.classList.add('hidden'); resolve(false); } }).catch(() => { ov.classList.add('hidden'); resolve(false); });
    });
  }

  // ---- animated intro splash ----
  function intro() {
    const el = $('#intro'); if (!el || !ISK.intro) return Promise.resolve();
    return ISK.intro.play(el);
  }

  function titleGags() {
    const box = $('#title-gag'); if (!box) return; let i = Math.floor(Math.random() * ISK.data.TITLE_GAGS.length);
    const show = () => { box.classList.remove('in'); setTimeout(() => { box.textContent = ISK.data.TITLE_GAGS[i++ % ISK.data.TITLE_GAGS.length]; box.classList.add('in'); }, 400); };
    show(); setInterval(show, 7000);
    // v4: interactive title gags — a clickable slime, a peeking goddess, a cat with places to be, a logo that hates being poked
    const scr = $('#screen-title'); const SPR = ISK.sprites;
    const say = (x, y, text) => { const b = h('div', { class: 't-bubble', style: { left: x + 'px', top: y + 'px' } }, text); scr.appendChild(b); setTimeout(() => b.remove(), 3300); };
    const SL = ['Бульк!', 'Не тисни, я ніжний!', 'Я теж колись був офісним працівником…', 'Ще раз — і я поділюся на два слизи. Податкова не зрадіє.', 'Натисни «Нова гра», я нудьгую!', 'Мене звуть Слизько. Я стартовий пітомець. Це моя ЄДИНА робота.', 'Бульк-бульк (переклад: «привіт, герою»)', 'Обережно, липкий!', 'Я бачив вантажівку-куна. Він пішов туди →'];
    const slime = SPR.img(SPR.monster('slime'), 72); slime.classList.add('t-slime'); scr.appendChild(slime); let sc = 0;
    slime.addEventListener('click', (e) => { ISK.audio.ensure(); ISK.audio.play('click'); slime.classList.remove('squish'); void slime.offsetWidth; slime.classList.add('squish'); const r = slime.getBoundingClientRect(); say(r.left + 30, r.top - 50, SL[sc++ % SL.length]); if (sc === 10) { say(r.left + 30, r.top - 100, '🏆 Досягнення: «Тикач слизів»'); } });
    const gd = SPR.img(SPR.goddess('happy'), 150); gd.classList.add('t-goddess'); scr.appendChild(gd);
    const GL = ['Пс-с! Ти ж не забудеш мене покликати?', 'Я тут випадково. Просто проходила повз світ.', 'Не дивись на мене так, я не винна у вантажівці!', 'Може, цього разу оберемо «Лицаря»? Ну будь ласка?', 'Я налаштувала тобі удачу на 5. Цього достатньо… мабуть.'];
    let gi = 0; const peek = () => { gd.classList.add('peek'); const r = scr.getBoundingClientRect(); say(r.width - 360, r.height * 0.22 + 20, GL[gi++ % GL.length]); setTimeout(() => gd.classList.remove('peek'), 3200); };
    setInterval(() => { if (scr.classList.contains('active') && Math.random() < 0.5) peek(); }, 15000);
    gd.addEventListener('click', () => { ISK.audio.ensure(); ISK.audio.play('goddess'); peek(); });
    const cat = h('div', { class: 't-cat', title: 'Кіт' }, '🐈'); scr.appendChild(cat);
    cat.addEventListener('click', () => { const r = cat.getBoundingClientRect(); say(r.left, r.top - 50, ['Мяу. (Не заважай, я йду в інший світ.)', 'Мяу. (Це мій ісекай, знайди свій.)', 'Мяу. (Вантажівка-кун — мій водій.)'][Math.floor(Math.random() * 3)]); });
    const logo = document.querySelector('.title-logo'); let lc = 0;
    logo.addEventListener('click', () => { logo.classList.remove('shake'); void logo.offsetWidth; logo.classList.add('shake'); lc++; const r = logo.getBoundingClientRect(); say(r.left + r.width / 2 - 100, r.bottom + 6, ['Ай!', 'Це логотип, а не кнопка!', 'Ще раз і я зміню назву на «Хроніки Нудьгосвіту».', 'Добре, ти виграв. Ось секрет: натисни ` у грі.', '…я ображений.'][Math.min(4, lc - 1)]); });
  }

  async function offerVoice() {
    if (!ISK.voice.hasNeural() || localStorage.getItem('dyvo_voice_asked')) return;
    await ISK.voice.refreshStatus(); if (ISK.voice.settings.installed) return;
    localStorage.setItem('dyvo_voice_asked', '1');
    if (await UI.confirm('🎙️ Українська нейроозвучка!\n\nПерсонажі говоритимуть справжніми голосами (Микита, Тетяна, Лада). Працює без інтернету після одноразового завантаження ~80 МБ.\n\nЗавантажити зараз? (можна й пізніше в Налаштуваннях)', 'Завантажити', 'Пізніше')) {
      UI.toast('⬇️ Завантажую нейроголоси у фоні…', 'good', 4000);
      ISK.voice.install((v) => { if (v % 25 === 0) UI.toast(`🎙️ Нейроозвучка: ${v}%`, '', 1500); }).then((r) => UI.toast(r && r.ok ? '🎙️ Озвучку встановлено! Люмі вже прочищає горло.' : '⚠️ Не вдалося завантажити озвучку: ' + ((r && r.error) || '?'), r && r.ok ? 'epic' : 'bad', 6000));
    }
  }

  function boot() {
    ISK.story.titleBg(); ISK.story.titleRefresh(); UI.bindMap(); UI.loop();
    document.querySelectorAll('.title-menu [data-act]').forEach((b) => b.addEventListener('click', () => {
      ISK.audio.ensure(); ISK.audio.play('click'); ISK.audio.music('title');
      const act = b.dataset.act;
      if (act === 'new') ISK.story.newGameFlow();
      if (act === 'continue') { const last = localStorage.getItem('dyvo_last'); if (last) ISK.panels.load(last); }
      if (act === 'load') ISK.panels.loadDialog();
      if (act === 'settings') ISK.panels.settings();
      if (act === 'quit') { if (native) native.quit(); else window.close(); }
    }));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F11' && native) { e.preventDefault(); native.toggleFullscreen(); }
      if (e.key === 'Escape' && $('#screen-title').classList.contains('active')) UI.closeTop();
    });
    window.addEventListener('beforeunload', () => { try { ISK.panels.autosave(); } catch (e) { /* ignore */ } });
    setInterval(() => { if (UI.G && !UI.inCombat && !UI.inDungeon && !UI.travelling) ISK.panels.autosave(); }, 120000);
    titleGags();
    if (location.search.includes('selftest')) selftest();
    else (async () => { autoUpdate(); await intro(); await UI.sleep(1500); if ($('#update-overlay').classList.contains('hidden')) offerVoice(); })();
  }

  async function selftest() {
    const errors = [];
    window.addEventListener('error', (e) => errors.push(String(e.message) + ' @' + (e.filename || '') + ':' + (e.lineno || '')));
    window.addEventListener('unhandledrejection', (e) => errors.push(String(e.reason && e.reason.stack || e.reason)));
    const shot = async (name) => { await UI.sleep(400); if (native) await native.shot(name); };
    const step = async (label, fn) => { try { await fn(); } catch (e) { errors.push(label + ': ' + (e.stack || e)); } };
    try {
      await shot('01_title');
      // creation screen (manual) for the overlap check
      await step('creation', async () => {
        globalThis.ISK_AUTOPLAY = 0.95; globalThis.ISK_HOLD = true; globalThis.ISK_NOENCOUNTER = true;
        ISK.story.newGameFlow();
        for (let i = 0; i < 60 && !document.querySelector('.create-card'); i++) await UI.sleep(100);
        document.querySelectorAll('.create-card .btn.small')[3]?.click(); await UI.sleep(300); await shot('02_creation');
        globalThis.ISK_HOLD = false;
      });
      await step('newgame', async () => { document.querySelector('.create-card .btn.primary.big')?.click(); for (let i = 0; i < 80 && !UI.G; i++) await UI.sleep(150); });
      globalThis.ISK_AUTOPLAY = 0; UI.setSpeed(0);
      const G = UI.G; if (!G) throw new Error('no game');
      for (let i = 0; i < 20 && document.querySelector('.dialog'); i++) { document.querySelector('.dialog')?.click(); await UI.sleep(100); }
      UI.closeAll(); await UI.sleep(600); await shot('03_map_start');
      ISK.render.R.cam.z = 0.4; ISK.render.clampCam(); await shot('04_world_overview');
      document.querySelector('[data-mode="political"]').click(); await shot('05_political');
      document.querySelector('[data-mode="terrain"]').click();
      ISK.render.centerOn(G.player.location, 1.1); await shot('06_regions_mid');
      ISK.render.centerOn(G.player.location, 2.6); await shot('07_zoom_close');
      const p = G.player;
      const town = G.world.baronies.find((b) => b.type === 'city' && b.owner === G.world.startRealm) || G.world.baronies.find((b) => b.type === 'city');
      p.location = 'b:' + town.id; G.discovered[p.location] = 1; p.guild.registered = true; p.gold = 20000; p.level = 14; p.fame = 700; p.social = 3;
      p.classes.primary = 'mage'; p.classXp.mage = { lvl: 12, xp: 0, sp: 4, adv: null };
      ISK.player.addItem(p, 'w_staff_2_2'); ISK.player.equip(p, 'w_staff_2_2'); ISK.player.addItem(p, 'a_head_cloth_2_1'); ISK.player.equip(p, 'a_head_cloth_2_1');
      ISK.player.addItem(p, 'c_mage'); ISK.player.equip(p, 'c_mage');
      p.hp = ISK.player.maxHp(p); p.mp = ISK.player.maxMp(p);
      const hc = ISK.game.hireOptions(G, town.id); ISK.game.hire(G, hc[0]); ISK.game.buyPet(G, 'fox'); ISK.game.buyMount(G, 'horse');
      const bd = ISK.game.board(G, town.id); for (const q of bd.quests.slice(0, 3)) ISK.game.acceptQuest(G, town.id, q.id);
      ISK.render.centerOn(p.location, 1.3); UI.refresh(); UI.showInfo('b:' + town.adj[0]); await shot('08_markers_info');
      ISK.panels.character(); await shot('09_character'); UI.closeAll();
      ISK.panels.skills(); await shot('10_skills_advance'); UI.closeAll();
      ISK.panels.guild(town); await UI.sleep(200); await shot('11_guild'); UI.closeAll();
      ISK.panels.openService('tavern', town); await UI.sleep(100); document.querySelector('.tabs button[data-id="hire"]')?.click(); await shot('12_tavern_hire'); UI.closeAll();
      ISK.panels.openService('stable', town); await shot('13_stable'); UI.closeAll();
      ISK.game.passTime(G, 150);
      ISK.panels.realms(); await shot('14_empire'); document.querySelector('.tabs button[data-id="dark"]')?.click(); await shot('15_darkness'); UI.closeAll();
      ISK.panels.open('chronicle'); await shot('16_chronicle'); UI.closeAll();
      await step('combat', async () => {
        const pr = ISK.combatUI.run([ISK.combat.makeEnemy('goblin', 12), ISK.combat.makeEnemy('slime', 12), ISK.combat.makeEnemy('wolf', 13)], { biome: 'forest', turnBased: true });
        await UI.sleep(2200); await shot('17_combat');
        document.querySelectorAll('.cb-actions .main-acts .btn')[1].click(); await UI.sleep(200); await shot('18_combat_skills');
        globalThis.ISK_AUTOFIGHT = true; globalThis.ISK_AUTOPLAY = 1;
        for (let i = 0; i < 40 && document.querySelector('.combat'); i++) { const sk = [...document.querySelectorAll('.cb-actions .sub-acts .btn')].find((b) => !b.disabled); if (sk) sk.click(); else document.querySelector('.cb-actions .main-acts .btn')?.click(); await UI.sleep(250); }
        await UI.sleep(400); UI.closeAll(); await pr; globalThis.ISK_AUTOFIGHT = false; globalThis.ISK_AUTOPLAY = 0;
      });
      await step('boss', async () => {
        const pr = ISK.combatUI.run([ISK.combat.makeBoss('dragon', 14)], { biome: 'mountain', turnBased: true }); await UI.sleep(1800); await shot('19_boss');
        const c = document.querySelector('.combat'); if (c) c.remove(); UI.inCombat = false; ISK.audio.setMood('calm');
      });
      for (const [name, fn] of [['fishing', () => ISK.minigames.fishing(1)], ['forge', () => ISK.minigames.forge(1)], ['cooking', () => ISK.minigames.cooking(1)]]) {
        await step('mg_' + name, async () => { fn(); await UI.sleep(1000); await shot('20_mg_' + name); const mg = document.querySelector('.mg'); if (mg) { mg.remove(); UI.inMinigame = false; } });
      }
      await step('house', async () => {
        ISK.game.buyHouse(G, town.id); ISK.player.addItem(p, 'wood', 40); ISK.player.addItem(p, 'stone', 40);
        for (const k of ['bed', 'garden', 'chest', 'kitchen', 'incubator']) ISK.game.upgradeHouse(G, k);
        ISK.player.addItem(p, 'seed_wheat', 2); ISK.player.addItem(p, 'seed_pumpkin', 1); ISK.game.plant(G, 0, 'seed_wheat'); ISK.game.plant(G, 1, 'seed_pumpkin');
        ISK.panels.house(); await UI.sleep(150); document.querySelector('.tabs button[data-id="garden"]')?.click(); await shot('21_house_garden'); UI.closeAll();
      });
      await step('land', async () => {
        const b = G.world.baronies.find((x) => x.owner === town.owner && x.type === 'village'); ISK.game.grantBarony(G, b.id, true); p.location = 'b:' + b.id; UI.refresh();
        ISK.panels.land(b.id); await shot('22_land'); UI.closeAll();
        ISK.panels.openService('court', town); await shot('23_court'); UI.closeAll();
      });
      await step('dungeon', async () => {
        const dg = G.world.dungeons.find((d) => !d.final); globalThis.ISK_AUTOPLAY = 1; p.location = 'd:' + dg.id;
        await ISK.dungeonUI.enter(dg.id); await UI.sleep(300); UI.closeAll(); await shot('24_dungeon'); ISK.dungeonUI.leave(); globalThis.ISK_AUTOPLAY = 0;
      });
      await step('saveload', async () => {
        ISK.panels.save('3'); const before = JSON.stringify({ t: G.time, o: G.world.baronies.map((b) => b.owner), h: p.holdings });
        ISK.panels.load('3'); const G2 = UI.G; const after = JSON.stringify({ t: G2.time, o: G2.world.baronies.map((b) => b.owner), h: G2.player.holdings });
        if (before !== after) errors.push('save/load mismatch');
      });
      UI.cutin('LEVEL UP!', 'Рівень 15 · +3 очки характеристик', '#ffd36e'); await UI.sleep(300); await shot('25_cutin');
      // ---- v3 features ----
      await step('v3_realms', async () => { ISK.panels.realms(); await UI.sleep(150); document.querySelector('.tabs button[data-id="races"]')?.click(); await shot('26_races'); document.querySelector('.tabs button[data-id="heroes"]')?.click(); await shot('27_heroes'); UI.closeAll(); });
      await step('v3_armies', async () => {
        const UI2 = UI; const G3 = UI2.G; const a = G3.P.armies.find((x) => x.path && x.path.length) || G3.P.armies[0];
        if (a) { ISK.render.centerOn('b:' + a.node, 1.6); }
        UI2.setSpeed(2); for (let i = 0; i < 30; i++) await UI2.sleep(100); UI2.setSpeed(0); await shot('28_armies_marching');
        ISK.render.centerOn(G3.player.location, 0.3); await UI2.sleep(300); await shot('29_world_overview');
      });
      await step('v3_sites_heroes', async () => {
        const G3 = UI.G; const p3 = G3.player; const B = G3.world.baronies.find((b) => b.sites && b.sites.length && !ISK.politics.isDemon(G3.P, b.owner));
        p3.location = 'b:' + B.id; G3.discovered['b:' + B.id] = 1;
        const hh = ISK.heroes.makeHero(G3.world, G3.P, new ISK.RNG(5)); hh.node = B.id; G3.P.heroes.push(hh);
        UI.refresh(); ISK.render.centerOn(p3.location, 2.2); UI.showInfo(p3.location); await UI.sleep(300); await shot('30_site_hero');
        ISK.panels.heroTalk(hh.id); await shot('31_hero_talk'); UI.closeAll();
        const r = ISK.game.gatherSite(G3, B.id, 0, 1); if (!r) errors.push('gatherSite failed');
      });
      await step('v3_forge', async () => {
        const G3 = UI.G; const p3 = G3.player; const town = G3.world.baronies.find((b) => b.type === 'city' && !ISK.politics.isDemon(G3.P, b.owner));
        for (const k of ['ore_copper', 'ore_iron', 'leather', 'wood', 'cloth', 'chain_ring', 'hide']) ISK.player.addItem(p3, k, 30); p3.gold += 5000;
        ISK.panels.openService('smith', town); await UI.sleep(150); document.querySelector('.tabs button[data-id="forge"]')?.click(); await UI.sleep(150); await shot('32_forge'); UI.closeAll();
        ISK.panels.openService('market', town); await UI.sleep(150); document.querySelector('.tabs button[data-id="tailor"]')?.click(); await UI.sleep(150); await shot('33_tailor'); UI.closeAll();
        const res = ISK.game.craftGear(G3, 'w_katana_1_0', 1); if (!res || (!res.id && !res.fail)) errors.push('craftGear failed');
      });
      await step('v3_cheats', async () => { ISK.panels.cheats(); await shot('34_cheats'); UI.closeAll(); });
      await step('v3_skills3', async () => {
        const p3 = UI.G.player; const c = p3.classes.primary; const cx = p3.classXp[c]; cx.lvl = 22; cx.adv = ISK.data.CLASSES[c].adv[0].id; cx.sp = 3;
        ISK.panels.skills(); await UI.sleep(150); await shot('35_class3'); UI.closeAll();
      });
      // ---- v4 features ----
      const G4 = () => UI.G; const L4 = ISK.life;
      await step('v4_estate_house', async () => {
        const g = G4(), p4 = g.player; if (!p4.house) { const tw = g.world.baronies.find((b) => b.type === 'city' && !ISK.politics.isDemon(g.P, b.owner)); p4.location = 'b:' + tw.id; ISK.game.buyHouse(g, tw.id); }
        p4.location = 'b:' + p4.house.barony; ISK.player.addItem(p4, 'wood', 60); ISK.player.addItem(p4, 'stone', 60); p4.gold += 30000;
        for (const k of ['bed', 'garden', 'chest', 'kitchen', 'forge', 'lab', 'incubator', 'trophy', 'cathouse']) ISK.game.upgradeHouse(g, k);
        ISK.player.addItem(p4, 'seed_wheat', 3); ISK.player.addItem(p4, 'seed_carrot', 3); p4.house.plots.forEach((pl, i) => { if (!pl.seed) ISK.game.plant(g, i, i % 2 ? 'seed_carrot' : 'seed_wheat'); });
        if (p4.house.plots[0]) { p4.house.plots[0].ready = true; }
        ISK.estate.open('house'); await UI.sleep(1200); await shot('37_estate_house');
        g.time = Math.floor(g.time / 360) * 360 + 360 * 1 + 15; await UI.sleep(700); await shot('38_estate_winter'); ISK.estate.close();
      });
      await step('v4_estate_land', async () => {
        const g = G4(), p4 = g.player; const bid = p4.holdings[0]; if (bid === undefined) return; p4.gold += 50000;
        for (const k of ['farm', 'market', 'tavern', 'barracks', 'walls']) ISK.game.buildOnLand(g, bid, k);
        g.time = Math.floor(g.time / 360) * 360 + 360 + 150; ISK.estate.open('land', bid); await UI.sleep(1200); await shot('39_estate_land'); ISK.estate.close();
      });
      await step('v4_lords', async () => {
        const g = G4(), p4 = g.player; const cap = g.world.realms[g.world.startRealm].capital; p4.location = 'b:' + cap; UI.refresh();
        ISK.panels2.lords(cap); await UI.sleep(300); await shot('40_lords'); UI.closeAll();
        const ls = L4.lordsAt(g, cap); if (!ls.length) errors.push('no lords at capital');
        ISK.panels2.audience(ls[0].key); await UI.sleep(400); await shot('41_audience_king'); UI.closeAll();
        if (ls[1]) { ISK.panels2.audience(ls[1].key); await UI.sleep(300); await shot('42_audience_duke'); UI.closeAll(); }
      });
      await step('v4_army', async () => {
        const g = G4(); const r = L4.recruit(g, 'infantry', 10); if (r) errors.push('recruit: ' + r); L4.recruit(g, 'archers', 5); L4.recruit(g, 'cavalry', 3);
        ISK.panels2.army(); await UI.sleep(300); await shot('43_army'); UI.closeAll();
      });
      await step('v4_family', async () => { ISK.panels2.family(); await UI.sleep(300); await shot('44_family'); UI.closeAll(); });
      await step('v4_naval', async () => {
        const g = G4(); const port = g.world.baronies.find((b) => b.type === 'port' && !ISK.politics.isDemon(g.P, b.owner)); if (port) { g.player.location = 'b:' + port.id; ISK.panels2.shipyard(port); await UI.sleep(300); await shot('45_shipyard'); UI.closeAll(); }
        g.player.ship = g.player.ship || { hull: 1 }; const pr = ISK.panels2.naval('pirate', 8); await UI.sleep(600); await shot('46_naval');
        for (let i = 0; i < 80; i++) { const b = [...document.querySelectorAll('.modal .btn')].find((x) => x.textContent.includes('Залп')); if (!b) break; b.click(); await UI.sleep(60); } await Promise.race([pr, UI.sleep(2000)]);
        UI.closeAll(); UI.inCombat = false; void pr;
      });
      await step('v4_voices', async () => { ISK.panels2.voices(); await UI.sleep(300); await shot('47_voices'); UI.closeAll(); });
      await step('v4_store', async () => {
        const g = G4(); const town = g.world.baronies.find((b) => b.type === 'city' && !ISK.politics.isDemon(g.P, b.owner)); g.player.location = 'b:' + town.id;
        ISK.panels.openService('market', town); await UI.sleep(300); await shot('48_store_categories'); UI.closeAll();
        const p4 = g.player; p4.classes.secondary = 'jack'; p4.classXp.jack = { lvl: 8, xp: 0, sp: 4 }; p4.guild.registered = true;
        ISK.panels.guild(town); await UI.sleep(200); document.querySelector('.tabs button[data-id="jack"]')?.click(); await UI.sleep(200); await shot('49_jack'); document.querySelector('.tabs button[data-id="rivals"]')?.click(); await UI.sleep(200); await shot('50_rivals'); UI.closeAll();
      });
      await step('v4_map', async () => {
        const g = G4(); g.life.weatherOverride = null; document.getElementById('hl-toggle').click(); ISK.render.centerOn(g.player.location, 1.2); await UI.sleep(500); await shot('51_map_highlight'); document.getElementById('hl-toggle').click();
        ISK.panels2.mapContext({ clientX: 500, clientY: 400, preventDefault() {} }, g.player.location); await UI.sleep(200); await shot('52_context_menu'); document.querySelectorAll('.ctx-menu').forEach((e) => e.remove());
        g.life.call = { ctx: 'random', text: 'Привіт, герою! Я тут подумала… може, вже час помитися?', gift: 'potion_s' }; ISK.panels2.goddessPopup(); await UI.sleep(800); await shot('53_goddess_call');
      });
      await step('v51_wasd', async () => {
        const g = G4(); const from = g.player.location; UI.fastTravel = true; const sp0 = UI.timeSpeed;
        const ev = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, key: code.slice(3).toLowerCase() }));
        let moved = false;
        for (const code of ['KeyD', 'KeyA', 'KeyS', 'KeyW']) {
          ev('keydown', code); for (let i = 0; i < 6 && !UI.travelling; i++) await UI.sleep(50); ev('keyup', code);
          for (let i = 0; i < 200 && (UI.travelling || UI.walking); i++) { document.querySelector('.modal .btn.primary')?.click(); await UI.sleep(100); }
          if (g.player.location !== from) { moved = true; break; }
        }
        UI.fastTravel = false; UI.setSpeed(sp0); UI.closeAll(); if (UI.inCombat) { const c = document.querySelector('.acombat,.combat'); if (c) c.remove(); UI.inCombat = false; }
        if (!moved) errors.push('wasd: hero did not move from ' + from);
        console.log('WASD moved', from, '->', g.player.location); await shot('56_wasd_walk');
      });
      await step('v52_map', async () => {
        const g = G4(); const p = g.player; UI.closeAll(); const home = 'b:' + g.world.startBarony; if (p.location !== home) { ISK.game.arrive(g, home); UI.refresh(); }
        ISK.render.centerOn(home, 1.3); await UI.sleep(500); await shot('70_fog');
        ISK.panels.worldMap(); await UI.sleep(600); await shot('71_world_map'); UI.closeAll();
        p.gold += 20000; ISK.panels.cartographer(g.world.startBarony); await UI.sleep(500); await shot('72_cartographer');
        const btn = [...document.querySelectorAll('.map-tier .btn.primary')][1]; if (btn) btn.click(); await UI.sleep(400); UI.closeAll();
        ISK.render.centerOn(home, 0.7); await UI.sleep(400); await shot('73_after_map');
        const e = g.world.graph[home].find((x) => x.to[0] === 'r'); if (!e) errors.push('no resource spot near start');
        UI.fastTravel = true; if (e) await UI.startTravel(e.to); UI.fastTravel = false; UI.closeAll();
        if (e && p.location !== e.to) errors.push('did not reach resource spot ' + p.location);
        ISK.render.centerOn(p.location, 2.2); await UI.sleep(400); await shot('74_resource_spot');
        const W0 = ISK.world.W; const c0 = ISK.world.nodeCell(g.world, p.location);
        g.life.mon.push({ id: 9999, cell: c0 + 3 + 2 * W0, home: c0, tgt: c0, key: 'wolf', keys: ['wolf'], lvl: p.level + 1, n: 2, icon: '🐺', name: 'Зграя: Вовк', elite: true }); ISK.game.revealAt(g, c0);
        await UI.sleep(400); await shot('75_monster'); UI.showMonster(g.life.mon[g.life.mon.length - 1]); await UI.sleep(300); await shot('76_monster_info');
        g.life.mon = g.life.mon.filter((m) => m.id !== 9999); document.getElementById('info-panel').classList.add('hidden');
        // арена з ролями й чемпіоном
        const es = [ISK.combat.makeEnemy('orc', p.level), ISK.combat.makeEnemy('goblin', p.level), ISK.combat.makeEnemy('skeleton', p.level)];
        es[2].champion = 'fiery'; es[2].name = 'Вогняний Скелет';
        const pr = ISK.combatUI.run(es, { biome: 'forest', noDeath: true }); await UI.sleep(2400); await shot('77_arena_roles');
        ISK.actionCombat._live && ISK.actionCombat._live.finish('flee'); await pr; UI.closeAll();
      });
      await step('v4_combat', async () => {
        const pr = ISK.combatUI.run([ISK.combat.makeEnemy('orc', 14), ISK.combat.makeEnemy('skeleton', 14)], { biome: 'plains', turnBased: true }); await UI.sleep(2000); await shot('54_combat_v4');
        globalThis.ISK_AUTOFIGHT = true; globalThis.ISK_AUTOPLAY = 1;
        for (let i = 0; i < 50 && document.querySelector('.combat'); i++) { document.querySelector('.cb-actions .main-acts .btn')?.click(); await UI.sleep(200); }
        await UI.sleep(300); UI.closeAll(); globalThis.ISK_AUTOFIGHT = false; globalThis.ISK_AUTOPLAY = 0; const c = document.querySelector('.combat'); if (c) { c.remove(); UI.inCombat = false; } void pr;
      });
      await step('v5_action', async () => {
        const PL = () => ISK.player; const p = UI.G.player; p.hp = PL().maxHp(p); p.mp = 999;
        globalThis.ISK_ACTIONBOT = true;
        const L0 = p.level + 1; const t0 = Date.now();
        const pr = ISK.combatUI.run([ISK.combat.makeEnemy('goblin', L0), ISK.combat.makeEnemy('slime', L0), ISK.combat.makeEnemy('harpy', L0), ISK.combat.makeEnemy('orc', L0)], { biome: 'forest', noDeath: true });
        await UI.sleep(2600); await shot('60_action');
        let res = null; pr.then((r) => { res = r; });
        for (let i = 0; i < 240 && !document.querySelector('.modal') && document.querySelector('.acombat'); i++) await UI.sleep(250);
        if (document.querySelector('.acombat')) errors.push('action: fight did not finish: ' + JSON.stringify(ISK.actionCombat._live.state()));
        await UI.sleep(300); await shot('61_action_end'); UI.closeAll(); await UI.sleep(200);
        if (res !== 'win' && res !== 'lose') errors.push('action: result ' + res);
        console.log('ACTION RESULT', res, 'sec', Math.round((Date.now() - t0) / 1000), 'hp', p.hp, '/', ISK.player.maxHp(p));
      });
      await step('v5_action_boss', async () => {
        const p = UI.G.player; p.hp = ISK.player.maxHp(p);
        globalThis.ISK_ACTIONBOT = false; const pr = ISK.combatUI.run([ISK.combat.makeBoss('dragon', p.level + 2)], { biome: 'mountain', noDeath: true });
        await UI.sleep(3200); await shot('62_action_boss');
        const L = ISK.actionCombat._live; const bs = L.E.find((x) => x.e.boss); if (bs) bs.e.hp = Math.floor(bs.e.maxHp * 0.45);
        await UI.sleep(2600); await shot('63_action_phase2');
        globalThis.ISK_ACTIONBOT = false; L.finish('flee'); await pr; UI.closeAll();
      });
      await step('v4_lifesim', async () => { const g = G4(); const t0 = g.time; ISK.game.passTime(g, 200); if (g.time < t0 + 199) errors.push('time'); UI.refresh(); ISK.render.centerOn(g.player.location, 0.5); await UI.sleep(400); await shot('55_world_after'); });
      await step('v4_intro', async () => { const el = document.getElementById('intro'); for (const [i, at] of [[0, 3.4], [1, 6.2], [2, 10.2], [3, 13.9], [4, 16.6]]) { await ISK.intro.play(el, { at }); await UI.sleep(150); await shot('36_intro_' + i); } el.classList.add('hidden'); el.innerHTML = ''; });
    } catch (e) { errors.push('fatal: ' + (e.stack || e)); }
    if (native) { await native.report({ errors }); native.quit(); } else console.log('SELFTEST', errors);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
