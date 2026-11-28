## Класи героя: базові характеристики, стиль звичайної атаки й три навички (Q, F, V).
## Типи навичок виконує dungeon.gd (_cast_skill).
class_name Classes
extends RefCounted

const KEYS := ["Q", "F", "V"]

const CLASSES := {
	"swordsman": {
		"name": "Мечник", "icon": "⚔️", "desc": "Класика жанру. Міцний, простий, як табуретка.",
		"hp": 110, "hp_lvl": 19, "mp": 35, "mp_lvl": 5, "atk": 13, "atk_lvl": 3.3, "def": 4, "def_lvl": 1.5, "crit": 0.1, "speed": 1.0,
		"basic": {"type": "arc", "reach": 58, "arc": 1.05, "power": 1.0, "cd": 0.36},
		"skills": [
			{"id": "power_strike", "name": "Сильний удар", "lvl": 1, "mp": 8, "cd": 2.0, "type": "arc", "reach": 70, "arc": 1.3, "power": 2.3, "knock": 320, "desc": "Удар з усієї сили. І з усієї душі."},
			{"id": "whirl", "name": "Вихор клинків", "lvl": 4, "mp": 14, "cd": 5.0, "type": "nova", "radius": 95, "power": 1.5, "col": "#e8f0ff", "desc": "Крутишся, поки вороги не закінчаться."},
			{"id": "skysplit", "name": "Розсікання неба", "lvl": 8, "mp": 26, "cd": 8.0, "type": "projectile", "speed": 520, "power": 3.6, "pierce": 99, "r": 16, "col": "#bfe6ff", "desc": "Хвиля сталі. Назву вигукувати обов'язково."},
		],
	},
	"archer": {
		"name": "Лучник", "icon": "🏹", "desc": "Стріляє здалеку. Гобліни смердять — тому здалеку.",
		"hp": 90, "hp_lvl": 15, "mp": 40, "mp_lvl": 6, "atk": 12, "atk_lvl": 3.1, "def": 3, "def_lvl": 1.1, "crit": 0.15, "speed": 1.08,
		"basic": {"type": "projectile", "speed": 560, "power": 0.9, "cd": 0.42, "r": 5, "col": "#ffe6a8", "pierce": 0},
		"skills": [
			{"id": "triple", "name": "Потрійний постріл", "lvl": 1, "mp": 8, "cd": 1.8, "type": "fan", "count": 3, "spread": 0.35, "speed": 560, "power": 1.0, "col": "#ffe6a8", "desc": "Три стріли. Одна точно влучить."},
			{"id": "rain", "name": "Дощ стріл", "lvl": 4, "mp": 15, "cd": 6.0, "type": "aoe_at", "radius": 85, "power": 0.75, "ticks": 5, "col": "#ffd36e", "desc": "Прогноз: 100% стріл."},
			{"id": "pierce_shot", "name": "Пробивний постріл", "lvl": 8, "mp": 24, "cd": 7.0, "type": "projectile", "speed": 760, "power": 4.0, "pierce": 99, "r": 9, "col": "#fff2c2", "desc": "Ігнорує броню. І здоровий глузд."},
		],
	},
	"mage": {
		"name": "Маг", "icon": "🔥", "desc": "Скляна гармата. Здебільшого скляна.",
		"hp": 80, "hp_lvl": 13, "mp": 70, "mp_lvl": 10, "atk": 14, "atk_lvl": 3.6, "def": 2, "def_lvl": 0.9, "crit": 0.08, "speed": 0.98,
		"basic": {"type": "projectile", "speed": 400, "power": 0.85, "cd": 0.5, "r": 8, "col": "#c18cff", "pierce": 0},
		"skills": [
			{"id": "fireball", "name": "Вогняна куля", "lvl": 1, "mp": 10, "cd": 1.6, "type": "projectile", "speed": 430, "power": 1.6, "explode": 65, "r": 11, "col": "#ff8a3d", "desc": "Класика. Вибухає. Завжди вибухає."},
			{"id": "frost_nova", "name": "Крижане кільце", "lvl": 4, "mp": 16, "cd": 6.0, "type": "nova", "radius": 120, "power": 1.2, "slow": 2.5, "col": "#9fe0ff", "desc": "Вороги мерзнуть і думають про своє життя."},
			{"id": "meteor", "name": "Метеор", "lvl": 8, "mp": 32, "cd": 9.0, "type": "meteor", "radius": 125, "power": 4.2, "delay": 0.8, "col": "#ff5a3d", "desc": "Звідки метеор у підземеллі? Не питай мага."},
		],
	},
	"priest": {
		"name": "Жрець", "icon": "✨", "desc": "Лікує всіх. Б'є булавою тих, кого не встиг вилікувати.",
		"hp": 100, "hp_lvl": 17, "mp": 60, "mp_lvl": 8, "atk": 11, "atk_lvl": 2.9, "def": 5, "def_lvl": 1.6, "crit": 0.07, "speed": 0.98,
		"basic": {"type": "arc", "reach": 52, "arc": 1.0, "power": 1.0, "cd": 0.42},
		"skills": [
			{"id": "heal", "name": "Святе світло", "lvl": 1, "mp": 14, "cd": 4.0, "type": "heal", "amount": 0.32, "col": "#fff6b0", "desc": "Лікує 32% здоров'я. Люмі схвалює."},
			{"id": "smite", "name": "Кара небесна", "lvl": 4, "mp": 14, "cd": 3.5, "type": "aoe_at", "radius": 70, "power": 2.2, "ticks": 1, "col": "#fff2a0", "desc": "Стовп світла туди, куди показуєш."},
			{"id": "aegis", "name": "Божественний щит", "lvl": 8, "mp": 22, "cd": 12.0, "type": "shield", "time": 3.0, "amount": 0.15, "col": "#ffe27a", "desc": "Три секунди невразливості й трохи лікування."},
		],
	},
	"rogue": {
		"name": "Розбійник", "icon": "🗡️", "desc": "Б'є часто, б'є в спину, б'є й тікає.",
		"hp": 88, "hp_lvl": 15, "mp": 40, "mp_lvl": 6, "atk": 11, "atk_lvl": 3.0, "def": 3, "def_lvl": 1.1, "crit": 0.25, "speed": 1.15,
		"basic": {"type": "arc", "reach": 48, "arc": 0.9, "power": 0.75, "cd": 0.22},
		"skills": [
			{"id": "knives", "name": "Віяло ножів", "lvl": 1, "mp": 8, "cd": 1.6, "type": "fan", "count": 5, "spread": 0.6, "speed": 600, "power": 0.8, "col": "#dfe6f0", "desc": "П'ять ножів. Хтось точно отримає."},
			{"id": "shadowstep", "name": "Крок тіні", "lvl": 4, "mp": 12, "cd": 4.0, "type": "blink", "range": 230, "power": 1.8, "col": "#8c6bff", "desc": "Був тут. Тепер там. Ворог — уже ні."},
			{"id": "poison", "name": "Отруйна хмара", "lvl": 8, "mp": 20, "cd": 9.0, "type": "cloud", "radius": 95, "power": 0.45, "time": 5.0, "col": "#7dff6a", "desc": "Пахне як болото. Діє як болото."},
		],
	},
	"berserker": {
		"name": "Берсерк", "icon": "🪓", "desc": "Лютий, волохатий, без плану. Працює.",
		"hp": 130, "hp_lvl": 22, "mp": 30, "mp_lvl": 4, "atk": 14, "atk_lvl": 3.5, "def": 4, "def_lvl": 1.3, "crit": 0.1, "speed": 1.0,
		"basic": {"type": "arc", "reach": 64, "arc": 1.25, "power": 1.2, "cd": 0.5},
		"skills": [
			{"id": "charge", "name": "Ривок люті", "lvl": 1, "mp": 8, "cd": 3.0, "type": "charge", "range": 240, "power": 1.7, "col": "#ff7a5a", "desc": "Біжиш крізь ворогів. Вони — під тобою."},
			{"id": "quake", "name": "Землетрус", "lvl": 4, "mp": 14, "cd": 5.5, "type": "nova", "radius": 110, "power": 1.9, "col": "#d9a066", "desc": "Б'єш сокирою об землю. Земля ображається."},
			{"id": "rage", "name": "Лють", "lvl": 8, "mp": 24, "cd": 15.0, "type": "buff", "time": 6.0, "atk": 0.6, "spd": 0.2, "col": "#ff4a4a", "desc": "+60% шкоди й швидкості на 6 секунд. Піна з рота — безкоштовно."},
		],
	},
}


static func info(key: String) -> Dictionary:
	return CLASSES.get(key, CLASSES.swordsman)


static func skills_open(key: String, lvl: int) -> Array:
	return info(key).skills.filter(func(s): return lvl >= int(s.lvl))
