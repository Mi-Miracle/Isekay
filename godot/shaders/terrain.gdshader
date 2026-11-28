// Мапа Дивосвіту: м'які переходи між рельєфом, анімована вода, тіні від гір, кордони держав.
shader_type canvas_item;

uniform sampler2D data_tex : filter_nearest;   // R — тип рельєфу, G — висота, B — річка
uniform sampler2D realm_tex : filter_nearest;  // R — номер держави + 1
uniform sampler2D realm_col : filter_nearest;  // кольори держав (рядок 1×N)
uniform vec2 size = vec2(540.0, 370.0);
uniform float realm_mix = 0.0;
uniform float realm_count = 32.0;

const vec3 COLS[13] = {
	vec3(0.10, 0.27, 0.52), vec3(0.17, 0.47, 0.74), vec3(0.93, 0.86, 0.63), vec3(0.58, 0.80, 0.36),
	vec3(0.25, 0.55, 0.24), vec3(0.64, 0.70, 0.38), vec3(0.55, 0.51, 0.47), vec3(0.95, 0.96, 0.99),
	vec3(0.93, 0.77, 0.43), vec3(0.80, 0.85, 0.84), vec3(0.37, 0.47, 0.25), vec3(0.30, 0.15, 0.14),
	vec3(0.16, 0.48, 0.20)
};

float hash(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float vnoise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
	return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
	float s = 0.0, a = 0.5;
	for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
	return s;
}

vec4 cell(ivec2 c) {
	c = clamp(c, ivec2(0), ivec2(size) - 1);
	return texelFetch(data_tex, c, 0);
}

int tid(vec4 d) { return int(d.r * 255.0 + 0.5); }

float hgt(vec2 cp) {
	vec2 p = cp - 0.5;
	ivec2 i = ivec2(floor(p));
	vec2 f = smoothstep(0.0, 1.0, fract(p));
	float a = cell(i).g, b = cell(i + ivec2(1, 0)).g, c = cell(i + ivec2(0, 1)).g, d = cell(i + ivec2(1, 1)).g;
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Деталі поверхні для кожного типу рельєфу. wp — координати в клітинках.
vec3 land_color(int t, vec2 wp, float tm) {
	vec3 c = COLS[t];
	float n = fbm(wp * 0.9);
	float fine = vnoise(wp * 6.0);
	if (t == 3) { // рівнини: трава й квіти
		c *= 0.9 + 0.2 * n;
		c = mix(c, c * vec3(0.85, 1.05, 0.8), smoothstep(0.55, 0.75, vnoise(wp * 2.5)));
		vec2 fg = fract(wp * 3.0) - 0.5;
		float fl = hash(floor(wp * 3.0));
		float petal = smoothstep(0.2, 0.12, length(fg + (vec2(hash(floor(wp * 3.0) + 3.1), fl) - 0.5) * 0.4));
		if (fl > 0.975) c = mix(c, fl > 0.988 ? vec3(1.0, 0.72, 0.86) : vec3(1.0, 0.94, 0.5), petal * 0.9);
	} else if (t == 4 || t == 12) { // ліс: крони дерев
		float k = fbm(wp * 1.7);
		c = mix(c * 0.6, c * 1.22, smoothstep(0.3, 0.7, k));
		// округлі крони: темні проміжки між деревами
		float crowns = vnoise(wp * 3.2) * 0.7 + vnoise(wp * 6.4 + 7.0) * 0.3;
		c *= 0.82 + 0.3 * smoothstep(0.25, 0.65, crowns);
		c += vec3(0.04, 0.07, 0.0) * smoothstep(0.7, 0.9, crowns);
	} else if (t == 5) { // пагорби
		c *= 0.88 + 0.25 * n;
	} else if (t == 6) { // гори
		c *= 0.8 + 0.35 * n;
		c = mix(c, vec3(0.42, 0.38, 0.36), smoothstep(0.6, 0.8, fine) * 0.4);
	} else if (t == 7) { // снігові піки
		c = mix(c, vec3(0.78, 0.86, 1.0), 0.35 * n);
	} else if (t == 8) { // пустеля: дюни
		float du = sin(wp.x * 1.6 + wp.y * 0.6 + n * 5.0);
		c *= 0.92 + 0.1 * du;
	} else if (t == 9) { // тундра
		c = mix(c, vec3(0.97, 0.98, 1.0), smoothstep(0.5, 0.8, fine) * 0.6);
	} else if (t == 10) { // болото
		c *= 0.85 + 0.25 * n;
		c = mix(c, vec3(0.2, 0.32, 0.28), smoothstep(0.62, 0.7, vnoise(wp * 1.7)) * 0.8);
	} else if (t == 11) { // пекельні пустища: тріщини з лавою
		c *= 0.8 + 0.3 * n;
		float r = abs(vnoise(wp * 1.3) - 0.5);
		float lava = smoothstep(0.05, 0.0, r);
		c = mix(c, vec3(1.0, 0.42, 0.1) * (0.8 + 0.4 * sin(tm * 2.0 + wp.x)), lava);
	} else if (t == 2) { // пляж
		c *= 0.95 + 0.1 * fine;
	}
	return c;
}

void fragment() {
	vec2 cp = UV * size;
	float tm = TIME;
	// легке «тремтіння» межі, щоб переходи були органічні, а не квадратні
	vec2 jit = vec2(vnoise(cp * 0.9) - 0.5, vnoise(cp * 0.9 + 17.0) - 0.5) * 0.7;
	vec2 p = cp - 0.5 + jit;
	ivec2 i0 = ivec2(floor(p));
	vec2 f = fract(p);
	vec2 u = smoothstep(0.0, 1.0, f);
	float wts[4] = { (1.0 - u.x) * (1.0 - u.y), u.x * (1.0 - u.y), (1.0 - u.x) * u.y, u.x * u.y };
	ivec2 offs[4] = { ivec2(0, 0), ivec2(1, 0), ivec2(0, 1), ivec2(1, 1) };
	vec3 land = vec3(0.0);
	float lw = 0.0;
	float water = 0.0;
	float deep = 0.0;
	float h = 0.0;
	float riv = 0.0;
	int dom = 3;
	float domw = -1.0;
	for (int k = 0; k < 4; k++) {
		vec4 d = cell(i0 + offs[k]);
		int t = tid(d);
		h += d.g * wts[k];
		riv += d.b * wts[k];
		if (t < 2) {
			water += wts[k];
			if (t == 0) deep += wts[k];
		} else {
			land += land_color(t, cp, tm) * wts[k];
			lw += wts[k];
			if (wts[k] > domw) { domw = wts[k]; dom = t; }
		}
	}
	if (lw > 0.0) land /= lw;
	// тінь від схилів (світло з північного заходу), висота інтерпольована — без «кубиків»
	float hx1 = hgt(cp + vec2(0.6, 0.0)), hx0 = hgt(cp - vec2(0.6, 0.0));
	float hy1 = hgt(cp + vec2(0.0, 0.6)), hy0 = hgt(cp - vec2(0.0, 0.6));
	float slope = ((hx1 - hx0) + (hy1 - hy0)) * 2.6;
	float relief = (dom == 6 || dom == 7) ? 2.2 : (dom == 5 ? 1.3 : 0.6);
	land *= clamp(1.0 - slope * relief, 0.6, 1.35);

	// вода
	float wv = fbm(cp * 0.35 + vec2(tm * 0.05, tm * 0.03));
	vec3 sea = mix(COLS[1], COLS[0], clamp(deep / max(water, 0.001), 0.0, 1.0));
	sea *= 0.9 + 0.2 * wv;
	float sparkle = smoothstep(0.78, 0.86, vnoise(cp * 3.0 + vec2(tm * 0.6, -tm * 0.4)));
	sea += vec3(0.6, 0.8, 1.0) * sparkle * 0.25 * (1.0 - deep);

	float coast = smoothstep(0.44, 0.56, water);
	vec3 col = mix(land, sea, coast);
	// піна біля берега
	float foam = 1.0 - smoothstep(0.0, 0.09, abs(water - 0.5 - 0.05 * sin(tm * 1.5 + cp.x * 2.0 + cp.y)));
	col = mix(col, vec3(0.95, 0.98, 1.0), foam * 0.7 * step(0.001, lw));

	// річки
	float rmask = smoothstep(0.28, 0.42, riv) * (1.0 - coast);
	vec3 rc = vec3(0.27, 0.6, 0.88) * (0.9 + 0.2 * vnoise(cp * 2.0 + vec2(0.0, -tm)));
	col = mix(col, rc, rmask);

	// кордони держав
	vec2 cf = fract(cp);
	ivec2 ci = ivec2(floor(cp));
	float rid = texelFetch(realm_tex, ci, 0).r;
	float border = 0.0;
	if (rid > 0.0) {
		float bx = cf.x < 0.5 ? texelFetch(realm_tex, ci - ivec2(1, 0), 0).r : texelFetch(realm_tex, ci + ivec2(1, 0), 0).r;
		float by = cf.y < 0.5 ? texelFetch(realm_tex, ci - ivec2(0, 1), 0).r : texelFetch(realm_tex, ci + ivec2(0, 1), 0).r;
		float ex = min(cf.x, 1.0 - cf.x);
		float ey = min(cf.y, 1.0 - cf.y);
		if (bx > 0.0 && abs(bx - rid) > 0.001) border = max(border, smoothstep(0.16, 0.04, ex));
		if (by > 0.0 && abs(by - rid) > 0.001) border = max(border, smoothstep(0.16, 0.04, ey));
		vec3 rcol = texture(realm_col, vec2((rid * 255.0 - 0.5) / realm_count, 0.5)).rgb;
		col = mix(col, rcol, realm_mix * 0.38 * (1.0 - coast));
		col = mix(col, rcol * 0.85, border * (0.45 + 0.45 * realm_mix) * (1.0 - coast));
	}

	COLOR = vec4(col, 1.0);
}
