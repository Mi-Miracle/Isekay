## Спорядження: зброя, броня, прикраси з рідкістю й кумедними назвами.
class_name Items
extends RefCounted

const SLOTS := ["weapon", "helmet", "armor", "gloves", "boots", "cloak", "trinket", "amulet"]
const SLOT_NAME := {"weapon": "Зброя", "helmet": "Шолом", "armor": "Броня", "gloves": "Рукавиці", "boots": "Чоботи", "cloak": "Плащ", "trinket": "Перстень", "amulet": "Амулет"}
const SLOT_ICON := {"weapon": "⚔️", "helmet": "🪖", "armor": "🛡️", "gloves": "🧤", "boots": "👢", "cloak": "🧣", "trinket": "💍", "amulet": "📿"}
const HELMETS := ["Шолом", "Капюшон", "Шапка-вушанка", "Корона (картонна)", "Бацинет", "Тюрбан мудреця"]
const GLOVES := ["Рукавиці", "Латні рукавиці", "Мітенки", "Кастети-рукавички", "Рукавички чарівника"]
const BOOTS := ["Чоботи", "Черевики", "Сандалі", "Чоботи-скороходи", "Капці (бойові)"]
const CLOAKS := ["Плащ", "Мантія-накидка", "Пелерина", "Плащ-невидимка (майже)", "Ковдра героя"]
const AMULETS := ["Амулет", "Кулон", "Оберіг", "Намисто", "Медальйон"]
const RARITY := [
	{"name": "Звичайна", "col": Color("#e6e1ea"), "mul": 1.0},
	{"name": "Незвичайна", "col": Color("#7dff9a"), "mul": 1.25},
	{"name": "Рідкісна", "col": Color("#6ab8ff"), "mul": 1.55},
	{"name": "Епічна", "col": Color("#c98cff"), "mul": 1.95},
	{"name": "Легендарна", "col": Color("#ffd36e"), "mul": 2.5},
]
const WEAPONS := {
	"swordsman": ["Меч", "Клинок", "Палаш"], "archer": ["Лук", "Довгий лук", "Арбалет"], "mage": ["Посох", "Жезл", "Гримуар"],
	"priest": ["Булава", "Святий молот", "Скіпетр"], "rogue": ["Кинджал", "Стилет", "Парні ножі"], "berserker": ["Сокира", "Двосічна сокира", "Молот"],
	"paladin": ["Молот і щит", "Святий меч", "Ранкова зоря"], "monk": ["Кастети", "Бойові обмотки", "Посох-шест"], "lancer": ["Спис", "Алебарда", "Глефа"],
	"bard": ["Лютня", "Флейта", "Бандура"], "samurai": ["Катана", "Вакідзасі", "Нодаті"], "summoner": ["Сфера призиву", "Книга печаток", "Свисток духів"],
	"warlock": ["Гримуар проклять", "Жезл безодні", "Череп-ліхтар"], "ninja": ["Кунай", "Ніндзято", "Ланцюг-серп"], "battle_chef": ["Пательня", "Тесак", "Вок"],
	"alchemist": ["Набір колб", "Перегінний куб", "Бомбомет"], "jack": ["Швейцарський ніж", "Що попало під руку", "Позичений меч"],
}
const ARMORS := ["Кольчуга", "Шкіряна куртка", "Мантія", "Нагрудник", "Плащ мандрівника", "Лати"]
const TRINKETS := ["Амулет", "Перстень", "Талісман", "Сережка", "Брошка", "Оберіг"]
const ADJ := [
	["Іржавий", "Старенький", "Позичений", "Трохи погризений"],
	["Надійний", "Гострий", "Міцний", "Добротний"],
	["Сяйливий", "Ельфійський", "Гномський", "Зачарований"],
	["Драконячий", "Демонічний", "Зоряний", "Громовий"],
	["Божественний", "Легендарний", "Абсолютний", "Неймовірно пафосний"],
]
const SUFFIX := ["", "", "Люмі", "Вантажівки-куна", "Нескінченного Пиріжка", "Хоробрості", "Сміливця", "Сонного Дракона", "Першого Ісекайника", "Королівської Бухгалтерії"]


static func roll_rarity(luck: float = 0.0) -> int:
	var r := randf() - luck
	if r < 0.02:
		return 4
	if r < 0.09:
		return 3
	if r < 0.25:
		return 2
	if r < 0.55:
		return 1
	return 0


## Нова річ для класу cls рівня lvl. slot — "" для випадкового.
static func make(cls: String, lvl: int, rarity: int = -1, slot: String = "") -> Dictionary:
	if rarity < 0:
		rarity = roll_rarity()
	if slot == "":
		slot = SLOTS.pick_random()
	var mul: float = RARITY[rarity].mul
	var base := 1.0 + (lvl - 1) * 0.14
	var it := {"slot": slot, "rarity": rarity, "lvl": lvl, "atk": 0.0, "def": 0.0, "hp": 0.0, "mp": 0.0, "crit": 0.0, "speed": 0.0}
	var noun := ""
	match slot:
		"weapon":
			it.atk = roundf((4.0 + lvl * 1.6) * mul * randf_range(0.9, 1.1))
			if rarity >= 2:
				it.crit = snappedf(0.02 * rarity * randf_range(0.8, 1.2), 0.01)
			noun = WEAPONS.get(cls, WEAPONS.swordsman).pick_random()
		"armor":
			it.def = roundf((2.0 + lvl * 0.8) * mul * randf_range(0.9, 1.1))
			it.hp = roundf((10 + lvl * 4) * mul * randf_range(0.8, 1.1)) if rarity >= 1 else 0.0
			noun = ARMORS.pick_random()
		"helmet":
			it.def = roundf((1.0 + lvl * 0.45) * mul * randf_range(0.9, 1.1))
			it.hp = roundf((8 + lvl * 3) * mul * randf_range(0.8, 1.1))
			noun = HELMETS.pick_random()
		"gloves":
			it.atk = roundf((1.5 + lvl * 0.7) * mul * randf_range(0.9, 1.1))
			if rarity >= 1:
				it.crit = snappedf(0.015 * (rarity + 1) * randf_range(0.8, 1.2), 0.01)
			noun = GLOVES.pick_random()
		"boots":
			it.def = roundf((1.0 + lvl * 0.35) * mul * randf_range(0.9, 1.1))
			it.speed = snappedf(0.02 + 0.015 * rarity, 0.01)
			noun = BOOTS.pick_random()
		"cloak":
			it.def = roundf((1.0 + lvl * 0.4) * mul * randf_range(0.9, 1.1))
			it.mp = roundf((6 + lvl * 2.0) * mul * randf_range(0.8, 1.1))
			noun = CLOAKS.pick_random()
		"amulet":
			it.hp = roundf((6 + lvl * 2.5) * mul * randf_range(0.8, 1.1))
			it.mp = roundf((5 + lvl * 1.5) * mul * randf_range(0.8, 1.1))
			if rarity >= 2:
				it.crit = snappedf(0.02 * rarity * 0.6, 0.01)
			noun = AMULETS.pick_random()
		_:
			it.mp = roundf((8 + lvl * 2.5) * mul * randf_range(0.8, 1.1))
			match randi() % 3:
				0:
					it.hp = roundf((12 + lvl * 4) * mul)
				1:
					it.crit = snappedf(0.03 * mul, 0.01)
				_:
					it.atk = roundf((2 + lvl * 0.7) * mul)
			noun = TRINKETS.pick_random()
	var adj: String = ADJ[rarity].pick_random()
	var suf: String = SUFFIX.pick_random() if rarity >= 2 else ""
	it.name = "%s %s%s" % [adj, noun, (" " + suf) if suf != "" else ""]
	it.price = int((15 + lvl * 9) * mul * mul * base)
	return it


static func power(it) -> float:
	if it == null or not (it is Dictionary):
		return 0.0
	return float(it.get("atk", 0.0)) * 2.0 + float(it.get("def", 0.0)) * 2.2 + float(it.get("hp", 0.0)) * 0.25 + float(it.get("mp", 0.0)) * 0.15 + float(it.get("crit", 0.0)) * 300.0 + float(it.get("speed", 0.0)) * 400.0


static func describe(it: Dictionary) -> String:
	var parts: Array = []
	if float(it.atk) > 0:
		parts.append("атака +%d" % int(it.atk))
	if float(it.def) > 0:
		parts.append("захист +%d" % int(it.def))
	if float(it.hp) > 0:
		parts.append("❤ +%d" % int(it.hp))
	if float(it.mp) > 0:
		parts.append("✦ +%d" % int(it.mp))
	if float(it.crit) > 0:
		parts.append("крит +%d%%" % int(round(float(it.crit) * 100)))
	if float(it.get("speed", 0.0)) > 0:
		parts.append("швидкість +%d%%" % int(round(float(it.speed) * 100)))
	return "%s · рів. %d · %s" % [RARITY[int(it.rarity)].name, int(it.lvl), ", ".join(PackedStringArray(parts))]
