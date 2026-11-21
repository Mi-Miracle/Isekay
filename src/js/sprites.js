// Pixel-art sprites drawn in code: monsters, bosses, hero/NPC generator (races, hair, costumes, weapons), map icons.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const cache = new Map();

  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function fromRows(rows, pal) {
    const H = rows.length, W = Math.max(...rows.map((r) => r.length));
    const c = canvas(W, H), g = c.getContext('2d');
    rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === '.' || ch === ' ' || !pal[ch]) continue; g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } });
    return c;
  }
  function shade(hex, f) { const n = parseInt(hex.slice(1), 16); const r = Math.min(255, Math.round(((n >> 16) & 255) * f)), g = Math.min(255, Math.round(((n >> 8) & 255) * f)), b = Math.min(255, Math.round((n & 255) * f)); return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0'); }

  // ---- monster pixel art (16×16) ----
  const M = {
    slime: { pal: { k: '#14301a', d: '#2f8a3f', g: '#55d16a', l: '#a9f5b4', w: '#ffffff' }, rows: [
      '................', '................', '................', '................', '.......kk.......', '.....kkllkk.....', '....kgglllgk....', '...kggggggggk...',
      '..kggwkggwkgggk.', '..kggkkggkkgggk.', '.kgggggggggggggk', '.kggdggggggdgggk', '.kgggddddddgggdk', '.kdgggggggggggdk', '..kkddddddddddk.', '...kkkkkkkkkkk..'] },
    rabbit: { pal: { k: '#2a2028', w: '#f4efe8', p: '#f3a2b8', h: '#e6d2a8', e: '#c8343c' }, rows: [
      '.....k...k......', '....kwk.kwk.....', '....kpk.kpk.....', '....kwk.kwk.....', '....kwwkwwk.....', '...kwwwwwwwk....', '...kwekwwekwk...', '...kwwwpwwwwk...',
      '...kkwwwwwwk....', '..kwwwwwwwwwk...', '.kwwwwwwwwwwwk..', '.kwwwwwwwwwwwwk.', '.kwwwwwwwwwwwwk.', '..kwwkwwwwkwwk..', '..kkk.kkkk.kkk..', '................'] },
    goblin: { pal: { k: '#1c2414', g: '#6fb64a', d: '#3f7a2a', w: '#ffffff', r: '#c23a2a', b: '#7a4a2a', t: '#e8e0c0' }, rows: [
      '................', '.kk.........kk..', '.kgk.kkkkk.kgk..', '..kgkgggggkgk...', '...kgwkgwkggk...', '...kgkkgkkggk...', '....kggtggk.....', '....kgrrrgk.....',
      '...kbkkkkkbk....', '..kgbbbbbbbgk...', '..kgkbbbbbkgk.t.', '..kk.kbbbbk.kkt.', '.....kbkkbk...t.', '.....kgk.kgk....', '....kkkk.kkkk...', '................'] },
    wolf: { pal: { k: '#1a1a22', g: '#8a8f9a', d: '#5a5f6a', l: '#c8ccd4', e: '#f2c94c', w: '#ffffff' }, rows: [
      '................', '..k.k...........', '.kgkgk..........', '.kggggk.........', 'kgegggk.........', 'kgggggkkkkkkkk..', 'kwkgggggggggggk.', '.kklggggggggggkk',
      '...klgggggggggkg', '...kllggggggdgk.', '....kgdkkkkgdgk.', '....kgk....kgk..', '....kgk....kgk..', '...kkk....kkk...', '................', '................'] },
    skeleton: { pal: { k: '#222', w: '#ecebe4', g: '#bdbbb0', e: '#e03030', r: '#7a6a5a' }, rows: [
      '.....kkkkk......', '....kwwwwwk.....', '....kwkwkwk.....', '....kwewewk.....', '....kwwwwwk.....', '.....kwkwk......', '......kwk.......', '...kkwwwwwkk..r.',
      '..kw.kwgwk.wk.r.', '..kw.kwwwk.wkkr.', '.....kwgwk...kr.', '......kwk.......', '.....kw.wk......', '.....kw.wk......', '....kkw.wkk.....', '................'] },
    ghost: { pal: { k: '#2a2a44', w: '#eef2ff', b: '#b8c4ff', e: '#202040' }, rows: [
      '................', '.....kkkkk......', '....kwwwwwk.....', '...kwwwwwwwk....', '..kwweewweewk...', '..kwweewweewk...', '..kwwwwwwwwwk...', '..kwwwkkkwwwk...',
      '.kwwwwkkkwwwwk..', '.kwwwwwwwwwwwk..', '.kbwwwwwwwwwbk..', '.kbbwwwwwwwbbk..', '.kbbbwwwwwbbbk..', '..kbkbbkbbkbk...', '..k.k.kk.k.k....', '................'] },
    harpy: { pal: { k: '#2a1a1a', s: '#e8b48c', f: '#8a5a8a', d: '#5a3a5a', h: '#d8c84a', e: '#202020', y: '#e8c040' }, rows: [
      '................', '......kkk.......', '.....khhhk......', '.....ksesk......', '.kk..ksssk..kk..', 'kffk.kkskk.kffk.', 'kfffkkfffkkfffk.', '.kfffffffffffk..',
      '..kdffffffffdk..', '...kkdffffdkk...', '.....kfdfk......', '.....kffk.......', '.....kyky.......', '....kyk.kyk.....', '................', '................'] },
    scorpion: { pal: { k: '#2a1408', r: '#c2582a', d: '#7a3214', y: '#f2c94c' }, rows: [
      '...........kk...', '..........krrk..', '..........kryk..', '...........krk..', '...........krk..', '..........krk...', 'kk......kkrrk...', 'krk...kkrrrk....',
      '.krkkkrrrrk.....', '..krrrrrrrrk....', '.kkrdrrrrdrrkk..', 'krk.kdrrrdk.krk.', 'kk..k.k.k.k..kk.', '...k.k...k.k....', '................', '................'] },
    troll: { pal: { k: '#1a2418', g: '#6a8a5a', d: '#4a6a3a', b: '#7a5a3a', w: '#ffffff', t: '#e8e0c0' }, rows: [
      '................', '.....kkkkk......', '....kgggggk.....', '...kgwkgkwgk....', '...kgggggggk....', '...kgtggggtk....', '....kgggggk.....', '..kkgggggggkk...',
      '.kgggggggggggk..', 'kgg.kgbbbgk.ggk.', 'kgk.kbbbbbk.kgk.', 'kk..kbbbbbk..kk.', '....kggkggk.....', '....kggkggk.....', '...kkkk.kkkk....', '................'] },
    golem: { pal: { k: '#22222a', g: '#8a8a94', d: '#5a5a66', l: '#b8b8c4', e: '#4ae0ff', m: '#5a8a4a' }, rows: [
      '................', '.....kkkkkk.....', '....klllgggk....', '....kgekkegk....', '....kggggggk....', '..kkkkggggkkkk..', '.kllgggggggggdk.', '.kggkgggggggkgk.',
      '.kgdkggmmgggkdk.', '.kddkgggggggkdk.', '.kkk.kggggggkkk.', '.....kgdkdgk....', '.....kgk.kgk....', '....kddk.kddk...', '....kkkk.kkkk...', '................'] },
    mimic: { pal: { k: '#2a1808', b: '#9a6a2a', d: '#6a4214', y: '#f2c94c', w: '#ffffff', r: '#c2343c', p: '#f08aa0' }, rows: [
      '................', '................', '..kkkkkkkkkkkk..', '.kbbbbbbbbbbbbk.', '.kbdbbbbbbbbdbk.', '.kyyyyyyyyyyyyk.', '.kwkwkwkwkwkwkk.', '.kkrrrrrrrrrrkk.',
      '.kkrrpppppprrkk.', '.kwkwkwkwkwkwkk.', '.kyyyyyyyyyyyyk.', '.kbdbbbyybbbdbk.', '.kbbbbbyybbbbbk.', '.kkkkkkkkkkkkkk.', '................', '................'] },
    wyvern: { pal: { k: '#1a1414', r: '#3a8a5a', d: '#245a3a', w: '#c8e8a0', e: '#f2c94c', f: '#e8e0c0' }, rows: [
      'kk..........kk..', 'krk........krk..', 'krrk......krrk..', 'krrrk.kkk.krrrk.', '.krrrkrrrkrrrk..', '..krrrrerrrrk...', '...krrrrrrrk.kk.', '....krwwwrrkkrk.',
      '....krwwwrrrrk..', '...krrwwwrrrk....', '...krrrrrrrk.....', '...krk..krk......', '..kfk...kfk......', '................', '................', '................'] },
    naga: { pal: { k: '#14242a', s: '#5ab0a0', d: '#2a7a6a', h: '#2a4a8a', e: '#f2c94c', y: '#e8e0a0' }, rows: [
      '................', '.....khhhk......', '....khssshk.....', '....kseksek.....', '....ksssssk.....', '.....kssk.......', '...kkssssskk....', '..ks.ksssk.sk...',
      '.....kyyyk......', '.....ksdsk......', '......ksdsk.....', '.......ksdsk....', '...kkkkksdsk....', '..ksdsdsdssk....', '...kkkkkkkk.....', '................'] },
    imp: { pal: { k: '#2a0a0a', r: '#d0342a', d: '#8a1a14', y: '#f2c94c', w: '#ffffff', h: '#3a1a1a' }, rows: [
      '................', '...kk.....kk....', '...khk...khk....', '....khkkkhk.....', '....krrrrrk.....', '...krykrykrk....', '...krrrrrrrk....', '....krwwwrk.....',
      '.kk..krrrk..kk..', 'kdrkkrrrrrkkrdk.', '.kdrrrrrrrrrdk..', '...kkrrrrrkk.k..', '....krk.krk..kr.', '....kdk.kdk...k.', '...kkk...kkk....', '................'] },
    yeti: { pal: { k: '#2a2a38', w: '#f0f4ff', g: '#c8d0e8', b: '#5a8ad0', e: '#202040', f: '#8aa0c8' }, rows: [
      '................', '.....kkkkk......', '....kwwwwwk.....', '...kwfefefwk....', '...kwffffffwk...', '...kwfkkkfwk....', '..kkwwwwwwwkk...', '.kwwwwwwwwwwwk..',
      'kwwgwwwwwwwgwwk.', 'kwgkwwwwwwwkgwk.', 'kwk.kwwwwwk.kwk.', 'kk..kwwwwwk..kk.', '....kwwkwwk.....', '....kgwkwgk.....', '...kkkk.kkkk....', '................'] },
    spider: { pal: { k: '#1a1420', b: '#4a3a5a', d: '#2a2034', r: '#e03050', y: '#c8a03a' }, rows: [
      '................', '................', 'k...k......k...k', '.k...k....k...k.', '..k..kkkkkk..k..', '...kkbbbbbbkk...', 'kkkkbbbbbbbbkkkk', '...kbrbrrbrbk...',
      'kkkkbbbbbbbbkkkk', '...kkbyybybkk...', '..k..kbbbbk..k..', '.k...kkkkkk...k.', 'k...k......k...k', '................', '................', '................'] },
    treant: { pal: { k: '#1a1408', b: '#7a5a2a', d: '#4a3414', g: '#3a8a3a', l: '#6ac24a', e: '#f2e05a' }, rows: [
      '...kkkkkkkk.....', '..kllglggllk....', '.klgglllgglgk...', '.kggllgglllgk...', '..kkkbbbbkkk....', '....kbebbek.....', '....kbbbbbk.....', '..kkkbkkkbkkk...',
      '.kbbkbbbbbkbbk..', 'kbk.kbbdbbk.kbk.', 'kk..kbbbbbk..kk.', '....kbdbdbk.....', '...kbbk.kbbk....', '..kbdk...kdbk...', '..kkk.....kkk...', '................'] },
    pixie: { pal: { k: '#2a1a3a', s: '#f6d8c8', w: '#c8f0ff', p: '#ff7eb6', h: '#ffd84a', y: '#fff6a0' }, rows: [
      '................', '.ww.......ww....', 'wwww.kkk.wwww...', 'wwwwkhhhkwwww...', '.wwkhssshkww....', '..wkseseskw.....', '...ksssssk......', '....kkskk...y...',
      '...kppppk..yyy..', '..kpppppkk..y...', '...kppppk.......', '....kkkk........', '....ks.sk.......', '................', '................', '................'] },
    salamander: { pal: { k: '#2a0a04', r: '#f2742a', d: '#b8341a', y: '#ffd84a', e: '#202020' }, rows: [
      '................', '................', '..kkk...........', '.kryrk..........', 'kryeyrk.........', 'krrrrrkkkkkkk...', '.kkrrrrrrrrrrkk.', '...krydrrydrrrk.',
      '...krrrrrrrrrkkk', '....kdkkkkdk..kk', '...kdk....kdk...', '...kk......kk...', '................', '................', '................', '................'] },
  };
  const ALIAS = { icegolem: ['golem', { g: '#a8dcff', l: '#e0f4ff', d: '#6aa8d8', e: '#ffffff', m: '#c8f0ff' }], drake: ['wyvern', { r: '#d0442a', d: '#8a2414', w: '#ffb05a' }], vampire: null, zombie: null };

  // ---- humanoid generator (hero, NPCs, humanoid monsters) ----
  // spec: {skin, hair, hairStyle, eyes, body, pants, boots, feat:[], weapon, hat, cape, mask, beard, glow}
  function humanoid(spec) {
    const W = 16, H = 16; const c = canvas(W, H), g = c.getContext('2d');
    const px = (x, y, col, w = 1, h = 1) => { if (!col) return; g.fillStyle = col; g.fillRect(x, y, w, h); };
    const K = '#16121c';
    const skin = spec.skin || '#f1c9a5', skinD = shade(skin, 0.8);
    const body = spec.body || '#5a6fb0', bodyD = shade(body, 0.7), bodyL = shade(body, 1.25);
    const hair = spec.hair || '#3a2a20', hairD = shade(hair, 0.75);
    const small = spec.feat && spec.feat.includes('small');
    const oy = small ? 2 : 0;
    // cape
    if (spec.cape) { px(4, 6 + oy, K, 8, 8 - oy); px(5, 7 + oy, spec.cape, 6, 7 - oy); }
    // tail
    if (spec.feat && spec.feat.includes('tail')) { px(12, 10 + oy, K, 3, 1); px(13, 9 + oy, K, 2, 1); px(12, 10 + oy, hair === '#e8e8ee' ? skinD : (spec.tailColor || hair), 2, 1); }
    // legs & boots
    px(5, 12, K, 6, 3 + 0); px(6, 12, spec.pants || shade(body, 0.55), 2, 2); px(8, 12, spec.pants || shade(body, 0.55), 2, 2);
    px(5, 14, K, 6, 2); px(6, 14, spec.boots || '#4a3020', 2, 1); px(8, 14, spec.boots || '#4a3020', 2, 1);
    // torso
    px(4, 7 + oy, K, 8, 6 - oy); px(5, 8 + oy, body, 6, 4 - oy); px(5, 8 + oy, bodyL, 6, 1); px(5, 11, bodyD, 6, 1);
    if (spec.belt !== false) px(5, 11, spec.beltColor || '#3a2a18', 6, 1);
    // arms
    px(3, 8 + oy, K, 1, 4); px(12, 8 + oy, K, 1, 4); px(4, 8 + oy, body, 1, 3); px(11, 8 + oy, body, 1, 3); px(4, 11 + oy * 0, skin, 1, 1); px(11, 11, skin, 1, 1);
    // head
    const hy = 1 + oy;
    px(4, hy, K, 8, 7); px(5, hy + 1, skin, 6, 5); px(5, hy + 5, skinD, 6, 1);
    // eyes
    px(6, hy + 3, spec.eyes || '#3a6bd6'); px(9, hy + 3, spec.eyes || '#3a6bd6'); px(6, hy + 2, K); px(9, hy + 2, K);
    if (spec.glow) { px(6, hy + 3, spec.glow); px(9, hy + 3, spec.glow); }
    // mouth
    px(7, hy + 5, shade(skin, 0.6), 2, 1);
    // features
    const f = spec.feat || [];
    if (f.includes('ears')) { px(3, hy + 2, K, 1, 2); px(12, hy + 2, K, 1, 2); px(2, hy + 1, K); px(13, hy + 1, K); px(3, hy + 3, skin); px(12, hy + 3, skin); }
    if (f.includes('bigears')) { px(1, hy + 2, K, 3, 3); px(12, hy + 2, K, 3, 3); px(2, hy + 3, skin, 2, 1); px(12, hy + 3, skin, 2, 1); }
    if (f.includes('tusks')) { px(6, hy + 5, '#f4f0dc'); px(9, hy + 5, '#f4f0dc'); }
    if (spec.beard || f.includes('beard')) { px(5, hy + 4, hair, 6, 3); px(6, hy + 6, hairD, 4, 2); px(7, hy + 5, shade(skin, 0.6), 2, 1); }
    // hair styles: 0 short, 1 long, 2 ponytail, 3 spiky, 4 bob, 5 bald
    const st = spec.hairStyle ?? 0;
    if (st !== 5 && !spec.hat) {
      px(4, hy, hair, 8, 2); px(4, hy + 1, hair, 1, 2); px(11, hy + 1, hair, 1, 2); px(5, hy + 2, hairD, 2, 1);
      if (st === 1) { px(3, hy + 1, hair, 1, 6); px(12, hy + 1, hair, 1, 6); px(4, hy + 3, hair, 1, 4); px(11, hy + 3, hair, 1, 4); }
      if (st === 2) { px(12, hy + 1, hair, 2, 2); px(13, hy + 3, hair, 1, 4); }
      if (st === 3) { px(4, hy - 1, hair); px(6, hy - 1, hair); px(8, hy - 1, hair); px(10, hy - 1, hair); px(3, hy, hair); px(12, hy, hair); }
      if (st === 4) { px(3, hy + 1, hair, 1, 4); px(12, hy + 1, hair, 1, 4); }
    }
    if (f.includes('catears')) { px(4, hy - 1, K, 2, 2); px(10, hy - 1, K, 2, 2); px(4, hy - 1, hair, 1, 1); px(11, hy - 1, hair, 1, 1); px(5, hy, '#f3a2b8'); px(10, hy, '#f3a2b8'); }
    if (f.includes('horns')) { px(4, hy - 1, '#e8e0c0'); px(11, hy - 1, '#e8e0c0'); px(3, hy - 2, '#e8e0c0'); px(12, hy - 2, '#e8e0c0'); }
    if (spec.hat) { px(3, hy, K, 10, 2); px(4, hy, spec.hat, 8, 1); px(5, hy - 2, K, 6, 2); px(6, hy - 2, spec.hat, 4, 2); if (spec.hatBrim) px(2, hy + 1, spec.hat, 12, 1); }
    if (spec.helmet) { px(4, hy, spec.helmet, 8, 2); px(4, hy + 1, spec.helmet, 1, 3); px(11, hy + 1, spec.helmet, 1, 3); px(7, hy + 2, spec.helmet, 2, 2); }
    if (spec.mask) { px(5, hy + 4, spec.mask, 6, 2); }
    if (spec.wraps) { for (let y = hy + 1; y < 13; y += 2) px(4, y, '#e8e4d0', 8, 1); }
    if (spec.crown) { px(5, hy - 2, '#f2c94c', 6, 1); px(5, hy - 3, '#f2c94c'); px(7, hy - 3, '#f2c94c'); px(10, hy - 3, '#f2c94c'); px(8, hy - 2, '#e03050'); }
    // weapon
    const wpn = spec.weapon;
    if (wpn === 'sword' || wpn === 'axe') { px(13, 3, '#dfe6f0', 1, 8); px(12, 10, '#c8a03a', 3, 1); px(13, 11, '#6a4a2a', 1, 2); if (wpn === 'axe') px(14, 3, '#b8c0cc', 2, 3); }
    if (wpn === 'staff' || wpn === 'holy') { px(13, 2, '#7a5a2a', 1, 12); px(12, 1, wpn === 'holy' ? '#fff6a0' : '#9a5aff', 3, 2); }
    if (wpn === 'bow') { px(13, 4, '#8a5a2a', 1, 8); px(14, 3, '#8a5a2a'); px(14, 12, '#8a5a2a'); px(12, 5, '#e8e8e8', 1, 6); }
    if (wpn === 'dagger') { px(12, 9, '#dfe6f0', 1, 3); px(12, 12, '#6a4a2a'); }
    if (wpn === 'mace') { px(13, 5, '#6a4a2a', 1, 8); px(12, 3, '#a8b0bc', 3, 3); }
    if (wpn === 'knuckles') { px(11, 11, '#c8a03a', 2, 1); px(3, 11, '#c8a03a', 2, 1); }
    if (wpn === 'spear') { px(13, 1, '#dfe6f0', 1, 3); px(13, 4, '#7a5a2a', 1, 11); }
    if (spec.shield) { px(1, 8, K, 3, 5); px(1, 9, spec.shield, 2, 3); }
    return c;
  }

  const HUMANOID_MONSTERS = {
    bandit: { skin: '#e0b08a', hair: '#3a2a20', body: '#5a4a3a', mask: '#2a2a2a', weapon: 'dagger', pants: '#3a3028' },
    zombie: { skin: '#8aa07a', hair: '#4a4a3a', body: '#5a6a5a', eyes: '#e0e040', hairStyle: 1, belt: false, pants: '#4a4a3a' },
    orc: { skin: '#6fa04a', hair: '#2a2018', body: '#7a5a3a', feat: ['tusks'], weapon: 'axe', hairStyle: 5, pants: '#4a3a28' },
    vampire: { skin: '#e8e4f0', hair: '#1a1420', body: '#2a1a2a', cape: '#8a1a2a', eyes: '#e02030', glow: '#ff3040', pants: '#1a1420' },
    demon: { skin: '#a8322a', hair: '#1a0a0a', body: '#2a1414', feat: ['horns'], weapon: 'sword', glow: '#ffb020', helmet: '#3a2a2a', cape: '#4a0a10' },
    pirate: { skin: '#d8a07a', hair: '#2a1a10', body: '#d8d0c0', hat: '#1a1a20', hatBrim: true, weapon: 'sword', pants: '#3a2a6a' },
    soldier: { skin: '#e0b08a', body: '#8a2a2a', helmet: '#a8b0bc', weapon: 'spear', shield: '#c8a03a', pants: '#4a4a5a' },
    mummy: { skin: '#e8e4d0', hair: '#e8e4d0', body: '#d8d4c0', wraps: true, eyes: '#40e0ff', glow: '#40e0ff', hairStyle: 5, belt: false },
  };

  function monster(key) {
    const k = 'm:' + key; if (cache.has(k)) return cache.get(k);
    let c;
    if (HUMANOID_MONSTERS[key]) c = humanoid(HUMANOID_MONSTERS[key]);
    else if (M[key]) c = fromRows(M[key].rows, M[key].pal);
    else if (ALIAS[key]) { const [base, over] = ALIAS[key]; c = fromRows(M[base].rows, { ...M[base].pal, ...over }); }
    else c = fromRows(M.slime.rows, M.slime.pal);
    cache.set(k, c); return c;
  }

  const BOSS_LOOK = {
    goblin: ['goblin', { crown: true }], crypt: ['skeleton', { tint: '#c8a0ff' }], slime: ['slime', { crown: true }], ruins: ['golem', { tint: '#f2c94c' }],
    mine: ['golem', {}], tower: [null, { skin: '#f1c9a5', hair: '#e8e8ee', beard: true, body: '#3b2a8a', hat: '#3b2a8a', weapon: 'staff' }], dragon: ['drake', {}],
    beast: ['wolf', { tint: '#e0e4ff' }], spider: ['spider', { crown: true }], bandit: [null, { skin: '#d8a07a', hair: '#5a3a20', body: '#6a4a2a', hat: '#4a3020', hatBrim: true, weapon: 'axe', beard: true }],
    fey: ['pixie', { crown: true }], crystal: ['icegolem', {}], ice: [null, { skin: '#c8e0ff', hair: '#ffffff', body: '#4a7ab0', cape: '#a8d0ff', crown: true, weapon: 'staff', glow: '#a0f0ff' }],
    volcano: ['salamander', { crown: true }], pirate: [null, { skin: '#d8a07a', hair: '#2a1a10', body: '#8a1a1a', hat: '#1a1a20', hatBrim: true, weapon: 'sword', beard: true }],
    sunken: ['naga', { tint: '#8a5aff' }], hellgate: ['demon', {}],
    citadel: [null, { skin: '#6a1a2a', hair: '#0a0a0a', body: '#1a0a14', cape: '#5a0010', feat: ['horns'], crown: true, glow: '#ff3030', weapon: 'sword', helmet: null }],
  };
  function boss(dtype) {
    const k = 'b:' + dtype; if (cache.has(k)) return cache.get(k);
    const [base, o] = BOSS_LOOK[dtype] || ['goblin', { crown: true }];
    let src = base ? monster(base) : humanoid(o);
    if (base && (o.crown || o.tint)) {
      const c = canvas(16, 16), g = c.getContext('2d'); g.drawImage(src, 0, 0);
      if (o.tint) { g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.35; g.fillStyle = o.tint; g.fillRect(0, 0, 16, 16); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
      if (o.crown) { g.fillStyle = '#16121c'; g.fillRect(5, 0, 6, 2); g.fillStyle = '#f2c94c'; g.fillRect(5, 1, 6, 1); g.fillRect(5, 0, 1, 1); g.fillRect(7, 0, 1, 1); g.fillRect(10, 0, 1, 1); }
      src = c;
    }
    cache.set(k, src); return src;
  }

  function hero(p) {
    const D = ISK.data; const R = D.RACES[p.race] || D.RACES.human;
    const look = p.look || {};
    const costume = D.COSTUMES[look.costume || 'c_default'] || D.COSTUMES.c_default;
    const cls = p.classes && p.classes.primary ? D.CLASSES[p.classes.primary].weapon : null;
    const w = p.equipment && p.equipment.weapon ? (D.getItem(p.equipment.weapon) || {}).wtype : cls;
    const key = ['h', p.race, p.gender, look.hair, look.hairColor, look.eyes, look.costume, w, p.equipment && p.equipment.offhand ? 1 : 0, p.equipment && p.equipment.head ? 1 : 0].join(':');
    if (cache.has(key)) return cache.get(key);
    const spec = {
      skin: R.skin, hair: D.HAIR_COLORS[look.hair === undefined ? 0 : look.hairColor] || D.HAIR_COLORS[0], hairStyle: look.hair ?? (p.gender === 'f' ? 1 : 0),
      eyes: D.EYE_COLORS[look.eyes || 0], body: costume.color, feat: R.feat, weapon: w,
      shield: p.equipment && p.equipment.offhand && p.equipment.offhand.startsWith('o_shield') ? '#c8a03a' : null,
      helmet: p.equipment && p.equipment.head && p.equipment.head.includes('_plate_') ? '#a8b0bc' : null,
      hat: look.costume === 'c_mage' ? '#3b2a8a' : null, cape: p.equipment && p.equipment.cloak ? '#7a2a3a' : null,
      pants: look.costume === 'c_school' ? '#22304f' : null,
    };
    if (p.gender === 'f' && spec.hairStyle === 0) spec.hairStyle = 1;
    const c = humanoid(spec); cache.set(key, c); return c;
  }

  function npc(seedStr, opts = {}) {
    const k = 'n:' + seedStr; if (cache.has(k)) return cache.get(k);
    let h = 0; for (const ch of seedStr) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const D = ISK.data; const r = (n) => { h = (h * 1103515245 + 12345) >>> 0; return h % n; };
    const races = Object.keys(D.RACES).filter((x) => x !== 'god');
    const R = D.RACES[opts.race || races[r(races.length)]];
    const c = humanoid({ skin: R.skin, hair: D.HAIR_COLORS[r(10)], hairStyle: r(6), eyes: D.EYE_COLORS[r(6)], body: ['#8a5a3a', '#3a6a8a', '#7a2a4a', '#4a7a3a', '#6a6a7a', '#b08a3a'][r(6)], feat: R.feat, weapon: opts.weapon, beard: opts.beard, hat: opts.hat });
    cache.set(k, c); return c;
  }

  // ---- map icons (12×12) ----
  const ICONS = {
    capital: { pal: { k: '#1a1410', s: '#e8e0d0', d: '#a89880', r: '#c0392b', y: '#f2c94c' }, rows: ['.....y......', '....kyk.....', '.k..ksk..k..', 'krk.ksk.krk.', 'kskkksskkskk', 'ksssssssssk.', 'ksdssssssdsk', 'ksssskkssssk', 'ksssk..kssk.', 'kkkkk..kkkk.'] },
    city: { pal: { k: '#1a1410', s: '#e0d4c0', d: '#a08a70', r: '#3a6ab0' }, rows: ['...k....k...', '..krk..krk..', '..ksk..ksk..', '.kkskkkkskk.', '.ksssssssssk', '.ksdsskssdsk', '.kssskksssk.', '.kkkkkkkkkk.'] },
    fortress: { pal: { k: '#1a1410', s: '#b8b0a0', d: '#7a7060' }, rows: ['k.k.k..k.k.k', 'kkkkk..kkkkk', 'ksssk..ksssk', 'kskskkkkskk.', 'kssssssssssk', 'ksdsskkssdsk', 'kssssk.ksssk', 'kkkkkk.kkkkk'] },
    town: { pal: { k: '#1a1410', r: '#b84a2a', s: '#e8d8b8', b: '#7a5a3a' }, rows: ['....kk......', '...krrk.kk..', '..krrrrkrrk.', '.krrrrrrrrrk', '..ksssskssk.', '..ksbbsksbk.', '..ksbbskksk.', '..kkkkkkkkk.'] },
    village: { pal: { k: '#1a1410', y: '#d8b048', s: '#e8d8b8', b: '#7a5a3a' }, rows: ['............', '....kkk.....', '...kyyyk....', '..kyyyyyk...', '.kyyyyyyyk..', '..ksssssk...', '..ksbbssk...', '..kkkkkkk...'] },
    port: { pal: { k: '#1a1410', s: '#e8d8b8', b: '#7a5a3a', w: '#6ab0e8', r: '#d03a2a' }, rows: ['.....k......', '.....kr.....', '.....krr....', '.....k......', '..kkkkkkkk..', '..kbbbbbbk..', 'wwkbbbbbbkww', 'wwwkkkkkkwww'] },
    mine: { pal: { k: '#1a1410', g: '#8a8a94', b: '#6a4a2a', y: '#f2c94c' }, rows: ['...kkkkk....', '..kgggggk...', '.kggkkkggk..', 'kgggk.kgggk.', 'kggk.y.kggk.', 'kgk.....kgk.', 'kbbbbbbbbbk.', 'kkkkkkkkkkk.'] },
    hellfort: { pal: { k: '#0a0404', r: '#6a1010', d: '#3a0808', o: '#ff6a20' }, rows: ['k....k....k.', 'kk..kkk..kk.', 'krk.krk.krk.', 'krrkkrkkrrk.', 'krrrrrrrrrk.', 'krokrrrkork.', 'krrrrkrrrrk.', 'kkkkkkkkkkk.'] },
  };
  function icon(type) { const k = 'i:' + type; if (cache.has(k)) return cache.get(k); const d = ICONS[type] || ICONS.village; const c = fromRows(d.rows, d.pal); cache.set(k, c); return c; }

  // DOM <img> with crisp scaling
  const urlCache = new Map();
  function img(cv, size, cls) {
    let u = urlCache.get(cv); if (!u) { u = cv.toDataURL(); urlCache.set(cv, u); }
    const el = document.createElement('img'); el.src = u; el.className = 'px ' + (cls || '');
    el.style.width = size + 'px'; el.style.height = size + 'px';
    return el;
  }
  function forEnemy(e) {
    if (e.boss) return boss(e.dtype || 'goblin');
    return monster(e.key);
  }
  function forCompanion(c) {
    const weapon = { warrior: 'sword', mage: 'staff', healer: 'holy', archer: 'bow', rogue: 'dagger' }[c.role];
    return npc('comp' + c.id, { weapon });
  }
  function forPet(key) {
    const map = { dog: 'wolf', cat: 'wolf', owl: 'harpy', fox: 'wolf', slime: 'slime', golem: 'golem', chicken: 'harpy', dragon: 'drake' };
    const k = 'p:' + key; if (cache.has(k)) return cache.get(k);
    const tints = { cat: '#f2a04a', fox: '#ff7a2a', dog: '#b88a5a', chicken: '#f4f4f4', owl: '#a0805a' };
    const base = monster(map[key] || 'slime'); const c = canvas(16, 16), g = c.getContext('2d'); g.drawImage(base, 0, 0);
    if (tints[key]) { g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.45; g.fillStyle = tints[key]; g.fillRect(0, 0, 16, 16); g.globalAlpha = 1; }
    cache.set(k, c); return c;
  }

  ISK.sprites = { monster, boss, hero, npc, icon, img, humanoid, forEnemy, forCompanion, forPet };
})();
