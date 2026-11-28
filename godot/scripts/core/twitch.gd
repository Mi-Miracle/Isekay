## Автозавантаження Twitch: анонімне підключення до чату каналу лише на читання (без логіна й токенів),
## команди глядачів і голосування чату за варіанти подій.
## Налаштування (Game.settings): twitch_on, twitch_channel, twitch_cmds, twitch_chaos, twitch_vote, twitch_vote_secs, twitch_cooldown.
extends Node

signal message(user: String, text: String)
signal status_changed(text: String)
## Команда глядача, яку виконує світ: kind ∈ heal, gift, hero, horde, joke, help.
signal command(user: String, kind: String, args: Array)
signal vote_changed(counts: Array)

const URL := "wss://irc-ws.chat.twitch.tv:443"
const JOKES := [
	"Чому скелети не б'ються між собою? Бо в них немає кишок.",
	"Люмі вперше спекла торт. Тепер у Дивосвіті на одне сузір'я менше.",
	"Ісекайник питає: «Де тут вай-фай?» Маг відповідає: «Ось твій вай — і фай».",
	"Слиз пішов на співбесіду. Його взяли — він легко вписався в колектив.",
	"Дракон сів на дієту. Тепер їсть лише лицарів без обладунків.",
	"Гоблін відкрив банк. Відсотки — 300%. Вклади — назавжди.",
	"Вантажівка-кун пішла у відпустку. Ісекайників цього тижня не буде.",
	"Мімік закохався в скриню. Каже, у них багато спільного.",
	"Бард заспівав так погано, що дракон сам віддав скарб, аби той замовк.",
	"Некромант не ходить на побачення: каже, всі його колишні досі поруч.",
]

var ws: WebSocketPeer = null
var connected := false
var channel := ""
var _retry := 0
var _retry_t := 0.0
var _cool := {}
var _global_cool := {}
var _vote_opts := 0
var _votes := {}
var vote_active := false


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	if bool(Game.settings.get("twitch_on", false)):
		connect_chat.call_deferred()


func status_text() -> String:
	if not bool(Game.settings.get("twitch_on", false)):
		return "вимкнено"
	if connected:
		return "✅ підключено до twitch.tv/%s" % channel
	return "⏳ підключаємось до twitch.tv/%s…" % _chan_setting()


func _chan_setting() -> String:
	var c := str(Game.settings.get("twitch_channel", "mi_miracle")).strip_edges().to_lower().trim_prefix("#")
	if c.begins_with("https://") or c.begins_with("twitch.tv"):
		c = c.get_slice("twitch.tv/", 1).get_slice("/", 0)
	return c if c != "" else "mi_miracle"


func connect_chat() -> void:
	disconnect_chat()
	channel = _chan_setting()
	ws = WebSocketPeer.new()
	var err := ws.connect_to_url(URL)
	if err != OK:
		ws = null
		status_changed.emit("❌ не вдалося підключитися (%d)" % err)
		_schedule_retry()
		return
	status_changed.emit(status_text())


func disconnect_chat() -> void:
	if ws:
		ws.close()
	ws = null
	connected = false


## Застосувати зміни налаштувань: увімкнути/вимкнути або перепідключитися до іншого каналу.
func apply_settings() -> void:
	var on := bool(Game.settings.get("twitch_on", false))
	if not on:
		disconnect_chat()
		_retry = 0
		status_changed.emit(status_text())
	elif ws == null or channel != _chan_setting():
		_retry = 0
		connect_chat()


func _schedule_retry() -> void:
	if _retry < 8:
		_retry += 1
		_retry_t = 3.0 * _retry


func _process(delta: float) -> void:
	if ws == null:
		if _retry_t > 0.0:
			_retry_t -= delta
			if _retry_t <= 0.0 and bool(Game.settings.get("twitch_on", false)):
				connect_chat()
		return
	ws.poll()
	match ws.get_ready_state():
		WebSocketPeer.STATE_OPEN:
			if not connected:
				connected = true
				_retry = 0
				ws.send_text("CAP REQ :twitch.tv/tags")
				ws.send_text("PASS SCHMOOPIIE")
				ws.send_text("NICK justinfan%d" % randi_range(10000, 89999))
				ws.send_text("JOIN #" + channel)
				status_changed.emit(status_text())
			while ws.get_available_packet_count() > 0:
				for line in ws.get_packet().get_string_from_utf8().split("\r\n", false):
					handle_line(line)
		WebSocketPeer.STATE_CLOSED:
			ws = null
			var was := connected
			connected = false
			status_changed.emit("🔌 з'єднання розірвано, перепідключення…" if was else "❌ Twitch недоступний, ще спроба…")
			_schedule_retry()


## Розбір одного рядка IRC. Публічний — щоб тестувати без мережі.
func handle_line(line: String) -> void:
	if line.begins_with("PING"):
		if ws:
			ws.send_text("PONG :tmi.twitch.tv")
		return
	var re := RegEx.create_from_string("^(?:@(\\S+) )?:(\\w+)!\\S+ PRIVMSG #\\S+ :(.*)$")
	var m := re.search(line)
	if m == null:
		return
	var user := m.get_string(2)
	var tags := m.get_string(1)
	var dn := RegEx.create_from_string("display-name=([^;]*)").search(tags)
	if dn and dn.get_string(1) != "":
		user = dn.get_string(1)
	handle_chat(user, m.get_string(3))


## Повідомлення глядача: голос за варіант або команда.
func handle_chat(user: String, text: String) -> void:
	message.emit(user, text)
	var t := text.strip_edges().to_lower()
	if not t.begins_with("!"):
		# голос просто цифрою теж рахуємо
		if vote_active and t.length() == 1 and t.is_valid_int():
			_vote(user, int(t))
		return
	var parts := t.substr(1).split(" ", false)
	if parts.is_empty():
		return
	var cmd := parts[0]
	if vote_active and cmd.is_valid_int():
		_vote(user, int(cmd))
		return
	if not bool(Game.settings.get("twitch_cmds", true)):
		return
	var kind := ""
	match cmd:
		"допомога", "help", "команди":
			kind = "help"
		"лікуй", "heal", "хіл":
			kind = "heal"
		"подарунок", "gift":
			kind = "gift"
		"герой", "hero":
			kind = "hero"
		"жарт", "joke":
			kind = "joke"
		"орда", "horde":
			kind = "horde"
		_:
			return
	if kind == "horde" and not bool(Game.settings.get("twitch_chaos", true)):
		return
	var now := Time.get_ticks_msec() / 1000.0
	var cd := float(Game.settings.get("twitch_cooldown", 30.0))
	if now - float(_cool.get(user.to_lower(), -9999.0)) < cd:
		return
	# спільні обмеження, щоб чат не завалив гру
	var gcd := {"heal": 20.0, "gift": 20.0, "horde": 600.0, "hero": 5.0, "joke": 8.0, "help": 30.0}
	if now - float(_global_cool.get(kind, -9999.0)) < float(gcd[kind]):
		return
	_cool[user.to_lower()] = now
	_global_cool[kind] = now
	command.emit(user, kind, Array(parts.slice(1)))


# ---------------------------------------------------------------- голосування

func start_vote(n_options: int) -> bool:
	if not connected or not bool(Game.settings.get("twitch_vote", true)):
		return false
	_vote_opts = n_options
	_votes = {}
	vote_active = true
	vote_changed.emit(vote_counts())
	return true


func _vote(user: String, n: int) -> void:
	if n < 1 or n > _vote_opts:
		return
	_votes[user.to_lower()] = n
	vote_changed.emit(vote_counts())


func vote_counts() -> Array:
	var c: Array = []
	c.resize(_vote_opts)
	c.fill(0)
	for u in _votes:
		c[int(_votes[u]) - 1] += 1
	return c


## Завершити голосування: індекс переможця (0..n-1) або -1, якщо ніхто не голосував. Нічия — випадково.
func end_vote() -> int:
	vote_active = false
	var c := vote_counts()
	var best := 0
	for x in c:
		best = maxi(best, int(x))
	if best == 0:
		return -1
	var tops: Array = []
	for i in c.size():
		if int(c[i]) == best:
			tops.append(i)
	return tops[randi() % tops.size()]
