## Торгові каравани героя: вклади золото на ринку, обери місто — і через кілька днів караван повернеться з прибутком.
## Стан: Game.state.caravans = {"list": [{from, to, gold, day0, days, risk}], "done": n, "profit": n}.
## Ризик пограбування менший, якщо є власне військо (охорона) і якщо дорога не через воюючі землі.
class_name Caravans
extends RefCounted

const MAX_ACTIVE := 3
const INVEST := [200, 500, 1000, 2500]
const GOODS := ["спеції", "шовк", "гномське пиво", "ельфійські шишки", "сушені гриби", "капібарячі іграшки", "мечі зі знижкою", "зілля від гикавки"]


static func st() -> Dictionary:
	if not (Game.state.get("caravans") is Dictionary):
		Game.state.caravans = {"list": [], "done": 0, "profit": 0}
	return Game.state.caravans


## Куди можна відправити: найбільші міста (місто/столиця/порт) за 8–60 клітинок, до 6 варіантів.
static func destinations(wd: WorldData, from: Dictionary) -> Array:
	var out: Array = []
	for b in wd.baronies:
		if int(b.id) == int(from.id) or not (b.type in ["city", "capital", "port", "town"]):
			continue
		var d := Vector2(b.x - from.x, b.y - from.y).length()
		if d < 8 or d > 60:
			continue
		out.append({"b": b, "dist": d})
	out.sort_custom(func(a, c): return float(a.dist) < float(c.dist))
	return out.slice(0, 6)


static func days_for(dist: float) -> int:
	return maxi(2, int(ceil(dist / 9.0)))


## Прибуток: 15% + 0,8% за клітинку (до 60%), більше для столиць.
static func margin(dist: float, to: Dictionary) -> float:
	return minf(0.6, 0.15 + dist * 0.008) + (0.08 if to.type == "capital" else 0.0)


static func risk(pol: Politics, from: Dictionary, to: Dictionary) -> float:
	var r := 0.12
	if pol.at_war(int(from.owner), int(to.owner)):
		r += 0.2
	if int(to.get("occ", -1)) >= 0 and pol.is_demon(int(to.occ)):
		r += 0.25
	r -= minf(0.06, Army.power(Player.ensure(Game.state)) / 1500.0)
	return clampf(r, 0.03, 0.6)


static func send(pol: Politics, from: Dictionary, to: Dictionary, gold: int, day: int) -> String:
	var p := Player.ensure(Game.state)
	if st().list.size() >= MAX_ACTIVE:
		return "Усі верблюди зайняті: максимум %d каравани." % MAX_ACTIVE
	if int(p.gold) < gold:
		return "Треба %d 💰 на товар." % gold
	p.gold = int(p.gold) - gold
	var d := Vector2(to.x - from.x, to.y - from.y).length()
	st().list.append({"from": int(from.id), "to": int(to.id), "gold": gold, "day0": day, "days": days_for(d) * 2,
		"margin": margin(d, to), "risk": risk(pol, from, to), "goods": GOODS[randi() % GOODS.size()]})
	return ""


## Щоденна перевірка: повернулись чи ні. Повертає повідомлення.
static func daily(wd: WorldData, day: int, rng: RandomNumberGenerator = null) -> Array:
	var msgs: Array = []
	var p := Player.ensure(Game.state)
	if rng == null:
		rng = RandomNumberGenerator.new()
		rng.randomize()
	var keep: Array = []
	for c in st().list:
		if day < int(c.day0) + int(c.days):
			keep.append(c)
			continue
		var to: Dictionary = wd.baronies[int(c.to)]
		if rng.randf() < float(c.risk):
			var back := int(int(c.gold) * rng.randf_range(0.0, 0.3))
			p.gold = int(p.gold) + back
			msgs.append("🐫💥 Караван до %s пограбували! Врятовано лише %d 💰 і одного дуже наляканого верблюда." % [to.name, back])
		else:
			var g := int(int(c.gold) * (1.0 + float(c.margin) * rng.randf_range(0.8, 1.2)) * (1.0 + Origin.mul(p, "gold") * 0.5))
			p.gold = int(p.gold) + g
			st().done = int(st().done) + 1
			st().profit = int(st().profit) + g - int(c.gold)
			msgs.append("🐫 Караван повернувся з %s! Продали %s: %d 💰 (прибуток +%d)." % [to.name, c.goods, g, g - int(c.gold)])
	st().list = keep
	return msgs


## Позиція каравану на мапі (у клітинках): туди й назад.
static func pos(wd: WorldData, c: Dictionary, day_f: float) -> Vector2:
	var a: Dictionary = wd.baronies[int(c.from)]
	var b: Dictionary = wd.baronies[int(c.to)]
	var t := clampf((day_f - float(c.day0)) / maxf(1.0, float(c.days)), 0.0, 1.0)
	var k := t * 2.0 if t < 0.5 else (1.0 - t) * 2.0
	return Vector2(a.x + 0.5, a.y + 0.5).lerp(Vector2(b.x + 0.5, b.y + 0.5), k)
