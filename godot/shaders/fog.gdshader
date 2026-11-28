// Туман війни: пухнасті фіолетові хмарки над нерозвіданими землями.
shader_type canvas_item;

uniform sampler2D fog_tex : filter_linear;
uniform vec2 size = vec2(540.0, 370.0);

float hash(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float vnoise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
	float s = 0.0, a = 0.5;
	for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
	return s;
}

void fragment() {
	vec2 cp = UV * size;
	vec2 px = 0.8 / size;
	float fg = (texture(fog_tex, UV).r * 2.0 + texture(fog_tex, UV + vec2(px.x, 0.0)).r + texture(fog_tex, UV - vec2(px.x, 0.0)).r
		+ texture(fog_tex, UV + vec2(0.0, px.y)).r + texture(fog_tex, UV - vec2(0.0, px.y)).r) / 6.0;
	float cl = fbm(cp * 0.15 + vec2(TIME * 0.03, TIME * 0.01));
	float vis = smoothstep(0.3, 0.8, fg + (cl - 0.5) * 0.45);
	vec3 cloud = mix(vec3(0.09, 0.07, 0.18), vec3(0.36, 0.28, 0.5), smoothstep(0.3, 0.8, cl));
	cloud += vec3(0.25, 0.15, 0.3) * smoothstep(0.45, 0.2, abs(fg - 0.45)) * 0.5;
	COLOR = vec4(cloud, 1.0 - vis);
}
