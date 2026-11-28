## Генератор Дивосвіту: континенти, рельєф, річки, баронства, королівства (Імперія з васалами),
## герцогства й графства, типи поселень, дороги, пам'ятки, підземелля.
## Логіка перенесена зі старої версії (src/js/world.js) і пристосована до Godot.
class_name WorldGen
extends RefCounted

const W := Defs.W
const H := Defs.H
const T := Defs.T
const DIRS4 := [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]

var progress: Callable = Callable()


func _report(frac: float, text: String) -> void:
	if progress.is_valid():
		progress.call(frac, text)


static func idx(x: int, y: int) -> int:
	return y * W + x


static func cell_cost(terrain: PackedByteArray, river: PackedByteArray, i: int) -> float:
	return Defs.TERRAIN_COST[terrain[i]] + (3.0 if river[i] else 0.0)


func _noise(seed_in: int, freq: float, octaves: int) -> FastNoiseLite:
	var n := FastNoiseLite.new()
	n.seed = seed_in
	n.noise_type = FastNoiseLite.TYPE_PERLIN
	n.frequency = freq
	n.fractal_type = FastNoiseLite.FRACTAL_FBM
	n.fractal_octaves = octaves
	n.fractal_lacunarity = 2.0
	n.fractal_gain = 0.5
	return n


func generate(seed_in: int) -> WorldData:
	var t0 := Time.get_ticks_msec()
	var wd := WorldData.new()
	wd.world_seed = seed_in
	var rng := Rng.new(seed_in)
	_report(0.02, "Богиня Люмі ліпить континенти…")
	_gen_terrain(wd, seed_in)
	_report(0.25, "Рахуємо острови…")
	_components(wd)
	_report(0.3, "Пускаємо річки…")
	_gen_rivers(wd, rng)
	_report(0.38, "Засновуємо баронства…")
	_place_baronies(wd, rng)
	_report(0.5, "Ділимо землі між королями…")
	_make_realms(wd, rng, seed_in)
	_report(0.62, "Позначаємо дивні місця…")
	_place_landmarks(wd, rng, seed_in)
	_report(0.7, "Прокладаємо дороги…")
	_build_roads(wd, rng)
	_report(0.88, "Ховаємо підземелля…")
	_place_dungeons(wd, rng)
	_report(0.96, "Призначаємо небезпеку…")
	_assign_danger(wd, rng)
	wd.gen_ms = Time.get_ticks_msec() - t0
	_report(1.0, "Готово!")
	return wd


# ---------------------------------------------------------------- terrain

func _gen_terrain(wd: WorldData, seed_in: int) -> void:
	var n_base := _noise(seed_in, 1.0 / 52.0, 6)
	var n_ridge := _noise(seed_in + 7, 1.0 / 26.0, 4)
	var n_moist := _noise(seed_in + 33, 1.0 / 36.0, 4)
	var n_isl := _noise(seed_in + 99, 1.0 / 11.0, 3)
	var n_w1 := _noise(seed_in + 71, 1.0 / 40.0, 3)
	var n_w2 := _noise(seed_in + 72, 1.0 / 40.0, 3)
	var height := PackedFloat32Array()
	height.resize(W * H)
	var moist := PackedFloat32Array()
	moist.resize(W * H)
	var cont := PackedInt32Array()
	cont.resize(W * H)
	var conts: Array = Defs.CONTINENTS
	var nc := conts.size()
	for y in H:
		var ny := float(y) / H
		for x in W:
			var nx := float(x) / W
			var i := y * W + x
			var w1 := n_w1.get_noise_2d(x, y) * 0.5
			var w2 := n_w2.get_noise_2d(x, y) * 0.5
			var best := 0.0
			var bc := -1
			for ci in nc:
				var c: Dictionary = conts[ci]
				var dx: float = (nx - c.cx) / c.rx
				var dy: float = (ny - c.cy) / c.ry
				var warp := (w1 if ci % 2 == 0 else w2) * 0.9 * (1.0 + 0.15 * ci)
				var d := sqrt(dx * dx + dy * dy) + warp
				var v := maxf(0.0, 1.0 - d * d)
				if v > best:
					best = v
					bc = ci
			var h := (n_base.get_noise_2d(x, y) * 0.5 + 0.5) * 0.55
			var ridge := 1.0 - absf(n_ridge.get_noise_2d(x, y))
			h += ridge * 0.22 + best * 0.62
			var isl := n_isl.get_noise_2d(x, y) * 0.5 + 0.5
			if best < 0.15 and isl > 0.73:
				h += (isl - 0.73) * 4.2
			var ex := mini(mini(x, W - 1 - x), mini(y, H - 1 - y))
			if ex < 6:
				h -= (6 - ex) * 0.05
			height[i] = h
			moist[i] = n_moist.get_noise_2d(x + 300, y) * 0.75 + 0.5
			cont[i] = bc if best > 0.04 else -1
		if y % 37 == 0:
			_report(0.02 + 0.2 * y / H, "Богиня Люмі ліпить континенти…")
	var sorted := height.duplicate()
	sorted.sort()
	var sea := sorted[int(sorted.size() * 0.64)]
	var land_start := int(sorted.size() * 0.64)
	var land_n := sorted.size() - land_start
	var q := func(f: float) -> float: return sorted[mini(sorted.size() - 1, land_start + int(land_n * f))]
	var hill: float = q.call(0.8)
	var mount: float = q.call(0.9)
	var peak: float = q.call(0.975)
	var terrain := PackedByteArray()
	terrain.resize(W * H)
	for i in W * H:
		var h := height[i]
		var m := moist[i]
		var lat := float(i / W) / H
		var t: int
		if h < sea - 0.07: t = T.DEEP
		elif h < sea: t = T.SEA
		elif h < sea + 0.012: t = T.BEACH
		elif h > peak: t = T.PEAK
		elif h > mount: t = T.MOUNTAIN
		elif h > hill: t = T.HILLS
		elif lat < 0.16 and m < 0.66: t = T.TUNDRA
		elif lat > 0.8 and m < 0.5: t = T.DESERT
		elif lat > 0.72 and m > 0.6: t = T.JUNGLE
		elif m > 0.64 and h < sea + 0.07: t = T.SWAMP
		elif m > 0.52: t = T.FOREST
		else: t = T.PLAINS
		if cont[i] == 3 and t >= T.BEACH and t != T.PEAK:
			t = T.MOUNTAIN if h > mount else T.ASH
		terrain[i] = t
	wd.terrain = terrain
	wd.height = height
	wd.cont = cont
	wd.sea_level = sea
	wd.peak_level = peak


func _components(wd: WorldData) -> void:
	var terrain := wd.terrain
	var comp := PackedInt32Array()
	comp.resize(W * H)
	comp.fill(-1)
	var sizes := PackedInt32Array()
	var c := 0
	var st := PackedInt32Array()
	for i in W * H:
		if comp[i] != -1 or terrain[i] < T.BEACH:
			continue
		st.clear()
		st.append(i)
		comp[i] = c
		var n := 0
		while not st.is_empty():
			var k := st[st.size() - 1]
			st.resize(st.size() - 1)
			n += 1
			var x := k % W
			var y := k / W
			if x > 0 and comp[k - 1] == -1 and terrain[k - 1] >= T.BEACH:
				comp[k - 1] = c; st.append(k - 1)
			if x < W - 1 and comp[k + 1] == -1 and terrain[k + 1] >= T.BEACH:
				comp[k + 1] = c; st.append(k + 1)
			if y > 0 and comp[k - W] == -1 and terrain[k - W] >= T.BEACH:
				comp[k - W] = c; st.append(k - W)
			if y < H - 1 and comp[k + W] == -1 and terrain[k + W] >= T.BEACH:
				comp[k + W] = c; st.append(k + W)
		sizes.append(n)
		c += 1
	wd.comp = comp
	wd.comp_sizes = sizes


func _gen_rivers(wd: WorldData, rng: Rng) -> void:
	var terrain := wd.terrain
	var height := wd.height
	var river := PackedByteArray()
	river.resize(W * H)
	var src := PackedInt32Array()
	for i in W * H:
		if terrain[i] == T.MOUNTAIN or terrain[i] == T.HILLS:
			src.append(i)
	rng.shuffle(src)
	var made := 0
	for s in src:
		if made >= 60:
			break
		var k := s
		var steps := 0
		var path := PackedInt32Array()
		var vis := {}
		while steps < 800:
			steps += 1
			path.append(k)
			vis[k] = true
			if terrain[k] < T.BEACH:
				break
			var x := k % W
			var y := k / W
			var bj := -1
			var bh := height[k] + 0.004
			for d in DIRS4:
				var xx: int = x + d.x
				var yy: int = y + d.y
				if xx < 0 or yy < 0 or xx >= W or yy >= H:
					continue
				var j := yy * W + xx
				if vis.has(j):
					continue
				var hj := height[j] + rng.rangef(0, 0.003)
				if hj < bh:
					bh = hj
					bj = j
			if bj < 0:
				path.clear()
				break
			if river[bj]:
				path.append(bj)
				break
			k = bj
		if path.size() > 16:
			for p in path:
				if terrain[p] >= T.BEACH:
					river[p] = 1
			made += 1
	wd.river = river


# ---------------------------------------------------------------- baronies

func _place_baronies(wd: WorldData, rng: Rng) -> void:
	var terrain := wd.terrain
	var comp := wd.comp
	var sizes := wd.comp_sizes
	var river := wd.river
	var cand := PackedInt32Array()
	for i in W * H:
		var t := terrain[i]
		if t < T.BEACH or t == T.PEAK or t == T.MOUNTAIN or sizes[comp[i]] < 40:
			continue
		cand.append(i)
	rng.shuffle(cand)
	var min_d := 12.0
	var cells := PackedInt32Array()
	var grid := {}
	for c in cand:
		var x := c % W
		var y := c / W
		var gx := int(x / 12.5)
		var gy := int(y / 12.5)
		var ok := true
		for ox in range(-1, 2):
			for oy in range(-1, 2):
				var key := Vector2i(gx + ox, gy + oy)
				if not grid.has(key):
					continue
				for o in grid[key]:
					if Vector2(o % W - x, o / W - y).length() < min_d:
						ok = false
						break
				if not ok:
					break
			if not ok:
				break
		if not ok:
			continue
		cells.append(c)
		var k2 := Vector2i(gx, gy)
		if not grid.has(k2):
			grid[k2] = []
		grid[k2].append(c)
	# тереторія баронства: найдешевша відстань від центру (черга з кошиками)
	var nb := cells.size()
	var cell_b := PackedInt32Array()
	cell_b.resize(W * H)
	cell_b.fill(-1)
	var dist := PackedInt32Array()
	dist.resize(W * H)
	dist.fill(1 << 30)
	const Q := 4
	const MAXD := 44 * Q
	var buckets: Array = []
	for b in MAXD + 1:
		buckets.append(PackedInt32Array())
	for bi in nb:
		dist[cells[bi]] = 0
		cell_b[cells[bi]] = bi
		buckets[0].append(cells[bi])
	for d in MAXD + 1:
		var bucket: PackedInt32Array = buckets[d]
		var qi := 0
		while qi < bucket.size():
			var k := bucket[qi]
			qi += 1
			if dist[k] != d:
				continue
			var x := k % W
			var y := k / W
			for dd in DIRS4:
				var xx: int = x + dd.x
				var yy: int = y + dd.y
				if xx < 0 or yy < 0 or xx >= W or yy >= H:
					continue
				var j := yy * W + xx
				if terrain[j] < T.BEACH or comp[j] != comp[k]:
					continue
				var nd := d + int(ceil(minf(cell_cost(terrain, river, j), 9.0) * Q))
				if nd < dist[j] and nd < MAXD:
					dist[j] = nd
					cell_b[j] = cell_b[k]
					buckets[nd].append(j)
		buckets[d] = PackedInt32Array()
	wd.cell_barony = cell_b
	# сусідство й склад рельєфу
	var adj: Array = []
	var tcount: Array = []
	var area := PackedInt32Array()
	area.resize(nb)
	var coastal := PackedByteArray()
	coastal.resize(nb)
	var has_river := PackedByteArray()
	has_river.resize(nb)
	for b in nb:
		adj.append({})
		var tc := PackedInt32Array()
		tc.resize(13)
		tcount.append(tc)
	for i in W * H:
		var b := cell_b[i]
		if b < 0:
			continue
		area[b] += 1
		tcount[b][terrain[i]] += 1
		if river[i]:
			has_river[b] = 1
		var x := i % W
		var y := i / W
		for dd in DIRS4:
			var xx: int = x + dd.x
			var yy: int = y + dd.y
			if xx < 0 or yy < 0 or xx >= W or yy >= H:
				continue
			var j := yy * W + xx
			var bj := cell_b[j]
			if bj >= 0 and bj != b:
				adj[b][bj] = true
			if terrain[j] < T.BEACH:
				coastal[b] = 1
	for b in nb:
		var c := cells[b]
		wd.baronies.append({
			"id": b, "cell": c, "x": c % W, "y": c / W, "adj": adj[b].keys(), "area": area[b],
			"coastal": coastal[b] == 1, "river": has_river[b] == 1, "terrain": tcount[b],
			"land": wd.comp[c], "cont": wd.cont[c], "county": -1, "duchy": -1, "realm": -1,
			"type": "village", "name": "", "dev": 1, "fort": 1, "danger": 1, "is_port": false,
		})


func _partition(rng: Rng, nodes: Array, k: int, adj_of: Callable, pos_of: Callable) -> Dictionary:
	var set := {}
	for n in nodes:
		set[n] = true
	var seeds: Array = [rng.pick(nodes)]
	while seeds.size() < k and seeds.size() < nodes.size():
		var best = null
		var bd := -1.0
		for n in nodes:
			if seeds.has(n):
				continue
			var md := INF
			var pn: Vector2 = pos_of.call(n)
			for s in seeds:
				md = minf(md, pn.distance_squared_to(pos_of.call(s)))
			md *= 0.85 + rng.next() * 0.3
			if md > bd:
				bd = md
				best = n
		seeds.append(best)
	var group := {}
	var dist := {}
	var heap := MinHeap.new()
	for gi in seeds.size():
		dist[seeds[gi]] = 0.0
		heap.push([seeds[gi], gi], 0.0)
	while not heap.is_empty():
		var e: Array = heap.pop()
		var n = e[0]
		if group.has(n):
			continue
		group[n] = e[1]
		var pn: Vector2 = pos_of.call(n)
		for m in adj_of.call(n):
			if not set.has(m) or group.has(m):
				continue
			var nd: float = dist[n] + pn.distance_to(pos_of.call(m))
			if not dist.has(m) or nd < dist[m]:
				dist[m] = nd
				heap.push([m, e[1]], nd)
	for n in nodes:
		if group.has(n):
			continue
		var bg := 0
		var bdd := INF
		for gi in seeds.size():
			var d: float = (pos_of.call(n) as Vector2).distance_to(pos_of.call(seeds[gi]))
			if d < bdd:
				bdd = d
				bg = gi
		group[n] = bg
	var groups: Array = []
	for s in seeds:
		groups.append([])
	for n in nodes:
		groups[group[n]].append(n)
	return {"groups": groups, "seeds": seeds}


func _make_realms(wd: WorldData, rng: Rng, seed_in: int) -> void:
	var B: Array = wd.baronies
	var nb := B.size()
	var pos_of := func(b: int) -> Vector2: return Vector2(B[b].x, B[b].y)
	var adj_of := func(b: int) -> Array: return B[b].adj
	# групуємо баронства за суходолом
	var by_land := {}
	for b in nb:
		var lid: int = B[b].land
		if not by_land.has(lid):
			by_land[lid] = []
		by_land[lid].append(b)
	var lands: Array = []
	for lid in by_land:
		var bs: Array = by_land[lid]
		var cnt := {}
		for b in bs:
			cnt[B[b].cont] = cnt.get(B[b].cont, 0) + 1
		var best_c := -1
		var best_n := -1
		for c in cnt:
			if cnt[c] > best_n:
				best_n = cnt[c]
				best_c = c
		lands.append({"lid": lid, "bs": bs, "cont": best_c})
	lands.sort_custom(func(a, b): return a.bs.size() > b.bs.size())
	var used := {}
	var cont_land := func(ck: int):
		for L in lands:
			if L.cont == ck and not used.has(L.lid):
				return L
		return null
	var groups: Array = []
	var demon_l = cont_land.call(3)
	if demon_l != null:
		used[demon_l.lid] = true
		groups.append({"bs": demon_l.bs.duplicate(), "kind": "demon", "culture": "demon"})
	var main_l = cont_land.call(0)
	if main_l == null:
		for L in lands:
			if not used.has(L.lid):
				main_l = L
				break
	used[main_l.lid] = true
	wd.main_land = main_l.lid
	var main_count := clampi(main_l.bs.size() / 8, 5, 13)
	var mp: Dictionary = {}
	for a in 30:
		var p := _partition(rng, main_l.bs, main_count, adj_of, pos_of)
		var mn := 1 << 30
		for g in p.groups:
			mn = mini(mn, g.size())
		var ok: bool = mn >= main_l.bs.size() / float(main_count) * 0.45
		if mp.is_empty() or ok:
			mp = p
		if ok:
			break
	var mc := Vector2.ZERO
	for b in main_l.bs:
		mc += pos_of.call(b)
	mc /= main_l.bs.size()
	var order: Array = []
	for gi in mp.groups.size():
		var g: Array = mp.groups[gi]
		if g.is_empty():
			continue
		var s := Vector2.ZERO
		for b in g:
			s += pos_of.call(b)
		order.append({"gi": gi, "d": (s / g.size()).distance_to(mc)})
	order.sort_custom(func(a, b): return a.d < b.d)
	var indep := {}
	var n_indep := 2 if main_count >= 9 else 1
	for k in n_indep:
		indep[order[order.size() - 1 - k].gi] = true
	var vassal_c: Array = rng.shuffle(["slavic", "slavic", "slavic", "steppe", "sea", "north", "imperial", "slavic", "steppe", "desert", "sea", "slavic"])
	var indep_c: Array = rng.shuffle(["free", "steppe"])
	var vc := 0
	var ic := 0
	for rank in order.size():
		var o: Dictionary = order[rank]
		var g: Array = mp.groups[o.gi]
		if rank == 0:
			groups.append({"bs": g, "kind": "empire", "culture": "imperial"})
		elif indep.has(o.gi):
			groups.append({"bs": g, "kind": "kingdom", "culture": indep_c[ic % indep_c.size()]})
			ic += 1
		else:
			groups.append({"bs": g, "kind": "vassal", "culture": vassal_c[vc % vassal_c.size()]})
			vc += 1
	# інші народи — на своїх континентах
	var carry: Array = []
	for ci in [4, 1, 2, 5]:
		var C: Dictionary = Defs.CONTINENTS[ci]
		var L = cont_land.call(ci)
		var peoples: Array = C.peoples.duplicate()
		peoples.append_array(carry)
		if L == null:
			carry = peoples
			continue
		carry = []
		used[L.lid] = true
		var k := maxi(1, mini(peoples.size(), L.bs.size() / 7))
		if k < peoples.size():
			carry = peoples.slice(k)
		var pp := _partition(rng, L.bs, k, adj_of, pos_of)
		var idxs: Array = range(pp.groups.size())
		idxs.sort_custom(func(a, b): return pp.groups[a].size() > pp.groups[b].size())
		for j in idxs.size():
			var gg: Array = pp.groups[idxs[j]]
			if not gg.is_empty():
				groups.append({"bs": gg, "kind": "kingdom", "culture": peoples[j % peoples.size()]})
	for cul in carry:
		var host = null
		for g in groups:
			if g.kind == "kingdom" and g.culture != "free" and g.bs.size() >= 8 and (host == null or g.bs.size() > host.bs.size()):
				host = g
		if host == null:
			continue
		var pp := _partition(rng, host.bs, 2, adj_of, pos_of)
		if pp.groups[0].is_empty() or pp.groups[1].is_empty():
			continue
		host.bs = pp.groups[0]
		groups.append({"bs": pp.groups[1], "kind": "kingdom", "culture": cul})
	var realm_of := PackedInt32Array()
	realm_of.resize(nb)
	realm_of.fill(-1)
	for ri in groups.size():
		for b in groups[ri].bs:
			realm_of[b] = ri
	var has_demon := func() -> bool:
		for g in groups:
			if g.kind == "demon":
				return true
		return false
	for L in lands:
		if used.has(L.lid):
			continue
		used[L.lid] = true
		if not has_demon.call() and L.bs.size() >= 6:
			demon_l = L
			var ri := groups.size()
			groups.append({"bs": L.bs.duplicate(), "kind": "demon", "culture": "demon"})
			for b in L.bs:
				realm_of[b] = ri
			for i in W * H:
				if wd.comp[i] == L.lid and wd.terrain[i] >= T.BEACH and wd.terrain[i] != T.PEAK and wd.terrain[i] != T.MOUNTAIN:
					wd.terrain[i] = T.ASH
			continue
		if L.bs.size() >= 10:
			var ri := groups.size()
			var has_drag := false
			for g in groups:
				if g.culture == "dragonkin":
					has_drag = true
			var cul := "sea" if has_drag or L.bs.size() < 16 else "dragonkin"
			groups.append({"bs": L.bs.duplicate(), "kind": "kingdom", "culture": cul})
			for b in L.bs:
				realm_of[b] = ri
			continue
		var c0: Vector2 = pos_of.call(L.bs[0])
		var best := -1
		var bd := INF
		for b in nb:
			if realm_of[b] >= 0 and groups[realm_of[b]].kind != "demon":
				var d := c0.distance_to(pos_of.call(b))
				if d < bd:
					bd = d
					best = b
		if best < 0:
			continue
		var ri2 := realm_of[best]
		for b in L.bs:
			groups[ri2].bs.append(b)
			realm_of[b] = ri2
	wd.demon_land = demon_l.lid if demon_l != null else -1
	# імена, ієрархія
	var used_names := {}
	var uname := func(culture: String) -> String:
		var n := Defs.make_name(rng, culture)
		var t := 0
		while used_names.has(n) and t < 30:
			n = Defs.make_name(rng, culture)
			t += 1
		if used_names.has(n):
			n += " " + ["Нижній", "Верхній", "Старий", "Новий", "Малий"][used_names.size() % 5]
		used_names[n] = true
		return n
	var empire_id := -1
	for ri in groups.size():
		if groups[ri].kind == "empire":
			empire_id = ri
	wd.empire_id = empire_id
	for ri in groups.size():
		var rg: Dictionary = groups[ri]
		var cr: Array = Defs.CULT_REALM[rg.culture]
		var s := Vector2.ZERO
		for b in rg.bs:
			s += pos_of.call(b)
		s /= rg.bs.size()
		var mg: Array = rg.bs.filter(func(b): return B[b].land == B[rg.bs[0]].land)
		if mg.is_empty():
			mg = rg.bs
		var capital: int = mg[0]
		var cd := INF
		for b in mg:
			var d := s.distance_to(pos_of.call(b))
			if d < cd:
				cd = d
				capital = b
		var rname: String = uname.call(rg.culture)
		var R := {
			"id": ri, "name": rname, "culture": rg.culture, "title": cr[0], "full_name": "%s %s" % [cr[0], rname],
			"ruler_title": cr[1], "ruler_title_f": cr[2], "race": cr[3], "motto": cr[4],
			"color": Color("#5a0f14") if rg.kind == "demon" else Defs.REALM_COLORS[ri % Defs.REALM_COLORS.size()],
			"capital": capital, "is_empire": rg.kind == "empire", "is_demon": rg.kind == "demon",
			"liege": empire_id if rg.kind == "vassal" else -1, "kind": rg.kind, "duchies": [],
			"race_key": Defs.RACE_KEY.get(rg.culture, "human"),
		}
		wd.realms.append(R)
		var dp := _partition(rng, rg.bs, maxi(1, roundi(rg.bs.size() / 8.0)), adj_of, pos_of)
		for di in dp.groups.size():
			var dg: Array = dp.groups[di]
			if dg.is_empty():
				continue
			var did := wd.duchies.size()
			var seat: int = capital if dg.has(capital) else dp.seeds[di]
			wd.duchies.append({"id": did, "name": uname.call(rg.culture), "realm": ri, "seat": seat})
			R.duchies.append(did)
			var cp := _partition(rng, dg, maxi(1, roundi(dg.size() / 3.0)), adj_of, pos_of)
			for cj in cp.groups.size():
				var cg: Array = cp.groups[cj]
				if cg.is_empty():
					continue
				var cid := wd.counties.size()
				var cseat: int = seat if cg.has(seat) else cp.seeds[cj]
				wd.counties.append({"id": cid, "name": uname.call(rg.culture), "duchy": did, "realm": ri, "seat": cseat})
				for b in cg:
					B[b].county = cid
					B[b].duchy = did
					B[b].realm = ri
					B[b].name = uname.call(rg.culture)
	# типи поселень
	for b in nb:
		var Bb: Dictionary = B[b]
		if Bb.realm < 0:
			Bb.realm = 0
		var R: Dictionary = wd.realms[Bb.realm]
		var tc: PackedInt32Array = Bb.terrain
		var hills := tc[T.HILLS] + tc[T.MOUNTAIN]
		var border := false
		for n in Bb.adj:
			if B[n].realm != Bb.realm:
				border = true
		var duchy_seat: bool = Bb.duchy >= 0 and wd.duchies[Bb.duchy].seat == b
		var county_seat: bool = Bb.county >= 0 and wd.counties[Bb.county].seat == b
		if R.is_demon:
			Bb.type = "capital" if R.capital == b else "hellfort"
			Bb.dev = rng.rangei(3, 6)
			Bb.fort = 6 if R.capital == b else 4
		elif R.capital == b:
			Bb.type = "capital"; Bb.dev = rng.rangei(8, 10); Bb.fort = 6 if R.is_empire else 5
		elif duchy_seat:
			Bb.type = "city"; Bb.dev = rng.rangei(5, 8); Bb.fort = 4
		elif county_seat:
			Bb.type = "fortress" if border or rng.chance(0.35) else "town"
			Bb.dev = rng.rangei(3, 6); Bb.fort = 5 if Bb.type == "fortress" else 3
		elif border and rng.chance(0.25):
			Bb.type = "fortress"; Bb.dev = rng.rangei(2, 4); Bb.fort = 4
		elif Bb.coastal and rng.chance(0.45):
			Bb.type = "port"; Bb.dev = rng.rangei(3, 5); Bb.fort = 2
		elif hills > Bb.area * 0.25 and rng.chance(0.6):
			Bb.type = "mine"; Bb.dev = rng.rangei(2, 4); Bb.fort = 1
		else:
			Bb.type = "village"; Bb.dev = rng.rangei(1, 3); Bb.fort = 1
	for lid in by_land:
		var bs: Array = by_land[lid]
		var has_port := false
		for b in bs:
			if B[b].coastal and B[b].type in ["port", "capital", "city", "hellfort"]:
				has_port = true
		if has_port:
			continue
		var cands: Array = bs.filter(func(b): return B[b].coastal and B[b].type != "capital")
		if cands.is_empty():
			continue
		cands.sort_custom(func(a, b): return B[a].dev < B[b].dev)
		var c: int = cands[0]
		B[c].type = "hellfort" if wd.realms[B[c].realm].is_demon else "port"
		B[c].dev = maxi(B[c].dev, 3)
	for Bb in B:
		Bb.is_port = Bb.coastal and Bb.type in ["port", "capital", "city", "hellfort"]
		Bb.owner = Bb.realm
		Bb.occ = -1
	wd.by_land = by_land


# ---------------------------------------------------------------- landmarks

func _place_landmarks(wd: WorldData, rng: Rng, seed_in: int) -> void:
	var terrain := wd.terrain
	var comp := wd.comp
	var cell_lm := PackedInt32Array()
	cell_lm.resize(W * H)
	cell_lm.fill(-1)
	var main_lids := {wd.main_land: true}
	for L in wd.realms:
		var cap: int = wd.baronies[L.capital].land
		if not L.is_demon:
			main_lids[cap] = true
	var by_terr: Array = []
	for t in 13:
		by_terr.append(PackedInt32Array())
	var i := 0
	while i < W * H:
		if main_lids.has(comp[i]):
			by_terr[terrain[i]].append(i)
		i += 3
	var shape := _noise(seed_in + 555, 1.0 / 5.0, 2)
	var pool: Array = Defs.LANDMARKS.duplicate()
	var order: Array = rng.shuffle(pool.duplicate())
	order.append_array(rng.shuffle(pool.duplicate()))
	for LM in order:
		if wd.landmarks.size() >= 30:
			break
		var cs := PackedInt32Array()
		for t in LM.terr:
			cs.append_array(by_terr[t])
		if cs.is_empty():
			continue
		var found := -1
		for attempt in 400:
			var c := cs[int(rng.next() * cs.size())]
			if cell_lm[c] >= 0:
				continue
			var ok := true
			for l in wd.landmarks:
				if Vector2(l.x - c % W, l.y - c / W).length() <= 30:
					ok = false
					break
			if ok:
				found = c
				break
		if found < 0:
			continue
		var x := found % W
		var y := found / W
		var r := rng.rangei(9, 15)
		var L := {"key": LM.key, "name": LM.name, "lvl": LM.lvl, "dungeon": LM.dungeon, "desc": LM.desc, "color": LM.color, "id": wd.landmarks.size(), "x": x, "y": y, "r": r, "cells": PackedInt32Array()}
		wd.landmarks.append(L)
		for yy in range(maxi(0, y - r - 3), mini(H, y + r + 3)):
			for xx in range(maxi(0, x - r - 3), mini(W, x + r + 3)):
				var j := yy * W + xx
				if terrain[j] < T.BEACH:
					continue
				if Vector2(xx - x, yy - y).length() + shape.get_noise_2d(xx, yy) * 4.0 < r:
					cell_lm[j] = L.id
					L.cells.append(j)
	wd.cell_landmark = cell_lm


# ---------------------------------------------------------------- roads

func _build_roads(wd: WorldData, rng: Rng) -> void:
	var terrain := wd.terrain
	var river := wd.river
	var B: Array = wd.baronies
	var astar := AStarGrid2D.new()
	astar.region = Rect2i(0, 0, W, H)
	astar.cell_size = Vector2.ONE
	astar.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_ONLY_IF_NO_OBSTACLES
	astar.default_compute_heuristic = AStarGrid2D.HEURISTIC_OCTILE
	astar.default_estimate_heuristic = AStarGrid2D.HEURISTIC_OCTILE
	astar.update()
	for y in H:
		for x in W:
			var i := y * W + x
			if terrain[i] < T.BEACH:
				astar.set_point_solid(Vector2i(x, y), true)
			else:
				astar.set_point_weight_scale(Vector2i(x, y), cell_cost(terrain, river, i))
	var road := PackedByteArray()
	road.resize(W * H)
	var tier_of := func(b: int) -> int:
		match B[b].type:
			"capital": return 4
			"city": return 3
			"town", "fortress", "port": return 2
		return 1
	var edges: Array = []
	var edge_set := {}
	for lid in wd.by_land:
		var bs: Array = wd.by_land[lid]
		var in_t := {bs[0]: true}
		var eh := MinHeap.new()
		var push_e := func(b: int) -> void:
			for m in B[b].adj:
				if not in_t.has(m):
					eh.push([b, m], Vector2(B[b].x - B[m].x, B[b].y - B[m].y).length())
		push_e.call(bs[0])
		while not eh.is_empty():
			var e: Array = eh.pop()
			if in_t.has(e[1]):
				continue
			in_t[e[1]] = true
			edges.append(e)
			push_e.call(e[1])
	for a in B.size():
		for b in B[a].adj:
			if a < b and Vector2(B[a].x - B[b].x, B[a].y - B[b].y).length() < 15 and rng.chance(0.4):
				edges.append([a, b])
	edges.sort_custom(func(e1, e2): return tier_of.call(e1[0]) + tier_of.call(e1[1]) > tier_of.call(e2[0]) + tier_of.call(e2[1]))
	var n_done := 0
	for e in edges:
		n_done += 1
		if n_done % 60 == 0:
			_report(0.7 + 0.17 * n_done / edges.size(), "Прокладаємо дороги…")
		var a: int = e[0]
		var b: int = e[1]
		var key := Vector2i(mini(a, b), maxi(a, b))
		if edge_set.has(key):
			continue
		var path := astar.get_id_path(Vector2i(B[a].x, B[a].y), Vector2i(B[b].x, B[b].y))
		if path.is_empty():
			continue
		edge_set[key] = true
		var major: bool = tier_of.call(a) >= 2 and tier_of.call(b) >= 2
		var cells := PackedInt32Array()
		for p in path:
			var c := p.y * W + p.x
			cells.append(c)
			road[c] = maxi(road[c], 2 if major else 1)
			astar.set_point_weight_scale(p, 0.35)
		var rc := 0.0
		for c in cells:
			rc += 0.5 if road[c] else minf(cell_cost(terrain, river, c), 6.0) * 0.6
		wd.roads.append({"a": a, "b": b, "path": cells, "major": major, "cost": rc})
	wd.road = road
	# для ходьби героя: дороги дешеві, ліс і гори дорожчі
	wd.astar = astar


# ---------------------------------------------------------------- dungeons

func _place_dungeons(wd: WorldData, rng: Rng) -> void:
	var terrain := wd.terrain
	var comp := wd.comp
	var B: Array = wd.baronies
	var D: Array = wd.dungeons
	var free_cell := func(i: int, min_dist: float) -> bool:
		if wd.road[i]:
			return false
		var x := i % W
		var y := i / W
		for d in D:
			if Vector2(d.x - x, d.y - y).length() <= min_dist:
				return false
		var cb := wd.cell_barony[i]
		if cb >= 0 and Vector2(B[cb].x - x, B[cb].y - y).length() <= 3:
			return false
		return true
	var place := func(type: String, cell: int, extra: Dictionary) -> void:
		var dd := {"id": D.size(), "type": type, "base_name": Defs.DTYPES[type].name, "cell": cell, "x": cell % W, "y": cell / W,
			"barony": wd.cell_barony[cell], "tier": 1, "level": 1, "final": false, "landmark": -1, "island": false}
		dd.merge(extra, true)
		D.append(dd)
	for L in wd.landmarks:
		var cs: PackedInt32Array = L.cells.duplicate()
		rng.shuffle(cs)
		for c in cs:
			if terrain[c] != T.PEAK and free_cell.call(c, 6.0):
				place.call(L.dungeon, c, {"landmark": L.id})
				break
	var demon_r := -1
	for R in wd.realms:
		if R.is_demon:
			demon_r = R.id
	if wd.demon_land >= 0 and demon_r >= 0:
		var cap_b: Dictionary = B[wd.realms[demon_r].capital]
		var capv := Vector2(cap_b.x, cap_b.y)
		var cs: Array = []
		for i in W * H:
			if comp[i] == wd.demon_land and terrain[i] == T.ASH:
				cs.append(i)
		cs.sort_custom(func(a, b): return Vector2(a % W, a / W).distance_to(capv) < Vector2(b % W, b / W).distance_to(capv))
		for c in cs:
			if free_cell.call(c, 2.0) and Vector2(c % W, c / W).distance_to(capv) > 3:
				place.call("hellgate", c, {"final": true, "base_name": "Цитадель Володаря Демонів"})
				break
		rng.shuffle(cs)
		var n := 0
		for c in cs:
			if n >= 4:
				break
			if free_cell.call(c, 10.0):
				place.call("hellgate", c, {})
				n += 1
	var gc := PackedInt32Array()
	for i in W * H:
		var t := terrain[i]
		if t >= T.BEACH and t != T.PEAK and t != T.ASH and wd.comp_sizes[comp[i]] >= 6:
			gc.append(i)
	rng.shuffle(gc)
	var keys: Array = Defs.DTYPES.keys()
	for c in gc:
		if D.size() >= 110:
			break
		if not free_cell.call(c, 15.0):
			continue
		var t := terrain[c]
		var small: bool = wd.comp_sizes[comp[c]] < 40
		var opts: Array = []
		for k in keys:
			if k == "hellgate" or not (t in Defs.DTYPES[k].terr):
				continue
			if small:
				if k in ["pirate", "sunken", "tower", "ruins"]:
					opts.append(k)
			elif k != "pirate" or rng.chance(0.3):
				opts.append(k)
		if opts.is_empty():
			continue
		place.call(rng.pick(opts), c, {"island": small})


func _assign_danger(wd: WorldData, rng: Rng) -> void:
	var B: Array = wd.baronies
	var start_realm := -1
	for R in wd.realms:
		if R.kind == "vassal" and R.culture == "slavic":
			start_realm = R.id
			break
	if start_realm < 0:
		for R in wd.realms:
			if R.kind == "vassal":
				start_realm = R.id
				break
	if start_realm < 0:
		for R in wd.realms:
			if not R.is_demon:
				start_realm = R.id
				break
	var sc: Array = B.filter(func(b): return b.realm == start_realm and b.type == "village")
	if sc.is_empty():
		sc = B.filter(func(b): return b.realm == start_realm)
	var S0: Dictionary = rng.pick(sc)
	wd.start_barony = S0.id
	wd.start_realm = start_realm
	var max_d := 1.0
	for b in B:
		b.dist_start = Vector2(b.x - S0.x, b.y - S0.y).length() * (1.0 if b.land == S0.land else 1.35)
		if not wd.realms[b.realm].is_demon:
			max_d = maxf(max_d, b.dist_start)
	for b in B:
		var lvl := 1 + int(minf(1.0, b.dist_start / max_d) * 26)
		if b.type == "capital" or b.type == "city":
			lvl = maxi(1, lvl - 2)
		var lm := wd.cell_landmark[b.cell]
		if lm >= 0:
			lvl = maxi(lvl, wd.landmarks[lm].lvl)
		if wd.realms[b.realm].is_demon:
			lvl = 30 + rng.rangei(0, 5)
		b.danger = lvl
	var s0v := Vector2(S0.x, S0.y)
	for d in wd.dungeons:
		var dd := Vector2(d.x, d.y).distance_to(s0v) * (1.0 if wd.comp[d.cell] == S0.land else 1.35)
		d.tier = mini(5, 1 + int(minf(1.0, dd / max_d) * 5.2))
		if d.landmark >= 0:
			d.tier = mini(5, d.tier + 1)
		d.level = maxi(1, roundi(d.tier * 5 - 3 + rng.rangei(-1, 2)))
		if d.landmark >= 0:
			d.level = maxi(d.level, wd.landmarks[d.landmark].lvl + 2)
		if d.type == "hellgate":
			d.tier = 6
			d.level = 36 if d.final else 30 + rng.rangei(0, 3)
		d.floors = 5 if d.final else 1 + mini(4, d.tier)
		var link := -1
		var ld := INF
		for b in B:
			if b.land != wd.comp[d.cell]:
				continue
			var dl := Vector2(b.x - d.x, b.y - d.y).length()
			if dl < ld:
				ld = dl
				link = b.id
		d.link = link
		var culture := "sea"
		if d.barony >= 0:
			culture = wd.realms[B[d.barony].realm].culture
		if d.final:
			d.name = d.base_name
		elif d.landmark >= 0:
			d.name = "%s (%s)" % [d.base_name, wd.landmarks[d.landmark].name]
		else:
			d.name = "%s %s" % [d.base_name, Defs.make_name(rng, culture)]
