## Пітомці (зі старої версії): купуються в зоокрамниці міста, один активний ходить з героєм у підземеллях.
## Стан: p.pets = {id: {lvl, xp}}, p.pet = id активного ("" — без пітомця).
## У бою пітомець — союзник (dungeon.allies, pet = true) з роллю: atk/magic б'ють, heal лікує, tank зменшує шкоду, loot — більше золота, buff — більше криту.
class_name Pets
extends RefCounted

const MAX_LVL := 20

const PETS := {
	"chicken": {"name": "Бойова курка Пеппа", "icon": "🐔", "price": 80, "role": "atk", "power": 0.9, "desc": "Найнебезпечніша істота Дивосвіту. Не зли її."},
	"slime": {"name": "Слиз Слизько", "icon": "🟢", "price": 100, "role": "heal", "power": 1.0, "desc": "Б'є, обіймає (лікує) і жартує. Друг на все життя (і трохи липкий)."},
	"dog": {"name": "Пес Барбос", "icon": "🐕", "price": 120, "role": "atk", "power": 1.0, "desc": "Вірний, кусючий, нюхає всіх ворогів."},
	"cat": {"name": "Кіт Пан Мурчик", "icon": "🐈", "price": 150, "role": "loot", "power": 0.8, "desc": "Іноді краде лут у ворогів. Іноді — у тебе."},
	"owl": {"name": "Сова Мудрагелька", "icon": "🦉", "price": 220, "role": "buff", "power": 0.8, "desc": "Підказує слабкості ворогів. Дивиться осудливо."},
	"raven": {"name": "Ворон Кар-Карич", "icon": "🐦‍⬛", "price": 300, "role": "buff", "power": 0.9, "desc": "Краде блискучі речі й підказує слабкості ворогів."},
	"capybara": {"name": "Капібара Спокій", "icon": "🦫", "price": 350, "role": "heal", "power": 1.0, "desc": "Найспокійніша істота світу. Лікує одним своїм виглядом."},
	"turtle": {"name": "Черепаха Тортила", "icon": "🐢", "price": 450, "role": "tank", "power": 1.1, "desc": "Повільна, але броньована. Пам'ятає твого прадіда."},
	"bunny": {"name": "Кролик-убивця", "icon": "🐇", "price": 500, "role": "atk", "power": 1.35, "desc": "Милий. Дуже. Не дивися йому в очі."},
	"fox": {"name": "Лисичка-кіцуне Ліна", "icon": "🦊", "price": 600, "role": "magic", "power": 1.3, "desc": "Пускає лисячі вогники. Дев'ять хвостів у планах."},
	"wolfpup": {"name": "Вовченя Сірко", "icon": "🐺", "price": 700, "role": "atk", "power": 1.25, "desc": "Виє на місяць і на ворогів."},
	"golem": {"name": "Міні-голем Камінчик", "icon": "🪨", "price": 900, "role": "tank", "power": 1.2, "desc": "Приймає удари на себе. Кам'яне серце, золота душа."},
	"mimicpet": {"name": "Мімік Скринько", "icon": "📦", "price": 1200, "role": "loot", "power": 1.2, "desc": "Ручний мімік. Ковтає лут ворогів і віддає тобі. Майже весь."},
	"spirit": {"name": "Дух-ліхтарик Блим", "icon": "🏮", "price": 1500, "role": "magic", "power": 1.45, "desc": "Маленький вогник з великими амбіціями."},
	"phoenix": {"name": "Пташеня фенікса Жарик", "icon": "🐦‍🔥", "price": 3000, "role": "heal", "power": 1.6, "desc": "Іноді згорає. Завжди повертається."},
	"dragon": {"name": "Дракончик Іскорка", "icon": "🐲", "price": 0, "role": "magic", "power": 2.0, "desc": "Вилупився з яйця боса. Дихає вогнем на ворогів і на твої штани.", "boss_only": true},
}

const ROLES := {
	"atk": {"name": "атака", "ally": "rogue", "sig": {"name": "Шалений укус", "target": "one", "power": 2.2}},
	"magic": {"name": "магія", "ally": "mage", "sig": {"name": "Вогняний подих", "target": "all", "power": 1.6}},
	"heal": {"name": "лікування", "ally": "healer", "sig": {"name": "Цілющі обійми", "target": "party", "heal": 1.0}},
	"tank": {"name": "захист: −12% шкоди", "ally": "warrior", "sig": {"name": "Панцир-таран", "target": "one", "power": 1.8}},
	"loot": {"name": "лут: +золото", "ally": "rogue", "sig": {"name": "Цап-цап!", "target": "one", "power": 1.4}},
	"buff": {"name": "підтримка: +крит", "ally": "archer", "sig": {"name": "Осудливий погляд", "target": "all", "power": 1.2}},
}

const PET_LINES := [
	"%s дивиться на тебе так, ніби це ти — пітомець.",
	"%s приніс(ла) тобі… щось. Краще не питай, що це було.",
	"%s вимагає смаколик. Негайно.",
	"%s гордо охороняє твої чоботи.",
]


static func owned(p: Dictionary) -> Dictionary:
	if not (p.get("pets") is Dictionary):
		p.pets = {}
	return p.pets


static func active(p: Dictionary) -> String:
	var id := str(p.get("pet", ""))
	return id if owned(p).has(id) else ""


static func info(id: String) -> Dictionary:
	return PETS.get(id, {})


static func lvl(p: Dictionary, id: String) -> int:
	return int(owned(p).get(id, {}).get("lvl", 1))


static func xp_need(l: int) -> int:
	return 8 + l * 6


## Сила пітомця з рівнем: +6% за рівень.
static func power(p: Dictionary, id: String) -> float:
	return float(info(id).get("power", 1.0)) * (1.0 + 0.06 * (lvl(p, id) - 1))


static func buy(p: Dictionary, id: String) -> String:
	var P := info(id)
	if P.is_empty() or P.get("boss_only", false):
		return "Цього пітомця не продають."
	if owned(p).has(id):
		return "%s уже твій(твоя)." % P.name
	if int(p.gold) < int(P.price):
		return "Бракує золота: треба %d 💰." % int(P.price)
	p.gold = int(p.gold) - int(P.price)
	give(p, id)
	return ""


static func give(p: Dictionary, id: String) -> void:
	if not owned(p).has(id):
		owned(p)[id] = {"lvl": 1, "xp": 0}
	if active(p) == "":
		p.pet = id


static func set_active(p: Dictionary, id: String) -> void:
	p.pet = id if owned(p).has(id) else ""


## Досвід пітомця за перемогу. Повертає true, якщо новий рівень.
static func add_xp(p: Dictionary, n: int) -> bool:
	var id := active(p)
	if id == "":
		return false
	var S: Dictionary = owned(p)[id]
	if int(S.lvl) >= MAX_LVL:
		return false
	S.xp = int(S.xp) + n
	var up := false
	while int(S.lvl) < MAX_LVL and int(S.xp) >= xp_need(int(S.lvl)):
		S.xp = int(S.xp) - xp_need(int(S.lvl))
		S.lvl = int(S.lvl) + 1
		up = true
	return up


## Пасивний бонус активного пітомця (gold, crit, dmg_taken) — додається в Origin.mul.
static func bonus(p: Dictionary, key: String) -> float:
	var id := active(p)
	if id == "":
		return 0.0
	var role := str(info(id).role)
	var pw := power(p, id)
	match key:
		"gold":
			return 0.15 * pw if role == "loot" else 0.0
		"loot":
			return 0.2 * pw if role == "loot" else 0.0
		"crit":
			return 0.04 * pw if role == "buff" else 0.0
		"guard":
			return minf(0.25, 0.1 * pw) if role == "tank" else 0.0
	return 0.0


## Союзник для підземелля (той самий формат, що й у легенд).
static func ally(p: Dictionary, hero_atk: float) -> Dictionary:
	var id := active(p)
	if id == "":
		return {}
	var P := info(id)
	var R: Dictionary = ROLES[P.role]
	var S: Dictionary = R.sig.duplicate()
	S.name = "%s" % S.name
	return {"id": "pet_" + id, "pet": true, "name": P.name.get_slice(" ", P.name.get_slice_count(" ") - 1), "icon": P.icon, "role": R.ally,
		"atk": hero_atk * 0.3 * power(p, id), "sig": S, "sig_mult": 1.0, "gender": "f"}
