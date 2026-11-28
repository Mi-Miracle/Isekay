## Походження героя: стать, раса й благословення богині Люмі (обираються на зустрічі з богинею).
## Бонуси — відсоткові множники, Player.max_hp/max_mp/atk/def/crit/add_xp і швидкість у підземеллі їх враховують.
class_name Origin
extends RefCounted

const RACES := {
	"human": {"name": "Людина", "icon": "🧑", "desc": "Універсальні, вперті й завжди голодні.", "bonus": {"xp": 0.10}, "txt": "+10% досвіду"},
	"elf": {"name": "Ельф", "icon": "🧝", "desc": "Гострі вуха, гострий розум, тупі жарти про вік.", "bonus": {"mp": 0.20, "atk": 0.05, "hp": -0.05}, "txt": "+20% мани, +5% шкоди, −5% здоров'я"},
	"dwarf": {"name": "Гном", "icon": "🧔", "desc": "Низькі, міцні, бородаті (навіть жінки, але це секрет).", "bonus": {"hp": 0.15, "def": 0.20, "speed": -0.05}, "txt": "+15% здоров'я, +20% захисту, −5% швидкості"},
	"orc": {"name": "Орк", "icon": "👹", "desc": "Сила — є. Манери — у розробці.", "bonus": {"atk": 0.12, "hp": 0.08, "mp": -0.10}, "txt": "+12% шкоди, +8% здоров'я, −10% мани"},
	"neko": {"name": "Неко", "icon": "🐱", "desc": "Котячі вушка, хвіст і непереборна любов до риби. Ня.", "bonus": {"speed": 0.10, "crit": 0.04}, "txt": "+10% швидкості, +4% криту"},
	"halfling": {"name": "Напіврослик", "icon": "🧒", "desc": "Маленькі, щасливі, їдять сім разів на день.", "bonus": {"crit": 0.06, "xp": 0.05, "hp": -0.05}, "txt": "+6% криту, +5% досвіду, −5% здоров'я"},
	"dragonkin": {"name": "Драконід", "icon": "🐲", "desc": "Луска, ріжки та вогняна гикавка.", "bonus": {"hp": 0.12, "atk": 0.05, "speed": -0.04}, "txt": "+12% здоров'я, +5% шкоди, −4% швидкості"},
	"darkelf": {"name": "Темний ельф", "icon": "🦇", "desc": "Похмурі, стильні, носять чорне навіть на пляжі.", "bonus": {"crit": 0.08, "mp": 0.05, "hp": -0.05}, "txt": "+8% криту, +5% мани, −5% здоров'я"},
	"god": {"name": "Бог", "icon": "✨", "desc": "Абсолютна сила! Безсмертя! Всемогутність! (Пробна версія)", "bonus": {}, "txt": "усе +∞%*", "fake": true},
	"goblin": {"name": "Гоблін", "icon": "👺", "desc": "Зелений, низенький і дуже-дуже чарівний (на думку мами).", "bonus": {"speed": 0.06, "crit": 0.05, "xp": 0.05}, "txt": "+6% швидкості, +5% криту, +5% досвіду", "hidden": true},
}

const BLESSINGS := {
	"exp": {"name": "Подвійний досвід (ну майже)", "icon": "📈", "desc": "+60% досвіду. Богиня забула, що «подвійний» — це ×2.", "bonus": {"xp": 0.60}},
	"mana": {"name": "Безмежна мана", "icon": "🔮", "desc": "+50% мани. Безмежна — це маркетинг.", "bonus": {"mp": 0.50}},
	"luck": {"name": "Удача дурня", "icon": "🍀", "desc": "+8% криту. Більше дивних щасливих випадків.", "bonus": {"crit": 0.08}},
	"vital": {"name": "Сюжетна броня", "icon": "💖", "desc": "+30% здоров'я. Головний герой не помирає в першій серії.", "bonus": {"hp": 0.30}},
	"iron": {"name": "Шкіра-панцир", "icon": "🛡️", "desc": "+40% захисту. На дотик — як табуретка.", "bonus": {"def": 0.40}},
	"fury": {"name": "Кров берсерка", "icon": "🔥", "desc": "+20% шкоди. Іноді гарчиш уві сні.", "bonus": {"atk": 0.20}},
	"wind": {"name": "Ноги-вітер", "icon": "💨", "desc": "+12% швидкості й навички перезаряджаються на 10% швидше.", "bonus": {"speed": 0.12, "cdr": 0.10}},
	"undying": {"name": "Безсмертний (майже)", "icon": "💀", "desc": "Раз за похід у підземелля виживаєш зі смертельного удару з 1 ❤. «Майже» — ключове слово.", "bonus": {}},
	"rich": {"name": "Спадок дядька-мільйонера", "icon": "💰", "desc": "Стартуєш з 1500 золота. Дядько ніколи не існував, але гроші справжні.", "bonus": {}},
	"charisma": {"name": "Харизма головного героя", "icon": "✨", "desc": "+25% золота, лорди ставляться краще (+10). Волосся завжди майорить на вітрі.", "bonus": {"gold": 0.25, "lord": 10}},
	"speedrun": {"name": "Спідранер", "icon": "⏱️", "desc": "Подорожі мапою на 40% швидші. Скіпаєш катсцени життя.", "bonus": {"travel": 0.40}},
	"royal": {"name": "Блакитна кров", "icon": "👑", "desc": "Лорди одразу прихильніші (+20). Мама казала, що ти принц(еса). Мама не брехала.", "bonus": {"lord": 20}},
	"streamer": {"name": "Стрімер", "icon": "📡", "desc": "Подарунки глядачів Twitch подвійні. Чат завжди з тобою (навіть коли не треба).", "bonus": {}},
	"loot": {"name": "Магніт лута", "icon": "🧲", "desc": "+60% шансу на речі й зілля з ворогів. Скрині самі тягнуться до тебе. Іноді — з зубами.", "bonus": {"loot": 0.60}},
	"ninja": {"name": "Шлях ніндзя", "icon": "🥷", "desc": "15% шанс ухилитися від удару й +5% криту. Ти не тікаєш — ти тактично зникаєш.", "bonus": {"dodge": 0.15, "crit": 0.05}},
	"cook": {"name": "Кулінар-бог", "icon": "🍳", "desc": "Зілля лікують на 50% більше, +2 зілля на старті. Бо смачно приготовані.", "bonus": {"potion": 0.50}},
	"appraisal": {"name": "Оцінка", "icon": "🔍", "desc": "Бачиш ціну всього: +15% золота і +3% криту по слабких місцях.", "bonus": {"gold": 0.15, "crit": 0.03}},
	"goddess_fav": {"name": "Улюблениця богині", "icon": "💌", "desc": "Люмі дзвонить частіше й надсилає подарунки. Іноді — листівки з сердечками.", "bonus": {"calls": 1.0}},
	"truck": {"name": "Вантажівка-кун на виклик", "icon": "🚚", "desc": "СЕКРЕТ! Твій ривок (Shift) таранить ворогів, як вантажівка. Карма — штука кругла.", "bonus": {"dash_dmg": 1.4}, "secret": true},
	"jack": {"name": "Майстер на всі руки", "icon": "🃏", "desc": "СЕКРЕТНИЙ ДЖЕКПОТ! Відкриває клас, що вчить навички ВСІХ класів. Ніщо не ідеально — зате все одразу.", "bonus": {"xp": 0.05}, "secret": true},
	"lumi": {"name": "Улюбленець Люмі", "icon": "🌸", "desc": "СЕКРЕТНИЙ ДЖЕКПОТ! +10% до всього. Люмі пише тобі листи.", "bonus": {"hp": 0.1, "mp": 0.1, "atk": 0.1, "def": 0.1, "crit": 0.03, "xp": 0.1, "speed": 0.05}, "secret": true},
}


static func race(p: Dictionary) -> Dictionary:
	return RACES.get(str(p.get("race", "human")), RACES.human)


static func blessing(p: Dictionary) -> Dictionary:
	return BLESSINGS.get(str(p.get("bless", "")), {})


## Сумарний бонус раси й благословення за ключем (hp, mp, atk, def, crit, xp, speed, cdr).
static func mul(p: Dictionary, key: String) -> float:
	return float(race(p).bonus.get(key, 0.0)) + float(blessing(p).get("bonus", {}).get(key, 0.0))


static func female(p: Dictionary) -> bool:
	return str(p.get("gender", "m")) == "f"


## Арт героя з урахуванням статі: big = для меню/діалогів.
static func hero_art(female_: bool, big := false) -> String:
	return "res://assets/art/hero%s%s.png" % ["_f" if female_ else "", "_big" if big else ""]


static func roll_blessing(rng := RandomNumberGenerator.new()) -> String:
	if rng.randf() < 0.03:
		return "lumi"
	if rng.randf() < 0.03:
		return "truck"
	if rng.randf() < 0.02 or OS.get_environment("ISEKAY_BLESS") == "jack":
		return "jack"
	var keys: Array = BLESSINGS.keys().filter(func(k): return not BLESSINGS[k].get("secret", false))
	return keys[rng.randi() % keys.size()]


static func summary(p: Dictionary) -> String:
	var R := race(p)
	var B := blessing(p)
	var s := "%s %s" % [R.icon, R.name]
	if not B.is_empty():
		s += " · %s %s" % [B.icon, B.name]
	return s
