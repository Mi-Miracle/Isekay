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
    const el = $('#intro'); if (!el) return Promise.resolve();
    el.classList.remove('hidden');
    return new Promise((resolve) => {
      let done = false;
      const finish = () => { if (done) return; done = true; el.classList.add('fade'); setTimeout(() => { el.classList.add('hidden'); el.classList.remove('fade'); resolve(); }, 500); };
      const sparks = el.querySelector('.intro-sparks');
      for (let i = 0; i < 40; i++) { const sp = h('i', { style: { left: Math.random() * 100 + '%', top: Math.random() * 100 + '%', animationDelay: (2.4 + Math.random() * 1.6) + 's', fontSize: (8 + Math.random() * 18) + 'px' } }, ['✦', '✧', '★', '✿'][i % 4]); sparks.appendChild(sp); }
      el.addEventListener('click', finish); window.addEventListener('keydown', finish, { once: true });
      setTimeout(finish, 5600);
    });
  }

  function titleGags() {
    const box = $('#title-gag'); if (!box) return; let i = Math.floor(Math.random() * ISK.data.TITLE_GAGS.length);
    const show = () => { box.classList.remove('in'); setTimeout(() => { box.textContent = ISK.data.TITLE_GAGS[i++ % ISK.data.TITLE_GAGS.length]; box.classList.add('in'); }, 400); };
    show(); setInterval(show, 7000);
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
      globalThis.ISK_AUTOPLAY = 0;
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
        const pr = ISK.combatUI.run([ISK.combat.makeEnemy('goblin', 12), ISK.combat.makeEnemy('slime', 12), ISK.combat.makeEnemy('wolf', 13)], { biome: 'forest' });
        await UI.sleep(2200); await shot('17_combat');
        document.querySelectorAll('.cb-actions .main-acts .btn')[1].click(); await UI.sleep(200); await shot('18_combat_skills');
        globalThis.ISK_AUTOFIGHT = true; globalThis.ISK_AUTOPLAY = 1;
        for (let i = 0; i < 40 && document.querySelector('.combat'); i++) { const sk = [...document.querySelectorAll('.cb-actions .sub-acts .btn')].find((b) => !b.disabled); if (sk) sk.click(); else document.querySelector('.cb-actions .main-acts .btn')?.click(); await UI.sleep(250); }
        await UI.sleep(400); UI.closeAll(); await pr; globalThis.ISK_AUTOFIGHT = false; globalThis.ISK_AUTOPLAY = 0;
      });
      await step('boss', async () => {
        const pr = ISK.combatUI.run([ISK.combat.makeBoss('dragon', 14)], { biome: 'mountain' }); await UI.sleep(1800); await shot('19_boss');
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
      await step('v3_intro', async () => { document.getElementById('intro').classList.remove('hidden'); document.getElementById('intro').querySelectorAll('*').forEach((e) => { e.style.animationDelay = '0s'; e.style.animationDuration = '0.01s'; }); await UI.sleep(400); await shot('36_intro'); document.getElementById('intro').classList.add('hidden'); });
    } catch (e) { errors.push('fatal: ' + (e.stack || e)); }
    if (native) { await native.report({ errors }); native.quit(); } else console.log('SELFTEST', errors);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
