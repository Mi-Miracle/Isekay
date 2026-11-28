// Генерує godot/scripts/core/class_tree.gd з даних старої Electron-версії (src/js).
// Покрокові навички перетворюються на екшен-навички типів dungeon.gd (arc, nova, projectile, fan, aoe_at, meteor, cloud, heal, shield, buff, blink, charge).
// Запуск із кореня репозиторію: node godot/tools/gen_classes.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
globalThis.ISK = {};
for (const f of ['rng', 'data', 'content', 'content2', 'content3', 'content4']) eval(fs.readFileSync(path.join(ROOT, 'src/js', f + '.js'), 'utf8'));
const D = ISK.data;

// Нові класи для Godot: базові стати, звичайна атака, рух і колір.
const NEW = {
  paladin: { melee: true, col: '#ffe27a', hp: 125, hp_lvl: 21, mp: 45, mp_lvl: 6, atk: 12, atk_lvl: 3.0, def: 6, def_lvl: 1.8, crit: 0.07, speed: 0.95,
    basic: { type: 'arc', reach: 56, arc: 1.1, power: 1.05, cd: 0.44 }, move: { name: 'Щитовий ривок', type: 'charge', range: 210, power: 1.1, desc: 'Таран щитом. Двері, вороги, стіни — без різниці.' } },
  monk: { melee: true, col: '#ffb36e', hp: 105, hp_lvl: 18, mp: 40, mp_lvl: 6, atk: 12, atk_lvl: 3.2, def: 4, def_lvl: 1.4, crit: 0.14, speed: 1.12,
    basic: { type: 'arc', reach: 46, arc: 1.0, power: 0.72, cd: 0.2 }, move: { name: 'Крок вітру', type: 'blink', range: 220, power: 0.8, desc: 'Ступив — і вітер позаду. Сандалі не встигають.' } },
  lancer: { melee: true, col: '#9fd0ff', hp: 112, hp_lvl: 19, mp: 35, mp_lvl: 5, atk: 13, atk_lvl: 3.3, def: 5, def_lvl: 1.5, crit: 0.12, speed: 1.0,
    basic: { type: 'arc', reach: 82, arc: 0.55, power: 1.05, cd: 0.42 }, move: { name: 'Стрибок драгуна', type: 'charge', range: 270, power: 1.4, desc: 'Злітаєш угору й падаєш списом униз. Приземлення — на ворога.' } },
  bard: { melee: false, col: '#ff8ad8', hp: 90, hp_lvl: 15, mp: 60, mp_lvl: 8, atk: 12, atk_lvl: 3.0, def: 3, def_lvl: 1.1, crit: 0.1, speed: 1.05,
    basic: { type: 'projectile', speed: 480, power: 0.85, cd: 0.42, r: 7, col: '#ff8ad8', pierce: 0 }, move: { name: 'Сальто зі сцени', type: 'blink', range: 210, power: 0.5, desc: 'Ефектне сальто. Публіка аплодує, вороги промахуються.' } },
  samurai: { melee: true, col: '#ff6a6a', hp: 105, hp_lvl: 18, mp: 35, mp_lvl: 5, atk: 14, atk_lvl: 3.5, def: 4, def_lvl: 1.3, crit: 0.2, speed: 1.04,
    basic: { type: 'arc', reach: 62, arc: 1.0, power: 1.0, cd: 0.38 }, move: { name: 'Іайдо-ривок', type: 'charge', range: 230, power: 1.5, desc: 'Ти вже позаду ворога. Меч уже в піхвах. Ворог ще думає.' } },
  summoner: { melee: false, col: '#7dffd0', hp: 85, hp_lvl: 14, mp: 75, mp_lvl: 10, atk: 13, atk_lvl: 3.4, def: 3, def_lvl: 1.0, crit: 0.08, speed: 1.0,
    basic: { type: 'projectile', speed: 420, power: 0.85, cd: 0.48, r: 8, col: '#7dffd0', pierce: 0 }, move: { name: 'Обмін із духом', type: 'blink', range: 230, power: 0.6, desc: 'Міняєшся місцями з духом. Дух невдоволений, але мовчить.' } },
  warlock: { melee: false, col: '#a64dff', hp: 88, hp_lvl: 15, mp: 70, mp_lvl: 9, atk: 14, atk_lvl: 3.6, def: 3, def_lvl: 1.0, crit: 0.1, speed: 0.98,
    basic: { type: 'projectile', speed: 440, power: 0.9, cd: 0.5, r: 8, col: '#a64dff', pierce: 0 }, move: { name: 'Крок безодні', type: 'blink', range: 230, power: 0.9, desc: 'Пірнаєш у тінь і виринаєш поруч. Від тебе пахне сіркою.' } },
  ninja: { melee: true, col: '#9aa6b8', hp: 90, hp_lvl: 15, mp: 45, mp_lvl: 7, atk: 12, atk_lvl: 3.1, def: 3, def_lvl: 1.1, crit: 0.25, speed: 1.18,
    basic: { type: 'arc', reach: 48, arc: 0.95, power: 0.75, cd: 0.22 }, move: { name: 'Заміна колодою', type: 'blink', range: 240, power: 0.7, desc: 'Пуф! На твоєму місці колода. Ворог б\'є колоду.' } },
  battle_chef: { melee: true, col: '#ffa64d', hp: 115, hp_lvl: 20, mp: 45, mp_lvl: 6, atk: 13, atk_lvl: 3.2, def: 5, def_lvl: 1.5, crit: 0.1, speed: 1.0,
    basic: { type: 'arc', reach: 58, arc: 1.15, power: 1.05, cd: 0.42 }, move: { name: 'Ривок з пательнею', type: 'charge', range: 220, power: 1.3, desc: 'Пательня попереду, кухар позаду. Обід подано.' } },
  alchemist: { melee: false, col: '#7dff6a', hp: 92, hp_lvl: 15, mp: 60, mp_lvl: 8, atk: 13, atk_lvl: 3.3, def: 3, def_lvl: 1.2, crit: 0.1, speed: 1.0,
    basic: { type: 'projectile', speed: 400, power: 0.9, cd: 0.5, r: 8, col: '#7dff6a', pierce: 0, explode: 40 }, move: { name: 'Димовий стрибок', type: 'blink', range: 210, power: 0.5, desc: 'Бах — дим — тебе тут немає. Колба — твоя найкраща подруга.' } },
  jack: { melee: true, col: '#ffd36e', hp: 100, hp_lvl: 17, mp: 50, mp_lvl: 7, atk: 12, atk_lvl: 3.2, def: 4, def_lvl: 1.4, crit: 0.15, speed: 1.05,
    basic: { type: 'arc', reach: 54, arc: 1.0, power: 0.95, cd: 0.36 }, move: { name: 'Імпровізований ривок', type: 'blink', range: 220, power: 0.8, desc: 'Ривок у випадковому стилі. Сьогодні — як ніндзя. Завтра — хто знає.' }, secret: true,
    extra: [
      { id: 'jack_beginner_luck', name: 'Удача новачка', lvl: 12, mp: 20, cd: 14, type: 'buff', time: 6.0, desc: 'Нічого не вмієш як слід — зате все вдається. Шкода +60% на 6 секунд.' },
      { id: 'jack_protagonist', name: 'Удар головного героя', lvl: 18, mp: 34, cd: 11, type: 'meteor', radius: 150, power: 4.6, delay: 0.8, col: '#ffe27a', desc: 'Сюжетна броня + сюжетний кулак. Звучить опенінг.' },
    ] },
};
// Класи, що вже є в Godot: чи ближній бій і колір (для дерева класу).
const OLD = {
  swordsman: { melee: true, col: '#bfe6ff' }, archer: { melee: false, col: '#ffe6a8' }, mage: { melee: false, col: '#c18cff' },
  priest: { melee: true, col: '#fff2a0' }, rogue: { melee: true, col: '#8c6bff' }, berserker: { melee: true, col: '#ff7a5a' },
};
const ARCH = { ...OLD, ...NEW };

const r2 = (x) => Math.round(x * 100) / 100;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const COST = { 1: [8, 1.8], 4: [14, 5], 8: [22, 8], 12: [20, 5], 18: [32, 10], 20: [24, 6], 26: [28, 7], 45: [32, 8], 52: [36, 9], 75: [50, 14] };

function conv(s, cls, lvl, id) {
  const A = ARCH[cls];
  const [mp, cd] = COST[lvl] || [20, 6];
  const out = { id, name: s.name, lvl, mp, cd, desc: s.desc || '', col: A.col };
  const p = s.power || 1.5, h = s.hits || 1, e = s.effect || {};
  const stun = e.status === 'stun', freeze = e.status === 'freeze';
  const big = lvl >= 75 ? 1.15 : 1;
  if (s.heal && (s.target === 'party' || s.target === 'self')) {
    Object.assign(out, { type: 'heal', amount: r2(clamp(0.18 + s.heal * 0.06, 0.2, 0.45)), col: '#9dffb0' });
  } else if (!s.power && e.buff && ['def', 'shield', 'dodge', 'counter', 'taunt', 'regen'].includes(e.buff)) {
    Object.assign(out, { type: 'shield', time: e.buff === 'shield' ? 3.5 : 3.0, amount: e.buff === 'regen' ? 0.25 : 0.12 });
  } else if (!s.power && e.buff) {
    Object.assign(out, { type: 'buff', time: 6.0 });
  } else if (s.target === 'all' && (e.status === 'poison' || e.status === 'burn') && p < 2.5) {
    Object.assign(out, { type: 'cloud', radius: 105, power: r2(clamp(p * 0.3, 0.35, 0.8) * big), time: 5.0 });
  } else if (s.target === 'all') {
    if (p >= 4 || lvl >= 75) Object.assign(out, { type: 'meteor', radius: lvl >= 75 ? 180 : 140, power: r2(p * 0.95 * big), delay: 0.85 });
    else if (A.melee) Object.assign(out, { type: 'nova', radius: 115, power: r2(p * 1.2), ...(stun || freeze ? { slow: freeze ? 3.0 : 2.0 } : {}) });
    else Object.assign(out, { type: 'aoe_at', radius: 100, power: r2(clamp(p * 0.55, 0.6, 2.4)), ticks: 3 });
  } else if (h >= 3) {
    Object.assign(out, { type: 'fan', count: clamp(h, 3, 10), spread: A.melee ? 1.2 : 0.5, speed: 560, power: r2(clamp(p * 0.9, 0.55, 2.2)) });
  } else if (A.melee) {
    Object.assign(out, { type: 'arc', reach: p > 3.5 ? 100 : 76, arc: 1.25, power: r2(p * 1.25 * h * big), knock: stun ? 460 : 300 });
  } else {
    Object.assign(out, { type: 'projectile', speed: 620, power: r2(p * 1.2 * h * big), r: p > 3.5 ? 14 : 10, pierce: s.pierce || p > 3.5 ? 99 : 0, ...(e.status === 'burn' || s.elem === 'fire' ? { explode: 70 } : {}) });
  }
  return out;
}

// Характеристики старої гри → множники Godot.
function bonus(b) {
  b = b || {};
  const g = (k) => b[k] || 0;
  const o = { hp: r2(g('vit') * 0.03), atk: r2((g('str') + g('int')) * 0.02), mp: r2(g('int') * 0.03), def: r2(g('vit') * 0.02), crit: r2((g('agi') + g('luk')) * 0.004) };
  for (const k of Object.keys(o)) if (!o[k]) delete o[k];
  return o;
}

const DMG = (s) => s.power && s.target !== 'self';
function pickBase(C, cls) {
  const sk = C.skills.slice().sort((a, b) => a.lvl - b.lvl);
  const first = sk[0];
  const rest = sk.slice(1);
  const bands = [[2, 6], [7, 13], [14, 19], [20, 99]];
  const used = new Set([first.id]);
  let support = 0;
  const picks = bands.map(([a, b]) => {
    const inb = rest.filter((s) => s.lvl >= a && s.lvl <= b && !used.has(s.id));
    let s = inb.find(DMG) || inb[0];
    if (inb.length && !DMG(inb[0]) && support === 0) { s = inb[0]; }
    if (!s) s = rest.find((x) => !used.has(x.id));
    if (!s) return null;
    if (!DMG(s)) support++;
    used.add(s.id);
    return s;
  });
  const lv = [1, 4, 8, 12, 18];
  const A = NEW[cls];
  const move = { id: cls + '_move', name: A.move.name, lvl: 1, mp: 4, cd: 1.5, type: A.move.type, range: A.move.range, power: A.move.power, col: A.col, desc: A.move.desc };
  const list = [first, ...picks].map((s, i) => s && conv(s, cls, lv[i], cls + '_' + s.id)).filter(Boolean);
  list.splice(1, 0, move);
  for (const x of A.extra || []) if (list.length < 6) list.push({ ...x, col: x.col || A.col });
  return list;
}

const EXTRA = {};
for (const [cls, A] of Object.entries(NEW)) {
  const C = D.CLASSES[cls];
  const { melee, col, move, secret, extra, ...stats } = A;
  EXTRA[cls] = { name: C.name, icon: C.icon, desc: C.desc, ...stats, ...(secret ? { secret: true } : {}), skills: pickBase(C, cls) };
}

const TREE = {};
for (const cls of Object.keys(ARCH)) {
  const C = D.CLASSES[cls];
  TREE[cls] = {
    branches: C.adv.map((a) => ({
      id: a.id, name: a.name, icon: a.icon, desc: a.desc, bonus: bonus(a.bonus),
      skills: a.skills.slice(0, 2).map((s, i) => conv(s, cls, [20, 26][i], 't_' + a.id + '_' + s.id)),
      masters: D.mastersOf(a).map((m) => ({
        id: m.id, name: m.name, icon: m.icon, desc: m.desc, bonus: bonus(m.bonus),
        skills: m.skills.slice(0, 2).map((s, i) => conv(s, cls, [45, 52][i], 't_' + m.id + '_' + s.id)),
      })),
    })),
    ascend: { name: C.ascend.name, icon: C.ascend.icon, skill: conv(C.ascend.skill, cls, 75, 't_asc_' + C.ascend.skill.id) },
  };
}

const gd = (o) => JSON.stringify(o, null, '\t');
const src = `## ЗГЕНЕРОВАНО godot/tools/gen_classes.js з даних старої версії — не редагувати вручну.
## EXTRA — класи, перенесені зі старої гри (паладин, монах, списник, бард, самурай, призивач,
## чорнокнижник, ніндзя, бойовий кухар, алхімік і секретний «Майстер на всі руки»).
## TREE — дерево класу: 3 гілки (клас ІІ, з 20 рівня), у кожної 2 майстри (клас ІІІ, з 45) і вознесіння (75).
class_name ClassTree
extends RefCounted

const EXTRA := ${gd(EXTRA)}

const TREE := ${gd(TREE)}
`;
fs.writeFileSync(path.join(ROOT, 'godot/scripts/core/class_tree.gd'), src);
console.log('classes', Object.keys(EXTRA).length, 'trees', Object.keys(TREE).length, 'bytes', src.length);
