## Герой на мапі світу: аніме-чібі з плащем і мечем (арт SpriteCook), анімація ходьби — покачування.
class_name Hero
extends Node2D

var moving := false
var running := false
var facing := 1.0
var cell := 16.0
var _walk_t := 0.0
var _dust: CPUParticles2D
var _tex: Texture2D


func _ready() -> void:
	# арт героя (SpriteCook) з mip-рівнями, щоб на будь-якому зумі був гладкий
	var src: Texture2D = load("res://assets/art/hero.png")
	if src:
		var img := src.get_image()
		if img.is_compressed():
			img.decompress()
		img.generate_mipmaps()
		_tex = ImageTexture.create_from_image(img)
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
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
	var bob := absf(sin(_walk_t)) * 1.6 * s if moving else sin(t * 2.0) * 0.4 * s
	# магічне коло й тінь під героєм
	draw_set_transform(Vector2.ZERO, 0, Vector2(1, 0.45))
	draw_arc(Vector2.ZERO, 9.5 * s, 0, TAU, 32, Color(1, 0.6, 0.85, 0.35 + 0.15 * sin(t * 3.0)), 1.4 * s, true)
	draw_circle(Vector2.ZERO, 6.5 * s, Color(0, 0, 0, 0.3))
	if _tex == null:
		draw_set_transform(Vector2.ZERO)
		return
	# аніме-арт: покачування під час ходьби, легкий нахил при бігу, «дихання» на місці
	var h := 30.0 * s
	var w := h * _tex.get_width() / float(_tex.get_height())
	var rock := sin(_walk_t) * 0.07 if moving else 0.0
	var lean := 0.1 * facing if running and moving else 0.0
	var squash := 1.0 + (0.03 * sin(t * 2.0) if not moving else 0.04 * absf(cos(_walk_t)))
	draw_set_transform(Vector2(0, -bob), rock + lean, Vector2(facing / squash, squash))
	draw_texture_rect(_tex, Rect2(-w / 2.0, -h, w, h), false)
	draw_set_transform(Vector2.ZERO)
