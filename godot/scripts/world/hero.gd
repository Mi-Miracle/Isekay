## Герой на мапі світу: аніме-чібі з плащем і мечем. Малюється векторно, анімація ходьби — покачування.
class_name Hero
extends Node2D

var moving := false
var running := false
var facing := 1.0
var cell := 16.0
var _walk_t := 0.0
var _dust: CPUParticles2D


func _ready() -> void:
	_dust = CPUParticles2D.new()
	_dust.amount = 14
	_dust.lifetime = 0.6
	_dust.emitting = false
	_dust.position = Vector2(0, 2)
	_dust.direction = Vector2(0, -1)
	_dust.spread = 70
	_dust.initial_velocity_min = 6
	_dust.initial_velocity_max = 16
	_dust.gravity = Vector2(0, 10)
	_dust.scale_amount_min = 1.2
	_dust.scale_amount_max = 2.6
	_dust.color = Color(0.95, 0.88, 0.75, 0.5)
	_dust.show_behind_parent = true
	add_child(_dust)


func _process(delta: float) -> void:
	if moving:
		_walk_t += delta * (14.0 if running else 9.0)
	else:
		_walk_t = lerpf(_walk_t, roundf(_walk_t / PI) * PI, delta * 10.0)
	_dust.emitting = moving
	queue_redraw()


func _draw() -> void:
	var s := cell / 16.0
	var t := Time.get_ticks_msec() / 1000.0
	var bob := absf(sin(_walk_t)) * 1.6 * s if moving else sin(t * 2.0) * 0.5 * s
	var lean := 0.12 if running and moving else 0.0
	# магічне коло під героєм
	draw_set_transform(Vector2.ZERO, 0, Vector2(1, 0.45))
	draw_arc(Vector2.ZERO, 9.5 * s, 0, TAU, 32, Color(1, 0.6, 0.85, 0.35 + 0.15 * sin(t * 3.0)), 1.4 * s, true)
	draw_circle(Vector2.ZERO, 6.5 * s, Color(0, 0, 0, 0.3))
	draw_set_transform(Vector2(0, -bob), lean * facing, Vector2(facing, 1))
	var leg := sin(_walk_t) * 2.2 * s if moving else 0.0
	# ноги
	draw_line(Vector2(-1.8 * s, -5 * s), Vector2(-1.8 * s + leg, 0), Color("#3b2a4a"), 2.2 * s, true)
	draw_line(Vector2(1.8 * s, -5 * s), Vector2(1.8 * s - leg, 0), Color("#3b2a4a"), 2.2 * s, true)
	# меч за спиною
	draw_line(Vector2(-4 * s, -17 * s), Vector2(5 * s, -4 * s), Color("#cfd8e6"), 1.6 * s, true)
	draw_line(Vector2(-5 * s, -15.5 * s), Vector2(-2.5 * s, -17.5 * s), Color("#c9a227"), 1.8 * s, true)
	# плащ (розвівається)
	var flap := sin(_walk_t * 0.5 + t) * 1.5 * s if moving else sin(t * 1.4) * 0.6 * s
	draw_colored_polygon(PackedVector2Array([
		Vector2(-4.5 * s, -12 * s), Vector2(4.5 * s, -12 * s), Vector2(5.5 * s - flap, -3 * s), Vector2(-6.5 * s - flap, -2.5 * s)]), Color("#2f6fd6"))
	# тіло
	draw_rect(Rect2(-3.5 * s, -12 * s, 7 * s, 7.5 * s), Color("#f2ece0"))
	draw_rect(Rect2(-3.5 * s, -7 * s, 7 * s, 1.4 * s), Color("#7a4b2a"))
	# голова
	var hc := Vector2(0, -17 * s)
	draw_circle(hc, 5.6 * s, Color("#ffe0cc"))
	# волосся — гострі аніме-пасма
	var hair := Color("#6b3f1f")
	draw_colored_polygon(PackedVector2Array([
		hc + Vector2(-6.2, 0.5) * s, hc + Vector2(-6.5, -4) * s, hc + Vector2(-3, -7.5) * s, hc + Vector2(1, -6.8) * s,
		hc + Vector2(5, -6) * s, hc + Vector2(7.5, -2.5) * s, hc + Vector2(6.3, 1) * s, hc + Vector2(4.2, -1.8) * s,
		hc + Vector2(2, -0.5) * s, hc + Vector2(0, -2.6) * s, hc + Vector2(-2.6, -0.2) * s, hc + Vector2(-4.4, -2) * s]), hair)
	draw_colored_polygon(PackedVector2Array([hc + Vector2(-3, -7.2) * s, hc + Vector2(-1.5, -10.5) * s, hc + Vector2(0.5, -6.8) * s]), hair)
	draw_colored_polygon(PackedVector2Array([hc + Vector2(1.5, -6.6) * s, hc + Vector2(4.5, -9.5) * s, hc + Vector2(4.6, -5.8) * s]), hair)
	# великі аніме-очі
	var blink := fmod(t, 3.7) < 0.12
	for ex in [1.0, 3.6]:
		var e := hc + Vector2(ex - 0.6, 1.2) * s
		if blink:
			draw_line(e + Vector2(-0.9, 0) * s, e + Vector2(0.9, 0) * s, Color("#2a1a33"), 0.6 * s)
		else:
			draw_rect(Rect2(e - Vector2(0.8, 1.3) * s, Vector2(1.6, 2.6) * s), Color("#2a1a33"))
			draw_rect(Rect2(e - Vector2(0.8, -0.1) * s, Vector2(1.6, 1.2) * s), Color("#3fa7ff"))
			draw_rect(Rect2(e - Vector2(0.6, 1.1) * s, Vector2(0.7, 0.7) * s), Color.WHITE)
	# рум'янець
	draw_circle(hc + Vector2(4.4, 3.2) * s, 0.9 * s, Color(1, 0.5, 0.6, 0.5))
	draw_set_transform(Vector2.ZERO)
