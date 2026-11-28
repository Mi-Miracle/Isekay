## Згенерований світ. Не зберігається у файл: його завжди можна відтворити з seed.
class_name WorldData
extends RefCounted

const W := Defs.W
const H := Defs.H

var world_seed: int = 0
var gen_ms: int = 0
var terrain: PackedByteArray
var height: PackedFloat32Array
var river: PackedByteArray
var road: PackedByteArray
var cont: PackedInt32Array
var comp: PackedInt32Array
var comp_sizes: PackedInt32Array
var cell_barony: PackedInt32Array
var cell_landmark: PackedInt32Array
var sea_level: float = 0.0
var peak_level: float = 1.0

var baronies: Array = []
var counties: Array = []
var duchies: Array = []
var realms: Array = []
var roads: Array = []
var landmarks: Array = []
var dungeons: Array = []
var by_land: Dictionary = {}

var main_land: int = -1
var demon_land: int = -1
var empire_id: int = -1
var start_barony: int = 0
var start_realm: int = 0

## Пошук шляху для ходьби героя (кліком по мапі).
var astar: AStarGrid2D


func in_bounds(c: Vector2i) -> bool:
	return c.x >= 0 and c.y >= 0 and c.x < W and c.y < H


func terrain_at(c: Vector2i) -> int:
	if not in_bounds(c):
		return Defs.T.DEEP
	return terrain[c.y * W + c.x]


func walkable(c: Vector2i) -> bool:
	return Defs.is_land(terrain_at(c))


func barony_at(c: Vector2i) -> Dictionary:
	if not in_bounds(c):
		return {}
	var b := cell_barony[c.y * W + c.x]
	return baronies[b] if b >= 0 else {}


func landmark_at(c: Vector2i) -> Dictionary:
	if not in_bounds(c):
		return {}
	var l := cell_landmark[c.y * W + c.x]
	return landmarks[l] if l >= 0 else {}


func realm_of_barony(b: Dictionary) -> Dictionary:
	if b.is_empty():
		return {}
	return realms[b.realm]


## Швидкість ходьби в клітинці (дороги й річки враховано).
func speed_at(c: Vector2i) -> float:
	if not in_bounds(c):
		return 0.0
	var i := c.y * W + c.x
	var s: float = Defs.TERRAIN_SPEED[terrain[i]]
	if road[i] == 2:
		s = maxf(s, 1.45)
	elif road[i] == 1:
		s = maxf(s, 1.25)
	elif river[i]:
		s *= 0.6
	return s


func settlement_title(b: Dictionary) -> String:
	return Defs.SETTLEMENT[b.type].name


func stats() -> String:
	return "баронств %d · королівств %d · доріг %d · підземель %d · пам'яток %d · %d мс" % [
		baronies.size(), realms.size(), roads.size(), dungeons.size(), landmarks.size(), gen_ms]
