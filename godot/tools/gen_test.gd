extends SceneTree
func _init() -> void:
	for s in [12345, 777, 2026]:
		var g := WorldGen.new()
		var wd := g.generate(s)
		print("seed ", s, ": ", wd.stats(), " start=", wd.baronies[wd.start_barony].name, " realms=", wd.realms.map(func(r): return r.full_name))
	quit()
