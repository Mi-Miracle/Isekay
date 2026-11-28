## Дороги: плавні лінії поверх рельєфу. Великі тракти — бруківка, малі — ґрунтовка.
class_name RoadsLayer
extends Node2D

var wd: WorldData
var cell := 16.0
var _lines: Array = []  # [PackedVector2Array, major]


func setup(world: WorldData, cell_px: float) -> void:
	wd = world
	cell = cell_px
	_lines.clear()
	for r in wd.roads:
		var pts := PackedVector2Array()
		for c in r.path:
			pts.append(Vector2(c % Defs.W + 0.5, c / Defs.W + 0.5) * cell)
		_lines.append([_chaikin(_chaikin(pts)), r.major])
	queue_redraw()


static func _chaikin(p: PackedVector2Array) -> PackedVector2Array:
	if p.size() < 3:
		return p
	var out := PackedVector2Array([p[0]])
	for i in p.size() - 1:
		out.append(p[i].lerp(p[i + 1], 0.25))
		out.append(p[i].lerp(p[i + 1], 0.75))
	out.append(p[p.size() - 1])
	return out


func _draw() -> void:
	for l in _lines:
		if not l[1]:
			draw_polyline(l[0], Color(0.36, 0.25, 0.14, 0.55), cell * 0.32, true)
			draw_polyline(l[0], Color(0.78, 0.63, 0.42, 0.85), cell * 0.18, true)
	for l in _lines:
		if l[1]:
			draw_polyline(l[0], Color(0.28, 0.22, 0.18, 0.7), cell * 0.46, true)
			draw_polyline(l[0], Color(0.86, 0.8, 0.68, 0.95), cell * 0.28, true)
