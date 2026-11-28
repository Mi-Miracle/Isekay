## Власне військо героя (дружина) і битви з арміями на мапі.
## Стан: Game.state.army = {"troops": {id: n}, "wins": n, "losses": n, "unpaid": днів}.
## Наймають у казармі (двір/ратуша міст і фортець), щодня платять утримання.
## На мапі біля ворожої армії (демони, орди або держава, що воює з твоїм сюзереном) — «E — атакувати».
class_name Army
extends RefCounted

const TROOPS := {
	"militia": {"name": "Ополченці", "icon": "🧑‍🌾", "cost": 20, "upkeep": 0.4, "power": 1.0, "lvl": 1, "desc": "Вила, ентузіазм і мамині пиріжки."},
	"archers": {"name": "Лучники", "icon": "🏹", "cost": 40, "upkeep": 0.7, "power": 1.7, "lvl": 5, "desc": "Стріляють здалеку. Інколи навіть у ворогів."},
	"knights": {"name": "Лицарі", "icon": "🐎", "cost": 110, "upkeep": 1.6, "power": 4.2, "lvl": 15, "desc": "Блискучі обладунки, гучні промови, коні з характером."},
	"mages": {"name": "Бойові маги", "icon": "🧙", "cost": 160, "upkeep": 2.2, "power": 6.0, "lvl": 25, "desc": "Вогняні кулі оптом. Чай — за окрему плату."},
	"griffins": {"name": "Грифонні вершники", "icon": "🦅", "cost": 420, "upkeep": 5.0, "power": 15.0, "lvl": 40, "desc": "Падають з неба на голову ворогам. Буквально."},
}


static func st() -> Dictionary:
	if not (Game.state.get("army") is Dictionary):
		Game.state.army = {"troops": {}, "wins": 0, "losses": 0, "unpaid": 0}
	return Game.state.army


static func count() -> int:
	var n := 0
	for k in st().troops:
		n += int(st().troops[k])
	return n


## Скільки воїнів можна тримати: 20 + 3 за рівень, +40 лицарю держави, +30 за кожен щабель власних земель.
static func cap(p: Dictionary) -> int:
	var c := 20 + 3 * int(p.lvl)
	if not Lords.st().knight.is_empty():
		c += 40
	var L := Estate.land()
	if not L.is_empty():
		c += 30 * (int(L.get("tier", 0)) + 1)
	return c


static func power(p: Dictionary) -> float:
	var s := 0.0
	for k in st().troops:
		s += float(TROOPS[k].power) * int(st().troops[k])
	return s * (1.0 + Origin.mul(p, "allies"))


static func hero_power(p: Dictionary) -> float:
	return 5.0 + 2.0 * int(p.lvl) + Player.atk(p) * 0.15


static func upkeep() -> int:
	var s := 0.0
	for k in st().troops:
		s += float(TROOPS[k].upkeep) * int(st().troops[k])
	return int(ceil(s))


static func hire(p: Dictionary, id: String, n: int) -> String:
	var T: Dictionary = TROOPS.get(id, {})
	if T.is_empty():
		return "Таких воїнів немає."
	if int(p.lvl) < int(T.lvl):
		return "%s служать лише героям від %d рівня." % [T.name, int(T.lvl)]
	n = mini(n, cap(p) - count())
	if n <= 0:
		return "Казарма повна: %d/%d. Більше війська — з рівнем, лицарством або власними землями." % [count(), cap(p)]
	var c := int(T.cost) * n
	if int(p.gold) < c:
		return "Бракує золота: %d 💰 за %d." % [c, n]
	p.gold = int(p.gold) - c
	st().troops[id] = int(st().troops.get(id, 0)) + n
	return ""


static func dismiss(id: String, n: int) -> void:
	var t: Dictionary = st().troops
	t[id] = maxi(0, int(t.get(id, 0)) - n)
	if int(t[id]) == 0:
		t.erase(id)


## Щоденне утримання. Повертає повідомлення, якщо хтось дезертирував.
static func daily(p: Dictionary) -> String:
	var u := upkeep()
	if u <= 0:
		return ""
	if int(p.gold) >= u:
		p.gold = int(p.gold) - u
		st().unpaid = 0
		return ""
	st().unpaid = int(st().unpaid) + 1
	var gone := 0
	for k in st().troops.keys():
		var lost := int(ceil(int(st().troops[k]) * 0.15))
		gone += lost
		dismiss(k, lost)
	return "💸 Нема чим платити війську! %d воїнів пішли додому. Ополченці забрали вила." % gone


# ---------------------------------------------------------------- битви на мапі

## Ворожа армія для героя: демони/орди завжди, а ще армії тих, хто воює з державою, де герой — лицар.
static func hostile(pol: Politics, a: Dictionary) -> bool:
	if pol.is_demon(int(a.realm)) or bool(a.get("horde", false)):
		return true
	for r in Lords.st().knight:
		if pol.at_war(int(r), int(a.realm)):
			return true
	return false


static func enemy_power(pol: Politics, a: Dictionary) -> float:
	return float(a.size) * (0.1 if pol.is_demon(int(a.realm)) else 0.08)


static func odds(p: Dictionary, pol: Politics, a: Dictionary) -> float:
	return (power(p) + hero_power(p)) / maxf(1.0, enemy_power(pol, a))


## Атака на армію. Повертає {win, killed, lost, gold, fame, destroyed, text}.
static func attack(p: Dictionary, pol: Politics, a: Dictionary, rng: RandomNumberGenerator = null) -> Dictionary:
	if rng == null:
		rng = RandomNumberGenerator.new()
		rng.randomize()
	var r := odds(p, pol, a) * rng.randf_range(0.75, 1.25)
	var win := r > 1.0
	var before := float(a.size)
	var frac := clampf(0.35 + 0.15 * minf(r, 2.0), 0.35, 0.7) if win else clampf(0.08 * r, 0.02, 0.1)
	var killed := int(before * frac)
	a.size = roundf(before - killed)
	a.morale = maxf(0.3, float(a.get("morale", 1.0)) - (0.3 if win else 0.05))
	var loss_frac := clampf(0.25 / maxf(r, 0.5), 0.05, 0.3) if win else rng.randf_range(0.4, 0.6)
	var lost := 0
	for k in st().troops.keys():
		var l := int(round(int(st().troops[k]) * loss_frac))
		lost += l
		dismiss(k, l)
	var destroyed := float(a.size) < 150.0
	if destroyed:
		if not pol.is_demon(int(a.realm)):
			pol.st(int(a.realm)).manpower += float(a.size)
		pol.P.armies.erase(a)
	var gold := 0
	var fame := 0
	var who: String = Game.state.get("hero_name", "Герой")
	var day := int(pol.P.day)
	if win:
		st().wins = int(st().wins) + 1
		gold = int(killed * (0.6 if pol.is_demon(int(a.realm)) else 0.4) * (1.0 + Origin.mul(p, "gold")))
		fame = 5 + killed / 60
		p.gold = int(p.gold) + gold
		var g := Guild.state()
		g.points = int(g.points) + fame
		pol.log_event(day, "🗡️ %s %s розбив(ла) «%s»: %s ворогів полягло%s." % [who, "з дружиною" if count() > 0 else "сам(а) один(одна)", str(a.name), Politics.fmt(killed), " — армію знищено!" if destroyed else ""], "battle", [int(a.realm)])
	else:
		st().losses = int(st().losses) + 1
		p.hp = maxf(1.0, float(p.hp) * 0.5)
		pol.log_event(day, "😵 %s атакував(ла) «%s» і ледве втік(ла). Барди вже складають сумну пісню." % [who, str(a.name)], "battle", [int(a.realm)])
	return {"win": win, "killed": killed, "lost": lost, "gold": gold, "fame": fame, "destroyed": destroyed}
