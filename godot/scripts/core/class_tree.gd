## ЗГЕНЕРОВАНО godot/tools/gen_classes.js з даних старої версії — не редагувати вручну.
## EXTRA — класи, перенесені зі старої гри (паладин, монах, списник, бард, самурай, призивач,
## чорнокнижник, ніндзя, бойовий кухар, алхімік і секретний «Майстер на всі руки»).
## TREE — дерево класу: 3 гілки (клас ІІ, з 20 рівня), у кожної 2 майстри (клас ІІІ, з 45) і вознесіння (75).
class_name ClassTree
extends RefCounted

const EXTRA := {
	"paladin": {
		"name": "Паладин",
		"icon": "🛡️",
		"desc": "Танк з моральними принципами і дуже блискучою бронею.",
		"hp": 125,
		"hp_lvl": 21,
		"mp": 45,
		"mp_lvl": 6,
		"atk": 12,
		"atk_lvl": 3,
		"def": 6,
		"def_lvl": 1.8,
		"crit": 0.07,
		"speed": 0.95,
		"basic": {
			"type": "arc",
			"reach": 56,
			"arc": 1.1,
			"power": 1.05,
			"cd": 0.44
		},
		"skills": [
			{
				"id": "paladin_holy_strike",
				"name": "Святий удар",
				"lvl": 1,
				"mp": 8,
				"cd": 1.8,
				"desc": "Удар булавою з благословенням.",
				"col": "#ffe27a",
				"type": "arc",
				"reach": 76,
				"arc": 1.25,
				"power": 1.88,
				"knock": 300
			},
			{
				"id": "paladin_move",
				"name": "Щитовий ривок",
				"lvl": 1,
				"mp": 4,
				"cd": 1.5,
				"type": "charge",
				"range": 210,
				"power": 1.1,
				"col": "#ffe27a",
				"desc": "Таран щитом. Двері, вороги, стіни — без різниці."
			},
			{
				"id": "paladin_faith_shield",
				"name": "Щит віри",
				"lvl": 4,
				"mp": 14,
				"cd": 5,
				"desc": "+100% захисту.",
				"col": "#ffe27a",
				"type": "shield",
				"time": 3,
				"amount": 0.12
			},
			{
				"id": "paladin_stun_bash",
				"name": "Оглушення щитом",
				"lvl": 8,
				"mp": 22,
				"cd": 8,
				"desc": "Може оглушити.",
				"col": "#ffe27a",
				"type": "arc",
				"reach": 76,
				"arc": 1.25,
				"power": 1.5,
				"knock": 460
			},
			{
				"id": "paladin_consecrate",
				"name": "Освячення землі",
				"lvl": 12,
				"mp": 20,
				"cd": 5,
				"desc": "Земля світиться. Нежить плаче.",
				"col": "#ffe27a",
				"type": "nova",
				"radius": 115,
				"power": 2.16
			},
			{
				"id": "paladin_holy_lance",
				"name": "Святий спис",
				"lvl": 18,
				"mp": 32,
				"cd": 10,
				"desc": "Пронизує темряву.",
				"col": "#ffe27a",
				"type": "arc",
				"reach": 100,
				"arc": 1.25,
				"power": 5.75,
				"knock": 300
			}
		]
	},
	"monk": {
		"name": "Монах",
		"icon": "👊",
		"desc": "Кастети, медитація і принципова відмова від сорочок.",
		"hp": 105,
		"hp_lvl": 18,
		"mp": 40,
		"mp_lvl": 6,
		"atk": 12,
		"atk_lvl": 3.2,
		"def": 4,
		"def_lvl": 1.4,
		"crit": 0.14,
		"speed": 1.12,
		"basic": {
			"type": "arc",
			"reach": 46,
			"arc": 1,
			"power": 0.72,
			"cd": 0.2
		},
		"skills": [
			{
				"id": "monk_flurry",
				"name": "Шквал кулаків",
				"lvl": 1,
				"mp": 8,
				"cd": 1.8,
				"desc": "Ора-ора-ора!",
				"col": "#ffb36e",
				"type": "fan",
				"count": 3,
				"spread": 1.2,
				"speed": 560,
				"power": 0.55
			},
			{
				"id": "monk_move",
				"name": "Крок вітру",
				"lvl": 1,
				"mp": 4,
				"cd": 1.5,
				"type": "blink",
				"range": 220,
				"power": 0.8,
				"col": "#ffb36e",
				"desc": "Ступив — і вітер позаду. Сандалі не встигають."
			},
			{
				"id": "monk_inner_chi",
				"name": "Внутрішня ці",
				"lvl": 4,
				"mp": 14,
				"cd": 5,
				"desc": "Глибокий вдих.",
				"col": "#9dffb0",
				"type": "heal",
				"amount": 0.28
			},
			{
				"id": "monk_hundred_fists",
				"name": "Сто кулаків Нескінченності",
				"lvl": 8,
				"mp": 22,
				"cd": 8,
				"desc": "Насправді десять.",
				"col": "#ffb36e",
				"type": "fan",
				"count": 10,
				"spread": 1.2,
				"speed": 560,
				"power": 0.55
			},
			{
				"id": "monk_chi_blast",
				"name": "Вибух ці",
				"lvl": 12,
				"mp": 20,
				"cd": 5,
				"desc": "Хаа-дуу-кен!",
				"col": "#ffb36e",
				"type": "nova",
				"radius": 115,
				"power": 2.04
			},
			{
				"id": "monk_seven_palms",
				"name": "Сім долонь",
				"lvl": 18,
				"mp": 32,
				"cd": 10,
				"desc": "Сім. Рівно сім. Монах рахував.",
				"col": "#ffb36e",
				"type": "fan",
				"count": 7,
				"spread": 1.2,
				"speed": 560,
				"power": 0.72
			}
		]
	},
	"lancer": {
		"name": "Списник",
		"icon": "🔱",
		"desc": "Тримає дистанцію. В житті теж.",
		"hp": 112,
		"hp_lvl": 19,
		"mp": 35,
		"mp_lvl": 5,
		"atk": 13,
		"atk_lvl": 3.3,
		"def": 5,
		"def_lvl": 1.5,
		"crit": 0.12,
		"speed": 1,
		"basic": {
			"type": "arc",
			"reach": 82,
			"arc": 0.55,
			"power": 1.05,
			"cd": 0.42
		},
		"skills": [
			{
				"id": "lancer_thrust",
				"name": "Укол",
				"lvl": 1,
				"mp": 8,
				"cd": 1.8,
				"desc": "Пробиває броню.",
				"col": "#9fd0ff",
				"type": "arc",
				"reach": 76,
				"arc": 1.25,
				"power": 2.13,
				"knock": 300
			},
			{
				"id": "lancer_move",
				"name": "Стрибок драгуна",
				"lvl": 1,
				"mp": 4,
				"cd": 1.5,
				"type": "charge",
				"range": 270,
				"power": 1.4,
				"col": "#9fd0ff",
				"desc": "Злітаєш угору й падаєш списом униз. Приземлення — на ворога."
			},
			{
				"id": "lancer_sweep",
				"name": "Розмах древком",
				"lvl": 4,
				"mp": 14,
				"cd": 5,
				"desc": "Підсікає всіх.",
				"col": "#9fd0ff",
				"type": "nova",
				"radius": 115,
				"power": 1.32
			},
			{
				"id": "lancer_phalanx",
				"name": "Фаланга",
				"lvl": 8,
				"mp": 22,
				"cd": 8,
				"desc": "+80% захисту.",
				"col": "#9fd0ff",
				"type": "shield",
				"time": 3,
				"amount": 0.12
			},
			{
				"id": "lancer_pin",
				"name": "Пришпилити",
				"lvl": 12,
				"mp": 20,
				"cd": 5,
				"desc": "Ворог пришпилений до землі.",
				"col": "#9fd0ff",
				"type": "arc",
				"reach": 76,
				"arc": 1.25,
				"power": 2,
				"knock": 460
			},
			{
				"id": "lancer_spiral_lance",
				"name": "Спіральний спис",
				"lvl": 18,
				"mp": 32,
				"cd": 10,
				"desc": "Дриль! Тобто спис.",
				"col": "#9fd0ff",
				"type": "arc",
				"reach": 100,
				"arc": 1.25,
				"power": 5.38,
				"knock": 300
			}
		]
	},
	"bard": {
		"name": "Бард",
		"icon": "🪕",
		"desc": "Співає, надихає і трохи фальшивить.",
		"hp": 90,
		"hp_lvl": 15,
		"mp": 60,
		"mp_lvl": 8,
		"atk": 12,
		"atk_lvl": 3,
		"def": 3,
		"def_lvl": 1.1,
		"crit": 0.1,
		"speed": 1.05,
		"basic": {
			"type": "projectile",
			"speed": 480,
			"power": 0.85,
			"cd": 0.42,
			"r": 7,
			"col": "#ff8ad8",
			"pierce": 0
		},
		"skills": [
			{
				"id": "bard_sonic_chord",
				"name": "Звуковий акорд",
				"lvl": 1,
				"mp": 8,
				"cd": 1.8,
				"desc": "Мі-мажор прямо у вухо.",
				"col": "#ff8ad8",
				"type": "projectile",
				"speed": 620,
				"power": 1.92,
				"r": 10,
				"pierce": 0
			},
			{
				"id": "bard_move",
				"name": "Сальто зі сцени",
				"lvl": 1,
				"mp": 4,
				"cd": 1.5,
				"type": "blink",
				"range": 210,
				"power": 0.5,
				"col": "#ff8ad8",
				"desc": "Ефектне сальто. Публіка аплодує, вороги промахуються."
			},
			{
				"id": "bard_ballad",
				"name": "Балада відваги",
				"lvl": 4,
				"mp": 14,
				"cd": 5,
				"desc": "+35% атаки команди.",
				"col": "#ff8ad8",
				"type": "buff",
				"time": 6
			},
			{
				"id": "bard_dissonance",
				"name": "Дисонанс",
				"lvl": 8,
				"mp": 22,
				"cd": 8,
				"desc": "Так фальшиво, що боляче.",
				"col": "#ff8ad8",
				"type": "aoe_at",
				"radius": 100,
				"power": 1.1,
				"ticks": 3
			},
			{
				"id": "bard_diss_track",
				"name": "Дис-трек",
				"lvl": 12,
				"mp": 20,
				"cd": 5,
				"desc": "Римована образа на 3.6 сили.",
				"col": "#ff8ad8",
				"type": "projectile",
				"speed": 620,
				"power": 4.32,
				"r": 14,
				"pierce": 99
			},
			{
				"id": "bard_sound_barrier",
				"name": "Звуковий бар'єр",
				"lvl": 18,
				"mp": 32,
				"cd": 10,
				"desc": "Басс-дроп на всіх.",
				"col": "#ff8ad8",
				"type": "aoe_at",
				"radius": 100,
				"power": 1.32,
				"ticks": 3
			}
		]
	},
	"samurai": {
		"name": "Самурай",
		"icon": "🎎",
		"desc": "Шлях меча, чай о п'ятій і дуже драматичні пелюстки сакури на фоні.",
		"hp": 105,
		"hp_lvl": 18,
		"mp": 35,
		"mp_lvl": 5,
		"atk": 14,
		"atk_lvl": 3.5,
		"def": 4,
		"def_lvl": 1.3,
		"crit": 0.2,
		"speed": 1.04,
		"basic": {
			"type": "arc",
			"reach": 62,
			"arc": 1,
			"power": 1,
			"cd": 0.38
		},
		"skills": [
			{
				"id": "samurai_iai_cut",
				"name": "Удар з піхов",
				"lvl": 1,
				"mp": 8,
				"cd": 1.8,
				"desc": "Меч з'явився і зник. Ворог ще не зрозумів.",
				"col": "#ff6a6a",
				"type": "arc",
				"reach": 76,
				"arc": 1.25,
				"power": 2,
				"knock": 300
			},
			{
				"id": "samurai_move",
				"name": "Іайдо-ривок",
				"lvl": 1,
				"mp": 4,
				"cd": 1.5,
				"type": "charge",
				"range": 230,
				"power": 1.5,
				"col": "#ff6a6a",
				"desc": "Ти вже позаду ворога. Меч уже в піхвах. Ворог ще думає."
			},
			{
				"id": "samurai_wind_step",
				"name": "Крок вітру",
				"lvl": 4,
				"mp": 14,
				"cd": 5,
				"desc": "+30% ухилення. Ти — листок на вітрі.",
				"col": "#ff6a6a",
				"type": "shield",
				"time": 3,
				"amount": 0.12
			},
			{
				"id": "samurai_dragon_flash",
				"name": "Спалах дракона",
				"lvl": 8,
				"mp": 22,
				"cd": 8,
				"desc": "Ріже так швидко, що аж світиться.",
				"col": "#ff6a6a",
				"type": "arc",
				"reach": 100,
				"arc": 1.25,
				"power": 4.88,
				"knock": 300
			},
			{
				"id": "samurai_sakura_fall",
				"name": "Падіння сакури",
				"lvl": 12,
				"mp": 20,
				"cd": 5,
				"desc": "Кожна пелюстка — порізаний ворог.",
				"col": "#ff6a6a",
				"type": "nova",
				"radius": 115,
				"power": 1.08
			},
			{
				"id": "samurai_moon_reflect",
				"name": "Місяць у воді",
				"lvl": 18,
				"mp": 32,
				"cd": 10,
				"desc": "Чотири віддзеркалені удари.",
				"col": "#ff6a6a",
				"type": "fan",
				"count": 4,
				"spread": 1.2,
				"speed": 560,
				"power": 1.26
			}
		]
	},
	"summoner": {
		"name": "Призивач",
		"icon": "🔯",
		"desc": "Сам не б'ється — кличе тих, хто б'ється. Профспілка духів нервує.",
		"hp": 85,
		"hp_lvl": 14,
		"mp": 75,
		"mp_lvl": 10,
		"atk": 13,
		"atk_lvl": 3.4,
		"def": 3,
		"def_lvl": 1,
		"crit": 0.08,
		"speed": 1,
		"basic": {
			"type": "projectile",
			"speed": 420,
			"power": 0.85,
			"cd": 0.48,
			"r": 8,
			"col": "#7dffd0",
			"pierce": 0
		},
		"skills": [
			{
				"id": "summoner_call_slime",
				"name": "Поклик слизня",
				"lvl": 1,
				"mp": 8,
				"cd": 1.8,
				"desc": "Слизень стрибає на ворога. Хлюп.",
				"col": "#7dffd0",
				"type": "projectile",
				"speed": 620,
				"power": 1.92,
				"r": 10,
				"pierce": 0
			},
			{
				"id": "summoner_move",
				"name": "Обмін із духом",
				"lvl": 1,
				"mp": 4,
				"cd": 1.5,
				"type": "blink",
				"range": 230,
				"power": 0.6,
				"col": "#7dffd0",
				"desc": "Міняєшся місцями з духом. Дух невдоволений, але мовчить."
			},
			{
				"id": "summoner_fairy_heal",
				"name": "Фея-лікарка",
				"lvl": 4,
				"mp": 14,
				"cd": 5,
				"desc": "Крихітна фея лікує всіх і просить чайові.",
				"col": "#9dffb0",
				"type": "heal",
				"amount": 0.26
			},
			{
				"id": "summoner_phoenix",
				"name": "Фенікс",
				"lvl": 8,
				"mp": 22,
				"cd": 8,
				"desc": "Палаючий птах. Дуже пафосний.",
				"col": "#7dffd0",
				"type": "cloud",
				"radius": 105,
				"power": 0.6,
				"time": 5
			},
			{
				"id": "summoner_behemoth",
				"name": "Бегемот",
				"lvl": 12,
				"mp": 20,
				"cd": 5,
				"desc": "Сідає на ворога. Всією вагою.",
				"col": "#7dffd0",
				"type": "projectile",
				"speed": 620,
				"power": 5.04,
				"r": 14,
				"pierce": 99
			},
			{
				"id": "summoner_kraken_call",
				"name": "Поклик кракена",
				"lvl": 18,
				"mp": 32,
				"cd": 10,
				"desc": "Щупальця звідусіль.",
				"col": "#7dffd0",
				"type": "aoe_at",
				"radius": 100,
				"power": 1.21,
				"ticks": 3
			}
		]
	},
	"warlock": {
		"name": "Чорнокнижник",
		"icon": "📕",
		"desc": "Уклав договір з демоном. Не читав дрібний шрифт.",
		"hp": 88,
		"hp_lvl": 15,
		"mp": 70,
		"mp_lvl": 9,
		"atk": 14,
		"atk_lvl": 3.6,
		"def": 3,
		"def_lvl": 1,
		"crit": 0.1,
		"speed": 0.98,
		"basic": {
			"type": "projectile",
			"speed": 440,
			"power": 0.9,
			"cd": 0.5,
			"r": 8,
			"col": "#a64dff",
			"pierce": 0
		},
		"skills": [
			{
				"id": "warlock_shadow_bolt",
				"name": "Тіньова стріла",
				"lvl": 1,
				"mp": 8,
				"cd": 1.8,
				"desc": "Темна, швидка, неприємна.",
				"col": "#a64dff",
				"type": "projectile",
				"speed": 620,
				"power": 2.04,
				"r": 10,
				"pierce": 0
			},
			{
				"id": "warlock_move",
				"name": "Крок безодні",
				"lvl": 1,
				"mp": 4,
				"cd": 1.5,
				"type": "blink",
				"range": 230,
				"power": 0.9,
				"col": "#a64dff",
				"desc": "Пірнаєш у тінь і виринаєш поруч. Від тебе пахне сіркою."
			},
			{
				"id": "warlock_curse",
				"name": "Прокляття",
				"lvl": 4,
				"mp": 14,
				"cd": 5,
				"desc": "Ворогу щодня не щастить. 4 ходи.",
				"col": "#a64dff",
				"type": "projectile",
				"speed": 620,
				"power": 1.08,
				"r": 10,
				"pierce": 0
			},
			{
				"id": "warlock_soul_drain",
				"name": "Висмоктування душі",
				"lvl": 8,
				"mp": 22,
				"cd": 8,
				"desc": "Шкода лікує тебе.",
				"col": "#a64dff",
				"type": "projectile",
				"speed": 620,
				"power": 2.4,
				"r": 10,
				"pierce": 0
			},
			{
				"id": "warlock_demon_pact",
				"name": "Демонічний пакт",
				"lvl": 12,
				"mp": 20,
				"cd": 5,
				"desc": "+60% атаки. Платити потім.",
				"col": "#a64dff",
				"type": "buff",
				"time": 6
			},
			{
				"id": "warlock_black_sun",
				"name": "Чорне сонце",
				"lvl": 18,
				"mp": 32,
				"cd": 10,
				"desc": "Світить темрявою.",
				"col": "#a64dff",
				"type": "aoe_at",
				"radius": 100,
				"power": 1.38,
				"ticks": 3
			}
		]
	},
	"ninja": {
		"name": "Ніндзя",
		"icon": "🥷",
		"desc": "Невидимий, нечутний і дуже голосно кричить назви технік.",
		"hp": 90,
		"hp_lvl": 15,
		"mp": 45,
		"mp_lvl": 7,
		"atk": 12,
		"atk_lvl": 3.1,
		"def": 3,
		"def_lvl": 1.1,
		"crit": 0.25,
		"speed": 1.18,
		"basic": {
			"type": "arc",
			"reach": 48,
			"arc": 0.95,
			"power": 0.75,
			"cd": 0.22
		},
		"skills": [
			{
				"id": "ninja_shuriken",
				"name": "Сюрікени",
				"lvl": 1,
				"mp": 8,
				"cd": 1.8,
				"desc": "Три зірочки. Всі в ціль.",
				"col": "#9aa6b8",
				"type": "fan",
				"count": 3,
				"spread": 1.2,
				"speed": 560,
				"power": 0.55
			},
			{
				"id": "ninja_move",
				"name": "Заміна колодою",
				"lvl": 1,
				"mp": 4,
				"cd": 1.5,
				"type": "blink",
				"range": 240,
				"power": 0.7,
				"col": "#9aa6b8",
				"desc": "Пуф! На твоєму місці колода. Ворог б'є колоду."
			},
			{
				"id": "ninja_log_swap",
				"name": "Підміна колодою",
				"lvl": 4,
				"mp": 14,
				"cd": 5,
				"desc": "Тебе вдарили? Ні, колоду.",
				"col": "#9aa6b8",
				"type": "shield",
				"time": 3,
				"amount": 0.12
			},
			{
				"id": "ninja_shadow_bind",
				"name": "Тіньові пута",
				"lvl": 8,
				"mp": 22,
				"cd": 8,
				"desc": "Тінь ворога тримає його.",
				"col": "#9aa6b8",
				"type": "arc",
				"reach": 76,
				"arc": 1.25,
				"power": 1.25,
				"knock": 460
			},
			{
				"id": "ninja_poison_needle",
				"name": "Отруйні голки",
				"lvl": 12,
				"mp": 20,
				"cd": 5,
				"desc": "Тихо і точно.",
				"col": "#9aa6b8",
				"type": "cloud",
				"radius": 105,
				"power": 0.35,
				"time": 5
			},
			{
				"id": "ninja_ninja_art_finale",
				"name": "Таємне мистецтво: фінал",
				"lvl": 18,
				"mp": 32,
				"cd": 10,
				"desc": "Феєрверк з кунаїв.",
				"col": "#9aa6b8",
				"type": "nova",
				"radius": 115,
				"power": 1.2
			}
		]
	},
	"battle_chef": {
		"name": "Бойовий кухар",
		"icon": "🍳",
		"desc": "Сковорідка — зброя. Борщ — зілля. Тарілки — щити. Кухня — поле бою.",
		"hp": 115,
		"hp_lvl": 20,
		"mp": 45,
		"mp_lvl": 6,
		"atk": 13,
		"atk_lvl": 3.2,
		"def": 5,
		"def_lvl": 1.5,
		"crit": 0.1,
		"speed": 1,
		"basic": {
			"type": "arc",
			"reach": 58,
			"arc": 1.15,
			"power": 1.05,
			"cd": 0.42
		},
		"skills": [
			{
				"id": "battle_chef_pan_smack",
				"name": "Удар сковорідкою",
				"lvl": 1,
				"mp": 8,
				"cd": 1.8,
				"desc": "БОНГ. Класика.",
				"col": "#ffa64d",
				"type": "arc",
				"reach": 76,
				"arc": 1.25,
				"power": 2,
				"knock": 460
			},
			{
				"id": "battle_chef_move",
				"name": "Ривок з пательнею",
				"lvl": 1,
				"mp": 4,
				"cd": 1.5,
				"type": "charge",
				"range": 220,
				"power": 1.3,
				"col": "#ffa64d",
				"desc": "Пательня попереду, кухар позаду. Обід подано."
			},
			{
				"id": "battle_chef_snack_time",
				"name": "Перекус!",
				"lvl": 4,
				"mp": 14,
				"cd": 5,
				"desc": "Бутерброди для всіх. Навіть для ворогів — ні.",
				"col": "#9dffb0",
				"type": "heal",
				"amount": 0.26
			},
			{
				"id": "battle_chef_tenderize",
				"name": "Відбивна",
				"lvl": 8,
				"mp": 22,
				"cd": 8,
				"desc": "Відбиває м'ясо і броню.",
				"col": "#ffa64d",
				"type": "arc",
				"reach": 76,
				"arc": 1.25,
				"power": 2.75,
				"knock": 300
			},
			{
				"id": "battle_chef_flambe",
				"name": "Фламбе",
				"lvl": 12,
				"mp": 20,
				"cd": 5,
				"desc": "Красиво горить. Вороги теж.",
				"col": "#ffa64d",
				"type": "nova",
				"radius": 115,
				"power": 2.28
			},
			{
				"id": "battle_chef_iron_chef",
				"name": "Залізний кухар",
				"lvl": 18,
				"mp": 32,
				"cd": 10,
				"desc": "Казан на голові — найкращий шолом.",
				"col": "#ffa64d",
				"type": "shield",
				"time": 3.5,
				"amount": 0.12
			}
		]
	},
	"alchemist": {
		"name": "Алхімік",
		"icon": "⚗️",
		"desc": "Змішує зілля. Іноді правильно. Брови вже відросли — двічі.",
		"hp": 92,
		"hp_lvl": 15,
		"mp": 60,
		"mp_lvl": 8,
		"atk": 13,
		"atk_lvl": 3.3,
		"def": 3,
		"def_lvl": 1.2,
		"crit": 0.1,
		"speed": 1,
		"basic": {
			"type": "projectile",
			"speed": 400,
			"power": 0.9,
			"cd": 0.5,
			"r": 8,
			"col": "#7dff6a",
			"pierce": 0,
			"explode": 40
		},
		"skills": [
			{
				"id": "alchemist_acid_flask",
				"name": "Колба кислоти",
				"lvl": 1,
				"mp": 8,
				"cd": 1.8,
				"desc": "Роз'їдає броню і настрій.",
				"col": "#7dff6a",
				"type": "projectile",
				"speed": 620,
				"power": 1.8,
				"r": 10,
				"pierce": 99
			},
			{
				"id": "alchemist_move",
				"name": "Димовий стрибок",
				"lvl": 1,
				"mp": 4,
				"cd": 1.5,
				"type": "blink",
				"range": 210,
				"power": 0.5,
				"col": "#7dff6a",
				"desc": "Бах — дим — тебе тут немає. Колба — твоя найкраща подруга."
			},
			{
				"id": "alchemist_healing_mist",
				"name": "Цілющий туман",
				"lvl": 4,
				"mp": 14,
				"cd": 5,
				"desc": "Пахне м'ятою і медициною.",
				"col": "#9dffb0",
				"type": "heal",
				"amount": 0.26
			},
			{
				"id": "alchemist_frost_flask",
				"name": "Крижана колба",
				"lvl": 8,
				"mp": 22,
				"cd": 8,
				"desc": "Заморожує.",
				"col": "#7dff6a",
				"type": "projectile",
				"speed": 620,
				"power": 1.92,
				"r": 10,
				"pierce": 0
			},
			{
				"id": "alchemist_transmute",
				"name": "Трансмутація",
				"lvl": 12,
				"mp": 20,
				"cd": 5,
				"desc": "Ворог трохи перетворюється на золото.",
				"col": "#7dff6a",
				"type": "projectile",
				"speed": 620,
				"power": 2.64,
				"r": 10,
				"pierce": 0
			},
			{
				"id": "alchemist_philosopher_stone",
				"name": "Філософський камінь",
				"lvl": 18,
				"mp": 32,
				"cd": 10,
				"desc": "Еквівалентний обмін: їхнє здоров'я на твою перемогу.",
				"col": "#7dff6a",
				"type": "aoe_at",
				"radius": 100,
				"power": 1.49,
				"ticks": 3
			}
		]
	},
	"jack": {
		"name": "Майстер на всі руки",
		"icon": "🃏",
		"desc": "Вміє все потроху. Вивчає навички будь-якого класу в будь-якого тренера. Ніщо не ідеально, зате все одразу.",
		"hp": 100,
		"hp_lvl": 17,
		"mp": 50,
		"mp_lvl": 7,
		"atk": 12,
		"atk_lvl": 3.2,
		"def": 4,
		"def_lvl": 1.4,
		"crit": 0.15,
		"speed": 1.05,
		"basic": {
			"type": "arc",
			"reach": 54,
			"arc": 1,
			"power": 0.95,
			"cd": 0.36
		},
		"secret": true,
		"skills": [
			{
				"id": "jack_improvise",
				"name": "Імпровізація",
				"lvl": 1,
				"mp": 8,
				"cd": 1.8,
				"desc": "Випадкова атака. Влучна, як не дивно.",
				"col": "#ffd36e",
				"type": "arc",
				"reach": 76,
				"arc": 1.25,
				"power": 2.13,
				"knock": 300
			},
			{
				"id": "jack_move",
				"name": "Імпровізований ривок",
				"lvl": 1,
				"mp": 4,
				"cd": 1.5,
				"type": "blink",
				"range": 220,
				"power": 0.8,
				"col": "#ffd36e",
				"desc": "Ривок у випадковому стилі. Сьогодні — як ніндзя. Завтра — хто знає."
			},
			{
				"id": "jack_copycat",
				"name": "Копіювання",
				"lvl": 4,
				"mp": 14,
				"cd": 5,
				"desc": "Підгледів у когось. Працює!",
				"col": "#ffd36e",
				"type": "nova",
				"radius": 115,
				"power": 1.68
			},
			{
				"id": "jack_swiss_knife",
				"name": "Швейцарський ніж",
				"lvl": 8,
				"mp": 22,
				"cd": 8,
				"desc": "Різне лезо на кожен удар.",
				"col": "#ffd36e",
				"type": "fan",
				"count": 4,
				"spread": 1.2,
				"speed": 560,
				"power": 0.9
			},
			{
				"id": "jack_beginner_luck",
				"name": "Удача новачка",
				"lvl": 12,
				"mp": 20,
				"cd": 14,
				"type": "buff",
				"time": 6,
				"desc": "Нічого не вмієш як слід — зате все вдається. Шкода +60% на 6 секунд.",
				"col": "#ffd36e"
			},
			{
				"id": "jack_protagonist",
				"name": "Удар головного героя",
				"lvl": 18,
				"mp": 34,
				"cd": 11,
				"type": "meteor",
				"radius": 150,
				"power": 4.6,
				"delay": 0.8,
				"col": "#ffe27a",
				"desc": "Сюжетна броня + сюжетний кулак. Звучить опенінг."
			}
		]
	}
}

const TREE := {
	"swordsman": {
		"branches": [
			{
				"id": "knight",
				"name": "Лицар-клинок",
				"icon": "🗡️",
				"desc": "Честь, сталь і дуже гучні промови.",
				"bonus": {
					"hp": 0.09,
					"atk": 0.06,
					"def": 0.06
				},
				"skills": [
					{
						"id": "t_knight_oath_blade",
						"name": "Клинок присяги",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Святий удар з шансом оглушення.",
						"col": "#bfe6ff",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 3.5,
						"knock": 460
					},
					{
						"id": "t_knight_rally",
						"name": "Згуртування",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Лікує команду й дає захист.",
						"col": "#9dffb0",
						"type": "heal",
						"amount": 0.28
					}
				],
				"masters": [
					{
						"id": "paladin_lord",
						"name": "Лорд-Командор",
						"icon": "🏰",
						"desc": "Командує арміями і промовами.",
						"bonus": {
							"hp": 0.15,
							"atk": 0.1,
							"def": 0.1
						},
						"skills": [
							{
								"id": "t_paladin_lord_banner_charge",
								"name": "Атака під прапором",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Уся команда в атаку!",
								"col": "#bfe6ff",
								"type": "nova",
								"radius": 115,
								"power": 3.48,
								"slow": 2
							},
							{
								"id": "t_paladin_lord_last_stand",
								"name": "Останній рубіж",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Ніхто не впаде. Ну, сьогодні.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.34
							}
						]
					},
					{
						"id": "dragon_knight",
						"name": "Драконячий Лицар",
						"icon": "🐉",
						"desc": "Їздить на драконі. Дракон — на ньому, коли втомиться.",
						"bonus": {
							"hp": 0.12,
							"atk": 0.12,
							"def": 0.08
						},
						"skills": [
							{
								"id": "t_dragon_knight_dragon_charge",
								"name": "Атака дракона",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Дракон і лицар — разом.",
								"col": "#bfe6ff",
								"type": "nova",
								"radius": 115,
								"power": 3.6
							},
							{
								"id": "t_dragon_knight_dragon_scale",
								"name": "Драконяча луска",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Луска на всіх.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.32
							}
						]
					}
				]
			},
			{
				"id": "blademaster",
				"name": "Майстер меча",
				"icon": "🌪️",
				"desc": "Тисяча ударів за секунду. Ну, вісім.",
				"bonus": {
					"atk": 0.08,
					"crit": 0.01
				},
				"skills": [
					{
						"id": "t_blademaster_thousand_cuts",
						"name": "Тисяча порізів",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Вісім блискавичних ударів.",
						"col": "#bfe6ff",
						"type": "fan",
						"count": 8,
						"spread": 1.2,
						"speed": 560,
						"power": 0.55
					},
					{
						"id": "t_blademaster_iaido",
						"name": "Іайдо",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Ти вже прибрав меч у піхви. Вороги ще не знають.",
						"col": "#bfe6ff",
						"type": "nova",
						"radius": 115,
						"power": 2.4
					}
				],
				"masters": [
					{
						"id": "sword_saint",
						"name": "Святий Меча",
						"icon": "🌸",
						"desc": "Розрізає листок, що падає. І ворога за ним.",
						"bonus": {
							"atk": 0.12,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_sword_saint_sakura_storm",
								"name": "Буря сакури",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Пелюстки гострі як бритва.",
								"col": "#bfe6ff",
								"type": "nova",
								"radius": 115,
								"power": 1.32
							},
							{
								"id": "t_sword_saint_void_slash",
								"name": "Розріз порожнечі",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Ріже простір. Простір ображається.",
								"col": "#bfe6ff",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 6.75,
								"knock": 300
							}
						]
					},
					{
						"id": "blade_storm",
						"name": "Буря Клинків",
						"icon": "🌪️",
						"desc": "Сто мечів кружляють навколо. Він не пам'ятає, де взяв.",
						"bonus": {
							"atk": 0.1,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_blade_storm_sword_rain",
								"name": "Дощ мечів",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Мечі з неба.",
								"col": "#bfe6ff",
								"type": "nova",
								"radius": 115,
								"power": 1.32
							},
							{
								"id": "t_blade_storm_final_cut",
								"name": "Остаточний розріз",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Кінець історії.",
								"col": "#bfe6ff",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 7.5,
								"knock": 300
							}
						]
					}
				]
			},
			{
				"id": "spellblade",
				"name": "Чарівний Клинок",
				"icon": "🔮",
				"desc": "Меч в одній руці, заклинання в іншій. Третьої руки бракує для кави.",
				"bonus": {
					"atk": 0.1,
					"mp": 0.09
				},
				"skills": [
					{
						"id": "t_spellblade_flame_edge",
						"name": "Полум'яне лезо",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Меч горить. Ворог теж.",
						"col": "#bfe6ff",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 3.75,
						"knock": 300
					},
					{
						"id": "t_spellblade_frost_parry",
						"name": "Крижане парирування",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Контратака холодом.",
						"col": "#bfe6ff",
						"type": "shield",
						"time": 3,
						"amount": 0.12
					}
				],
				"masters": [
					{
						"id": "rune_lord",
						"name": "Рунний Лорд",
						"icon": "🪬",
						"desc": "Кожен удар — заклинання, кожне заклинання — удар.",
						"bonus": {
							"atk": 0.2,
							"mp": 0.15
						},
						"skills": [
							{
								"id": "t_rune_lord_rune_storm",
								"name": "Буря рун",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Руни вибухають навколо.",
								"col": "#bfe6ff",
								"type": "nova",
								"radius": 115,
								"power": 3.72
							},
							{
								"id": "t_rune_lord_arcane_blade",
								"name": "Аркана-клинок",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Лезо з чистої магії.",
								"col": "#bfe6ff",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 7,
								"knock": 300
							}
						]
					},
					{
						"id": "storm_knight",
						"name": "Лицар Бурі",
						"icon": "⛈️",
						"desc": "Ловить блискавки мечем. Іноді — зубами.",
						"bonus": {
							"atk": 0.12,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_storm_knight_thunder_cleave",
								"name": "Громовий розруб",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Гуркіт на все поле.",
								"col": "#bfe6ff",
								"type": "nova",
								"radius": 115,
								"power": 3.6,
								"slow": 2
							},
							{
								"id": "t_storm_knight_static_field",
								"name": "Статичне поле",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Додатковий хід, волосся дибки.",
								"col": "#bfe6ff",
								"type": "buff",
								"time": 6
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Меч-Святий",
			"icon": "👼",
			"skill": {
				"id": "t_asc_excalibur",
				"name": "Екскалібур!!!",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "Промінь світла завдовжки з цю назву.",
				"col": "#bfe6ff",
				"type": "meteor",
				"radius": 180,
				"power": 6.01,
				"delay": 0.85
			}
		}
	},
	"archer": {
		"branches": [
			{
				"id": "ranger",
				"name": "Слідопит",
				"icon": "🌲",
				"desc": "Друг лісу, ворог усього, що в ньому кусається.",
				"bonus": {
					"hp": 0.06,
					"def": 0.04,
					"crit": 0.01
				},
				"skills": [
					{
						"id": "t_ranger_beast_call",
						"name": "Поклик звіра",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Вовк з лісу допомагає. Він не твій, але дружній.",
						"col": "#ffe6a8",
						"type": "projectile",
						"speed": 620,
						"power": 2.88,
						"r": 10,
						"pierce": 0
					},
					{
						"id": "t_ranger_trap",
						"name": "Капкан",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Ворог стоїть і думає про своє життя.",
						"col": "#ffe6a8",
						"type": "projectile",
						"speed": 620,
						"power": 1.44,
						"r": 10,
						"pierce": 0
					}
				],
				"masters": [
					{
						"id": "beastlord",
						"name": "Володар Звірів",
						"icon": "🦁",
						"desc": "Ліс слухається. Ведмеді теж.",
						"bonus": {
							"hp": 0.12,
							"def": 0.08,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_beastlord_stampede",
								"name": "Стампіда",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Стадо бізонів. Звідки? Не питай.",
								"col": "#ffe6a8",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.49,
								"ticks": 3
							},
							{
								"id": "t_beastlord_wild_heal",
								"name": "Сила природи",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Листя гоїть рани.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.31
							}
						]
					},
					{
						"id": "wind_walker",
						"name": "Мандрівник Вітрів",
						"icon": "🌬️",
						"desc": "Іде туди, куди дме. Влучає туди, куди хоче.",
						"bonus": {
							"crit": 0.04
						},
						"skills": [
							{
								"id": "t_wind_walker_gale_arrows",
								"name": "Стріли бурі",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Вітер несе стріли.",
								"col": "#ffe6a8",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.65,
								"ticks": 3
							},
							{
								"id": "t_wind_walker_tailwind",
								"name": "Попутний вітер",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Додатковий хід.",
								"col": "#ffe6a8",
								"type": "buff",
								"time": 6
							}
						]
					}
				]
			},
			{
				"id": "sniper",
				"name": "Снайпер Ельфів",
				"icon": "🎯",
				"desc": "Один постріл — одна легенда.",
				"bonus": {
					"crit": 0.02
				},
				"skills": [
					{
						"id": "t_sniper_headshot",
						"name": "Хедшот",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Бум. Хедшот.",
						"col": "#ffe6a8",
						"type": "projectile",
						"speed": 620,
						"power": 4.8,
						"r": 14,
						"pierce": 99
					},
					{
						"id": "t_sniper_storm_arrows",
						"name": "Буря стріл",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Небо темніє від стріл. Буквально.",
						"col": "#ffe6a8",
						"type": "aoe_at",
						"radius": 100,
						"power": 1.16,
						"ticks": 3
					}
				],
				"masters": [
					{
						"id": "stargazer",
						"name": "Небесний Стрілець",
						"icon": "🔭",
						"desc": "Влучає у ворогів за горизонтом.",
						"bonus": {
							"crit": 0.04
						},
						"skills": [
							{
								"id": "t_stargazer_railshot",
								"name": "Постріл-комета",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Пробиває все. Навіть стіну таверни.",
								"col": "#ffe6a8",
								"type": "projectile",
								"speed": 620,
								"power": 7.2,
								"r": 14,
								"pierce": 99
							},
							{
								"id": "t_stargazer_volley",
								"name": "Нескінченний залп",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Сагайдак бездонний. Це баг, але приємний.",
								"col": "#ffe6a8",
								"type": "aoe_at",
								"radius": 100,
								"power": 0.6,
								"ticks": 3
							}
						]
					},
					{
						"id": "ghost_sniper",
						"name": "Снайпер-Привид",
						"icon": "👻",
						"desc": "Його не бачать навіть після пострілу.",
						"bonus": {
							"crit": 0.05
						},
						"skills": [
							{
								"id": "t_ghost_sniper_phantom_shot",
								"name": "Примарний постріл",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Звідки?!",
								"col": "#ffe6a8",
								"type": "projectile",
								"speed": 620,
								"power": 7.92,
								"r": 14,
								"pierce": 99
							},
							{
								"id": "t_ghost_sniper_camouflage",
								"name": "Камуфляж",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "+60% ухилення.",
								"col": "#ffe6a8",
								"type": "shield",
								"time": 3,
								"amount": 0.12
							}
						]
					}
				]
			},
			{
				"id": "gunslinger",
				"name": "Стрілець-ковбой",
				"icon": "🤠",
				"desc": "Лук? Застаріло. Гноми продали йому арбалет-револьвер.",
				"bonus": {
					"crit": 0.02
				},
				"skills": [
					{
						"id": "t_gunslinger_quick_draw",
						"name": "Швидкий постріл",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Пиу-пиу-пиу.",
						"col": "#ffe6a8",
						"type": "fan",
						"count": 3,
						"spread": 0.5,
						"speed": 560,
						"power": 0.9
					},
					{
						"id": "t_gunslinger_ricochet",
						"name": "Рикошет",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Стріла б'є всіх по черзі.",
						"col": "#ffe6a8",
						"type": "aoe_at",
						"radius": 100,
						"power": 0.88,
						"ticks": 3
					}
				],
				"masters": [
					{
						"id": "high_noon",
						"name": "Полудень",
						"icon": "🌞",
						"desc": "Щодня о 12:00 хтось падає.",
						"bonus": {
							"crit": 0.04
						},
						"skills": [
							{
								"id": "t_high_noon_deadeye",
								"name": "Мертве око",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Сонце в зеніті. Час стріляти.",
								"col": "#ffe6a8",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.87,
								"ticks": 3
							},
							{
								"id": "t_high_noon_fan_hammer",
								"name": "Віялом",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Вісім пострілів за мить.",
								"col": "#ffe6a8",
								"type": "fan",
								"count": 8,
								"spread": 0.5,
								"speed": 560,
								"power": 0.72
							}
						]
					},
					{
						"id": "siege_master",
						"name": "Майстер Облоги",
						"icon": "🏹",
						"desc": "Стріляє колодами з баліст.",
						"bonus": {
							"atk": 0.1,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_siege_master_ballista",
								"name": "Баліста",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Колода крізь стіну.",
								"col": "#ffe6a8",
								"type": "projectile",
								"speed": 620,
								"power": 7.68,
								"r": 14,
								"pierce": 99
							},
							{
								"id": "t_siege_master_rain_of_fire",
								"name": "Вогняна злива",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Небо палає.",
								"col": "#ffe6a8",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.6,
								"ticks": 3
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Зоряний Стрілець",
			"icon": "🌠",
			"skill": {
				"id": "t_asc_star_arrow",
				"name": "Стріла падучої зірки",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "Загадай бажання, поки вороги падають.",
				"col": "#ffe6a8",
				"type": "meteor",
				"radius": 180,
				"power": 5.46,
				"delay": 0.85
			}
		}
	},
	"mage": {
		"branches": [
			{
				"id": "archmage",
				"name": "Архімаг стихій",
				"icon": "🌋",
				"desc": "Вогонь, лід і блискавка — у одному флаконі.",
				"bonus": {
					"atk": 0.1,
					"mp": 0.15
				},
				"skills": [
					{
						"id": "t_archmage_inferno",
						"name": "Інферно",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Все горить. Навіть твої брови.",
						"col": "#c18cff",
						"type": "cloud",
						"radius": 105,
						"power": 0.69,
						"time": 5
					},
					{
						"id": "t_archmage_blizzard",
						"name": "Хуртовина",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Зима прийшла. Раптово.",
						"col": "#c18cff",
						"type": "aoe_at",
						"radius": 100,
						"power": 1.16,
						"ticks": 3
					}
				],
				"masters": [
					{
						"id": "sage",
						"name": "Великий Мудрець",
						"icon": "📚",
						"desc": "Знає всі заклинання. І всі відповіді на кросворд.",
						"bonus": {
							"atk": 0.16,
							"mp": 0.24
						},
						"skills": [
							{
								"id": "t_sage_elemental_storm",
								"name": "Стихійний шторм",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Все одразу. Без розбору.",
								"col": "#c18cff",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.87,
								"ticks": 3
							},
							{
								"id": "t_sage_time_stop",
								"name": "Зупинка часу",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "ЗА ВАРУДО!",
								"col": "#c18cff",
								"type": "aoe_at",
								"radius": 100,
								"power": 0.6,
								"ticks": 3
							}
						]
					},
					{
						"id": "elementalist",
						"name": "Повелитель Стихій",
						"icon": "🌋",
						"desc": "Вулкани слухаються його. Метеорологи — ні.",
						"bonus": {
							"hp": 0.06,
							"atk": 0.16,
							"mp": 0.24,
							"def": 0.04
						},
						"skills": [
							{
								"id": "t_elementalist_volcano",
								"name": "Виверження",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Лава на всіх.",
								"col": "#c18cff",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.98,
								"ticks": 3
							},
							{
								"id": "t_elementalist_absolute_zero",
								"name": "Абсолютний нуль",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "-273 градуси.",
								"col": "#c18cff",
								"type": "projectile",
								"speed": 620,
								"power": 6.72,
								"r": 14,
								"pierce": 99
							}
						]
					}
				]
			},
			{
				"id": "necro",
				"name": "Некромант",
				"icon": "💀",
				"desc": "Друзі в тебе є. Просто трохи мертві.",
				"bonus": {
					"hp": 0.06,
					"atk": 0.06,
					"mp": 0.09,
					"def": 0.04
				},
				"skills": [
					{
						"id": "t_necro_soul_drain",
						"name": "Висмоктування душі",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Шкода лікує тебе.",
						"col": "#c18cff",
						"type": "projectile",
						"speed": 620,
						"power": 2.88,
						"r": 10,
						"pierce": 0
					},
					{
						"id": "t_necro_bone_army",
						"name": "Кістяна армія",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Скелети виходять із землі і дуже стараються.",
						"col": "#c18cff",
						"type": "aoe_at",
						"radius": 100,
						"power": 0.88,
						"ticks": 3
					}
				],
				"masters": [
					{
						"id": "lich_lord",
						"name": "Лорд-Ліч",
						"icon": "☠️",
						"desc": "Смерть — це лише кар'єрний ріст.",
						"bonus": {
							"hp": 0.12,
							"atk": 0.12,
							"mp": 0.18,
							"def": 0.08
						},
						"skills": [
							{
								"id": "t_lich_lord_death_wave",
								"name": "Хвиля смерті",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Кожен удар лікує тебе.",
								"col": "#c18cff",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.54,
								"ticks": 3
							},
							{
								"id": "t_lich_lord_bone_dragon",
								"name": "Кістяний дракон",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Дракон зі скелетів. Скриплячий, але грізний.",
								"col": "#c18cff",
								"type": "projectile",
								"speed": 620,
								"power": 7.44,
								"r": 14,
								"pierce": 99
							}
						]
					},
					{
						"id": "bone_king",
						"name": "Кістяний Король",
						"icon": "🦴",
						"desc": "Трон із черепів. Незручний, зате стильний.",
						"bonus": {
							"hp": 0.18,
							"atk": 0.12,
							"mp": 0.18,
							"def": 0.12
						},
						"skills": [
							{
								"id": "t_bone_king_skeleton_army",
								"name": "Армія скелетів",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Деренчать і б'ють.",
								"col": "#c18cff",
								"type": "aoe_at",
								"radius": 100,
								"power": 0.6,
								"ticks": 3
							},
							{
								"id": "t_bone_king_bone_armor",
								"name": "Кістяні лати",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Захист з кісток.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.31
							}
						]
					}
				]
			},
			{
				"id": "chronomancer",
				"name": "Хрономант",
				"icon": "⏳",
				"desc": "Керує часом. Все одно запізнюється.",
				"bonus": {
					"atk": 0.08,
					"mp": 0.12,
					"crit": 0.01
				},
				"skills": [
					{
						"id": "t_chronomancer_slow",
						"name": "Сповільнення",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Вороги в сиропі.",
						"col": "#c18cff",
						"type": "aoe_at",
						"radius": 100,
						"power": 0.6,
						"ticks": 3
					},
					{
						"id": "t_chronomancer_rewind",
						"name": "Перемотка",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Рани? Їх ще не було.",
						"col": "#9dffb0",
						"type": "heal",
						"amount": 0.31
					}
				],
				"masters": [
					{
						"id": "time_lord",
						"name": "Володар Часу",
						"icon": "⌛",
						"desc": "Прожив цей бій уже 400 разів. Знає, чим скінчиться.",
						"bonus": {
							"atk": 0.16,
							"mp": 0.24,
							"crit": 0.01
						},
						"skills": [
							{
								"id": "t_time_lord_time_skip",
								"name": "Стрибок у часі",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Ходиш двічі. Тричі.",
								"col": "#c18cff",
								"type": "buff",
								"time": 6
							},
							{
								"id": "t_time_lord_age_decay",
								"name": "Тлін віків",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Тисяча років за мить.",
								"col": "#c18cff",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.87,
								"ticks": 3
							}
						]
					},
					{
						"id": "paradox",
						"name": "Парадокс",
						"icon": "♾️",
						"desc": "Існує у двох місцях. Платить податки в одному.",
						"bonus": {
							"atk": 0.14,
							"mp": 0.21,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_paradox_double_cast",
								"name": "Подвійне закляття",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Минуле і майбутнє б'ють разом.",
								"col": "#c18cff",
								"type": "projectile",
								"speed": 620,
								"power": 6.72,
								"r": 10,
								"pierce": 0
							},
							{
								"id": "t_paradox_loop",
								"name": "Часова петля",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Вороги застрягли в понеділку.",
								"col": "#c18cff",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.32,
								"ticks": 3
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Чарівник Кінця Світу",
			"icon": "🪐",
			"skill": {
				"id": "t_asc_big_bang",
				"name": "ВЕЛИКИЙ ВИБУХ",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "EXPLOSION!!! Після цього треба полежати.",
				"col": "#c18cff",
				"type": "meteor",
				"radius": 180,
				"power": 7.1,
				"delay": 0.85
			}
		}
	},
	"priest": {
		"branches": [
			{
				"id": "saint",
				"name": "Свята",
				"icon": "😇",
				"desc": "Німб, сяйво і алергія на гріхи.",
				"bonus": {
					"hp": 0.09,
					"atk": 0.06,
					"mp": 0.09,
					"def": 0.06
				},
				"skills": [
					{
						"id": "t_saint_sanctuary",
						"name": "Святилище",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Велике лікування + щит.",
						"col": "#9dffb0",
						"type": "heal",
						"amount": 0.36
					},
					{
						"id": "t_saint_purify",
						"name": "Очищення",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Нежить вибухає конфетті.",
						"col": "#fff2a0",
						"type": "nova",
						"radius": 115,
						"power": 2.16
					}
				],
				"masters": [
					{
						"id": "archsaint",
						"name": "Архісвята",
						"icon": "🕊️",
						"desc": "Воскрешає. Навіть настрій.",
						"bonus": {
							"hp": 0.15,
							"atk": 0.12,
							"mp": 0.18,
							"def": 0.1
						},
						"skills": [
							{
								"id": "t_archsaint_miracle",
								"name": "Диво",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Повне зцілення і регенерація.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.45
							},
							{
								"id": "t_archsaint_holy_nova",
								"name": "Свята нова",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Світло з усіх боків.",
								"col": "#fff2a0",
								"type": "nova",
								"radius": 115,
								"power": 3.6
							}
						]
					},
					{
						"id": "angel",
						"name": "Ангел-Хоронитель",
						"icon": "😇",
						"desc": "Справжні крила. Справжній німб. Трохи пафосу.",
						"bonus": {
							"hp": 0.18,
							"atk": 0.12,
							"mp": 0.18,
							"def": 0.12
						},
						"skills": [
							{
								"id": "t_angel_angel_wings",
								"name": "Ангельські крила",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Крила обіймають загін.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.45
							},
							{
								"id": "t_angel_heaven_gate",
								"name": "Небесна брама",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Світло з брами.",
								"col": "#fff2a0",
								"type": "nova",
								"radius": 115,
								"power": 3.6
							}
						]
					}
				]
			},
			{
				"id": "battlepriest",
				"name": "Бойовий Інквізитор",
				"icon": "🔨",
				"desc": "Молитва і молот. Здебільшого молот.",
				"bonus": {
					"hp": 0.03,
					"atk": 0.1,
					"mp": 0.06,
					"def": 0.02
				},
				"skills": [
					{
						"id": "t_battlepriest_holy_hammer",
						"name": "Молот правосуддя",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Аргумент, проти якого не посперечаєшся.",
						"col": "#fff2a0",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 3.75,
						"knock": 460
					},
					{
						"id": "t_battlepriest_zeal",
						"name": "Фанатизм",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "+70% атаки.",
						"col": "#fff2a0",
						"type": "buff",
						"time": 6
					}
				],
				"masters": [
					{
						"id": "hammer_saint",
						"name": "Молот Небес",
						"icon": "⚒️",
						"desc": "Проповідь з розмаху.",
						"bonus": {
							"atk": 0.2,
							"mp": 0.12
						},
						"skills": [
							{
								"id": "t_hammer_saint_heaven_hammer",
								"name": "Небесний молот",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Молот падає з неба. Тільки на поганих.",
								"col": "#fff2a0",
								"type": "nova",
								"radius": 115,
								"power": 3.84,
								"slow": 2
							},
							{
								"id": "t_hammer_saint_crusade",
								"name": "Священний похід",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "+100% атаки.",
								"col": "#fff2a0",
								"type": "buff",
								"time": 6
							}
						]
					},
					{
						"id": "inquisitor",
						"name": "Інквізитор",
						"icon": "🔥",
						"desc": "Ніхто не чекає інквізиції.",
						"bonus": {
							"atk": 0.22,
							"mp": 0.18
						},
						"skills": [
							{
								"id": "t_inquisitor_purge",
								"name": "Очищення вогнем",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Єресь горить.",
								"col": "#fff2a0",
								"type": "nova",
								"radius": 115,
								"power": 3.72
							},
							{
								"id": "t_inquisitor_verdict",
								"name": "Вердикт",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Винен.",
								"col": "#fff2a0",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 7.25,
								"knock": 300
							}
						]
					}
				]
			},
			{
				"id": "oracle",
				"name": "Оракул",
				"icon": "👁️",
				"desc": "Бачить майбутнє. Майбутнє бачить її і нервує.",
				"bonus": {
					"atk": 0.06,
					"mp": 0.09,
					"crit": 0.01
				},
				"skills": [
					{
						"id": "t_oracle_foresight",
						"name": "Передбачення",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Знаєш, куди вдарять.",
						"col": "#fff2a0",
						"type": "shield",
						"time": 3,
						"amount": 0.12
					},
					{
						"id": "t_oracle_fate_ray",
						"name": "Промінь долі",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Доля б'є прицільно.",
						"col": "#fff2a0",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 4,
						"knock": 300
					}
				],
				"masters": [
					{
						"id": "prophet",
						"name": "Пророчиця Зірок",
						"icon": "🌌",
						"desc": "Зірки шепочуть їй плітки про ворогів.",
						"bonus": {
							"atk": 0.14,
							"mp": 0.21,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_prophet_starfall",
								"name": "Зорепад",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Падають зірки. Бажання — перемогти.",
								"col": "#fff2a0",
								"type": "nova",
								"radius": 115,
								"power": 3.96
							},
							{
								"id": "t_prophet_blessed_path",
								"name": "Благословенний шлях",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Лікування і щастя.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.38
							}
						]
					},
					{
						"id": "doom_seer",
						"name": "Провидиця Кінця",
						"icon": "🕯️",
						"desc": "Передбачила твою поразку. Тепер ображається, що помилилась.",
						"bonus": {
							"hp": 0.09,
							"atk": 0.16,
							"mp": 0.24,
							"def": 0.06
						},
						"skills": [
							{
								"id": "t_doom_seer_last_rites",
								"name": "Останні обряди",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Вирок неба.",
								"col": "#fff2a0",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 7.25,
								"knock": 300
							},
							{
								"id": "t_doom_seer_omen",
								"name": "Лиха прикмета",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Чорний кіт перебіг дорогу. Всім.",
								"col": "#fff2a0",
								"type": "cloud",
								"radius": 105,
								"power": 0.48,
								"time": 5
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Аватар Богині",
			"icon": "👼",
			"skill": {
				"id": "t_asc_goddess_descent",
				"name": "Сходження Люмі",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "Люмі особисто приходить і б'є всіх сумочкою.",
				"col": "#fff2a0",
				"type": "meteor",
				"radius": 180,
				"power": 4.92,
				"delay": 0.85
			}
		}
	},
	"rogue": {
		"branches": [
			{
				"id": "shadowblade",
				"name": "Тіньовий клинок",
				"icon": "🌘",
				"desc": "Тебе не видно. Твого рахунку в таверні теж.",
				"bonus": {
					"crit": 0.02
				},
				"skills": [
					{
						"id": "t_shadowblade_execute",
						"name": "Страта",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Утричі сильніше по ворогах з <30% HP.",
						"col": "#8c6bff",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 3.75,
						"knock": 300
					},
					{
						"id": "t_shadowblade_smoke",
						"name": "Димова бомба",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Пуф! І ти вже не тут.",
						"col": "#8c6bff",
						"type": "nova",
						"radius": 115,
						"power": 0.96,
						"slow": 2
					}
				],
				"masters": [
					{
						"id": "reaper",
						"name": "Жнець Тіней",
						"icon": "⚰️",
						"desc": "Приходить по душі. І по чайові.",
						"bonus": {
							"crit": 0.04
						},
						"skills": [
							{
								"id": "t_reaper_soul_reap",
								"name": "Жнива душ",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Добиває слабких.",
								"col": "#8c6bff",
								"type": "nova",
								"radius": 115,
								"power": 3.12
							},
							{
								"id": "t_reaper_shadow_clone",
								"name": "Тіньові клони",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Дев'ять тебе. Мама була б у шоці.",
								"col": "#8c6bff",
								"type": "fan",
								"count": 9,
								"spread": 1.2,
								"speed": 560,
								"power": 0.72
							}
						]
					},
					{
						"id": "night_dancer",
						"name": "Танцівник Ночі",
						"icon": "🌙",
						"desc": "Ріже під місячним світлом. Під сонячним — спить.",
						"bonus": {
							"crit": 0.04
						},
						"skills": [
							{
								"id": "t_night_dancer_moon_waltz",
								"name": "Місячний вальс",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Раз-два-три, раз-два-ріж.",
								"col": "#8c6bff",
								"type": "nova",
								"radius": 115,
								"power": 1.2
							},
							{
								"id": "t_night_dancer_eclipse_step",
								"name": "Крок затемнення",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "+60% криту.",
								"col": "#8c6bff",
								"type": "buff",
								"time": 6
							}
						]
					}
				]
			},
			{
				"id": "thief",
				"name": "Король злодіїв",
				"icon": "👑",
				"desc": "Що твоє — моє. Що моє — теж моє.",
				"bonus": {
					"crit": 0.03
				},
				"skills": [
					{
						"id": "t_thief_grand_heist",
						"name": "Велике пограбування",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Обкрадає всіх ворогів одразу.",
						"col": "#8c6bff",
						"type": "nova",
						"radius": 115,
						"power": 1.68
					},
					{
						"id": "t_thief_lucky7",
						"name": "Щаслива сімка",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Сім ударів, шкода росте з удачею.",
						"col": "#8c6bff",
						"type": "fan",
						"count": 7,
						"spread": 1.2,
						"speed": 560,
						"power": 0.63
					}
				],
				"masters": [
					{
						"id": "phantom",
						"name": "Фантомний Злодій",
						"icon": "🎩",
						"desc": "Краде серця. Буквально — ні. Метафорично — так.",
						"bonus": {
							"crit": 0.05
						},
						"skills": [
							{
								"id": "t_phantom_jackpot",
								"name": "Джекпот",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Все золото світу — твоє. Ну, частина.",
								"col": "#8c6bff",
								"type": "nova",
								"radius": 115,
								"power": 2.28
							},
							{
								"id": "t_phantom_calling_card",
								"name": "Візитна картка",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Попередив — значить, переміг.",
								"col": "#8c6bff",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 5.75,
								"knock": 300
							}
						]
					},
					{
						"id": "guild_master_thief",
						"name": "Голова Гільдії Злодіїв",
						"icon": "🗝️",
						"desc": "Має ключ від усіх дверей. І від твоїх.",
						"bonus": {
							"crit": 0.05
						},
						"skills": [
							{
								"id": "t_guild_master_thief_grand_heist",
								"name": "Велике пограбування",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "План ідеальний.",
								"col": "#8c6bff",
								"type": "nova",
								"radius": 115,
								"power": 3.12
							},
							{
								"id": "t_guild_master_thief_lockpick_stab",
								"name": "Відмичка в ребро",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Відчинив броню.",
								"col": "#8c6bff",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 6.5,
								"knock": 300
							}
						]
					}
				]
			},
			{
				"id": "pirate_rogue",
				"name": "Корсар",
				"icon": "🏴‍☠️",
				"desc": "Йо-хо-хо, абордаж і чужий ром.",
				"bonus": {
					"atk": 0.04,
					"crit": 0.02
				},
				"skills": [
					{
						"id": "t_pirate_rogue_cutlass_flurry",
						"name": "Шквал абордажника",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Ріже як вітер в щоглах.",
						"col": "#8c6bff",
						"type": "fan",
						"count": 4,
						"spread": 1.2,
						"speed": 560,
						"power": 0.81
					},
					{
						"id": "t_pirate_rogue_grog",
						"name": "Ковток грогу",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Хоробрість у пляшці.",
						"col": "#9dffb0",
						"type": "heal",
						"amount": 0.28
					}
				],
				"masters": [
					{
						"id": "pirate_king",
						"name": "Король Піратів",
						"icon": "👑",
						"desc": "Мріє знайти скарб. Скарб ховається.",
						"bonus": {
							"crit": 0.05
						},
						"skills": [
							{
								"id": "t_pirate_king_cannon_barrage",
								"name": "Залп гармат",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "БАБАХ з усіх бортів.",
								"col": "#8c6bff",
								"type": "nova",
								"radius": 115,
								"power": 3.84
							},
							{
								"id": "t_pirate_king_treasure_hunt",
								"name": "Полювання за скарбом",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Твоє — моє.",
								"col": "#8c6bff",
								"type": "nova",
								"radius": 115,
								"power": 2.4
							}
						]
					},
					{
						"id": "sea_ghost",
						"name": "Морський Привид",
						"icon": "👻",
						"desc": "Затонув, але передумав.",
						"bonus": {
							"atk": 0.06,
							"mp": 0.09,
							"crit": 0.03
						},
						"skills": [
							{
								"id": "t_sea_ghost_drown",
								"name": "Холодні глибини",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Вода звідусіль.",
								"col": "#8c6bff",
								"type": "nova",
								"radius": 115,
								"power": 3.36,
								"slow": 3
							},
							{
								"id": "t_sea_ghost_ghost_ship",
								"name": "Корабель-привид",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Протаранив крізь туман.",
								"col": "#8c6bff",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 7.5,
								"knock": 300
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Безликий",
			"icon": "🎭",
			"skill": {
				"id": "t_asc_void_step",
				"name": "Крок у порожнечу",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "Ніхто не бачив. Ніхто не вижив. Ніхто не платив.",
				"col": "#8c6bff",
				"type": "meteor",
				"radius": 180,
				"power": 4.37,
				"delay": 0.85
			}
		}
	},
	"berserker": {
		"branches": [
			{
				"id": "warlord",
				"name": "Вождь Війни",
				"icon": "🪖",
				"desc": "Лідер, що б'є першим.",
				"bonus": {
					"hp": 0.09,
					"atk": 0.08,
					"def": 0.06
				},
				"skills": [
					{
						"id": "t_warlord_war_stomp",
						"name": "Бойове тупотіння",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Тупіт, від якого дрижать гори.",
						"col": "#ff7a5a",
						"type": "nova",
						"radius": 115,
						"power": 2.4,
						"slow": 2
					},
					{
						"id": "t_warlord_iron_will",
						"name": "Залізна воля",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "+120% захисту.",
						"col": "#ff7a5a",
						"type": "shield",
						"time": 3,
						"amount": 0.12
					}
				],
				"masters": [
					{
						"id": "titan",
						"name": "Титан",
						"icon": "🗿",
						"desc": "Розміром з гору. Інтелектом — з камінь.",
						"bonus": {
							"hp": 0.18,
							"atk": 0.16,
							"def": 0.12
						},
						"skills": [
							{
								"id": "t_titan_titan_smash",
								"name": "Удар титана",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Кратер на пів мапи.",
								"col": "#ff7a5a",
								"type": "nova",
								"radius": 115,
								"power": 4.08
							},
							{
								"id": "t_titan_unbreakable",
								"name": "Незламність",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Ніхто не ламається.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.36
							}
						]
					},
					{
						"id": "conqueror",
						"name": "Завойовник",
						"icon": "🗺️",
						"desc": "Мапа світу — його список справ.",
						"bonus": {
							"hp": 0.15,
							"atk": 0.14,
							"def": 0.1
						},
						"skills": [
							{
								"id": "t_conqueror_conquest",
								"name": "Завоювання",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Захоплено!",
								"col": "#ff7a5a",
								"type": "nova",
								"radius": 115,
								"power": 3.84,
								"slow": 2
							},
							{
								"id": "t_conqueror_war_banner",
								"name": "Бойовий стяг",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "За прапором — у бій!",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.32
							}
						]
					}
				]
			},
			{
				"id": "bloodrager",
				"name": "Кривавий Шаленець",
				"icon": "🩸",
				"desc": "Що менше здоров'я — то більше проблем у ворогів.",
				"bonus": {
					"atk": 0.12
				},
				"skills": [
					{
						"id": "t_bloodrager_reckless",
						"name": "Безрозсудний удар",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Захист? Не чув.",
						"col": "#ff7a5a",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 4.25,
						"knock": 300
					},
					{
						"id": "t_bloodrager_blood_rain",
						"name": "Кривавий дощ",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Лікуєшся від кожного удару.",
						"col": "#ff7a5a",
						"type": "nova",
						"radius": 115,
						"power": 2.16
					}
				],
				"masters": [
					{
						"id": "demon_slayer",
						"name": "Вбивця Демонів",
						"icon": "👹",
						"desc": "Найняли демони, щоб знищити демонів. Іронія.",
						"bonus": {
							"atk": 0.16,
							"crit": 0.01
						},
						"skills": [
							{
								"id": "t_demon_slayer_hell_cleave",
								"name": "Пекельний розруб",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Демони спеціально бояться.",
								"col": "#ff7a5a",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 7.5,
								"knock": 300
							},
							{
								"id": "t_demon_slayer_frenzy_storm",
								"name": "Шторм шаленства",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Сокири всюди.",
								"col": "#ff7a5a",
								"type": "nova",
								"radius": 115,
								"power": 1.44
							}
						]
					},
					{
						"id": "blood_god",
						"name": "Кривавий Бог",
						"icon": "🩸",
						"desc": "Вже не людина. Ще не бог. Вже дуже злий.",
						"bonus": {
							"hp": 0.06,
							"atk": 0.18,
							"def": 0.04
						},
						"skills": [
							{
								"id": "t_blood_god_blood_nova",
								"name": "Кривава нова",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Вибух люті.",
								"col": "#ff7a5a",
								"type": "nova",
								"radius": 115,
								"power": 3.84
							},
							{
								"id": "t_blood_god_berserk_final",
								"name": "Останній шал",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Нічого не тримає.",
								"col": "#ff7a5a",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 8,
								"knock": 300
							}
						]
					}
				]
			},
			{
				"id": "beast_warrior",
				"name": "Воїн-Звір",
				"icon": "🐻",
				"desc": "Ведмежа шкура, ведмежа сила, ведмежий апетит.",
				"bonus": {
					"hp": 0.09,
					"atk": 0.08,
					"def": 0.06
				},
				"skills": [
					{
						"id": "t_beast_warrior_maul",
						"name": "Розтерзати",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Кігті й зуби.",
						"col": "#ff7a5a",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 3.5,
						"knock": 300
					},
					{
						"id": "t_beast_warrior_roar",
						"name": "Звіриний рик",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "РРРАААР!",
						"col": "#ff7a5a",
						"type": "nova",
						"radius": 115,
						"power": 0.96,
						"slow": 2
					}
				],
				"masters": [
					{
						"id": "were_king",
						"name": "Король Перевертнів",
						"icon": "🌕",
						"desc": "Повний місяць — його вихідний.",
						"bonus": {
							"atk": 0.16,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_were_king_moon_frenzy",
								"name": "Місячний шал",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Вовк у тобі вирвався.",
								"col": "#ff7a5a",
								"type": "nova",
								"radius": 115,
								"power": 1.32
							},
							{
								"id": "t_were_king_alpha_howl",
								"name": "Виття вожака",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Зграя готова.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.32
							}
						]
					},
					{
						"id": "ancient_bear",
						"name": "Прадавній Ведмідь",
						"icon": "🐻‍❄️",
						"desc": "Бурий, білий, і просто дуже великий.",
						"bonus": {
							"hp": 0.24,
							"atk": 0.12,
							"def": 0.16
						},
						"skills": [
							{
								"id": "t_ancient_bear_hibernate",
								"name": "Сплячка",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Поспав — і як новий.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.42
							},
							{
								"id": "t_ancient_bear_bear_slam",
								"name": "Ведмежий гуп",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Всією вагою.",
								"col": "#ff7a5a",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 8,
								"knock": 300
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Бог Війни",
			"icon": "⚡",
			"skill": {
				"id": "t_asc_ragnarok",
				"name": "РАГНАРЬОК",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "Кінець світу (локальний).",
				"col": "#ff7a5a",
				"type": "meteor",
				"radius": 180,
				"power": 7.21,
				"delay": 0.85
			}
		}
	},
	"paladin": {
		"branches": [
			{
				"id": "guardian",
				"name": "Вартовий фортеці",
				"icon": "🏰",
				"desc": "Стіна. Жива. Говорить.",
				"bonus": {
					"hp": 0.18,
					"def": 0.12
				},
				"skills": [
					{
						"id": "t_guardian_taunt",
						"name": "Провокація",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Вороги б'ють тільки тебе (і з меншою силою).",
						"col": "#ffe27a",
						"type": "shield",
						"time": 3,
						"amount": 0.12
					},
					{
						"id": "t_guardian_fortress",
						"name": "Живa фортеця",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "+200% захисту.",
						"col": "#ffe27a",
						"type": "shield",
						"time": 3,
						"amount": 0.12
					}
				],
				"masters": [
					{
						"id": "bastion",
						"name": "Бастіон",
						"icon": "🗻",
						"desc": "Гора, що ходить і тримає щит.",
						"bonus": {
							"hp": 0.27,
							"atk": 0.04,
							"def": 0.18
						},
						"skills": [
							{
								"id": "t_bastion_earthwall",
								"name": "Земляна стіна",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Стіна для всієї команди.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.3
							},
							{
								"id": "t_bastion_shield_nova",
								"name": "Удар щитом-метеором",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Щит теж зброя.",
								"col": "#ffe27a",
								"type": "nova",
								"radius": 115,
								"power": 2.76,
								"slow": 2
							}
						]
					},
					{
						"id": "aegis_lord",
						"name": "Володар Егіди",
						"icon": "🔰",
						"desc": "Щит такий великий, що в ньому живе родина.",
						"bonus": {
							"hp": 0.27,
							"atk": 0.06,
							"mp": 0.09,
							"def": 0.18
						},
						"skills": [
							{
								"id": "t_aegis_lord_reflect",
								"name": "Віддзеркалення",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Удар повертається.",
								"col": "#ffe27a",
								"type": "shield",
								"time": 3,
								"amount": 0.12
							},
							{
								"id": "t_aegis_lord_fortress",
								"name": "Фортеця",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Загін — у фортеці.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.36
							}
						]
					}
				]
			},
			{
				"id": "crusader",
				"name": "Хрестоносець",
				"icon": "⚜️",
				"desc": "У поході проти зла. І проти поганих манер.",
				"bonus": {
					"hp": 0.06,
					"atk": 0.08,
					"def": 0.04
				},
				"skills": [
					{
						"id": "t_crusader_smite",
						"name": "Кара",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Святий удар з неба.",
						"col": "#ffe27a",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 4,
						"knock": 300
					},
					{
						"id": "t_crusader_aura",
						"name": "Аура мужності",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Лікування і +35% атаки команди.",
						"col": "#9dffb0",
						"type": "heal",
						"amount": 0.25
					}
				],
				"masters": [
					{
						"id": "templar",
						"name": "Великий Тамплієр",
						"icon": "✝️",
						"desc": "Віра, сталь і дуже серйозний вираз обличчя.",
						"bonus": {
							"hp": 0.12,
							"atk": 0.12,
							"def": 0.08
						},
						"skills": [
							{
								"id": "t_templar_judgement_blade",
								"name": "Клинок суду",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Вирок остаточний.",
								"col": "#ffe27a",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 6.25,
								"knock": 300
							},
							{
								"id": "t_templar_holy_storm",
								"name": "Свята буря",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Грім з неба і з голосу.",
								"col": "#ffe27a",
								"type": "nova",
								"radius": 115,
								"power": 3.12
							}
						]
					},
					{
						"id": "holy_avenger",
						"name": "Святий Месник",
						"icon": "⚡",
						"desc": "Помста — святе діло.",
						"bonus": {
							"atk": 0.14,
							"crit": 0.01
						},
						"skills": [
							{
								"id": "t_holy_avenger_avenge",
								"name": "Відплата",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "За всіх скривджених.",
								"col": "#ffe27a",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 7.25,
								"knock": 300
							},
							{
								"id": "t_holy_avenger_holy_cross",
								"name": "Святий хрест",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Хрестовий удар з неба.",
								"col": "#ffe27a",
								"type": "nova",
								"radius": 115,
								"power": 3.6
							}
						]
					}
				]
			},
			{
				"id": "sun_knight",
				"name": "Лицар Сонця",
				"icon": "☀️",
				"desc": "Сяє так, що вороги просять сонцезахисні окуляри.",
				"bonus": {
					"hp": 0.03,
					"atk": 0.1,
					"mp": 0.06,
					"def": 0.02
				},
				"skills": [
					{
						"id": "t_sun_knight_solar_strike",
						"name": "Сонячний удар",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Тепло й боляче.",
						"col": "#ffe27a",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 4,
						"knock": 300
					},
					{
						"id": "t_sun_knight_dawn_ward",
						"name": "Охорона світанку",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Перший промінь захищає.",
						"col": "#9dffb0",
						"type": "heal",
						"amount": 0.29
					}
				],
				"masters": [
					{
						"id": "solar_emperor",
						"name": "Сонячний Імператор",
						"icon": "🌞",
						"desc": "Сонце сходить, коли він прокидається. Або навпаки.",
						"bonus": {
							"hp": 0.15,
							"atk": 0.12,
							"def": 0.1
						},
						"skills": [
							{
								"id": "t_solar_emperor_supernova",
								"name": "Наднова",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Зірка вибухає поруч.",
								"col": "#ffe27a",
								"type": "nova",
								"radius": 115,
								"power": 4.2
							},
							{
								"id": "t_solar_emperor_eternal_noon",
								"name": "Вічний полудень",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Тінь не наступить.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.4
							}
						]
					},
					{
						"id": "eclipse_knight",
						"name": "Лицар Затемнення",
						"icon": "🌘",
						"desc": "Світло й темрява в одних латах.",
						"bonus": {
							"atk": 0.22,
							"mp": 0.12
						},
						"skills": [
							{
								"id": "t_eclipse_knight_eclipse_blade",
								"name": "Клинок затемнення",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Світло гасне, рани гояться.",
								"col": "#ffe27a",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 7.25,
								"knock": 300
							},
							{
								"id": "t_eclipse_knight_corona",
								"name": "Корона",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Кільце вогню навколо.",
								"col": "#ffe27a",
								"type": "nova",
								"radius": 115,
								"power": 3.36
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Небесний Страж",
			"icon": "🛡️",
			"skill": {
				"id": "t_asc_heaven_wall",
				"name": "Небесна стіна",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "Веселкова стіна, яку не пробити.",
				"col": "#9dffb0",
				"type": "heal",
				"amount": 0.42
			}
		}
	},
	"monk": {
		"branches": [
			{
				"id": "dragonfist",
				"name": "Кулак Дракона",
				"icon": "🐉",
				"desc": "Кулаки горять. Буквально. Купи рукавиці.",
				"bonus": {
					"atk": 0.08,
					"crit": 0.01
				},
				"skills": [
					{
						"id": "t_dragonfist_dragon_fist",
						"name": "Драконячий кулак",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Вогняний апперкот.",
						"col": "#ffb36e",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 4,
						"knock": 300
					},
					{
						"id": "t_dragonfist_tornado_kick",
						"name": "Торнадо-удар",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Крутишся як дзиґа. Дуже боляче дзиґа.",
						"col": "#ffb36e",
						"type": "nova",
						"radius": 115,
						"power": 2.28
					}
				],
				"masters": [
					{
						"id": "dragon_emperor",
						"name": "Імператор Драконів",
						"icon": "🐲",
						"desc": "Кулак, що дихає вогнем.",
						"bonus": {
							"atk": 0.14,
							"crit": 0.01
						},
						"skills": [
							{
								"id": "t_dragon_emperor_dragon_rush",
								"name": "Драконячий ривок",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Вогняний ураган кулаків.",
								"col": "#ffb36e",
								"type": "nova",
								"radius": 115,
								"power": 3.36
							},
							{
								"id": "t_dragon_emperor_dragon_soul",
								"name": "Душа дракона",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "+90% атаки.",
								"col": "#ffb36e",
								"type": "buff",
								"time": 6
							}
						]
					},
					{
						"id": "tiger_crane",
						"name": "Тигр і Журавель",
						"icon": "🐯",
						"desc": "Два стилі. Одна людина. Нуль шансів у ворога.",
						"bonus": {
							"atk": 0.12,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_tiger_crane_tiger_claw",
								"name": "Кіготь тигра",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Шість швидких ударів.",
								"col": "#ffb36e",
								"type": "fan",
								"count": 6,
								"spread": 1.2,
								"speed": 560,
								"power": 0.81
							},
							{
								"id": "t_tiger_crane_crane_wings",
								"name": "Крила журавля",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Красиво й боляче.",
								"col": "#ffb36e",
								"type": "nova",
								"radius": 115,
								"power": 3.36,
								"slow": 2
							}
						]
					}
				]
			},
			{
				"id": "zen",
				"name": "Майстер Дзен",
				"icon": "🧘",
				"desc": "Сидить. Медитує. Перемагає.",
				"bonus": {
					"hp": 0.09,
					"atk": 0.04,
					"mp": 0.06,
					"def": 0.06
				},
				"skills": [
					{
						"id": "t_zen_nirvana",
						"name": "Нірвана",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Глибокий спокій лікує всіх.",
						"col": "#9dffb0",
						"type": "heal",
						"amount": 0.32
					},
					{
						"id": "t_zen_pressure_point",
						"name": "Точки тиску",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Тицьнув — і ворог завис.",
						"col": "#ffb36e",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 2.75,
						"knock": 460
					}
				],
				"masters": [
					{
						"id": "buddha",
						"name": "Просвітлений",
						"icon": "🪷",
						"desc": "Сидить так спокійно, що вороги засинають.",
						"bonus": {
							"hp": 0.15,
							"atk": 0.08,
							"mp": 0.12,
							"def": 0.1,
							"crit": 0.01
						},
						"skills": [
							{
								"id": "t_buddha_lotus_palm",
								"name": "Долоня лотоса",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Тисяча долонь з неба.",
								"col": "#ffb36e",
								"type": "nova",
								"radius": 115,
								"power": 3.12
							},
							{
								"id": "t_buddha_inner_peace",
								"name": "Внутрішній спокій",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Глибокий спокій лікує і захищає.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.38
							}
						]
					},
					{
						"id": "void_monk",
						"name": "Монах Порожнечі",
						"icon": "⚪",
						"desc": "Досяг нірвани. Повернувся по забуті капці.",
						"bonus": {
							"hp": 0.18,
							"atk": 0.12,
							"mp": 0.18,
							"def": 0.12
						},
						"skills": [
							{
								"id": "t_void_monk_emptiness",
								"name": "Порожнеча",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Нічого не залишилось.",
								"col": "#ffb36e",
								"type": "nova",
								"radius": 115,
								"power": 3.6
							},
							{
								"id": "t_void_monk_meditation",
								"name": "Глибока медитація",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Всі спокійні й здорові.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.42
							}
						]
					}
				]
			},
			{
				"id": "drunken_master",
				"name": "П'яний Майстер",
				"icon": "🍶",
				"desc": "Хитається, падає, перемагає. Ніхто не розуміє як.",
				"bonus": {
					"hp": 0.06,
					"def": 0.04,
					"crit": 0.02
				},
				"skills": [
					{
						"id": "t_drunken_master_stagger_fist",
						"name": "Хиткий кулак",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Промахнувся навмисно. Влучив випадково.",
						"col": "#ffb36e",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 3.25,
						"knock": 300
					},
					{
						"id": "t_drunken_master_sake_spray",
						"name": "Фонтан саке",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Пфф! Вороги в шоці.",
						"col": "#ffb36e",
						"type": "nova",
						"radius": 115,
						"power": 1.68,
						"slow": 2
					}
				],
				"masters": [
					{
						"id": "immortal_drunk",
						"name": "Безсмертний Пияк",
						"icon": "🏮",
						"desc": "Пережив три драконів і дванадцять похмільних ранків.",
						"bonus": {
							"hp": 0.18,
							"def": 0.12,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_immortal_drunk_eight_immortals",
								"name": "Вісім безсмертних",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Вісім стилів п'яного кулака.",
								"col": "#ffb36e",
								"type": "fan",
								"count": 8,
								"spread": 1.2,
								"speed": 560,
								"power": 0.72
							},
							{
								"id": "t_immortal_drunk_hangover_cure",
								"name": "Ліки від похмілля",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Найсильніша магія світу.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.37
							}
						]
					},
					{
						"id": "iron_body",
						"name": "Залізне Тіло",
						"icon": "🦾",
						"desc": "Об нього ламаються мечі й самооцінка.",
						"bonus": {
							"hp": 0.24,
							"atk": 0.08,
							"def": 0.16
						},
						"skills": [
							{
								"id": "t_iron_body_diamond_skin",
								"name": "Діамантова шкіра",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "+200% захисту.",
								"col": "#ffb36e",
								"type": "shield",
								"time": 3,
								"amount": 0.12
							},
							{
								"id": "t_iron_body_mountain_palm",
								"name": "Долоня-гора",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Гора падає на ворогів.",
								"col": "#ffb36e",
								"type": "nova",
								"radius": 115,
								"power": 3.6,
								"slow": 2
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Просвітлений Кулак",
			"icon": "🌞",
			"skill": {
				"id": "t_asc_one_punch",
				"name": "Один удар",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "Лисина в комплект не входить.",
				"col": "#ffb36e",
				"type": "arc",
				"reach": 100,
				"arc": 1.25,
				"power": 17.25,
				"knock": 300
			}
		}
	},
	"lancer": {
		"branches": [
			{
				"id": "dragoon",
				"name": "Драгун",
				"icon": "🐉",
				"desc": "Стрибає вище за дракона.",
				"bonus": {
					"atk": 0.04,
					"crit": 0.02
				},
				"skills": [
					{
						"id": "t_dragoon_sky_dive",
						"name": "Падіння з небес",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Злітає за хмари. Повертається з болем.",
						"col": "#9fd0ff",
						"type": "nova",
						"radius": 115,
						"power": 2.64
					},
					{
						"id": "t_dragoon_dragon_pierce",
						"name": "Драконячий прокол",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Наскрізь.",
						"col": "#9fd0ff",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 4.25,
						"knock": 300
					}
				],
				"masters": [
					{
						"id": "skylord",
						"name": "Небесний Лорд",
						"icon": "🌤️",
						"desc": "Живе в небі. На землю спускається бити.",
						"bonus": {
							"atk": 0.06,
							"crit": 0.03
						},
						"skills": [
							{
								"id": "t_skylord_meteor_lance",
								"name": "Метеорний спис",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Падає як метеор.",
								"col": "#9fd0ff",
								"type": "nova",
								"radius": 115,
								"power": 3.96
							},
							{
								"id": "t_skylord_wind_walk",
								"name": "Хода вітру",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "+50% ухилення.",
								"col": "#9fd0ff",
								"type": "shield",
								"time": 3,
								"amount": 0.12
							}
						]
					},
					{
						"id": "dragon_rider",
						"name": "Вершник Драконів",
						"icon": "🐉",
						"desc": "Нарешті знайшов дракона, щоб на ньому стрибати.",
						"bonus": {
							"atk": 0.1,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_dragon_rider_dragon_dive",
								"name": "Піке з драконом",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Двоє падають з неба.",
								"col": "#9fd0ff",
								"type": "nova",
								"radius": 115,
								"power": 3.84
							},
							{
								"id": "t_dragon_rider_wyrm_lance",
								"name": "Спис змія",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Пробиває все.",
								"col": "#9fd0ff",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 7.25,
								"knock": 300
							}
						]
					}
				]
			},
			{
				"id": "valkyrie",
				"name": "Валькірія",
				"icon": "🪽",
				"desc": "Крила, спис і дуже драматичний вітер у волоссі.",
				"bonus": {
					"hp": 0.06,
					"atk": 0.04,
					"mp": 0.06,
					"def": 0.04,
					"crit": 0.01
				},
				"skills": [
					{
						"id": "t_valkyrie_valkyrie_light",
						"name": "Світло Вальгалли",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Лікує загін.",
						"col": "#9dffb0",
						"type": "heal",
						"amount": 0.3
					},
					{
						"id": "t_valkyrie_spear_of_light",
						"name": "Спис світла",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Святе вістря.",
						"col": "#9fd0ff",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 4,
						"knock": 300
					}
				],
				"masters": [
					{
						"id": "einherjar",
						"name": "Предводителька Ейнгер'ярів",
						"icon": "⚔️",
						"desc": "Веде мертвих героїв у бій. Вони не скаржаться.",
						"bonus": {
							"hp": 0.09,
							"atk": 0.08,
							"mp": 0.12,
							"def": 0.06,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_einherjar_host_of_heroes",
								"name": "Воїнство героїв",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Привиди героїв б'ються поруч.",
								"col": "#9fd0ff",
								"type": "nova",
								"radius": 115,
								"power": 3.48
							},
							{
								"id": "t_einherjar_valhalla_call",
								"name": "Поклик Вальгалли",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Лікування і бойовий дух.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.4
							}
						]
					},
					{
						"id": "freya_chosen",
						"name": "Обраниця Фреї",
						"icon": "🌸",
						"desc": "Богиня кохання й війни. Буває зручно.",
						"bonus": {
							"atk": 0.12,
							"mp": 0.18,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_freya_chosen_love_war",
								"name": "Любов і війна",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Серця й удари.",
								"col": "#9fd0ff",
								"type": "nova",
								"radius": 115,
								"power": 3.48
							},
							{
								"id": "t_freya_chosen_golden_tears",
								"name": "Золоті сльози",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Плаче золотом, лікує всіх.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.41
							}
						]
					}
				]
			},
			{
				"id": "halberdier",
				"name": "Алебардник",
				"icon": "🪓",
				"desc": "Спис, сокира й гачок в одному. Швейцарський ніж воїна.",
				"bonus": {
					"hp": 0.03,
					"atk": 0.06,
					"def": 0.02,
					"crit": 0.01
				},
				"skills": [
					{
						"id": "t_halberdier_hook_pull",
						"name": "Гак і ривок",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Підтягнув і вдарив.",
						"col": "#9fd0ff",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 2.75,
						"knock": 460
					},
					{
						"id": "t_halberdier_wide_arc",
						"name": "Широка дуга",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Обертання з алебардою.",
						"col": "#9fd0ff",
						"type": "nova",
						"radius": 115,
						"power": 2.16
					}
				],
				"masters": [
					{
						"id": "iron_wall",
						"name": "Залізна Стіна",
						"icon": "🧱",
						"desc": "Строй з однієї людини.",
						"bonus": {
							"hp": 0.21,
							"atk": 0.1,
							"def": 0.14
						},
						"skills": [
							{
								"id": "t_iron_wall_pike_wall",
								"name": "Стіна пік",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Ніхто не пройде.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.3
							},
							{
								"id": "t_iron_wall_impale",
								"name": "Нанизати",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Як шашлик.",
								"col": "#9fd0ff",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 7.25,
								"knock": 300
							}
						]
					},
					{
						"id": "war_reaper",
						"name": "Жнець Війни",
						"icon": "⚔️",
						"desc": "Косить ворогів, як пшеницю.",
						"bonus": {
							"atk": 0.14,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_war_reaper_harvest_arc",
								"name": "Жнива",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Урожай цього року — вороги.",
								"col": "#9fd0ff",
								"type": "nova",
								"radius": 115,
								"power": 3.72
							},
							{
								"id": "t_war_reaper_blood_moon_lance",
								"name": "Спис кривавого місяця",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Лікує жнеця.",
								"col": "#9fd0ff",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 6,
								"knock": 300
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Гунгнір",
			"icon": "🌠",
			"skill": {
				"id": "t_asc_gungnir",
				"name": "Спис Гунгнір",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "Ніколи не промахується. Перевірено.",
				"col": "#9fd0ff",
				"type": "arc",
				"reach": 100,
				"arc": 1.25,
				"power": 15.81,
				"knock": 300
			}
		}
	},
	"bard": {
		"branches": [
			{
				"id": "idol",
				"name": "Айдол",
				"icon": "🎤",
				"desc": "Фанати платять. Вороги плачуть.",
				"bonus": {
					"atk": 0.06,
					"mp": 0.09,
					"crit": 0.01
				},
				"skills": [
					{
						"id": "t_idol_concert",
						"name": "Концерт",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Феєрверк і фанати.",
						"col": "#ff8ad8",
						"type": "aoe_at",
						"radius": 100,
						"power": 1.1,
						"ticks": 3
					},
					{
						"id": "t_idol_fan_service",
						"name": "Фан-сервіс",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Підмигування лікує.",
						"col": "#9dffb0",
						"type": "heal",
						"amount": 0.31
					}
				],
				"masters": [
					{
						"id": "superstar",
						"name": "Суперзірка Дивосвіту",
						"icon": "🌟",
						"desc": "Тури по всіх королівствах. Квитки розпродані.",
						"bonus": {
							"atk": 0.1,
							"mp": 0.15,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_superstar_world_tour",
								"name": "Світовий тур",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Хіт на всю мапу.",
								"col": "#ff8ad8",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.76,
								"ticks": 3
							},
							{
								"id": "t_superstar_standing_ovation",
								"name": "Овації",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Зал встає, команда сяє.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.37
							}
						]
					},
					{
						"id": "virtual_idol",
						"name": "Віртуальна Айдолка",
						"icon": "💻",
						"desc": "Існує як голограма. Фанати не помічають різниці.",
						"bonus": {
							"atk": 0.12,
							"mp": 0.18,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_virtual_idol_hologram",
								"name": "Голограма",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Б'ють проекцію.",
								"col": "#ff8ad8",
								"type": "shield",
								"time": 3,
								"amount": 0.12
							},
							{
								"id": "t_virtual_idol_viral_hit",
								"name": "Вірусний хіт",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Мільйон переглядів.",
								"col": "#ff8ad8",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.71,
								"ticks": 3
							}
						]
					}
				]
			},
			{
				"id": "skald",
				"name": "Скальд",
				"icon": "🪘",
				"desc": "Пісні війни. Барабани. Багато барабанів.",
				"bonus": {
					"hp": 0.03,
					"atk": 0.1,
					"mp": 0.06,
					"def": 0.02
				},
				"skills": [
					{
						"id": "t_skald_war_drum",
						"name": "Бойовий барабан",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "+60% атаки.",
						"col": "#ff8ad8",
						"type": "buff",
						"time": 6
					},
					{
						"id": "t_skald_saga",
						"name": "Сага про героя",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Слова ранять. Буквально.",
						"col": "#ff8ad8",
						"type": "projectile",
						"speed": 620,
						"power": 3.6,
						"r": 10,
						"pierce": 0
					}
				],
				"masters": [
					{
						"id": "myth_singer",
						"name": "Співець Міфів",
						"icon": "🐦‍🔥",
						"desc": "Його пісні стають правдою.",
						"bonus": {
							"atk": 0.18,
							"mp": 0.18
						},
						"skills": [
							{
								"id": "t_myth_singer_myth_song",
								"name": "Пісня творення",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Світ слухає і підспівує.",
								"col": "#ff8ad8",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.93,
								"ticks": 3
							},
							{
								"id": "t_myth_singer_legend_shield",
								"name": "Щит легенди",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Ти — легенда. Легенди не вмирають.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.3
							}
						]
					},
					{
						"id": "thunder_drummer",
						"name": "Барабанщик Грому",
						"icon": "🥁",
						"desc": "Б'є в барабан — гримить грім. Б'є в ворога — теж.",
						"bonus": {
							"atk": 0.22,
							"mp": 0.15
						},
						"skills": [
							{
								"id": "t_thunder_drummer_thunder_beat",
								"name": "Ритм грому",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Бас прямо в серце.",
								"col": "#ff8ad8",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.65,
								"ticks": 3
							},
							{
								"id": "t_thunder_drummer_war_march",
								"name": "Бойовий марш",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Крок у ритм.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.31
							}
						]
					}
				]
			},
			{
				"id": "dancer",
				"name": "Танцівник Клинків",
				"icon": "💃",
				"desc": "Танцює між ударами. Іноді на головах ворогів.",
				"bonus": {
					"crit": 0.02
				},
				"skills": [
					{
						"id": "t_dancer_sword_dance",
						"name": "Танець з мечами",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Граціозно і гостро.",
						"col": "#ff8ad8",
						"type": "aoe_at",
						"radius": 100,
						"power": 0.6,
						"ticks": 3
					},
					{
						"id": "t_dancer_tango",
						"name": "Танго",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Ворог веде, ти ухиляєшся.",
						"col": "#ff8ad8",
						"type": "shield",
						"time": 3,
						"amount": 0.12
					}
				],
				"masters": [
					{
						"id": "stage_queen",
						"name": "Зірка Сцени",
						"icon": "🎭",
						"desc": "Кожен бій — вистава. Квитки продано.",
						"bonus": {
							"crit": 0.05
						},
						"skills": [
							{
								"id": "t_stage_queen_grand_finale",
								"name": "Гранд-фінал",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Оплески і вибухи.",
								"col": "#ff8ad8",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.76,
								"ticks": 3
							},
							{
								"id": "t_stage_queen_encore_dance",
								"name": "Танець на біс",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Ще раз! Усі разом!",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.35
							}
						]
					},
					{
						"id": "siren",
						"name": "Сирена",
						"icon": "🧜",
						"desc": "Співає так, що кораблі розвертаються.",
						"bonus": {
							"atk": 0.12,
							"mp": 0.18,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_siren_siren_song",
								"name": "Пісня сирени",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Вороги заслухались.",
								"col": "#ff8ad8",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.21,
								"ticks": 3
							},
							{
								"id": "t_siren_tidal_voice",
								"name": "Голос припливу",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Хвиля зі співом.",
								"col": "#ff8ad8",
								"type": "projectile",
								"speed": 620,
								"power": 6.48,
								"r": 14,
								"pierce": 99
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Голос Богині",
			"icon": "🎼",
			"skill": {
				"id": "t_asc_final_song",
				"name": "Остання пісня світу",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "Після неї тиша. Довга. Красива.",
				"col": "#ff8ad8",
				"type": "meteor",
				"radius": 180,
				"power": 5.9,
				"delay": 0.85
			}
		}
	},
	"samurai": {
		"branches": [
			{
				"id": "ronin",
				"name": "Ронін",
				"icon": "🥷",
				"desc": "Без пана, без грошей, зате з неймовірним стилем.",
				"bonus": {
					"crit": 0.02
				},
				"skills": [
					{
						"id": "t_ronin_drifter_slash",
						"name": "Удар мандрівника",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Ріже ворога й позичає його гаманець.",
						"col": "#ff6a6a",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 3.88,
						"knock": 300
					},
					{
						"id": "t_ronin_lone_wolf",
						"name": "Самотній вовк",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "+45% криту, коли ніхто не дивиться.",
						"col": "#ff6a6a",
						"type": "buff",
						"time": 6
					}
				],
				"masters": [
					{
						"id": "shadow_shogun",
						"name": "Тіньовий Сьоґун",
						"icon": "🏯",
						"desc": "Має армію. Армія — це він і його тіні.",
						"bonus": {
							"atk": 0.06,
							"crit": 0.03
						},
						"skills": [
							{
								"id": "t_shadow_shogun_shogun_order",
								"name": "Наказ сьоґуна",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Вороги стають на коліна. Самі.",
								"col": "#ff6a6a",
								"type": "nova",
								"radius": 115,
								"power": 3.48,
								"slow": 2
							},
							{
								"id": "t_shadow_shogun_thousand_blossoms",
								"name": "Тисяча квітів",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Красиво. Дев'ять разів.",
								"col": "#ff6a6a",
								"type": "fan",
								"count": 9,
								"spread": 1.2,
								"speed": 560,
								"power": 0.63
							}
						]
					},
					{
						"id": "wandering_saint",
						"name": "Мандрівний Святий",
						"icon": "🍃",
						"desc": "Без пана, без дому, але з дуже добрим серцем.",
						"bonus": {
							"hp": 0.15,
							"def": 0.1,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_wandering_saint_leaf_cut",
								"name": "Розріз листа",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Падає лист — падають вороги.",
								"col": "#ff6a6a",
								"type": "nova",
								"radius": 115,
								"power": 3.6
							},
							{
								"id": "t_wandering_saint_wanderer_rest",
								"name": "Відпочинок мандрівника",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Чай біля вогнища.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.37
							}
						]
					}
				]
			},
			{
				"id": "kensei",
				"name": "Кенсей",
				"icon": "⛩️",
				"desc": "Святий меча. Медитує стоячи на одній нозі.",
				"bonus": {
					"hp": 0.03,
					"atk": 0.06,
					"def": 0.02,
					"crit": 0.01
				},
				"skills": [
					{
						"id": "t_kensei_zen_cut",
						"name": "Розріз дзен",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Броня? Ілюзія.",
						"col": "#ff6a6a",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 4.25,
						"knock": 300
					},
					{
						"id": "t_kensei_mind_blade",
						"name": "Меч розуму",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Спокій лікує команду.",
						"col": "#9dffb0",
						"type": "heal",
						"amount": 0.28
					}
				],
				"masters": [
					{
						"id": "abyss_blade",
						"name": "Меч-Безодня",
						"icon": "🕳️",
						"desc": "Розрізав відстань між собою і обідом.",
						"bonus": {
							"atk": 0.1,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_abyss_blade_dimension_cut",
								"name": "Розріз виміру",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Простір тріщить.",
								"col": "#ff6a6a",
								"type": "nova",
								"radius": 115,
								"power": 3.84
							},
							{
								"id": "t_abyss_blade_one_thought",
								"name": "Одна думка",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Подумав — і вже переміг.",
								"col": "#ff6a6a",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 7.75,
								"knock": 300
							}
						]
					},
					{
						"id": "sword_god",
						"name": "Бог Меча",
						"icon": "⚜️",
						"desc": "Меч молиться йому.",
						"bonus": {
							"atk": 0.08,
							"crit": 0.03
						},
						"skills": [
							{
								"id": "t_sword_god_divine_cut",
								"name": "Божественний розріз",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Небо розкололось.",
								"col": "#ff6a6a",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 8.75,
								"knock": 300
							},
							{
								"id": "t_sword_god_heaven_flash",
								"name": "Небесний спалах",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Блиск і тиша.",
								"col": "#ff6a6a",
								"type": "nova",
								"radius": 115,
								"power": 3.6
							}
						]
					}
				]
			},
			{
				"id": "onmyoji",
				"name": "Онмьодзі",
				"icon": "🧧",
				"desc": "Самурай, що вивчив талісмани. Меч і папірці.",
				"bonus": {
					"atk": 0.08,
					"mp": 0.12,
					"crit": 0.01
				},
				"skills": [
					{
						"id": "t_onmyoji_ofuda",
						"name": "Талісман-офуда",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Приклеїв до лоба. Демон плаче.",
						"col": "#ff6a6a",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 3.25,
						"knock": 300
					},
					{
						"id": "t_onmyoji_shikigami",
						"name": "Сікіґамі",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Паперові птахи ріжуть.",
						"col": "#ff6a6a",
						"type": "nova",
						"radius": 115,
						"power": 2.04
					}
				],
				"masters": [
					{
						"id": "yin_yang",
						"name": "Майстер Інь-Ян",
						"icon": "☯️",
						"desc": "Баланс у всьому. Особливо в ударах.",
						"bonus": {
							"atk": 0.14,
							"mp": 0.21,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_yin_yang_five_elements",
								"name": "П'ять стихій",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Вогонь, вода, дерево, метал, земля.",
								"col": "#ff6a6a",
								"type": "nova",
								"radius": 115,
								"power": 3.96
							},
							{
								"id": "t_yin_yang_harmony",
								"name": "Гармонія",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Рівновага лікує.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.36
							}
						]
					},
					{
						"id": "kitsune_blade",
						"name": "Клинок Кіцуне",
						"icon": "🦊",
						"desc": "Дев'ять хвостів, один меч.",
						"bonus": {
							"crit": 0.04
						},
						"skills": [
							{
								"id": "t_kitsune_blade_foxfire",
								"name": "Лисячий вогонь",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Блакитні вогники кусають.",
								"col": "#ff6a6a",
								"type": "nova",
								"radius": 115,
								"power": 1.2
							},
							{
								"id": "t_kitsune_blade_illusion_cut",
								"name": "Ілюзорний розріз",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Удар з того боку, де тебе нема.",
								"col": "#ff6a6a",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 7,
								"knock": 300
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Демон Меча",
			"icon": "👹",
			"skill": {
				"id": "t_asc_final_iai",
				"name": "Останнє іайдо",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "Клац. Меч у піхвах. Світ поділено навпіл.",
				"col": "#ff6a6a",
				"type": "meteor",
				"radius": 180,
				"power": 6.77,
				"delay": 0.85
			}
		}
	},
	"summoner": {
		"branches": [
			{
				"id": "beastcaller",
				"name": "Заклинач Звірів",
				"icon": "🦁",
				"desc": "Дружить з кожною твариною. Тварини не завжди погоджуються.",
				"bonus": {
					"hp": 0.06,
					"atk": 0.06,
					"mp": 0.09,
					"def": 0.04
				},
				"skills": [
					{
						"id": "t_beastcaller_griffin_dive",
						"name": "Піке грифона",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Грифон падає з неба.",
						"col": "#7dffd0",
						"type": "projectile",
						"speed": 620,
						"power": 3.84,
						"r": 10,
						"pierce": 0
					},
					{
						"id": "t_beastcaller_bear_hug",
						"name": "Обійми ведмедя",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Тепло. Міцно. Не вирватися.",
						"col": "#7dffd0",
						"type": "projectile",
						"speed": 620,
						"power": 2.16,
						"r": 10,
						"pierce": 0
					}
				],
				"masters": [
					{
						"id": "zoo_king",
						"name": "Король Звіринця",
						"icon": "🎪",
						"desc": "У кишені — цілий звіринець.",
						"bonus": {
							"hp": 0.12,
							"atk": 0.12,
							"mp": 0.18,
							"def": 0.08
						},
						"skills": [
							{
								"id": "t_zoo_king_stampede_spirits",
								"name": "Звірина навала",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Усі звірі одразу.",
								"col": "#7dffd0",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.65,
								"ticks": 3
							},
							{
								"id": "t_zoo_king_nest",
								"name": "Гніздо",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Затишно, пухнасто, лікувально.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.36
							}
						]
					},
					{
						"id": "dragon_tamer",
						"name": "Приборкувач Драконів",
						"icon": "🐲",
						"desc": "Дракон муркоче, коли його чешуть.",
						"bonus": {
							"hp": 0.12,
							"atk": 0.14,
							"mp": 0.21,
							"def": 0.08
						},
						"skills": [
							{
								"id": "t_dragon_tamer_dragon_summon",
								"name": "Поклик дракона",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Дракон прилетів на допомогу.",
								"col": "#7dffd0",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.98,
								"ticks": 3
							},
							{
								"id": "t_dragon_tamer_wyvern_shield",
								"name": "Крило віверни",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Крило над загоном.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.34
							}
						]
					}
				]
			},
			{
				"id": "spirit_lord",
				"name": "Повелитель Духів",
				"icon": "🌀",
				"desc": "Розмовляє з вітром. Вітер плітки переказує.",
				"bonus": {
					"atk": 0.08,
					"mp": 0.12,
					"crit": 0.01
				},
				"skills": [
					{
						"id": "t_spirit_lord_sylph",
						"name": "Сильфіда",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Вітряна панна ріже всіх.",
						"col": "#7dffd0",
						"type": "aoe_at",
						"radius": 100,
						"power": 0.99,
						"ticks": 3
					},
					{
						"id": "t_spirit_lord_ifrit",
						"name": "Іфрит",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Вогняний джин. Без бажань, лише вогонь.",
						"col": "#7dffd0",
						"type": "projectile",
						"speed": 620,
						"power": 4.08,
						"r": 10,
						"pierce": 0,
						"explode": 70
					}
				],
				"masters": [
					{
						"id": "world_gate",
						"name": "Брамник Світів",
						"icon": "🚪",
						"desc": "Відчиняє двері в інші світи. Іноді звідти виходить вантажівка.",
						"bonus": {
							"atk": 0.16,
							"mp": 0.24,
							"crit": 0.01
						},
						"skills": [
							{
								"id": "t_world_gate_bahamut",
								"name": "Король драконів",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Мега-спалах з неба.",
								"col": "#7dffd0",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.98,
								"ticks": 3
							},
							{
								"id": "t_world_gate_truck_kun",
								"name": "Вантажівка-кун",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Відправляє ворога в інший світ. Класика.",
								"col": "#7dffd0",
								"type": "projectile",
								"speed": 620,
								"power": 7.2,
								"r": 14,
								"pierce": 99
							}
						]
					},
					{
						"id": "ancestor_voice",
						"name": "Голос Предків",
						"icon": "🏺",
						"desc": "Прадіди радять у бою. І критикують зачіску.",
						"bonus": {
							"atk": 0.14,
							"mp": 0.21,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_ancestor_voice_ancestor_host",
								"name": "Військо предків",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Прадіди б'ються поруч.",
								"col": "#7dffd0",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.76,
								"ticks": 3
							},
							{
								"id": "t_ancestor_voice_family_blessing",
								"name": "Родинне благословення",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Бабуся гладить по голові.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.38
							}
						]
					}
				]
			},
			{
				"id": "golem_smith",
				"name": "Творець Големів",
				"icon": "🗿",
				"desc": "Ліпить друзів з глини. Справжні друзі — теж з глини.",
				"bonus": {
					"hp": 0.09,
					"atk": 0.06,
					"mp": 0.09,
					"def": 0.06
				},
				"skills": [
					{
						"id": "t_golem_smith_clay_punch",
						"name": "Глиняний кулак",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Голем б'є.",
						"col": "#7dffd0",
						"type": "projectile",
						"speed": 620,
						"power": 3.6,
						"r": 10,
						"pierce": 0
					},
					{
						"id": "t_golem_smith_stone_skin",
						"name": "Кам'яна шкіра",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Усі тверді як камінь.",
						"col": "#9dffb0",
						"type": "heal",
						"amount": 0.26
					}
				],
				"masters": [
					{
						"id": "titan_forge",
						"name": "Кузня Титанів",
						"icon": "⚙️",
						"desc": "Його голем вищий за ратушу.",
						"bonus": {
							"hp": 0.18,
							"atk": 0.12,
							"mp": 0.18,
							"def": 0.12
						},
						"skills": [
							{
								"id": "t_titan_forge_colossus",
								"name": "Колос",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Крок колоса — землетрус.",
								"col": "#7dffd0",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.98,
								"ticks": 3
							},
							{
								"id": "t_titan_forge_repair",
								"name": "Ремонт",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Підкрутив, підклеїв — працює.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.37
							}
						]
					},
					{
						"id": "mecha_pilot",
						"name": "Пілот Мехи",
						"icon": "🤖",
						"desc": "Гноми допомогли. Тепер він у залізному гіганті.",
						"bonus": {
							"atk": 0.22,
							"mp": 0.24
						},
						"skills": [
							{
								"id": "t_mecha_pilot_rocket_punch",
								"name": "Ракетний кулак",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Кулак летить окремо.",
								"col": "#7dffd0",
								"type": "projectile",
								"speed": 620,
								"power": 7.44,
								"r": 14,
								"pierce": 99
							},
							{
								"id": "t_mecha_pilot_beam_cannon",
								"name": "Променева гармата",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Б-з-з-з-ВУУУ!",
								"col": "#7dffd0",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.76,
								"ticks": 3
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Ключник Світів",
			"icon": "🗝️",
			"skill": {
				"id": "t_asc_all_summons",
				"name": "Парад призивів",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "Усі, кого ти колись кликав, приходять одночасно.",
				"col": "#7dffd0",
				"type": "meteor",
				"radius": 180,
				"power": 6.55,
				"delay": 0.85
			}
		}
	},
	"warlock": {
		"branches": [
			{
				"id": "hexblade",
				"name": "Клинок Прокльонів",
				"icon": "🗡️",
				"desc": "Проклятий меч. Ну, і власник теж трохи.",
				"bonus": {
					"atk": 0.12,
					"mp": 0.09
				},
				"skills": [
					{
						"id": "t_hexblade_cursed_edge",
						"name": "Прокляте лезо",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Ріже і проклинає.",
						"col": "#a64dff",
						"type": "projectile",
						"speed": 620,
						"power": 3.84,
						"r": 10,
						"pierce": 0
					},
					{
						"id": "t_hexblade_dark_armor",
						"name": "Темні лати",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "+100% захисту.",
						"col": "#a64dff",
						"type": "shield",
						"time": 3,
						"amount": 0.12
					}
				],
				"masters": [
					{
						"id": "doom_knight",
						"name": "Лицар Загибелі",
						"icon": "♠️",
						"desc": "Приходить — і всім стає похмуро.",
						"bonus": {
							"atk": 0.22,
							"mp": 0.15
						},
						"skills": [
							{
								"id": "t_doom_knight_doom_blade",
								"name": "Клинок загибелі",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Без шансів.",
								"col": "#a64dff",
								"type": "projectile",
								"speed": 620,
								"power": 6.72,
								"r": 14,
								"pierce": 99
							},
							{
								"id": "t_doom_knight_dread_aura",
								"name": "Аура жаху",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Вороги тремтять.",
								"col": "#a64dff",
								"type": "aoe_at",
								"radius": 100,
								"power": 0.88,
								"ticks": 3
							}
						]
					},
					{
						"id": "cursed_king",
						"name": "Проклятий Король",
						"icon": "👑",
						"desc": "Корона проклята. Він — теж. Зате стильно.",
						"bonus": {
							"atk": 0.24,
							"mp": 0.18
						},
						"skills": [
							{
								"id": "t_cursed_king_royal_curse",
								"name": "Королівське прокляття",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Наказ — страждати.",
								"col": "#a64dff",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.43,
								"ticks": 3
							},
							{
								"id": "t_cursed_king_crown_blade",
								"name": "Клинок корони",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Король б'є особисто.",
								"col": "#a64dff",
								"type": "projectile",
								"speed": 620,
								"power": 6.96,
								"r": 14,
								"pierce": 99
							}
						]
					}
				]
			},
			{
				"id": "demonologist",
				"name": "Демонолог",
				"icon": "👿",
				"desc": "Тримає демонів на короткому повідку і в кишені — печиво для них.",
				"bonus": {
					"atk": 0.1,
					"mp": 0.15
				},
				"skills": [
					{
						"id": "t_demonologist_imp_swarm",
						"name": "Рій бісенят",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Бісенята кусаються.",
						"col": "#a64dff",
						"type": "aoe_at",
						"radius": 100,
						"power": 0.6,
						"ticks": 3
					},
					{
						"id": "t_demonologist_hellfire",
						"name": "Пекельний вогонь",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Гарячіше, ніж пекло. Бо це воно і є.",
						"col": "#a64dff",
						"type": "projectile",
						"speed": 620,
						"power": 4.32,
						"r": 14,
						"pierce": 99,
						"explode": 70
					}
				],
				"masters": [
					{
						"id": "archdemon_tamer",
						"name": "Приборкувач Архідемона",
						"icon": "🦇",
						"desc": "Архідемон носить за ним сумки.",
						"bonus": {
							"atk": 0.18,
							"mp": 0.27,
							"crit": 0.01
						},
						"skills": [
							{
								"id": "t_archdemon_tamer_archdemon",
								"name": "Виклик Архідемона",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Він злий, бо його розбудили.",
								"col": "#a64dff",
								"type": "aoe_at",
								"radius": 100,
								"power": 2.04,
								"ticks": 3
							},
							{
								"id": "t_archdemon_tamer_contract_renew",
								"name": "Продовження контракту",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Нові умови: тепер зі страховкою.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.34
							}
						]
					},
					{
						"id": "hell_lawyer",
						"name": "Адвокат Пекла",
						"icon": "📜",
						"desc": "Знайшов лазівку в контракті з демоном. Тепер демон працює на нього.",
						"bonus": {
							"atk": 0.16,
							"mp": 0.24,
							"crit": 0.01
						},
						"skills": [
							{
								"id": "t_hell_lawyer_fine_print",
								"name": "Дрібний шрифт",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Ворог читає і плаче.",
								"col": "#a64dff",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.54,
								"ticks": 3
							},
							{
								"id": "t_hell_lawyer_soul_contract",
								"name": "Контракт на душу",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Підпис — і все.",
								"col": "#a64dff",
								"type": "projectile",
								"speed": 620,
								"power": 6.96,
								"r": 14,
								"pierce": 99
							}
						]
					}
				]
			},
			{
				"id": "blood_mage",
				"name": "Маг Крові",
				"icon": "🩸",
				"desc": "Платить за магію власною кров'ю. Їсть багато печінки.",
				"bonus": {
					"hp": 0.06,
					"atk": 0.08,
					"mp": 0.12,
					"def": 0.04
				},
				"skills": [
					{
						"id": "t_blood_mage_blood_spear",
						"name": "Кривавий спис",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Бере своє назад.",
						"col": "#a64dff",
						"type": "projectile",
						"speed": 620,
						"power": 3.6,
						"r": 10,
						"pierce": 0
					},
					{
						"id": "t_blood_mage_hemorrhage",
						"name": "Кровотеча",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Неприємно всім.",
						"col": "#a64dff",
						"type": "cloud",
						"radius": 105,
						"power": 0.39,
						"time": 5
					}
				],
				"masters": [
					{
						"id": "vampire_lord",
						"name": "Вампірський Лорд",
						"icon": "🧛",
						"desc": "Не любить часник і ранкові зустрічі.",
						"bonus": {
							"atk": 0.14,
							"mp": 0.21,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_vampire_lord_crimson_night",
								"name": "Багряна ніч",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Ніч п'є ворогів.",
								"col": "#a64dff",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.65,
								"ticks": 3
							},
							{
								"id": "t_vampire_lord_bat_swarm",
								"name": "Зграя кажанів",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Пищать і кусають.",
								"col": "#a64dff",
								"type": "fan",
								"count": 8,
								"spread": 0.5,
								"speed": 560,
								"power": 0.63
							}
						]
					},
					{
						"id": "plague_doctor",
						"name": "Чумний Лікар",
						"icon": "🎭",
						"desc": "Лікує. Або навпаки. Залежить від оплати.",
						"bonus": {
							"hp": 0.12,
							"atk": 0.14,
							"mp": 0.21,
							"def": 0.08
						},
						"skills": [
							{
								"id": "t_plague_doctor_plague",
								"name": "Чума",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Нежить заздрить.",
								"col": "#a64dff",
								"type": "cloud",
								"radius": 105,
								"power": 0.54,
								"time": 5
							},
							{
								"id": "t_plague_doctor_dark_cure",
								"name": "Темні ліки",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Гірко, але допомагає.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.38
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Володар Порожнечі",
			"icon": "🌑",
			"skill": {
				"id": "t_asc_end_of_light",
				"name": "Кінець світла",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "Вимкнув сонце. Ненадовго.",
				"col": "#a64dff",
				"type": "meteor",
				"radius": 180,
				"power": 6.99,
				"delay": 0.85
			}
		}
	},
	"ninja": {
		"branches": [
			{
				"id": "shinobi",
				"name": "Тіньовий Сінобі",
				"icon": "🌑",
				"desc": "Його ніхто не бачив. Навіть дзеркало.",
				"bonus": {
					"crit": 0.02
				},
				"skills": [
					{
						"id": "t_shinobi_assassin_step",
						"name": "Крок убивці",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "За спиною. Вже.",
						"col": "#9aa6b8",
						"type": "arc",
						"reach": 100,
						"arc": 1.25,
						"power": 4.5,
						"knock": 300
					},
					{
						"id": "t_shinobi_caltrops",
						"name": "Шипи-часник",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Ой. Ой. ОЙ.",
						"col": "#9aa6b8",
						"type": "nova",
						"radius": 115,
						"power": 1.44,
						"slow": 2
					}
				],
				"masters": [
					{
						"id": "night_lord",
						"name": "Володар Ночі",
						"icon": "🌚",
						"desc": "Ніч — його офіс.",
						"bonus": {
							"crit": 0.04
						},
						"skills": [
							{
								"id": "t_night_lord_moonless",
								"name": "Безмісячна ніч",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Темрява з'їдає слабких.",
								"col": "#9aa6b8",
								"type": "nova",
								"radius": 115,
								"power": 3.36
							},
							{
								"id": "t_night_lord_hundred_shadows",
								"name": "Сто тіней",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Тіні б'ють по черзі.",
								"col": "#9aa6b8",
								"type": "fan",
								"count": 10,
								"spread": 1.2,
								"speed": 560,
								"power": 0.55
							}
						]
					},
					{
						"id": "kage",
						"name": "Тінь Селища",
						"icon": "🏘️",
						"desc": "Голова прихованого селища. Ніхто не знає, якого.",
						"bonus": {
							"atk": 0.08,
							"mp": 0.12,
							"crit": 0.03
						},
						"skills": [
							{
								"id": "t_kage_village_hidden",
								"name": "Приховане селище",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Сотня ніндзя з кущів.",
								"col": "#9aa6b8",
								"type": "nova",
								"radius": 115,
								"power": 1.2
							},
							{
								"id": "t_kage_kage_seal",
								"name": "Печатка тіні",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Усі зникають.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.32
							}
						]
					}
				]
			},
			{
				"id": "kunoichi_sage",
				"name": "Мудрець Печаток",
				"icon": "🙏",
				"desc": "Знає 400 печаток. Пам'ятає три.",
				"bonus": {
					"hp": 0.03,
					"atk": 0.06,
					"mp": 0.09,
					"def": 0.02,
					"crit": 0.01
				},
				"skills": [
					{
						"id": "t_kunoichi_sage_water_dragon",
						"name": "Водяний дракон",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Дракон з калюжі.",
						"col": "#9aa6b8",
						"type": "nova",
						"radius": 115,
						"power": 2.28
					},
					{
						"id": "t_kunoichi_sage_healing_seal",
						"name": "Цілюща печатка",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Печатка на рану — і рани нема.",
						"col": "#9dffb0",
						"type": "heal",
						"amount": 0.3
					}
				],
				"masters": [
					{
						"id": "sage_mode",
						"name": "Режим Мудреця",
						"icon": "🐸",
						"desc": "Сила природи і жаб'ячі пігменти під очима.",
						"bonus": {
							"hp": 0.06,
							"atk": 0.1,
							"mp": 0.15,
							"def": 0.04,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_sage_mode_toad_oil",
								"name": "Олія велетенської жаби",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Жаба плює полум'ям.",
								"col": "#9aa6b8",
								"type": "nova",
								"radius": 115,
								"power": 3.6
							},
							{
								"id": "t_sage_mode_nature_flow",
								"name": "Потік природи",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Ліс ділиться силою.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.37
							}
						]
					},
					{
						"id": "nine_tails",
						"name": "Носій Дев'ятихвостого",
						"icon": "🦊",
						"desc": "В ньому запечатаний лис. Лис не в захваті.",
						"bonus": {
							"hp": 0.18,
							"def": 0.12,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_nine_tails_tailed_beast",
								"name": "Хвостатий звір",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Червоний вихор.",
								"col": "#9aa6b8",
								"type": "nova",
								"radius": 115,
								"power": 4.32
							},
							{
								"id": "t_nine_tails_chakra_share",
								"name": "Поділ сили",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Сила для всіх.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.37
							}
						]
					}
				]
			},
			{
				"id": "puppeteer",
				"name": "Ляльковод",
				"icon": "🪆",
				"desc": "Б'ється маріонетками. Маріонетки б'ються краще за нього.",
				"bonus": {
					"atk": 0.06,
					"mp": 0.09,
					"crit": 0.01
				},
				"skills": [
					{
						"id": "t_puppeteer_puppet_blades",
						"name": "Леза ляльки",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Лялька має шість рук.",
						"col": "#9aa6b8",
						"type": "fan",
						"count": 4,
						"spread": 1.2,
						"speed": 560,
						"power": 0.72
					},
					{
						"id": "t_puppeteer_string_trap",
						"name": "Пастка з ниток",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Заплутав усіх.",
						"col": "#9aa6b8",
						"type": "nova",
						"radius": 115,
						"power": 1.2,
						"slow": 2
					}
				],
				"masters": [
					{
						"id": "puppet_king",
						"name": "Король Маріонеток",
						"icon": "🎎",
						"desc": "Сто ляльок, жодної вихідної.",
						"bonus": {
							"atk": 0.12,
							"mp": 0.18,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_puppet_king_hundred_puppets",
								"name": "Сто ляльок",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Армія з дерева.",
								"col": "#9aa6b8",
								"type": "nova",
								"radius": 115,
								"power": 1.2
							},
							{
								"id": "t_puppet_king_puppet_shield",
								"name": "Лялька-щит",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Лялька приймає удар.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.31
							}
						]
					},
					{
						"id": "soul_strings",
						"name": "Нитки Душ",
						"icon": "🕸️",
						"desc": "Ниткою керує і ворогами.",
						"bonus": {
							"crit": 0.04
						},
						"skills": [
							{
								"id": "t_soul_strings_marionette",
								"name": "Маріонетка",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Ворог танцює під твою дудку.",
								"col": "#9aa6b8",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 7,
								"knock": 460
							},
							{
								"id": "t_soul_strings_cut_strings",
								"name": "Обрізані нитки",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Хто без ниток — падає.",
								"col": "#9aa6b8",
								"type": "nova",
								"radius": 115,
								"power": 3.36
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Легенда Тіней",
			"icon": "🌒",
			"skill": {
				"id": "t_asc_forbidden_art",
				"name": "Заборонене мистецтво",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "Заборонене, бо надто круте.",
				"col": "#9aa6b8",
				"type": "arc",
				"reach": 100,
				"arc": 1.25,
				"power": 15.09,
				"knock": 300
			}
		}
	},
	"battle_chef": {
		"branches": [
			{
				"id": "grill_master",
				"name": "Майстер Гриля",
				"icon": "🍖",
				"desc": "Смажить драконів на їхньому ж вогні.",
				"bonus": {
					"hp": 0.06,
					"atk": 0.08,
					"def": 0.04
				},
				"skills": [
					{
						"id": "t_grill_master_bbq_slam",
						"name": "Барбекю-удар",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Прожарка well done.",
						"col": "#ffa64d",
						"type": "arc",
						"reach": 76,
						"arc": 1.25,
						"power": 4.13,
						"knock": 300
					},
					{
						"id": "t_grill_master_smoke_screen",
						"name": "Дим від мангалу",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Ніхто нічого не бачить, але пахне смачно.",
						"col": "#ffa64d",
						"type": "shield",
						"time": 3,
						"amount": 0.12
					}
				],
				"masters": [
					{
						"id": "dragon_grill",
						"name": "Гриль-Дракон",
						"icon": "🐲",
						"desc": "Посмажив дракона. Дракон попросив добавки.",
						"bonus": {
							"hp": 0.12,
							"atk": 0.14,
							"def": 0.08
						},
						"skills": [
							{
								"id": "t_dragon_grill_inferno_grill",
								"name": "Пекельний гриль",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Гриль на все поле бою.",
								"col": "#ffa64d",
								"type": "nova",
								"radius": 115,
								"power": 3.6
							},
							{
								"id": "t_dragon_grill_meat_shield",
								"name": "М'ясний щит",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Ковбасою можна захищатися. Хто знав?",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.32
							}
						]
					},
					{
						"id": "volcano_chef",
						"name": "Кухар Вулкана",
						"icon": "🌋",
						"desc": "Готує на лаві. Вулкан — його плита.",
						"bonus": {
							"hp": 0.12,
							"atk": 0.14,
							"def": 0.08
						},
						"skills": [
							{
								"id": "t_volcano_chef_lava_wok",
								"name": "Вок на лаві",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Обсмажено до хрусту.",
								"col": "#ffa64d",
								"type": "nova",
								"radius": 115,
								"power": 3.84
							},
							{
								"id": "t_volcano_chef_magma_steak",
								"name": "Магма-стейк",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Гарячий білок.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.36
							}
						]
					}
				]
			},
			{
				"id": "patissier",
				"name": "Кондитер Хаосу",
				"icon": "🎂",
				"desc": "Торти, від яких вибухають мізки. Іноді буквально.",
				"bonus": {
					"hp": 0.09,
					"def": 0.06,
					"crit": 0.01
				},
				"skills": [
					{
						"id": "t_patissier_cake_bomb",
						"name": "Торт-бомба",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "З днем народження! БАХ!",
						"col": "#ffa64d",
						"type": "nova",
						"radius": 115,
						"power": 2.16
					},
					{
						"id": "t_patissier_sugar_rush",
						"name": "Цукровий шок",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Додатковий хід. Ще й ще.",
						"col": "#ffa64d",
						"type": "buff",
						"time": 6
					}
				],
				"masters": [
					{
						"id": "dessert_god",
						"name": "Бог Десертів",
						"icon": "🍰",
						"desc": "Його макарони продають на чорному ринку.",
						"bonus": {
							"hp": 0.15,
							"def": 0.1,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_dessert_god_chocolate_flood",
								"name": "Шоколадний потоп",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Вороги тонуть у щасті.",
								"col": "#ffa64d",
								"type": "nova",
								"radius": 115,
								"power": 3.6,
								"slow": 2
							},
							{
								"id": "t_dessert_god_wedding_cake",
								"name": "Весільний торт",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Сім ярусів зцілення.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.42
							}
						]
					},
					{
						"id": "candy_witch",
						"name": "Цукрова Відьма",
						"icon": "🍭",
						"desc": "Пряниковий будиночок — її фортеця.",
						"bonus": {
							"atk": 0.08,
							"mp": 0.12,
							"crit": 0.03
						},
						"skills": [
							{
								"id": "t_candy_witch_candy_curse",
								"name": "Цукрове прокляття",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Злиплись від солодкого.",
								"col": "#ffa64d",
								"type": "nova",
								"radius": 115,
								"power": 2.88,
								"slow": 2
							},
							{
								"id": "t_candy_witch_gingerbread",
								"name": "Пряниковий голем",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Хрусть.",
								"col": "#ffa64d",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 7,
								"knock": 300
							}
						]
					}
				]
			},
			{
				"id": "sushi_master",
				"name": "Суші-майстер",
				"icon": "🍣",
				"desc": "Ніж такий гострий, що ріже навіть погані жарти.",
				"bonus": {
					"atk": 0.04,
					"crit": 0.02
				},
				"skills": [
					{
						"id": "t_sushi_master_fillet",
						"name": "Філе",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Ідеальні шматочки.",
						"col": "#ffa64d",
						"type": "fan",
						"count": 4,
						"spread": 1.2,
						"speed": 560,
						"power": 0.72
					},
					{
						"id": "t_sushi_master_wasabi_bomb",
						"name": "Васабі-бомба",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Сльози і шок.",
						"col": "#ffa64d",
						"type": "nova",
						"radius": 115,
						"power": 1.8,
						"slow": 2
					}
				],
				"masters": [
					{
						"id": "omakase",
						"name": "Омакасе",
						"icon": "🍱",
						"desc": "Що подати — вирішує шеф. Зазвичай — поразку.",
						"bonus": {
							"atk": 0.12,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_omakase_chef_choice",
								"name": "Вибір шефа",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Сет із 12 ударів.",
								"col": "#ffa64d",
								"type": "nova",
								"radius": 115,
								"power": 3.72
							},
							{
								"id": "t_omakase_miso_soup",
								"name": "Місо-суп",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Гарячий і цілющий.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.36
							}
						]
					},
					{
						"id": "fugu_master",
						"name": "Майстер Фугу",
						"icon": "🐡",
						"desc": "Готує отруйну рибу. Подає ворогам.",
						"bonus": {
							"atk": 0.2,
							"mp": 0.15
						},
						"skills": [
							{
								"id": "t_fugu_master_fugu_platter",
								"name": "Тарілка фугу",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Смачно до смерті.",
								"col": "#ffa64d",
								"type": "cloud",
								"radius": 105,
								"power": 0.48,
								"time": 5
							},
							{
								"id": "t_fugu_master_knife_rain",
								"name": "Дощ ножів",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Кухня летить у ворога.",
								"col": "#ffa64d",
								"type": "fan",
								"count": 9,
								"spread": 1.2,
								"speed": 560,
								"power": 0.63
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Шеф Дивосвіту",
			"icon": "👨‍🍳",
			"skill": {
				"id": "t_asc_ultimate_dish",
				"name": "Страва, що єднає світи",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "Вороги куштують і згадують маму. Потім падають.",
				"col": "#ffa64d",
				"type": "meteor",
				"radius": 180,
				"power": 6.12,
				"delay": 0.85
			}
		}
	},
	"alchemist": {
		"branches": [
			{
				"id": "bombardier",
				"name": "Бомбардир",
				"icon": "💣",
				"desc": "Вибухи — це мистецтво.",
				"bonus": {
					"atk": 0.08,
					"mp": 0.12,
					"crit": 0.01
				},
				"skills": [
					{
						"id": "t_bombardier_cluster_bomb",
						"name": "Касетна колба",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Бах-бах-бах.",
						"col": "#7dff6a",
						"type": "aoe_at",
						"radius": 100,
						"power": 0.6,
						"ticks": 3
					},
					{
						"id": "t_bombardier_napalm",
						"name": "Липкий вогонь",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Горить довго.",
						"col": "#7dff6a",
						"type": "projectile",
						"speed": 620,
						"power": 3.12,
						"r": 10,
						"pierce": 0,
						"explode": 70
					}
				],
				"masters": [
					{
						"id": "mad_bomber",
						"name": "Божевільний Підривник",
						"icon": "🤯",
						"desc": "Вибухнув три рази. Щоразу ставав сильнішим.",
						"bonus": {
							"atk": 0.16,
							"mp": 0.24,
							"crit": 0.01
						},
						"skills": [
							{
								"id": "t_mad_bomber_mega_bomb",
								"name": "Мега-бомба",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Гриб над полем бою.",
								"col": "#7dff6a",
								"type": "aoe_at",
								"radius": 100,
								"power": 2.09,
								"ticks": 3
							},
							{
								"id": "t_mad_bomber_chain_reaction",
								"name": "Ланцюгова реакція",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Одне тягне інше.",
								"col": "#7dff6a",
								"type": "fan",
								"count": 7,
								"spread": 0.5,
								"speed": 560,
								"power": 0.81
							}
						]
					},
					{
						"id": "rocket_scientist",
						"name": "Ракетник",
						"icon": "🚀",
						"desc": "Вирішив, що вибухи мають літати.",
						"bonus": {
							"atk": 0.14,
							"mp": 0.21,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_rocket_scientist_rocket_barrage",
								"name": "Ракетний залп",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Свист — і бум.",
								"col": "#7dff6a",
								"type": "aoe_at",
								"radius": 100,
								"power": 0.61,
								"ticks": 3
							},
							{
								"id": "t_rocket_scientist_jetpack",
								"name": "Реактивний ранець",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Злітаєш над полем бою.",
								"col": "#7dff6a",
								"type": "buff",
								"time": 6
							}
						]
					}
				]
			},
			{
				"id": "homunculus",
				"name": "Творець Гомункулів",
				"icon": "🧫",
				"desc": "Виростив помічника в колбі. Він ходить на роботу.",
				"bonus": {
					"hp": 0.09,
					"atk": 0.06,
					"mp": 0.09,
					"def": 0.06
				},
				"skills": [
					{
						"id": "t_homunculus_homunculus_strike",
						"name": "Удар гомункула",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Маленький, але злий.",
						"col": "#7dff6a",
						"type": "projectile",
						"speed": 620,
						"power": 3.6,
						"r": 10,
						"pierce": 0
					},
					{
						"id": "t_homunculus_panacea",
						"name": "Панацея",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Від усього. Навіть від понеділків.",
						"col": "#9dffb0",
						"type": "heal",
						"amount": 0.32
					}
				],
				"masters": [
					{
						"id": "grand_alchemist",
						"name": "Великий Алхімік",
						"icon": "🔱",
						"desc": "Перетворив свинець на золото. І свинку — на дракона.",
						"bonus": {
							"hp": 0.12,
							"atk": 0.14,
							"mp": 0.21,
							"def": 0.08
						},
						"skills": [
							{
								"id": "t_grand_alchemist_golden_rain",
								"name": "Золотий дощ",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Падає золото. І боляче.",
								"col": "#7dff6a",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.43,
								"ticks": 3
							},
							{
								"id": "t_grand_alchemist_immortal_elixir",
								"name": "Еліксир безсмертя",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Майже безсмертя. Майже.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.43
							}
						]
					},
					{
						"id": "life_creator",
						"name": "Творець Життя",
						"icon": "🧬",
						"desc": "Виростив квітку з каменю. І друга з колби.",
						"bonus": {
							"hp": 0.18,
							"atk": 0.12,
							"mp": 0.18,
							"def": 0.12
						},
						"skills": [
							{
								"id": "t_life_creator_rebirth",
								"name": "Відродження",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Нове життя загону.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.45
							},
							{
								"id": "t_life_creator_chimera",
								"name": "Химера",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Лев, коза, змія і трохи злості.",
								"col": "#7dff6a",
								"type": "projectile",
								"speed": 620,
								"power": 6.96,
								"r": 14,
								"pierce": 99
							}
						]
					}
				]
			},
			{
				"id": "herbalist",
				"name": "Травник-цілитель",
				"icon": "🌿",
				"desc": "Знає 300 трав. 290 з них — від кашлю.",
				"bonus": {
					"hp": 0.09,
					"atk": 0.06,
					"mp": 0.09,
					"def": 0.06
				},
				"skills": [
					{
						"id": "t_herbalist_herbal_tea",
						"name": "Трав'яний чай",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Ромашка, м'ята, перемога.",
						"col": "#9dffb0",
						"type": "heal",
						"amount": 0.3
					},
					{
						"id": "t_herbalist_thorn_vine",
						"name": "Колюча лоза",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Кропива-переросток.",
						"col": "#7dff6a",
						"type": "cloud",
						"radius": 105,
						"power": 0.45,
						"time": 5
					}
				],
				"masters": [
					{
						"id": "world_tree",
						"name": "Голос Світового Дерева",
						"icon": "🌳",
						"desc": "Розмовляє з корінням усього світу.",
						"bonus": {
							"hp": 0.18,
							"atk": 0.12,
							"mp": 0.18,
							"def": 0.12
						},
						"skills": [
							{
								"id": "t_world_tree_yggdrasil",
								"name": "Сік Світового Дерева",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Майже воскресіння.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.44
							},
							{
								"id": "t_world_tree_root_crush",
								"name": "Корені",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Земля стискає ворогів.",
								"col": "#7dff6a",
								"type": "aoe_at",
								"radius": 100,
								"power": 1.65,
								"ticks": 3
							}
						]
					},
					{
						"id": "poison_queen",
						"name": "Отруйна Королева",
						"icon": "☠️",
						"desc": "Її чай краще не пити. Навіть якщо дуже просить.",
						"bonus": {
							"atk": 0.16,
							"mp": 0.24,
							"crit": 0.01
						},
						"skills": [
							{
								"id": "t_poison_queen_nightshade",
								"name": "Беладонна",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Солодка і смертельна.",
								"col": "#7dff6a",
								"type": "cloud",
								"radius": 105,
								"power": 0.6,
								"time": 5
							},
							{
								"id": "t_poison_queen_antidote_bomb",
								"name": "Протиотрута-бомба",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Лікує всіх, крім ворогів.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.35
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Магнум Опус",
			"icon": "🌞",
			"skill": {
				"id": "t_asc_great_work",
				"name": "Велике Діяння",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "Найвища формула всесвіту. Складна. Красива. Вибухова.",
				"col": "#7dff6a",
				"type": "meteor",
				"radius": 180,
				"power": 6.55,
				"delay": 0.85
			}
		}
	},
	"jack": {
		"branches": [
			{
				"id": "polymath",
				"name": "Поліхист",
				"icon": "🧠",
				"desc": "Знає все. Набридає всім.",
				"bonus": {
					"atk": 0.06,
					"mp": 0.09,
					"crit": 0.01
				},
				"skills": [
					{
						"id": "t_polymath_lecture",
						"name": "Лекція",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Вороги засинають на 3-й хвилині.",
						"col": "#ffd36e",
						"type": "nova",
						"radius": 115,
						"power": 1.92,
						"slow": 2
					},
					{
						"id": "t_polymath_lifehack",
						"name": "Лайфхак",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Зробив двічі швидше.",
						"col": "#ffd36e",
						"type": "buff",
						"time": 6
					}
				],
				"masters": [
					{
						"id": "omni",
						"name": "Всемайстер",
						"icon": "🌈",
						"desc": "Тепер справді все.",
						"bonus": {
							"hp": 0.09,
							"atk": 0.12,
							"mp": 0.09,
							"def": 0.06,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_omni_all_in",
								"name": "Ва-банк",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Ставить усе. Виграє.",
								"col": "#ffd36e",
								"type": "nova",
								"radius": 115,
								"power": 3.6
							},
							{
								"id": "t_omni_second_wind",
								"name": "Друге дихання",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Усі знову в строю.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.35
							}
						]
					},
					{
						"id": "archivist",
						"name": "Архіваріус Світів",
						"icon": "📚",
						"desc": "Прочитав усі книги. Навіть інструкцію.",
						"bonus": {
							"atk": 0.12,
							"mp": 0.18,
							"crit": 0.02
						},
						"skills": [
							{
								"id": "t_archivist_encyclopedia",
								"name": "Енциклопедія",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Удар томом знань.",
								"col": "#ffd36e",
								"type": "nova",
								"radius": 115,
								"power": 3.6
							},
							{
								"id": "t_archivist_footnote",
								"name": "Примітка",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Дрібним шрифтом.",
								"col": "#ffd36e",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 6.25,
								"knock": 300
							}
						]
					}
				]
			},
			{
				"id": "trickster",
				"name": "Трикстер",
				"icon": "🎭",
				"desc": "Обманює навіть долю.",
				"bonus": {
					"crit": 0.03
				},
				"skills": [
					{
						"id": "t_trickster_bait",
						"name": "Наживка",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Вороги б'ють повітря.",
						"col": "#ffd36e",
						"type": "shield",
						"time": 3,
						"amount": 0.12
					},
					{
						"id": "t_trickster_card_trick",
						"name": "Фокус з картами",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "Тут була карта. Тепер у ворога в оці.",
						"col": "#ffd36e",
						"type": "nova",
						"radius": 115,
						"power": 2.16
					}
				],
				"masters": [
					{
						"id": "fate_breaker",
						"name": "Ламач Долі",
						"icon": "♾️",
						"desc": "Сценарій? Переписано.",
						"bonus": {
							"crit": 0.05
						},
						"skills": [
							{
								"id": "t_fate_breaker_rewrite",
								"name": "Переписати сюжет",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Автор плаче, вороги — теж.",
								"col": "#ffd36e",
								"type": "nova",
								"radius": 115,
								"power": 4.08
							},
							{
								"id": "t_fate_breaker_lucky_seven",
								"name": "Щаслива сімка",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Сім ударів, кожен — джекпот.",
								"col": "#ffd36e",
								"type": "fan",
								"count": 7,
								"spread": 1.2,
								"speed": 560,
								"power": 0.81
							}
						]
					},
					{
						"id": "jester",
						"name": "Блазень Долі",
						"icon": "🤡",
						"desc": "Сміється останнім. І першим. І посередині.",
						"bonus": {
							"crit": 0.05
						},
						"skills": [
							{
								"id": "t_jester_prank",
								"name": "Розіграш",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Кнопка на троні.",
								"col": "#ffd36e",
								"type": "nova",
								"radius": 115,
								"power": 3.12,
								"slow": 2
							},
							{
								"id": "t_jester_punchline",
								"name": "Панчлайн",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Найсильніший жарт.",
								"col": "#ffd36e",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 7.5,
								"knock": 300
							}
						]
					}
				]
			},
			{
				"id": "gambler",
				"name": "Гравець",
				"icon": "🎲",
				"desc": "Ставить усе на червоне. І виграє. Майже завжди.",
				"bonus": {
					"crit": 0.02
				},
				"skills": [
					{
						"id": "t_gambler_dice_throw",
						"name": "Кидок кості",
						"lvl": 20,
						"mp": 24,
						"cd": 6,
						"desc": "Шість граней — шість ударів.",
						"col": "#ffd36e",
						"type": "fan",
						"count": 6,
						"spread": 1.2,
						"speed": 560,
						"power": 0.55
					},
					{
						"id": "t_gambler_double_or_nothing",
						"name": "Все або нічого",
						"lvl": 26,
						"mp": 28,
						"cd": 7,
						"desc": "+60% криту.",
						"col": "#ffd36e",
						"type": "buff",
						"time": 6
					}
				],
				"masters": [
					{
						"id": "casino_lord",
						"name": "Власник Казино",
						"icon": "🎰",
						"desc": "Казино завжди виграє. Він — казино.",
						"bonus": {
							"atk": 0.06,
							"mp": 0.09,
							"crit": 0.04
						},
						"skills": [
							{
								"id": "t_casino_lord_jackpot_rain",
								"name": "Дощ джекпоту",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Три сімки!",
								"col": "#ffd36e",
								"type": "nova",
								"radius": 115,
								"power": 3.36
							},
							{
								"id": "t_casino_lord_house_edge",
								"name": "Перевага закладу",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Шанси на твоєму боці.",
								"col": "#9dffb0",
								"type": "heal",
								"amount": 0.35
							}
						]
					},
					{
						"id": "lucky_fool",
						"name": "Щасливий Дурень",
						"icon": "🍀",
						"desc": "Не знає правил. Тому й перемагає.",
						"bonus": {
							"hp": 0.12,
							"def": 0.08,
							"crit": 0.03
						},
						"skills": [
							{
								"id": "t_lucky_fool_trip_win",
								"name": "Спіткнувся — переміг",
								"lvl": 45,
								"mp": 32,
								"cd": 8,
								"desc": "Випадково. Боляче.",
								"col": "#ffd36e",
								"type": "arc",
								"reach": 100,
								"arc": 1.25,
								"power": 7.5,
								"knock": 300
							},
							{
								"id": "t_lucky_fool_clover_field",
								"name": "Конюшинове поле",
								"lvl": 52,
								"mp": 36,
								"cd": 9,
								"desc": "Щастя на всіх.",
								"col": "#ffd36e",
								"type": "nova",
								"radius": 115,
								"power": 2.88
							}
						]
					}
				]
			}
		],
		"ascend": {
			"name": "Протагоніст",
			"icon": "⭐",
			"skill": {
				"id": "t_asc_plot_armor",
				"name": "Сила сюжету",
				"lvl": 75,
				"mp": 50,
				"cd": 14,
				"desc": "Головний герой не може програти. Це правило.",
				"col": "#ffd36e",
				"type": "meteor",
				"radius": 180,
				"power": 6.99,
				"delay": 0.85
			}
		}
	}
}
