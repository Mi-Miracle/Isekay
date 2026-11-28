// Міні-мапа й мапа світу: кольори рельєфу, держави (Tab) і туман.
shader_type canvas_item;

uniform sampler2D fog_tex : filter_linear;
uniform sampler2D realm_img : filter_nearest;
uniform float realm_mix = 0.0;

void fragment() {
	vec3 col = texture(TEXTURE, UV).rgb;
	vec4 r = texture(realm_img, UV);
	col = mix(col, r.rgb, realm_mix * r.a * 0.55);
	float fg = texture(fog_tex, UV).r;
	// нерозвідане: лише ледь помітні обриси суходолу
	float landish = step(0.75, texture(TEXTURE, UV).a);
	vec3 hidden = mix(vec3(0.09, 0.07, 0.18), vec3(0.2, 0.16, 0.3), landish);
	col = mix(hidden, col, smoothstep(0.05, 0.6, fg));
	COLOR = vec4(col, 1.0);
}
