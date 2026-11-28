extends SceneTree
const COL := ["#1d4e89","#2f7fc1","#e8d9a0","#8fcf5a","#3f8f3a","#a7b85e","#8d8174","#f1f4f8","#e9c46a","#c9d6d3","#5c7a3e","#4a2a2a","#2e7d32"]
func _init() -> void:
	var wd := WorldGen.new().generate(12345)
	var img := Image.create(Defs.W, Defs.H, false, Image.FORMAT_RGB8)
	for i in Defs.W * Defs.H:
		var c := Color(COL[wd.terrain[i]])
		if wd.river[i]: c = Color("#4aa3df")
		if wd.road[i]: c = Color("#7a4b2a")
		img.set_pixel(i % Defs.W, i / Defs.W, c)
	for b in wd.baronies:
		img.set_pixel(b.x, b.y, Color.RED if b.type == "capital" else Color.BLACK)
	for d in wd.dungeons:
		img.set_pixel(d.x, d.y, Color.MAGENTA)
	img.resize(Defs.W * 2, Defs.H * 2, Image.INTERPOLATE_NEAREST)
	img.save_png("/tmp/map.png")
	quit()
