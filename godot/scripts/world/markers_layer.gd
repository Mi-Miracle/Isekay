## Поселення, підземелля й назви пам'яток на мапі. Показує лише те, що герой уже розвідав.
class_name MarkersLayer
extends Node2D

var wd: WorldData
var fog: PackedByteArray
var cell := 16.0
var zoom := 2.0
var view_rect := Rect2()
var font: Font
var highlight := -1
## Написи малюються окремо в екранних координатах, щоб текст був чіткий за будь-якого зуму.
var labels: Array = []
var label_layer: Node2D


func setup(world: WorldData, fog_ref: PackedByteArray, cell_px: float) -> void:
	wd = world
	fog = fog_ref
	cell = cell_px
	font = Game.ui_font


func _seen(c: int) -> bool:
	return fog.size() > c and fog[c] > 0


func _draw() -> void:
	if wd == null:
		return
	labels.clear()
	var k := maxf(1.0, 0.85 / zoom)  # при віддаленні значки трохи більші, щоб їх було видно
	var vr := view_rect.grow(cell * 4)
	var show_small := zoom >= 0.9
	var show_names := zoom >= 1.15
	_post(k)
	# назви пам'яток — великі напівпрозорі написи
	for L in wd.landmarks:
		var lc: int = L.y * Defs.W + L.x
		if not _seen(lc):
			continue
		var p := Vector2(L.x + 0.5, L.y + 0.5) * cell
		if not vr.has_point(p):
			continue
		_label(p + Vector2(0, -L.r * cell * 0.3), L.name, 22, Color(1, 0.9, 0.98, 0.7), true)
	for d in wd.dungeons:
		if not _seen(d.cell):
			continue
		var p := Vector2(d.x + 0.5, d.y + 0.5) * cell
		if not vr.has_point(p):
			continue
		if not show_small and not d.final:
			draw_circle(p, cell * 0.35 * k, Color(0.55, 0.2, 0.6, 0.9))
			continue
		_draw_dungeon(p, d, k)
		if show_names:
			_label(p + Vector2(0, cell * 1.5 * k), d.name, 14, Color("#f0dcff"), false)
	for b in wd.baronies:
		if not _seen(b.cell):
			continue
		var p := Vector2(b.x + 0.5, b.y + 0.5) * cell
		if not vr.has_point(p):
			continue
		var big: bool = b.type in ["capital", "city"]
		if not show_small and not big:
			var rc: Color = wd.realms[b.owner].color
			draw_circle(p, cell * 0.38 * k, Color(0.1, 0.06, 0.12, 0.8))
			draw_circle(p, cell * 0.26 * k, rc.lightened(0.2))
			continue
		_draw_settlement(p, b, k)
		if big or show_names:
			var col := Color("#fff2c2") if b.type == "capital" else Color.WHITE
			_label(p + Vector2(0, cell * (1.9 if big else 1.45) * k), b.name, 19 if b.type == "capital" else (17 if big else 15), col, false)
		if b.id == highlight:
			var t := Time.get_ticks_msec() / 1000.0
			draw_arc(p, cell * (1.3 + 0.12 * sin(t * 5.0)) * k, 0, TAU, 40, Color(1, 0.85, 0.4, 0.9), 2.0 / zoom, true)


func _post(k: float) -> void:
	_draw_own(k)


func _draw_own(k: float) -> void:
	var h := Estate.house()
	if not h.is_empty():
		var B: Dictionary = wd.baronies[int(h.barony)]
		var p := Vector2(B.x + 1.6, B.y - 0.4) * cell
		var u := cell * k * 0.8
		draw_circle(p, u * 0.9, Color(1, 0.4, 0.7, 0.35))
		draw_rect(Rect2(p.x - u * 0.45, p.y - u * 0.2, u * 0.9, u * 0.6), Color("#fff0f6"))
		draw_colored_polygon(PackedVector2Array([p + Vector2(-u * 0.6, -u * 0.2), p + Vector2(0, -u * 0.75), p + Vector2(u * 0.6, -u * 0.2)]), Color("#e05a9a"))
		_label(p + Vector2(0, u * 0.6), "Мій дім", 14, Color("#ffc4e1"), false)
	var L := Estate.land()
	if not L.is_empty():
		var B: Dictionary = wd.baronies[int(L.barony)]
		var p := Vector2(B.x - 1.4, B.y - 0.6) * cell
		var u := cell * k * 0.9
		draw_line(p + Vector2(0, u * 0.6), p + Vector2(0, -u * 0.8), Color(0.3, 0.2, 0.1), u * 0.1)
		draw_colored_polygon(PackedVector2Array([p + Vector2(0, -u * 0.8), p + Vector2(u * 0.8, -u * 0.55), p + Vector2(0, -u * 0.3)]), Color("#e05a9a"))
		_label(p + Vector2(0, u * 0.8), L.name, 14, Color("#ffc4e1"), false)


func _label(p: Vector2, text: String, px: int, col: Color, big: bool) -> void:
	labels.append([p, text, px, col, big])
	if label_layer:
		label_layer.queue_redraw()


func _house(p: Vector2, w: float, h: float, wall: Color, roof: Color) -> void:
	draw_rect(Rect2(p.x - w / 2, p.y - h, w, h), wall)
	draw_colored_polygon(PackedVector2Array([Vector2(p.x - w * 0.62, p.y - h), Vector2(p.x, p.y - h - w * 0.55), Vector2(p.x + w * 0.62, p.y - h)]), roof)
	draw_rect(Rect2(p.x - w * 0.12, p.y - h * 0.5, w * 0.24, h * 0.5), wall.darkened(0.45))


func _tower(p: Vector2, w: float, h: float, wall: Color, roof: Color) -> void:
	draw_rect(Rect2(p.x - w / 2, p.y - h, w, h), wall)
	draw_colored_polygon(PackedVector2Array([Vector2(p.x - w * 0.65, p.y - h), Vector2(p.x, p.y - h - w * 1.1), Vector2(p.x + w * 0.65, p.y - h)]), roof)
	draw_rect(Rect2(p.x - w * 0.14, p.y - h * 0.7, w * 0.28, w * 0.36), Color(1, 0.86, 0.5))


func _draw_settlement(p: Vector2, b: Dictionary, k: float) -> void:
	var u := cell * k * 1.5
	var rc: Color = wd.realms[b.owner].color
	var roof := rc.darkened(0.1)
	var wall := Color("#f4ead8")
	var stone := Color("#cfc6d6")
	draw_set_transform(p + Vector2(0, u * 0.2), 0, Vector2(1, 0.38))
	draw_circle(Vector2.ZERO, u * 0.95, Color(0, 0, 0, 0.25))
	draw_set_transform(Vector2.ZERO)
	match b.type:
		"capital":
			draw_rect(Rect2(p.x - u * 0.9, p.y - u * 0.55, u * 1.8, u * 0.75), stone)
			_tower(p + Vector2(-u * 0.75, u * 0.2), u * 0.45, u * 1.1, stone, roof)
			_tower(p + Vector2(u * 0.75, u * 0.2), u * 0.45, u * 1.1, stone, roof)
			_tower(p + Vector2(0, u * 0.2), u * 0.6, u * 1.6, stone.lightened(0.1), roof)
			draw_line(p + Vector2(0, -u * 2.05), p + Vector2(0, -u * 2.55), Color(0.2, 0.15, 0.1), u * 0.06)
			draw_colored_polygon(PackedVector2Array([p + Vector2(0, -u * 2.55), p + Vector2(u * 0.45, -u * 2.42), p + Vector2(0, -u * 2.28)]), rc.lightened(0.25))
		"city":
			draw_rect(Rect2(p.x - u * 0.75, p.y - u * 0.45, u * 1.5, u * 0.65), stone)
			_tower(p + Vector2(-u * 0.5, u * 0.2), u * 0.45, u * 1.1, stone, roof)
			_tower(p + Vector2(u * 0.5, u * 0.2), u * 0.5, u * 1.3, stone, roof)
		"fortress":
			draw_rect(Rect2(p.x - u * 0.6, p.y - u * 0.9, u * 1.2, u * 1.1), Color("#a99fb2"))
			for i in 4:
				draw_rect(Rect2(p.x - u * 0.6 + i * u * 0.34, p.y - u * 1.1, u * 0.2, u * 0.22), Color("#a99fb2"))
			draw_rect(Rect2(p.x - u * 0.18, p.y - u * 0.4, u * 0.36, u * 0.6), Color(0.25, 0.18, 0.2))
			draw_rect(Rect2(p.x - u * 0.6, p.y - u * 0.55, u * 1.2, u * 0.12), roof)
		"town":
			_house(p + Vector2(-u * 0.5, u * 0.2), u * 0.55, u * 0.45, wall, roof)
			_house(p + Vector2(u * 0.45, u * 0.25), u * 0.5, u * 0.4, wall, roof.lightened(0.15))
			_house(p + Vector2(0, -u * 0.05), u * 0.6, u * 0.55, wall, roof)
		"port":
			_house(p + Vector2(-u * 0.3, u * 0.2), u * 0.6, u * 0.5, wall, roof)
			draw_line(p + Vector2(u * 0.55, u * 0.2), p + Vector2(u * 0.55, -u * 1.0), Color(0.35, 0.22, 0.12), u * 0.08)
			draw_colored_polygon(PackedVector2Array([p + Vector2(u * 0.6, -u * 0.95), p + Vector2(u * 1.05, -u * 0.35), p + Vector2(u * 0.6, -u * 0.3)]), Color.WHITE)
		"mine":
			draw_colored_polygon(PackedVector2Array([p + Vector2(-u * 0.9, u * 0.25), p + Vector2(0, -u * 0.8), p + Vector2(u * 0.9, u * 0.25)]), Color("#8c7b6b"))
			draw_circle(p + Vector2(0, u * 0.05), u * 0.3, Color(0.12, 0.08, 0.06))
			_house(p + Vector2(u * 0.75, u * 0.3), u * 0.4, u * 0.3, wall, roof)
		"hellfort":
			draw_colored_polygon(PackedVector2Array([p + Vector2(-u * 0.6, u * 0.2), p + Vector2(-u * 0.35, -u * 1.3), p + Vector2(0, -u * 0.7), p + Vector2(u * 0.35, -u * 1.5), p + Vector2(u * 0.6, u * 0.2)]), Color("#2a0c12"))
			draw_circle(p + Vector2(0, -u * 0.3), u * 0.16, Color(1, 0.35, 0.1))
		_:
			_house(p + Vector2(-u * 0.3, u * 0.2), u * 0.55, u * 0.42, wall, roof)
			_house(p + Vector2(u * 0.35, u * 0.25), u * 0.45, u * 0.36, wall, roof.lightened(0.2))


func _draw_dungeon(p: Vector2, d: Dictionary, k: float) -> void:
	var u := cell * k * 1.3
	var rock := Color("#6f6478") if d.type != "hellgate" else Color("#3a1418")
	draw_set_transform(p + Vector2(0, u * 0.3), 0, Vector2(1, 0.38))
	draw_circle(Vector2.ZERO, u * 0.9, Color(0, 0, 0, 0.25))
	draw_set_transform(Vector2.ZERO)
	draw_colored_polygon(PackedVector2Array([p + Vector2(-u * 0.85, u * 0.3), p + Vector2(-u * 0.5, -u * 0.6), p + Vector2(0, -u * 0.85), p + Vector2(u * 0.55, -u * 0.55), p + Vector2(u * 0.85, u * 0.3)]), rock)
	draw_circle(p + Vector2(0, u * 0.12), u * 0.32, Color(0.05, 0.02, 0.08))
	draw_rect(Rect2(p.x - u * 0.32, p.y + u * 0.1, u * 0.64, u * 0.2), Color(0.05, 0.02, 0.08))
	var glow := Color(0.8, 0.3, 1.0) if d.type != "hellgate" else Color(1, 0.3, 0.1)
	if d.final:
		glow = Color(1, 0.1, 0.1)
	var t := Time.get_ticks_msec() / 1000.0
	draw_circle(p + Vector2(0, u * 0.1), u * (0.12 + 0.03 * sin(t * 4.0 + d.id)), glow)


## Шар написів у координатах екрана (поверх мапи, під інтерфейсом).
class LabelLayer extends Node2D:
	var markers: MarkersLayer
	var extra: Node2D

	func _draw() -> void:
		if markers == null:
			return
		var xf := markers.get_viewport().get_canvas_transform()
		var font: Font = Game.ui_font
		var all: Array = markers.labels.duplicate()
		if extra != null:
			all.append_array(extra.labels)
		for l in all:
			var fs: int = l[2]
			var sp: Vector2 = xf * (l[0] as Vector2)
			var w := font.get_string_size(l[1], HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
			var pos := sp + Vector2(-w / 2.0, fs * 0.8)
			draw_string_outline(font, pos, l[1], HORIZONTAL_ALIGNMENT_LEFT, -1, fs, 5 if not l[4] else 3, Color(0.12, 0.05, 0.16, 0.9 if not l[4] else 0.6))
			draw_string(font, pos, l[1], HORIZONTAL_ALIGNMENT_LEFT, -1, fs, l[3])
