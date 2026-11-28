## Унікальні артефакти (зі старої версії): по одному в найглибших підземеллях світу.
## Здобуваються за перемогу над босом цього підземелля. Носиться один — слот «Артефакт» (p.artifact).
## Колекція: p.artifacts = [id, ...]. Ефекти додаються в Origin.mul за ключами.
class_name Artifacts
extends RefCounted

const LIST := [
	{"id": "art_compass", "name": "Компас Безкінечних Доріг", "icon": "🧭", "fx": {"travel": 0.3}, "desc": "Подорожі на 30% швидші. Стрілка вказує туди, де тебе ще не було."},
	{"id": "art_teacup", "name": "Чашка Безкінечного Чаю", "icon": "🍵", "fx": {"regen": 0.012}, "desc": "У бою щосекунди +1,2% ❤. Чай завжди гарячий."},
	{"id": "art_coin", "name": "Монета Двох Сторін", "icon": "🪙", "fx": {"loot": 0.35, "crit": 0.05}, "desc": "+35% до здобичі й +5% криту. Завжди падає ребром, коли треба."},
	{"id": "art_dragoneye", "name": "Око Дракона", "icon": "👁️", "fx": {"crit": 0.12}, "desc": "Бачиш усі слабкості ворогів: +12% криту."},
	{"id": "art_crown", "name": "Корона Першого Короля", "icon": "👑", "fx": {"lord": 25.0}, "desc": "Усі лорди ставляться до тебе на +25 краще."},
	{"id": "art_hourglass", "name": "Пісочний годинник Хроноса", "icon": "⏳", "fx": {"cdr": 0.2}, "desc": "Навички перезаряджаються на 20% швидше."},
	{"id": "art_feather", "name": "Вічне перо фенікса", "icon": "🪶", "fx": {"revive": 0.4}, "desc": "Раз за похід воскрешає з 40% ❤."},
	{"id": "art_ring", "name": "Перстень Сімох Морів", "icon": "🌊", "fx": {"travel": 0.15, "gold": 0.15}, "desc": "+15% до швидкості подорожей і +15% золота. Пахне морем і піратськими скарбами."},
	{"id": "art_lute", "name": "Струна Першої Пісні", "icon": "🎵", "fx": {"xp": 0.25}, "desc": "+25% досвіду. Світ трохи наспівує."},
	{"id": "art_mask", "name": "Маска Тисячі Облич", "icon": "🎭", "fx": {"stealth": 0.5, "dodge": 0.08}, "desc": "Пригоди й засідки на дорогах на 50% рідші, +8% ухилення."},
	{"id": "art_seed", "name": "Насінина Світового Дерева", "icon": "🌱", "fx": {"harvest": 1.0}, "desc": "Руда в шахтах і врожай удвічі щедріші."},
	{"id": "art_horn", "name": "Ріг Останнього Героя", "icon": "📯", "fx": {"allies": 0.4}, "desc": "Легенди із загону й пітомець сильніші на 40%."},
	{"id": "art_mirror", "name": "Дзеркало Правди", "icon": "🪞", "fx": {"gold": 0.4}, "desc": "+40% золота. Показує, хто бреше про ціни."},
	{"id": "art_sock", "name": "Ліва шкарпетка богині", "icon": "🧦", "fx": {"hp": 0.08, "mp": 0.08, "atk": 0.08, "def": 0.08, "crit": 0.02, "xp": 0.08}, "desc": "+8% до всього. Пахне лавандою. Люмі шукає її вже 300 років."},
]


static func get_art(id: String) -> Dictionary:
	for a in LIST:
		if a.id == id:
			return a
	return {}


static func owned(p: Dictionary) -> Array:
	if not (p.get("artifacts") is Array):
		p.artifacts = []
	return p.artifacts


static func worn(p: Dictionary) -> Dictionary:
	return get_art(str(p.get("artifact", "")))


static func wear(p: Dictionary, id: String) -> void:
	p.artifact = id if id in owned(p) else ""


static func give(p: Dictionary, id: String) -> bool:
	if id == "" or id in owned(p):
		return false
	owned(p).append(id)
	if str(p.get("artifact", "")) == "":
		p.artifact = id
	return true


static func bonus(p: Dictionary, key: String) -> float:
	return float(worn(p).get("fx", {}).get(key, 0.0))


## Де лежить артефакт: детерміновано від зерна світу — найглибші підземелля (без фіналу), кожен другий-третій.
static func map_for(wd) -> Dictionary:
	var deep: Array = wd.dungeons.filter(func(d): return not d.get("final", false))
	deep.sort_custom(func(a, b): return int(a.level) > int(b.level) or (int(a.level) == int(b.level) and int(a.id) < int(b.id)))
	var rng := RandomNumberGenerator.new()
	rng.seed = int(wd.world_seed) * 7 + 404
	var out := {}
	for i in LIST.size():
		var k := i * 2 + rng.randi_range(0, 1)
		if k < deep.size():
			out[int(deep[k].id)] = LIST[i].id
	return out


static var _map_seed := -1
static var _map := {}


## Артефакт підземелля з id (або "").
static func in_dungeon(wd, did: int) -> String:
	if int(wd.world_seed) != _map_seed:
		_map = map_for(wd)
		_map_seed = int(wd.world_seed)
	return str(_map.get(did, ""))
