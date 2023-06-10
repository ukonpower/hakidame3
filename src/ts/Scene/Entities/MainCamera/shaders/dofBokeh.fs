#include <common>
#include <noise>

uniform float uTime;
uniform sampler2D sampler0;
uniform sampler2D sampler1;
uniform vec4 uParams;

in vec2 vUv;

layout (location = 0) out vec4 outColor;

// #define BOKEH_SAMPLE 16
// vec2 poissonDisk[ BOKEH_SAMPLE ];

#define BOKEH_SAMPLE 22
vec2 kDiskKernel[ BOKEH_SAMPLE ] = vec2[](
    vec2(0,0),
    vec2(0.53333336,0),
    vec2(0.3325279,0.4169768),
    vec2(-0.11867785,0.5199616),
    vec2(-0.48051673,0.2314047),
    vec2(-0.48051673,-0.23140468),
    vec2(-0.11867763,-0.51996166),
    vec2(0.33252785,-0.4169769),
    vec2(1,0),
    vec2(0.90096885,0.43388376),
    vec2(0.6234898,0.7818315),
    vec2(0.22252098,0.9749279),
    vec2(-0.22252095,0.9749279),
    vec2(-0.62349,0.7818314),
    vec2(-0.90096885,0.43388382),
    vec2(-1,0),
    vec2(-0.90096885,-0.43388376),
    vec2(-0.6234896,-0.7818316),
    vec2(-0.22252055,-0.974928),
    vec2(0.2225215,-0.9749278),
    vec2(0.6234897,-0.7818316),
    vec2(0.90096885,-0.43388376)
);

// Fragment shader: Bokeh filter with disk-shaped kernels
void main( void ) {

	float _MaxCoC = uParams.y;
	float _RcpMaxCoC = uParams.z;
	vec2 _MainTex_TexelSize = vec2( 1.0 ) / vec2( textureSize( sampler0, 0 ) );
	float _RcpAspect = _MainTex_TexelSize.x / _MainTex_TexelSize.y;
	// sampler2D _MainTex = sampler0;

    vec4 samp0 = texture(sampler0, vUv);

    vec4 bgAcc = vec4(0.0); // Background: far field bokeh
    vec4 fgAcc = vec4(0.0); // Foreground: near field bokeh

    for (int si = 0; si < BOKEH_SAMPLE; si++)
    {
        vec2 disp = kDiskKernel[si] * _MaxCoC;
        float dist = length(disp);

        vec2 duv = vec2(disp.x * _RcpAspect, disp.y);
        vec4 samp = texture(sampler0, vUv + duv);

        // BG: Compare CoC of the current sample and the center sample
        // and select smaller one.
        float bgCoC = max(min(samp0.a, samp.a), 0.0);

        // Compare the CoC to the sample distance.
        // Add a small margin to smooth out.
        float margin = _MainTex_TexelSize.y * 2.0;
        float bgWeight = clamp((bgCoC   - dist + margin ) / margin, 0.0, 1.0);
        float fgWeight = clamp((-samp.a - dist + margin ) / margin, 0.0, 1.0);

        // Cut influence from focused areas because they're darkened by CoC
        // premultiplying. This is only needed for near field.
        fgWeight *= step(_MainTex_TexelSize.y, -samp.a);

        // Accumulation
        bgAcc += vec4(samp.rgb, 1.0) * bgWeight;
        fgAcc += vec4(samp.rgb, 1.0) * fgWeight;
    }

    // Get the weighted average.
    bgAcc.rgb /= bgAcc.a + (bgAcc.a == 0.0 ? 1.0 : 0.0 ); // zero-div guard
    fgAcc.rgb /= fgAcc.a + (fgAcc.a == 0.0 ? 1.0 : 0.0 );

    // BG: Calculate the alpha value only based on the center CoC.
    // This is a rather aggressive approximation but provides stable results.
    bgAcc.a = smoothstep(_MainTex_TexelSize.y, _MainTex_TexelSize.y * 2.0, samp0.a);

    // FG: Normalize the total of the weights.
    fgAcc.a *= PI / float(BOKEH_SAMPLE);

    // Alpha premultiplying
    vec3 rgb = vec3( 0.0 );
    rgb = mix(rgb, bgAcc.rgb, clamp(bgAcc.a, 0.0, 1.0));
    rgb = mix(rgb, fgAcc.rgb, clamp(fgAcc.a, 0.0, 1.0));

    // Combined alpha value
    float alpha = (1.0 - clamp(bgAcc.a, 0.0, 1.0)) * (1.0 - clamp(fgAcc.a, 0.0, 1.0));

    outColor = vec4(rgb, alpha);
}