## Погода Дивосвіту: щодня одна на весь світ, залежить від пори року.
## Стан: Game.state.weather = {kind, day}. Бонуси йдуть через Origin.mul (travel, dodge, crit, atk, def, speed, xp).
class_name Weather
extends RefCounted

const KINDS := {
	"clear": {"name": "Ясно", "icon": "☀️", "fx": {}, "line": ""},
	"bloom": {"name": "Цвітіння сакури", "icon": "🌸", "fx": {"travel": 0.05, "xp": 0.1}, "line": "🌸 Цвіте сакура! Усі закохані, досвід +10%. Люмі пише вірші."},
	"rain": {"name": "Дощ", "icon": "🌧️", "fx": {"travel": -0.1, "dodge": 0.03}, "line": "🌧️ Дощ. Дороги розмокли (−10% швидкості), зате вороги ковзаються (+3% ухилення)."},
	"storm": {"name": "Гроза", "icon": "⛈️", "fx": {"travel": -0.15, "crit": 0.05}, "line": "⛈️ Гроза! Адреналін: +5% криту. Не стій під деревом із мечем угору."},
	"fog": {"name": "Туман", "icon": "🌫️", "fx": {"travel": -0.05, "dodge": 0.06}, "sight": 0.6, "line": "🌫️ Густий туман: видно менше, але й тебе не видно (+6% ухилення)."},
	"heat": {"name": "Спека", "icon": "🔥", "fx": {"travel": -0.05, "atk": 0.05, "mp": -0.05}, "line": "🔥 Спека! Усі злі (+5% атаки), мана випаровується (−5%)."},
	"snow": {"name": "Сніг", "icon": "🌨️", "fx": {"travel": -0.2, "def": 0.05}, "line": "🌨️ Сніг! Повільніше йти (−20%), зате теплий одяг (+5% захисту)."},
	"blizzard": {"name": "Хуртовина", "icon": "❄️", "fx": {"travel": -0.35, "def": 0.08, "speed": -0.08}, "sight": 0.7, "line": "❄️ Хуртовина! Подорожі −35%, руки мерзнуть. Люмі позичила тобі шарф. Уявний."},
}

## Ваги погоди для весни, літа, осені й зими.
const SEASON_W := [
	{"clear": 40, "rain": 26, "fog": 10, "storm": 10, "bloom": 14},
	{"clear": 55, "heat": 18, "storm": 15, "rain": 12},
	{"clear": 35, "rain": 30, "fog": 25, "storm": 10},
	{"clear": 30, "snow": 45, "blizzard": 17, "fog": 8},
]


static func st() -> Dictionary:
	if Game.state.is_empty():
		return {"kind": "clear", "day": -1}
	if not (Game.state.get("weather") is Dictionary):
		Game.state.weather = {"kind": "clear", "day": -1}
	return Game.state.weather


static func current() -> Dictionary:
	return KINDS.get(str(st().kind), KINDS.clear)


static func kind() -> String:
	return str(st().kind)


## Новий день: погода тримається з шансом 45%, інакше — нова за порою року. Повертає текст, якщо погода змінилась.
static func roll(day: int, rng: RandomNumberGenerator = null) -> String:
	var s := st()
	if int(s.day) == day:
		return ""
	if rng == null:
		rng = RandomNumberGenerator.new()
		rng.seed = int(Game.state.get("seed", 1)) * 977 + day * 131
	var season := Game.season_of_day(day)
	var W: Dictionary = SEASON_W[season]
	var old := str(s.kind)
	var k := old
	if not W.has(old) or rng.randf() > 0.45 or int(s.day) < 0:
		var total := 0
		for w in W.values():
			total += int(w)
		var r := rng.randi_range(1, total)
		for key in W:
			r -= int(W[key])
			if r <= 0:
				k = key
				break
	s.kind = k
	s.day = day
	if k != old:
		return str(KINDS[k].line)
	return ""


static func bonus(_p: Dictionary, key: String) -> float:
	if Game.state.is_empty() or not (Game.state.get("weather") is Dictionary):
		return 0.0
	return float(current().fx.get(key, 0.0))


## Множник радіуса огляду на мапі.
static func sight() -> float:
	return float(current().get("sight", 1.0))


static func tag() -> String:
	var W := current()
	return " · %s %s" % [W.icon, W.name]
