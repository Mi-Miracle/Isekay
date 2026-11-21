// Boot: title screen wiring, global keys, optional self-test run (used by automated screenshot tests).
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const UI = ISK.ui; const $ = UI.$;
  const native = window.isekayNative || null;

  function boot() {
    ISK.story.titleBg();
    ISK.story.titleRefresh();
    UI.bindMap();
    UI.loop();
    document.querySelectorAll('.title-menu [data-act]').forEach((b) => b.addEventListener('click', () => {
      ISK.audio.ensure(); ISK.audio.play('click'); ISK.audio.music('calm');
      const act = b.dataset.act;
      if (act === 'new') ISK.story.newGameFlow();
      if (act === 'continue') { const last = localStorage.getItem('isekay_last'); if (last) ISK.panels.load(last); }
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
    if (location.search.includes('selftest')) selftest();
  }

  // ---------------- Automated self-test (screenshots + smoke checks) ----------------
  async function selftest() {
    const errors = [];
    window.addEventListener('error', (e) => errors.push(String(e.message)));
    window.addEventListener('unhandledrejection', (e) => errors.push(String(e.reason && e.reason.stack || e.reason)));
    const shot = async (name) => { await UI.sleep(350); if (native) await native.shot(name); };
    const step = async (label, fn) => { try { await fn(); } catch (e) { errors.push(label + ': ' + (e.stack || e)); } };
    try {
      await shot('01_title');
      globalThis.ISK_AUTOPLAY = 0.95;
      await step('newgame', async () => { await ISK.story.newGameFlow(); });
      globalThis.ISK_AUTOPLAY = 0;
      const G = UI.G;
      await UI.sleep(800);
      await shot('02_map_start');
      ISK.render.R.cam.z = 0.6; ISK.render.clampCam();
      document.querySelector('[data-mode="political"]').click();
      await shot('03_map_political');
      document.querySelector('[data-mode="dejure"]').click();
      await shot('04_map_dejure');
      document.querySelector('[data-mode="terrain"]').click();
      ISK.render.centerOn(G.player.location, 2.2);
      await shot('05_map_zoom');
      // Guild & class
      const town = G.world.baronies.filter((b) => ISK.world.SETTLEMENT[b.type].services.includes('guild'))[0];
      G.player.location = 'b:' + town.id; G.discovered['b:' + town.id] = 1; UI.refresh();
      G.player.guild.registered = true;
      G.player.classes.primary = 'mage'; G.player.classXp.mage = { lvl: 6, xp: 0 };
      ISK.player.addItem(G.player, 'w_staff_1_2'); ISK.player.equip(G.player, 'w_staff_1_2');
      ISK.render.centerOn(G.player.location, 1.8);
      UI.showInfo('b:' + G.world.baronies[0].id);
      await shot('06_location_info');
      ISK.panels.guild(town); await UI.sleep(200);
      await shot('07_guild');
      UI.closeAll();
      ISK.panels.character(); await shot('08_character'); UI.closeAll();
      ISK.panels.inventory(); await shot('09_inventory'); UI.closeAll();
      ISK.game.passTime(G, 120);
      ISK.panels.realms(); await shot('10_realms');
      document.querySelector('.tabs button[data-id="wars"]').click(); await shot('11_wars');
      document.querySelector('.tabs button[data-id="rel"]').click(); await shot('12_relations');
      UI.closeAll();
      ISK.panels.open('chronicle'); await shot('13_chronicle'); UI.closeAll();
      ISK.panels.store(town, 'smith'); await shot('14_smith'); UI.closeAll();
      // Combat
      await step('combat', async () => {
        const p = ISK.combatUI.run([ISK.combat.makeEnemy('goblin', 2), ISK.combat.makeEnemy('slime', 2), ISK.combat.makeEnemy('wolf', 3)], { biome: 'forest' });
        await UI.sleep(500); await shot('15_combat');
        document.querySelectorAll('.cb-actions .main-acts .btn')[1].click(); await UI.sleep(200); await shot('16_combat_skills');
        document.querySelectorAll('.cb-actions .main-acts .btn')[0].click(); await UI.sleep(400); await shot('17_combat_timing');
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
        // autoplay rest of fight with skills
        for (let i = 0; i < 40 && document.querySelector('.combat'); i++) {
          await UI.sleep(300);
          const sk = [...document.querySelectorAll('.cb-actions .sub-acts .btn')].find((b) => !b.disabled);
          if (sk) sk.click(); else { const btn = document.querySelectorAll('.cb-actions .main-acts .btn')[1]; if (btn && !btn.disabled) btn.click(); }
        }
        await UI.sleep(600); await shot('18_combat_result');
        UI.closeAll(); await p;
      });
      // Minigames
      for (const [name, fn] of [['fishing', () => ISK.minigames.fishing(1)], ['mining', () => ISK.minigames.mining(1)], ['herbs', () => ISK.minigames.herbs(1)], ['forge', () => ISK.minigames.forge(1)], ['alchemy', () => ISK.minigames.alchemy(1)], ['cooking', () => ISK.minigames.cooking(1)], ['lockpick', () => ISK.minigames.lockpick(1)]]) {
        await step('mg_' + name, async () => {
          fn(); await UI.sleep(1200); await shot('19_mg_' + name);
          const mg = document.querySelector('.mg'); if (mg) { mg.remove(); UI.inMinigame = false; }
        });
      }
      // Dungeon
      await step('dungeon', async () => {
        const dg = G.world.dungeons[0]; G.player.level = 30;
        globalThis.ISK_AUTOPLAY = 1;
        await ISK.dungeonUI.enter(dg.id); await UI.sleep(300); UI.closeAll();
        await UI.sleep(300); await shot('20_dungeon');
        ISK.dungeonUI.leave();
        globalThis.ISK_AUTOPLAY = 0;
      });
      // Save / load roundtrip
      await step('saveload', async () => {
        ISK.panels.save('3');
        const before = JSON.stringify({ day: G.time, own: G.world.baronies.map((b) => b.owner) });
        ISK.panels.load('3');
        const G2 = UI.G;
        const after = JSON.stringify({ day: G2.time, own: G2.world.baronies.map((b) => b.owner) });
        if (before !== after) errors.push('save/load mismatch');
        await UI.sleep(300);
      });
      ISK.render.R.cam.z = 0.55; ISK.render.clampCam(); document.querySelector('[data-mode="political"]').click();
      await shot('21_after_120_days');
    } catch (e) { errors.push('fatal: ' + (e.stack || e)); }
    if (native) { await native.report({ errors }); native.quit(); }
    else console.log('SELFTEST', errors);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
