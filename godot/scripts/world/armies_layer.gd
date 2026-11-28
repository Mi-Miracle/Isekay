## Армії, орди, легіони демонів, мандрівні герої й місця недавніх битв на мапі світу.
## Показуються лише в розвіданих землях.
class_name ArmiesLayer
extends Node2D

var world  # world.gd
var labels: Array = []


func _seen(p: Vector2) -> bool:
	var c := Vector2i(p)
	if c.x < 0 or c.y < 0 or c.x >= Defs.W or c.y >= Defs.H:
		return false
	return world.fog[c.y * Defs.W + c.x] > 0


func _draw() -> void:
	labels.clear()
	if world == null or world.pol == null:
		return
	var pol: Politics = world.pol
	var cell: float = world.CELL
	var z: float = world.cam.zoom.x
	var k := maxf(1.0, 0.85 / z)
	var vr: Rect2 = world.markers.view_rect.grow(cell * 6)
	var t := Time.get_ticks_msec() / 1000.0
	var day := int(pol.P.day)
	# битви останніх днів
	for b in pol.P.battles:
		if day - int(b.day) > 6:
			continue
		var B: Dictionary = pol.wd.baronies[b.node]
		var p := Vector2(B.x + 0.5, B.y - 0.6) * cell
		if not vr.has_point(p) or not _seen(p / cell):
			continue
		var u := cell * 0.7 * k
		var col := Color(1, 0.35, 0.3, 0.9)
		draw_line(p + Vector2(-u, -u), p + Vector2(u, u), col, u * 0.22, true)
		draw_line(p + Vector2(u, -u), p + Vector2(-u, u), col, u * 0.22, true)
	# армії
	for a in pol.P.armies:
		var pc := pol.moving_pos(int(a.node), a.path, float(a.prog))
		var p := pc * cell
		if not vr.has_point(p) or not _seen(pc):
			continue
		var demon := pol.is_demon(int(a.realm))
		var size := float(a.size)
		var u := cell * k * (0.85 + clampf(log(maxf(size, 100.0) / 500.0) / log(10.0), 0.0, 1.2) * 0.35)
		if not a.path.is_empty():
			var nb: Dictionary = pol.wd.baronies[int(a.path[0])]
			var np := Vector2(nb.x + 0.5, nb.y + 0.5) * cell
			_dashed(p, np, Color(1, 1, 1, 0.35), 1.6 / z)
		draw_set_transform(p + Vector2(0, u * 0.5), 0, Vector2(1, 0.4))
		draw_circle(Vector2.ZERO, u * 0.9, Color(0, 0, 0, 0.3))
		draw_set_transform(Vector2.ZERO)
		var bob := sin(t * 3.0 + int(a.id)) * u * 0.06 if not a.path.is_empty() else 0.0
		var c := p + Vector2(0, -u * 0.4 + bob)
		if demon:
			var dc := Color("#3a0a12") if not a.horde else Color("#3b2350")
			draw_circle(c, u * 0.72, Color(1, 0.25, 0.1, 0.35 + 0.15 * sin(t * 4.0)))
			draw_circle(c, u * 0.6, dc)
			draw_colored_polygon(PackedVector2Array([c + Vector2(-u * 0.45, -u * 0.3), c + Vector2(-u * 0.62, -u * 0.95), c + Vector2(-u * 0.18, -u * 0.5)]), dc)
			draw_colored_polygon(PackedVector2Array([c + Vector2(u * 0.45, -u * 0.3), c + Vector2(u * 0.62, -u * 0.95), c + Vector2(u * 0.18, -u * 0.5)]), dc)
			draw_circle(c + Vector2(-u * 0.2, -u * 0.05), u * 0.1, Color(1, 0.3, 0.1))
			draw_circle(c + Vector2(u * 0.2, -u * 0.05), u * 0.1, Color(1, 0.3, 0.1))
		else:
			var rc: Color = pol.wd.realms[int(a.realm)].color
			# щит з гербовим кольором
			var sh := PackedVector2Array([c + Vector2(-u * 0.55, -u * 0.6), c + Vector2(u * 0.55, -u * 0.6), c + Vector2(u * 0.55, u * 0.05), c + Vector2(0, u * 0.7), c + Vector2(-u * 0.55, u * 0.05)])
			draw_colored_polygon(sh, Color.WHITE)
			var inner := PackedVector2Array()
			for v in sh:
				inner.append(c + (v - c) * 0.8)
			draw_colored_polygon(inner, rc)
			draw_line(c + Vector2(0, -u * 0.45), c + Vector2(0, u * 0.4), Color(1, 1, 1, 0.8), u * 0.1)
			draw_line(c + Vector2(-u * 0.3, -u * 0.15), c + Vector2(u * 0.3, -u * 0.15), Color(1, 1, 1, 0.8), u * 0.1)
			if a.patrol:
				draw_arc(c, u * 0.85, 0, TAU, 24, Color(1, 1, 1, 0.35), 1.2 / z, true)
		var B0: Dictionary = pol.wd.baronies[int(a.node)]
		if a.path.is_empty() and pol.enemies_of(int(a.realm)).has(pol.controller(B0)):
			var sp := float(a.siege)
			draw_arc(Vector2(B0.x + 0.5, B0.y + 0.5) * cell, cell * 1.7 * k, -PI / 2, -PI / 2 + TAU * sp, 32, Color(1, 0.4, 0.3, 0.9), 3.0 / z, true)
		var label := _short(size)
		if z >= 1.0:
			label = "%s · %s" % [a.name, label]
		labels.append([p + Vector2(0, u * 0.55), label, 13, Color("#ffd0d0") if demon else Color("#fff2c2"), false])
	# мандрівні герої
	for h in pol.P.heroes:
		if not h.alive:
			continue
		var pc := pol.moving_pos(int(h.node), h.path, float(h.prog))
		pc += Vector2(0.9, -0.7)
		var p := pc * cell
		if not vr.has_point(p) or not _seen(pc):
			continue
		var u := cell * 0.55 * k
		var col := Color("#ff8fd0") if h.rival else Color("#ffe27a")
		draw_circle(p, u * 1.4, Color(col, 0.25 + 0.1 * sin(t * 5.0 + int(h.id))))
		_star(p, u, col)
		if z >= 1.6:
			labels.append([p + Vector2(0, u * 1.2), "%s (рів. %d)" % [h.name, h.lvl], 12, col, false])
	# каравани героя (туди й назад)
	var day_f := float(Game.state.minutes) / 1440.0
	for cv in Caravans.st().list:
		var pc := Caravans.pos(world.wd, cv, day_f)
		var p := pc * cell
		if not vr.has_point(p):
			continue
		var u := cell * 0.5 * k
		draw_circle(p, u * 1.3, Color(1, 0.85, 0.4, 0.3))
		draw_rect(Rect2(p - Vector2(u, u * 0.5), Vector2(u * 2.0, u)), Color("#c8955a"))
		draw_circle(p + Vector2(u * 1.1, -u * 0.5), u * 0.45, Color("#c8955a"))
		if z >= 1.0:
			labels.append([p + Vector2(0, u * 1.4), "🐫 караван", 12, Game.C_GOLD, false])
	world.markers.label_layer.queue_redraw()


static func _short(n: float) -> String:
	if n >= 1000:
		return "%.1fк" % (n / 1000.0)
	return str(int(n))


func _dashed(a: Vector2, b: Vector2, col: Color, w: float) -> void:
	var d := a.distance_to(b)
	var n := int(d / 6.0)
	for i in range(0, n, 2):
		draw_line(a.lerp(b, float(i) / n), a.lerp(b, float(i + 1) / n), col, w)


func _star(c: Vector2, r: float, col: Color) -> void:
	var pts := PackedVector2Array()
	for i in 10:
		var ang := -PI / 2 + i * PI / 5
		pts.append(c + Vector2(cos(ang), sin(ang)) * (r if i % 2 == 0 else r * 0.45))
	draw_colored_polygon(pts, col)
	draw_polyline(pts + PackedVector2Array([pts[0]]), Color(0.3, 0.15, 0.05, 0.8), 1.0, true)
