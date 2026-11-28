## Детермінований генератор випадкових чисел (порт mulberry32 зі старої версії).
## Один і той самий seed завжди дає той самий світ.
class_name Rng
extends RefCounted

const M32 := 0xFFFFFFFF

var seed_value: int
var _a: int


func _init(seed_in: int = 1) -> void:
	seed_value = seed_in & M32
	_a = seed_value


static func imul(a: int, b: int) -> int:
	a &= M32
	b &= M32
	var lo := (a & 0xFFFF) * b
	var hi := (((a >> 16) * b) & 0xFFFF) << 16
	return (lo + hi) & M32


func next() -> float:
	_a = (_a + 0x6D2B79F5) & M32
	var t := _a
	t = imul(t ^ (t >> 15), t | 1)
	t = (t ^ ((t + imul(t ^ (t >> 7), t | 61)) & M32)) & M32
	return float((t ^ (t >> 14)) & M32) / 4294967296.0


func rangef(a: float, b: float) -> float:
	return a + (b - a) * next()


## Ціле в межах [a, b] включно.
func rangei(a: int, b: int) -> int:
	return int(floor(a + (b - a + 1) * next()))


func chance(p: float) -> bool:
	return next() < p


func pick(arr: Array):
	if arr.is_empty():
		return null
	return arr[int(next() * arr.size())]


func shuffle(arr) -> Variant:
	var i: int = arr.size() - 1
	while i > 0:
		var j := int(next() * (i + 1))
		var tmp = arr[i]
		arr[i] = arr[j]
		arr[j] = tmp
		i -= 1
	return arr


func derive() -> int:
	return int(next() * 4294967296.0) & M32
