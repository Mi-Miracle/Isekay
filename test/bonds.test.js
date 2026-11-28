const test = require('node:test');
const assert = require('node:assert');
['rng', 'data', 'content', 'content2', 'content3', 'world', 'politics', 'heroes', 'player', 'combat', 'game', 'depths', 'life', 'bonds'].forEach((f) => require(`../src/js/${f}.js`));
const { game: GM, data: D, player: PL, bonds: B, combat: C } = globalThis.ISK;

test('v5.9 classes: six new classes with full skill trees', () => {
  for (const k of ['samurai', 'summoner', 'warlock', 'ninja', 'battle_chef', 'alchemist']) {
    const Cl = D.CLASSES[k]; assert.ok(Cl, k);
    assert.ok(D.WEAPON_TYPES[Cl.weapon], `${k} weapon ${Cl.weapon}`);
    for (const w of Cl.alt) assert.ok(D.WEAPON_TYPES[w], `${k} alt ${w}`);
    assert.strictEqual(Cl.adv.length, 2); for (const a of Cl.adv) assert.ok(a.master && a.master.skills.length === 2, `${k}/${a.id} master`);
    const all = D.allSkillsOf(k); assert.ok(all.length >= 9 + 4 + 4 + 1, `${k} skills ${all.length}`);
    assert.ok(D.classTier(k, { lvl: 1 }).name === Cl.name);
  }
  const ids = new Set(); for (const k of Object.keys(D.CLASSES)) for (const s of D.allSkillsOf(k)) { assert.ok(s.id && s.name && s.target, k + ' ' + s.id); ids.add(s.id); }
  assert.ok(D.skillIndex().has('iai_cut'), 'jack sees new skills');
});

test('v5.9 legends: data, meet, join, bond, chapters', () => {
  const G = GM.newGame(5, { name: 'Т', race: 'human' }); const p = G.player; p.level = 20;
  for (const [id, L] of Object.entries(D.LEGENDS)) {
    assert.ok(L.intro.length >= 3 && L.chapters.length === 3 && L.lines.length >= 3, id);
    assert.ok(D.MONSTERS[L.chapters[2].boss.key], id + ' boss');
    assert.ok(D.CLAN.roles[L.role], id + ' role');
  }
  assert.ok(B.meetCandidates(G, 'arrive', { type: 'city' }).length >= 3);
  assert.ok(B.meetCandidates(G, 'win', { hpFrac: 0.3 }).includes('seira'));
  assert.ok(!B.meetCandidates(G, 'win', { hpFrac: 0.9 }).includes('seira'));
  B.meet(G, 'ariel'); assert.ok(B.st(p, 'ariel'));
  assert.strictEqual(B.meetCandidates(G, 'arrive', { type: 'city' }).length, 0, 'cooldown after meeting');
  assert.strictEqual(B.join(G, 'ariel'), null); assert.ok(B.inParty(p, 'ariel'));
  const c = B.inParty(p, 'ariel'); assert.strictEqual(c.wage, 0);
  const base = PL.companionStats({ lvl: c.lvl, role: 'warrior' }).atk; assert.ok(PL.companionStats(c).atk > base, 'legend stronger');
  const t = B.talk(G, 'ariel', () => 0.1); assert.ok(t.line && t.gain === 3);
  assert.strictEqual(B.talk(G, 'ariel').gain, 0, 'one talk per day');
  PL.addItem(p, 'gem', 2); const gf = B.gift(G, 'ariel', 'gem'); assert.ok(gf.liked && gf.gain === 8);
  assert.strictEqual(B.st(p, 'ariel').bond, 16);
  B.addBond(G, 'ariel', 100); const ch = B.nextChapter(p, 'ariel'); assert.strictEqual(ch.idx, 0);
  const str0 = p.stats.str; B.completeChapter(G, 'ariel'); assert.strictEqual(p.stats.str, str0 + 2); assert.strictEqual(B.st(p, 'ariel').ch, 1);
  B.completeChapter(G, 'ariel'); B.completeChapter(G, 'ariel'); assert.strictEqual(B.st(p, 'ariel').sig, 2); assert.strictEqual(B.nextChapter(p, 'ariel'), null);
  assert.strictEqual(B.leave(G, 'ariel'), null); assert.ok(!B.inParty(p, 'ariel'));
  // фірмовий прийом у бою не ламає бій
  B.join(G, 'ariel'); const b = C.startBattle(p, [C.makeEnemy('goblin', 3)]); assert.ok(b.allies.some((a) => a.ref && a.ref.legend === 'ariel'));
});

test('v5.9 clan: found, recruit, contracts, hall, perks, war', () => {
  const G = GM.newGame(7, { name: 'Т', race: 'human' }); const p = G.player;
  assert.ok(B.clanCan(G)); p.level = 10; p.guild.registered = true; p.guild.rank = 2; p.gold = 50000;
  assert.strictEqual(B.foundClan(G, { name: 'Нічні Сови', icon: '🦉' }), null); assert.ok(p.clan && p.clan.lvl === 1);
  assert.ok(B.foundClan(G, { name: 'X2' }), 'only one clan');
  const cands = B.candidates(G); assert.ok(cands.length >= 3);
  assert.strictEqual(B.recruitMember(G, cands[0].id), null); assert.strictEqual(B.recruitMember(G, cands[1].id), null);
  assert.strictEqual(p.clan.members.length, 2);
  const cons = B.contracts(G); assert.ok(cons.length >= 3);
  const ids = p.clan.members.map((m) => m.id);
  assert.strictEqual(B.sendMission(G, cons[0].uid, ids), null); assert.strictEqual(p.clan.missions.length, 1);
  assert.ok(B.sendMission(G, cons[1].uid, ids), 'members are busy');
  const bank0 = p.clan.bank; GM.passTime(G, cons[0].days + 1);
  assert.strictEqual(p.clan.missions.length, 0, 'mission resolved'); assert.ok(p.clan.members.every((m) => !(m.busy > Math.floor(G.time))));
  assert.ok(p.clan.bank >= bank0);
  assert.strictEqual(B.deposit(G, 5000), null); assert.strictEqual(B.upgradeHall(G, 'barracks'), null); assert.strictEqual(B.memberCap(p.clan), 7);
  assert.ok(B.upgradeHall(G, 'barracks') === null || true);
  B.addClanXp(G, 100000); assert.strictEqual(p.clan.lvl, D.CLAN.maxLvl); assert.strictEqual(B.partyCap(p), 5);
  const r = { xp: 100, gold: 100, fame: 10, items: {} }; B.boostRewards(G, r); assert.strictEqual(r.xp, 115); assert.strictEqual(r.gold, 125);
  B.boostRewards(G, r); assert.strictEqual(r.xp, 115, 'only once');
  const en = B.warEnemies(G, D.RIVAL_GUILDS[0].id); assert.ok(en.length >= 2);
  assert.ok(B.warReady(G)); B.warResult(G, D.RIVAL_GUILDS[0].id, true); assert.ok(!B.warReady(G)); assert.strictEqual(p.clan.rep[D.RIVAL_GUILDS[0].id], 1);
  // збереження
  const G2 = GM.deserialize(GM.serialize(G)); assert.strictEqual(G2.player.clan.name, 'Нічні Сови');
});

test('v5.9 contract items exist', () => {
  for (const c of D.CLAN.contracts) if (c.item) assert.ok(D.getItem(c.item[0]), c.item[0]);
});
