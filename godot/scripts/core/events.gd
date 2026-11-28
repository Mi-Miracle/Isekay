## Сюжетні події з вибором (у дорозі й у містах) та їхні наслідки.
## Дані — EventsData.STORY. Частота — Game.settings.events_freq (0 — вимкнено), у містах — events_town.
## Стан: Game.state.events = {"seen": {id: день}, "walk": клітинки з останньої перевірки}.
class_name Events
extends RefCounted

## Кожні CHECK_CELLS пройдених клітинок — шанс події = BASE_CHANCE × частота × 2.
const CHECK_CELLS := 30.0
const BASE_CHANCE := 0.22
const TOWN_CHANCE := 0.1
## Подію не повторюємо раніше, ніж за стільки днів.
const REPEAT_DAYS := 12

## Бій із події → (тип підземелля для арени, вид монстра-ватажка).
const FIGHTS := {
	"mimic": ["ruins", "golem"], "goblin": ["goblin", "goblin"], "wolf": ["beast", "wolf"], "soldier": ["bandit", "skeleton"],
	"imp": ["fey", "ghost"], "wyvern": ["dragon", "wolf"], "orc": ["bandit", "goblin"], "slime": ["slime", "slime"],
	"bandit": ["bandit", "goblin"],
}

const ITEMS := {
	"potion_m": {"potions": 1}, "potion_l": {"potions": 2}, "mana_crystal": {"ethers": 1},
	"gem": {"gold": 35, "name": "самоцвіт"}, "herb_heal": {"herb": "healroot"},
	"food_pie": {"food": 0.25, "name": "пиріг"}, "food_bread": {"food": 0.15, "name": "хліб"}, "meat": {"food": 0.2, "name": "м'ясо"},
	"stone": {"name": "камінь"},
}


static func st() -> Dictionary:
	if not (Game.state.get("events") is Dictionary):
		Game.state.events = {"seen": {}, "walk": 0.0}
	return Game.state.events


static func freq() -> float:
	return clampf(float(Game.settings.get("events_freq", 0.5)), 0.0, 1.0)


static func today() -> int:
	return Game.day_of(float(Game.state.get("minutes", 0.0)))


## Герой пройшов dist клітинок мапою. Повертає подію (або {}), якщо настав час.
static func on_walk(dist: float, rng: RandomNumberGenerator = null) -> Dictionary:
	var f := freq()
	if f <= 0.0:
		return {}
	var s := st()
	s.walk = float(s.walk) + dist
	if float(s.walk) < CHECK_CELLS:
		return {}
	s.walk = 0.0
	if _roll(rng) > BASE_CHANCE * f * 2.0 * (1.0 - Origin.mul(Game.state.player, "stealth")):
		return {}
	return pick("road", rng)


## Прибуття в місто: невеликий шанс міської події.
static func on_town(rng: RandomNumberGenerator = null) -> Dictionary:
	if not bool(Game.settings.get("events_town", true)) or freq() <= 0.0:
		return {}
	if _roll(rng) > TOWN_CHANCE * freq() * 2.0:
		return {}
	return pick("town", rng)


static func _roll(rng: RandomNumberGenerator) -> float:
	return rng.randf() if rng else randf()


static func pick(where: String, rng: RandomNumberGenerator = null) -> Dictionary:
	var s := st()
	var d := today()
	var pool: Array = EventsData.STORY.filter(func(e): return e.where == where and d - int(s.seen.get(e.id, -999)) >= REPEAT_DAYS)
	if pool.is_empty():
		pool = EventsData.STORY.filter(func(e): return e.where == where)
	if pool.is_empty():
		return {}
	var ev: Dictionary = pool[int(_roll(rng) * pool.size()) % pool.size()]
	s.seen[ev.id] = d
	return ev


## Обрати варіант: кидок наслідку за шансами. Повертає {"text", "fx"}.
static func choose(ev: Dictionary, opt_i: int, rng: RandomNumberGenerator = null) -> Dictionary:
	var opt: Dictionary = ev.opts[clampi(opt_i, 0, ev.opts.size() - 1)]
	var r := _roll(rng)
	var out: Dictionary = opt.out[opt.out.size() - 1]
	for o in opt.out:
		r -= float(o.p)
		if r <= 0.0:
			out = o
			break
	return {"text": out.text, "fx": out.fx}


static func _rr(v, rng: RandomNumberGenerator) -> int:
	if v is Array:
		var a := int(v[0])
		var b := int(v[1])
		return a + int(_roll(rng) * (b - a + 1)) if b > a else a
	return int(v)


## Застосувати наслідок до героя (крім бою — бій запускає світ). Повертає рядки підсумку.
static func apply(fx: Dictionary, rng: RandomNumberGenerator = null) -> Array:
	var p := Player.ensure(Game.state)
	var lines: Array = []
	if fx.has("gold"):
		var g := _rr(fx.gold, rng)
		g = maxi(g, -int(p.gold))
		p.gold = int(p.gold) + g
		if g != 0:
			lines.append("%+d 💰" % g)
	if fx.has("goldPct"):
		var g := int(absf(float(fx.goldPct)) * int(p.gold))
		p.gold = int(p.gold) - g
		lines.append("−%d 💰" % g)
	if fx.has("xp"):
		var x := _rr(fx.xp, rng) * maxi(1, int(p.lvl) / 4 + 1)
		var ups := Player.add_xp(p, x)
		lines.append("+%d досвіду%s" % [x, " · ✨ новий рівень!" if ups > 0 else ""])
	if fx.has("hp"):
		var h := _rr(fx.hp, rng) * (1.0 + int(p.lvl) * 0.08)
		p.hp = clampf(float(p.hp) + h, 1.0, Player.max_hp(p))
		lines.append("%+d ❤" % int(h))
	if fx.get("heal", false):
		p.hp = Player.max_hp(p)
		p.mp = Player.max_mp(p)
		lines.append("❤ ✦ повністю відновлено")
	if fx.has("fame"):
		var g := Guild.state()
		g.points = maxi(0, int(g.points) + int(fx.fame))
		lines.append("%+d ⭐ слави (очки гільдії)" % int(fx.fame))
	if fx.has("days"):
		Game.state.minutes = float(Game.state.minutes) + float(fx.days) * 1440.0
		lines.append("минуло %s дн." % str(fx.days))
	if fx.has("item"):
		var I: Dictionary = ITEMS.get(fx.item, {})
		var n := maxi(1, _rr(fx.get("n", 1), rng))
		if I.has("potions"):
			p.potions = int(p.potions) + int(I.potions) * n
			lines.append("+%d 🧪" % (int(I.potions) * n))
		elif I.has("ethers"):
			p.ethers = int(p.ethers) + n
			lines.append("+%d ефір" % n)
		elif I.has("gold"):
			p.gold = int(p.gold) + int(I.gold) * n
			lines.append("%s ×%d — продано за %d 💰" % [I.name, n, int(I.gold) * n])
		elif I.has("herb"):
			if not (p.get("herbs") is Dictionary):
				p.herbs = {}
			p.herbs[I.herb] = int(p.herbs.get(I.herb, 0)) + n
			lines.append("+%d 🌿 цілющої трави" % n)
		elif I.has("food"):
			p.hp = minf(Player.max_hp(p), float(p.hp) + Player.max_hp(p) * float(I.food) * n)
			lines.append("%s ×%d — з'їдено, ❤ відновлено" % [I.name, n])
		else:
			lines.append("%s ×%d. Корисність сумнівна." % [I.get("name", "щось"), n])
	return lines


## Інформація для бою-засідки (одноповерхова арена з ватажком поруч зі входом).
static func ambush_info(f: Dictionary, wd: WorldData) -> Dictionary:
	var p := Player.ensure(Game.state)
	var F: Array = f.get("arena", FIGHTS.get(str(f.get("key", "bandit")), FIGHTS.bandit))
	var elite: bool = bool(f.get("elite", false))
	return {"name": "Засідка: %s" % str(f.get("name", "вороги")), "kind": "dungeon", "dtype": F[0], "level": maxi(1, int(p.lvl) - 1 + int(f.get("add", 0))),
		"floors": 1, "id": -1, "seed": wd.world_seed * 31 + today() * 977 + randi() % 1000,
		"ambush": {"n": maxi(1, int(f.get("n", 1))), "boss_kind": F[1], "boss_name": str(f.get("name", DungeonGen.MONSTERS[F[1]].name)),
			"boss_hp": 5.0 if elite else 2.5, "boss_size": 1.6 if elite else 1.3}}
