## Складність: зберігається в сейві (Game.state.difficulty), обирається при створенні героя й у налаштуваннях.
class_name Difficulty
extends RefCounted

const LEVELS := {
	"story": {"name": "Казка", "icon": "🌸", "hp": 0.6, "atk": 0.55, "reward": 0.9, "desc": "Для сюжету й стріму з чатом: вороги м'якенькі, Люмі вболіває."},
	"normal": {"name": "Звичайна", "icon": "⚔️", "hp": 1.0, "atk": 1.0, "reward": 1.0, "desc": "Як задумано. Ворогам теж треба жити."},
	"hard": {"name": "Важка", "icon": "🔥", "hp": 1.45, "atk": 1.35, "reward": 1.25, "desc": "Вороги злі, але й нагороди більші на 25%."},
	"nightmare": {"name": "Жах", "icon": "💀", "hp": 2.1, "atk": 1.8, "reward": 1.6, "desc": "Для мазохістів і героїв аніме 3-го сезону. +60% нагород."},
}
const ORDER := ["story", "normal", "hard", "nightmare"]


static func key() -> String:
	var k := str(Game.state.get("difficulty", Game.settings.get("difficulty", "normal"))) if not Game.state.is_empty() else str(Game.settings.get("difficulty", "normal"))
	return k if LEVELS.has(k) else "normal"


static func cur() -> Dictionary:
	return LEVELS[key()]


static func set_key(k: String) -> void:
	if not LEVELS.has(k):
		return
	Game.settings.difficulty = k
	if not Game.state.is_empty():
		Game.state.difficulty = k


static func mul(what: String) -> float:
	return float(cur().get(what, 1.0))
