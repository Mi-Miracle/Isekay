extends SceneTree
## Перевірка симуляції світу: 400 днів політики без графіки.
func _init() -> void:
	var wd := WorldGen.new().generate(12345)
	var pol := Politics.new(wd)
	pol.init_state()
	var t0 := Time.get_ticks_msec()
	for d in range(1, 401):
		pol.tick(d)
	var ms := Time.get_ticks_msec() - t0
	var types := {}
	for e in pol.P.chronicle:
		types[e.type] = types.get(e.type, 0) + 1
	print("sim 400 днів: %d мс, подій %d, війн зараз %d, армій %d, героїв %d" % [ms, pol.P.chronicle.size(), pol.P.wars.size(), pol.P.armies.size(), pol.P.heroes.filter(func(h): return h.alive).size()])
	print("типи: ", types)
	for e in pol.P.chronicle.slice(0, 12):
		print("  д.", e.day, " ", e.text)
	# збереження й відновлення
	var data: Dictionary = JSON.parse_string(JSON.stringify(pol.serialize()))
	var wd2 := WorldGen.new().generate(12345)
	var pol2 := Politics.new(wd2)
	pol2.restore(data)
	for d in range(401, 431):
		pol2.tick(d)
	print("після відновлення +30 днів: ок, подій ", pol2.P.chronicle.size())
	quit()
