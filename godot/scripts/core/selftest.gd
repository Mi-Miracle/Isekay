## Автотест: скріншоти й звіт. Запуск: godot --path godot -- --selftest
class_name Selftest
extends RefCounted

static var report: Dictionary = {}


static func dir() -> String:
	var d := OS.get_environment("ISEKAY_SHOTS")
	if d == "":
		d = OS.get_user_data_dir() + "/shots"
	DirAccess.make_dir_recursive_absolute(d)
	return d


static func shot(node: Node, name: String) -> void:
	if DisplayServer.get_name() == "headless":
		return
	var img := node.get_viewport().get_texture().get_image()
	if img:
		img.save_png("%s/%s.png" % [dir(), name])


static func step(name: String, ok: bool, info = "") -> void:
	report[name] = {"ok": ok, "info": str(info)}
	print("[selftest] %s: %s %s" % [name, "OK" if ok else "FAIL", str(info)])


static func finish(tree: SceneTree) -> void:
	var all_ok := true
	for k in report:
		all_ok = all_ok and report[k].ok
	print("SELFTEST REPORT ", JSON.stringify({"ok": all_ok, "steps": report}))
	tree.quit(0 if all_ok else 1)
