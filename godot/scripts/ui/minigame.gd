## Мініігри професій. Два режими:
##  "timing" — бігунок ходить по смузі, тисни ПРОБІЛ / клік, коли він у зеленій зоні (рибалка, трави, огранювання);
##  "keys"   — з'являються стрілки, тисни їх вчасно (кулінарія).
## Результат — сигнал finished(score 0..1).
class_name MiniGame
extends Control

signal finished(score: float)

var kind := "timing"
var title := ""
var hint := ""
var icon := "🎣"
var col := Color("#7dff9a")
# timing
var zone := 0.22          # ширина зеленої зони (частка смуги)
var speed := 1.0          # швидкість бігунка
var need := 3             # скільки влучань треба
var max_miss := 3
var _zone_x := 0.4
var _t := 0.0
var _pos := 0.0
var _hits := 0
var _miss := 0
var _flash := 0.0
var _flash_col := Color.WHITE
# keys
const ARROWS := [KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN]
const ARROW_TXT := ["←", "↑", "→", "↓"]
const WASD := [KEY_A, KEY_W, KEY_D, KEY_S]
var _seq: Array = []
var _i := 0
var _win := 1.4
var _left := 0.0
var _good := 0
var _done := false
var _time_limit := 20.0


func setup(k: String, opts: Dictionary) -> void:
	kind = k
	title = opts.get("title", "Мінігра")
	hint = opts.get("hint", "")
	icon = opts.get("icon", "🎣")
	col = opts.get("col", col)
	zone = float(opts.get("zone", zone))
	speed = float(opts.get("speed", speed))
	need = int(opts.get("need", need))
	custom_minimum_size = Vector2(820, 330)
	mouse_filter = Control.MOUSE_FILTER_STOP
	if kind == "keys":
		var n := int(opts.get("n", 6))
		_win = float(opts.get("window", 1.4))
		for i in n:
			_seq.append(randi() % 4)
		_left = _win
	else:
		_zone_x = randf_range(0.1, 0.9 - zone)


func _process(delta: float) -> void:
	if _done:
		return
	_t += delta
	_flash = maxf(0.0, _flash - delta * 3.0)
	if kind == "timing":
		# бігунок: синус із «рибʼячими» ривками
		_pos = 0.5 + 0.5 * sin(_t * 2.2 * speed + sin(_t * 1.3) * 0.8 * speed)
		if _t > _time_limit:
			_finish()
	else:
		_left -= delta
		if _left <= 0.0:
			_flash = 1.0
			_flash_col = Color("#ff7a7a")
			_next()
	queue_redraw()


func _input(event: InputEvent) -> void:
	if _done or not is_visible_in_tree():
		return
	var press := false
	var key := -1
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_ESCAPE:
			get_viewport().set_input_as_handled()
			_hits = 0
			_good = 0
			_finish()
			return
		key = event.keycode
		press = event.keycode in [KEY_SPACE, KEY_ENTER, KEY_E]
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		press = true
	if kind == "timing" and press:
		get_viewport().set_input_as_handled()
		if _pos >= _zone_x and _pos <= _zone_x + zone:
			_hits += 1
			_flash_col = col
			Audio.sfx("coin", -4.0)
			_zone_x = randf_range(0.08, 0.92 - zone)
			if _hits >= need:
				_finish()
		else:
			_miss += 1
			_flash_col = Color("#ff7a7a")
			Audio.sfx("error", -8.0)
			if _miss >= max_miss:
				_finish()
		_flash = 1.0
	elif kind == "keys" and key >= 0:
		var want: int = _seq[_i]
		var idx := ARROWS.find(key)
		if idx < 0:
			idx = WASD.find(key)
		if idx < 0:
			return
		get_viewport().set_input_as_handled()
		if idx == want:
			_good += 1
			_flash_col = col
			Audio.sfx("click", -2.0)
		else:
			_flash_col = Color("#ff7a7a")
			Audio.sfx("error", -8.0)
		_flash = 1.0
		_next()


func _next() -> void:
	_i += 1
	_left = _win * (0.92 if _i > 2 else 1.0)
	if _i >= _seq.size():
		_finish()


func _finish() -> void:
	if _done:
		return
	_done = true
	var score := 0.0
	if kind == "timing":
		score = float(_hits) / float(need) * (1.0 - 0.12 * _miss) if _hits > 0 else 0.0
	else:
		score = float(_good) / float(maxi(1, _seq.size()))
	finished.emit(clampf(score, 0.0, 1.0))


func _draw() -> void:
	var f: Font = Game.title_font
	var nf := ThemeDB.fallback_font
	var w := size.x
	draw_rect(Rect2(Vector2.ZERO, size), Color(0.08, 0.05, 0.14, 0.96), true)
	draw_rect(Rect2(Vector2.ZERO, size), Color(1, 1, 1, 0.15), false, 2.0)
	if _flash > 0.0:
		draw_rect(Rect2(Vector2.ZERO, size), Color(_flash_col, 0.15 * _flash), true)
	draw_string(f, Vector2(0, 52), "%s %s" % [icon, title], HORIZONTAL_ALIGNMENT_CENTER, w, 34, Game.C_GOLD)
	draw_string(nf, Vector2(0, 88), hint, HORIZONTAL_ALIGNMENT_CENTER, w, 18, Color(1, 1, 1, 0.75))
	if kind == "timing":
		var bar := Rect2(60, 150, w - 120, 46)
		draw_rect(bar, Color(0.15, 0.12, 0.22), true)
		draw_rect(Rect2(bar.position.x + bar.size.x * _zone_x, bar.position.y, bar.size.x * zone, bar.size.y), Color(col, 0.55), true)
		draw_rect(bar, Color(1, 1, 1, 0.3), false, 2.0)
		var mx := bar.position.x + bar.size.x * _pos
		draw_rect(Rect2(mx - 4, bar.position.y - 12, 8, bar.size.y + 24), Color.WHITE, true)
		draw_string(nf, Vector2(mx - 14, bar.position.y - 18), icon, HORIZONTAL_ALIGNMENT_LEFT, -1, 24, Color.WHITE)
		var st := "Влучань: %d/%d · промахів: %d/%d" % [_hits, need, _miss, max_miss]
		draw_string(nf, Vector2(0, 250), st, HORIZONTAL_ALIGNMENT_CENTER, w, 20, Color.WHITE)
		draw_string(nf, Vector2(0, 290), "ПРОБІЛ / клік — тягни! · Esc — здатися", HORIZONTAL_ALIGNMENT_CENTER, w, 16, Color(1, 1, 1, 0.55))
	else:
		var n := _seq.size()
		var step := 92.0
		var x0 := w / 2.0 - (n - 1) * step / 2.0
		for i in n:
			var c := Vector2(x0 + i * step, 190)
			var active := i == _i
			var bg := Color(0.2, 0.16, 0.3) if i > _i else (Color(col, 0.35) if i < _i else Color(1, 0.85, 0.4, 0.35))
			draw_circle(c, 36 if active else 30, bg)
			if active:
				draw_arc(c, 40, -PI / 2, -PI / 2 + TAU * clampf(_left / _win, 0, 1), 32, Game.C_GOLD, 4.0)
			draw_string(nf, c + Vector2(-20, 14), ARROW_TXT[_seq[i]], HORIZONTAL_ALIGNMENT_CENTER, 40, 38, Color.WHITE if i >= _i else Color(1, 1, 1, 0.5))
		draw_string(nf, Vector2(0, 270), "Тисни стрілки (або WASD) вчасно! Вірно: %d" % _good, HORIZONTAL_ALIGNMENT_CENTER, w, 20, Color.WHITE)
		draw_string(nf, Vector2(0, 304), "Esc — кинути готувати", HORIZONTAL_ALIGNMENT_CENTER, w, 16, Color(1, 1, 1, 0.55))
