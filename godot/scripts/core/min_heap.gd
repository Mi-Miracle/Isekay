## Проста бінарна купа (мінімум зверху) для пошуку шляхів і розбиття територій.
class_name MinHeap
extends RefCounted

var _pri: PackedFloat64Array = PackedFloat64Array()
var _items: Array = []


func size() -> int:
	return _items.size()


func is_empty() -> bool:
	return _items.is_empty()


func push(item, pri: float) -> void:
	_pri.append(pri)
	_items.append(item)
	var i := _items.size() - 1
	while i > 0:
		var p := (i - 1) >> 1
		if _pri[p] <= _pri[i]:
			break
		_swap(i, p)
		i = p


func pop():
	var top = _items[0]
	var last_i := _items.size() - 1
	_pri[0] = _pri[last_i]
	_items[0] = _items[last_i]
	_pri.resize(last_i)
	_items.resize(last_i)
	var n := last_i
	var i := 0
	while true:
		var l := 2 * i + 1
		var r := l + 1
		var m := i
		if l < n and _pri[l] < _pri[m]:
			m = l
		if r < n and _pri[r] < _pri[m]:
			m = r
		if m == i:
			break
		_swap(i, m)
		i = m
	return top


func _swap(a: int, b: int) -> void:
	var tp := _pri[a]
	_pri[a] = _pri[b]
	_pri[b] = tp
	var ti = _items[a]
	_items[a] = _items[b]
	_items[b] = ti
