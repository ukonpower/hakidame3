#include <common>
#include <packing>
#include <frag_h>

#include <sdf>
#include <noise>
#include <rotate>

uniform vec3 cameraPosition;
uniform mat4 modelMatrixInverse;
uniform float uTime;

// ref: https://www.shadertoy.com/view/stdXWH

vec3 traverseGrid2D( vec2 ro, vec2 rd ) {
    const float GRID_INTERVAL = 1.0;

    vec2 grid = floor( ( ro + rd * 1E-2 * GRID_INTERVAL ) / GRID_INTERVAL ) * GRID_INTERVAL + 0.5 * GRID_INTERVAL;
    
    vec2 src = ( ro - grid ) / rd;
    vec2 dst = abs( 0.5 * GRID_INTERVAL / rd );
    vec2 bv = -src + dst;
    float b = min( bv.x, bv.y );
    
    return vec3( grid, b );
}

vec2 D( vec3 p ) {

	vec2 d = vec2( 0.0 );

	vec3 s = vec3( 0.5, 0.5, 0.5 );

	d = vec2( sdBox( p, s ), 0.0 );
	
	return d;

}


vec3 N( vec3 pos, float delta ){

    return normalize( vec3(
		D( pos ).x - D( vec3( pos.x - delta, pos.y, pos.z ) ).x,
		D( pos ).x - D( vec3( pos.x, pos.y - delta, pos.z ) ).x,
		D( pos ).x - D( vec3( pos.x, pos.y, pos.z - delta ) ).x
	) );
	
}

void main( void ) {

	#include <frag_in>

	vec3 rayOrigin = ( modelMatrixInverse * vec4( vPos, 1.0 ) ).xyz;
	vec3 rayDir = normalize( ( modelMatrixInverse * vec4( normalize( vPos - cameraPosition ), 0.0 ) ).xyz );
	vec2 rayDirXZ = normalize( rayDir.xz );
	vec3 rayPos = rayOrigin;
	float rayLength = 0.0;
	
	vec3 gridCenter = vec3( 0.0 );
	float lenNextGrid = 0.0;
	
	vec2 dist = vec2( 0.0 );
	bool hit = false;

	vec3 normal;
	
	for( int i = 0; i < 64; i++ ) { 

		if( lenNextGrid <= rayLength ) {

			rayLength = lenNextGrid;
			rayPos = rayOrigin + rayLength * rayDir;
			vec3 grid = traverseGrid2D( rayPos.xz, rayDirXZ );
			gridCenter.xz = grid.xy;

			float lg = length(gridCenter.xz);
			gridCenter.y = ( sin( lg + uTime ) * 0.5 - 0.5 ) * smoothstep( 15.0, 0.0, lg );
			lenNextGrid += grid.z;

		}

		dist = D( rayPos - gridCenter );
		rayLength += dist.x;
		rayPos = rayOrigin + rayLength * rayDir;

		if( dist.x < 0.01 ) {
			hit = true;
			break;
		}
		
	}

	if( hit ) {

		vec3 n = N( rayPos - gridCenter, 0.00001 );
		// vec3 n2 = N( rayPos - gridCenter, 0.05 );
		// outEmission += length(n - n2);
		outNormal = normalize(modelMatrix * vec4( n, 0.0 )).xyz;
		
	} else {

		discard;
		
	}

	outRoughness = .1;
	outMetalic = 0.0;
	// outColor.xyz = vec3( 0.0 );

	outPos = ( modelMatrix * vec4( rayPos, 1.0 ) ).xyz;

	#include <frag_out>

}