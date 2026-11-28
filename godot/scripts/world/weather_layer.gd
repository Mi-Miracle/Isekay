## Погода на мапі світу: дощ, сніг, хуртовина, туман, спека, пелюстки сакури й блискавки.
## Малюється в екранних координатах поверх мапи, під HUD. Видно лише на мапі (не в місті й не в підземеллі).
class_name WeatherLayer
extends CanvasLayer

var world
var _fx: Control
var _parts: Array = []
var _flash := 0.0
var _kind := ""


func _ready() -> void:
	layer = 2
	_fx = Control.new()
	_fx.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_fx.set_anchors_preset(Control.PRESET_FULL_RECT)
	_fx.draw.connect(_on_draw)
	add_child(_fx)


func _process(delta: float) -> void:
	var show: bool = world != null and world.visible and world.town == null and world.dungeon == null and Game.settings.get("weather_fx", true)
	visible = show
	if not show:
		return
	var k := Weather.kind()
	var vs := _fx.get_viewport_rect().size
	if k != _kind:
		_kind = k
		_parts.clear()
		var n: int = {"rain": 180, "storm": 260, "snow": 140, "blizzard": 320, "bloom": 50, "heat": 0, "fog": 0}.get(k, 0)
		for i in n:
			_parts.append(_new_part(vs, true))
	for q in _parts:
		q.pos += q.vel * delta
		if k in ["snow", "bloom", "blizzard"]:
			q.pos.x += sin(Time.get_ticks_msec() / 600.0 + float(q.ph)) * 20.0 * delta
		if q.pos.y > vs.y + 10 or q.pos.x < -40 or q.pos.x > vs.x + 40:
			var nq := _new_part(vs, false)
			q.pos = nq.pos
			q.vel = nq.vel
	if k == "storm":
		_flash = maxf(0.0, _flash - delta * 2.5)
		if randf() < delta * 0.18:
			_flash = 1.0
			Audio.sfx("thunder", -8.0, 0.2)
	_fx.queue_redraw()


func _new_part(vs: Vector2, anywhere: bool) -> Dictionary:
	var k := _kind
	var pos := Vector2(randf_range(-30, vs.x + 30), randf_range(-vs.y, vs.y) if anywhere else randf_range(-60, -10))
	var vel := Vector2.ZERO
	match k:
		"rain":
			vel = Vector2(-60, randf_range(700, 900))
		"storm":
			vel = Vector2(-220, randf_range(900, 1150))
		"snow":
			vel = Vector2(randf_range(-15, 15), randf_range(45, 90))
		"blizzard":
			vel = Vector2(randf_range(-420, -260), randf_range(140, 260))
			if not anywhere:
				pos = Vector2(vs.x + randf_range(0, 40), randf_range(-20, vs.y))
		"bloom":
			vel = Vector2(randf_range(-40, -10), randf_range(35, 70))
	return {"pos": pos, "vel": vel, "ph": randf() * TAU, "s": randf_range(0.6, 1.4)}


func _on_draw() -> void:
	var vs := _fx.get_viewport_rect().size
	match _kind:
		"rain", "storm":
			_fx.draw_rect(Rect2(Vector2.ZERO, vs), Color(0.1, 0.14, 0.25, 0.18 if _kind == "rain" else 0.28))
			for q in _parts:
				var d: Vector2 = q.vel.normalized() * 14.0 * float(q.s)
				_fx.draw_line(q.pos, q.pos + d, Color(0.75, 0.85, 1.0, 0.45), 1.2)
			if _flash > 0.0:
				_fx.draw_rect(Rect2(Vector2.ZERO, vs), Color(0.9, 0.95, 1.0, 0.45 * _flash * _flash))
		"snow", "blizzard":
			_fx.draw_rect(Rect2(Vector2.ZERO, vs), Color(0.85, 0.92, 1.0, 0.08 if _kind == "snow" else 0.2))
			for q in _parts:
				_fx.draw_circle(q.pos, 2.0 * float(q.s), Color(1, 1, 1, 0.8))
		"fog":
			var t := Time.get_ticks_msec() / 1000.0
			_fx.draw_rect(Rect2(Vector2.ZERO, vs), Color(0.8, 0.82, 0.88, 0.22))
			for i in 7:
				var x := fmod(t * (12.0 + i * 3.0) + i * 260.0, vs.x + 600.0) - 300.0
				_fx.draw_circle(Vector2(x, vs.y * (0.15 + i * 0.12)), 220.0, Color(0.9, 0.9, 0.95, 0.07))
		"heat":
			_fx.draw_rect(Rect2(Vector2.ZERO, vs), Color(1.0, 0.6, 0.2, 0.07 + 0.02 * sin(Time.get_ticks_msec() / 400.0)))
		"bloom":
			for q in _parts:
				var a := Time.get_ticks_msec() / 500.0 + float(q.ph)
				_fx.draw_set_transform(q.pos, a, Vector2(1.0, 0.6))
				_fx.draw_circle(Vector2.ZERO, 4.0 * float(q.s), Color("#ffc6e0"))
				_fx.draw_set_transform(Vector2.ZERO)
