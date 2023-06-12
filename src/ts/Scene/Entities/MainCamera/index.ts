import * as GLP from 'glpower';

import { canvas, gl, globalUniforms, power } from "~/ts/Globals";
import { PostProcess } from "~/ts/libs/framework/Components/PostProcess";
import { PostProcessPass } from "~/ts/libs/framework/Components/PostProcessPass";
import { Entity, EntityResizeEvent } from "~/ts/libs/framework/Entity";
import { RenderCamera, RenderCameraParam } from '~/ts/libs/framework/Components/Camera/RenderCamera';
import { OrbitControls } from '~/ts/libs/framework/Components/OrbitControls';
import { ComponentResizeEvent, ComponentUpdateEvent } from '~/ts/libs/framework/Components';

import fxaaFrag from './shaders/fxaa.fs';
import bloomBlurFrag from './shaders/bloomBlur.fs';
import bloomBrightFrag from './shaders/bloomBright.fs';
import lightShaftFrag from './shaders/lightShaft.fs';
import ssrFrag from './shaders/ssr.fs';
import dofCoc from './shaders/dofCoc.fs';
import dofComposite from './shaders/dofComposite.fs';
import dofBokeh from './shaders/dofBokeh.fs';
import ssCompositeFrag from './shaders/ssComposite.fs';
import compositeFrag from './shaders/composite.fs';
import { LookAt } from '~/ts/libs/framework/Components/LookAt';
import { ShakeViewer } from '~/ts/libs/framework/Components/ShakeViewer';
import { RotateViewer } from '~/ts/libs/framework/Components/RotateViewer';

export class MainCamera extends Entity {

	private commonUniforms: GLP.Uniforms;

	private cameraComponent: RenderCamera;

	private baseFov: number;

	// common rendertarget

	private rt1: GLP.GLPowerFrameBuffer;
	private rt2: GLP.GLPowerFrameBuffer;
	private rt3: GLP.GLPowerFrameBuffer;

	// fxaa

	private fxaa: PostProcessPass;

	// bloom

	private bloomRenderCount: number;
	private bloomBright: PostProcessPass;
	private bloomBlur: PostProcessPass[];
	private rtBloomVertical: GLP.GLPowerFrameBuffer[];
	private rtBloomHorizonal: GLP.GLPowerFrameBuffer[];

	// light shaft

	private lightShaft: PostProcessPass;
	public rtLightShaft1: GLP.GLPowerFrameBuffer;
	public rtLightShaft2: GLP.GLPowerFrameBuffer;

	// ssr

	private ssr: PostProcessPass;
	public rtSSR1: GLP.GLPowerFrameBuffer;
	public rtSSR2: GLP.GLPowerFrameBuffer;

	// ss composite

	private ssComposite: PostProcessPass;

	// dof

	private dofParams: GLP.Vector;
	private dofTarget: Entity | null;

	public dofCoc: PostProcessPass;
	public dofBokeh: PostProcessPass;
	public dofComposite: PostProcessPass;
	public rtDofCoc: GLP.GLPowerFrameBuffer;
	public rtDofBokeh: GLP.GLPowerFrameBuffer;
	public rtDofComposite: GLP.GLPowerFrameBuffer;

	// composite

	private composite: PostProcessPass;

	// resolutions

	private resolution: GLP.Vector;
	private resolutionInv: GLP.Vector;
	private resolutionBloom: GLP.Vector[];

	// tmps

	private tmpVector1: GLP.Vector;
	private tmpVector2: GLP.Vector;

	constructor( param: RenderCameraParam ) {

		super();

		this.baseFov = 50.0;

		// components

		this.cameraComponent = this.addComponent( "camera", new RenderCamera( param ) );
		this.addComponent( 'orbitControls', new OrbitControls( canvas ) );

		const lookAt = this.addComponent( 'lookAt', new LookAt() );

		this.addComponent( 'shakeViewer', new ShakeViewer() );
		this.addComponent( 'rotateViewer', new RotateViewer() );

		// resolution

		this.resolution = new GLP.Vector();
		this.resolutionInv = new GLP.Vector();
		this.resolutionBloom = [];

		// rt

		this.rt1 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [ power.createTexture() ] );
		this.rt2 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [ power.createTexture() ] );
		this.rt3 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [ power.createTexture() ] );

		// uniforms

		this.commonUniforms = GLP.UniformsUtils.merge( {
			uResolution: {
				type: "2f",
				value: this.resolution
			},
			uResolutionInv: {
				type: "2f",
				value: this.resolutionInv
			}
		} );

		// light shaft

		this.rtLightShaft1 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
		] );
		this.rtLightShaft2 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
		] );

		this.lightShaft = new PostProcessPass( {
			input: [],
			frag: lightShaftFrag,
			renderTarget: this.rtLightShaft1,
			uniforms: GLP.UniformsUtils.merge( globalUniforms.time, {
				uLightShaftBackBuffer: {
					value: this.rtLightShaft2.textures[ 0 ],
					type: '1i'
				},
				uDepthTexture: {
					value: param.renderTarget.gBuffer.depthTexture,
					type: '1i'
				},
			} ),
		} );

		// ssr

		this.rtSSR1 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
		] );

		this.rtSSR2 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
		] );

		this.ssr = new PostProcessPass( {
			input: [ param.renderTarget.gBuffer.textures[ 0 ], param.renderTarget.gBuffer.textures[ 1 ] ],
			frag: ssrFrag,
			renderTarget: this.rtSSR1,
			uniforms: GLP.UniformsUtils.merge( globalUniforms.time, {
				uResolution: {
					value: this.resolution,
					type: '2fv',
				},
				uResolutionInv: {
					value: this.resolutionInv,
					type: '2fv',
				},
				uSceneTex: {
					value: param.renderTarget.forwardBuffer.textures[ 0 ],
					type: '1i'
				},
				uSSRBackBuffer: {
					value: this.rtSSR2.textures[ 0 ],
					type: '1i'
				},
				uDepthTexture: {
					value: param.renderTarget.gBuffer.depthTexture,
					type: '1i'
				},
			} ),
		} );

		// ss-composite

		this.ssComposite = new PostProcessPass( {
			input: [ param.renderTarget.gBuffer.textures[ 0 ], param.renderTarget.gBuffer.textures[ 1 ], param.renderTarget.forwardBuffer.textures[ 0 ] ],
			frag: ssCompositeFrag,
			uniforms: GLP.UniformsUtils.merge( this.commonUniforms, {
				uLightShaftTexture: {
					value: this.rtLightShaft2.textures[ 0 ],
					type: '1i'
				},
				uSSRTexture: {
					value: this.rtSSR2.textures[ 0 ],
					type: '1i'
				},
			} ),
			renderTarget: this.rt1
		} );

		// dof

		this.rtDofCoc = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR, internalFormat: gl.RGBA16F, type: gl.HALF_FLOAT, format: gl.RGBA } ),
		] );

		this.rtDofComposite = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR, internalFormat: gl.RGBA16F, type: gl.HALF_FLOAT, format: gl.RGBA } ),
		] );

		this.rtDofBokeh = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
		] );

		this.dofTarget = null;
		this.dofParams = new GLP.Vector( 10, 0.05, 20, 0.05 );

		this.dofCoc = new PostProcessPass( {
			input: [ this.rt1.textures[ 0 ], param.renderTarget.gBuffer.depthTexture ],
			frag: dofCoc,
			uniforms: GLP.UniformsUtils.merge( globalUniforms.time, {
				uParams: {
					value: this.dofParams,
					type: '4f'
				},
			} ),
			renderTarget: this.rtDofCoc,
		} );

		this.dofBokeh = new PostProcessPass( {
			input: [ this.rtDofCoc.textures[ 0 ] ],
			frag: dofBokeh,
			uniforms: GLP.UniformsUtils.merge( globalUniforms.time, {
				uParams: {
					value: this.dofParams,
					type: '4f'
				}
			} ),
			renderTarget: this.rtDofBokeh
		} );

		this.dofComposite = new PostProcessPass( {
			input: [ this.rt1.textures[ 0 ], this.rtDofBokeh.textures[ 0 ] ],
			frag: dofComposite,
			uniforms: GLP.UniformsUtils.merge( {} ),
			renderTarget: this.rtDofComposite
		} );

		// fxaa

		this.fxaa = new PostProcessPass( {
			input: [ this.rtDofComposite.textures[ 0 ] ],
			frag: fxaaFrag,
			uniforms: this.commonUniforms,
			renderTarget: this.rt1
		} );

		// bloom

		this.bloomRenderCount = 4;

		this.rtBloomVertical = [];
		this.rtBloomHorizonal = [];

		for ( let i = 0; i < this.bloomRenderCount; i ++ ) {

			this.rtBloomVertical.push( new GLP.GLPowerFrameBuffer( gl ).setTexture( [
				power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
			] ) );

			this.rtBloomHorizonal.push( new GLP.GLPowerFrameBuffer( gl ).setTexture( [
				power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
			] ) );

		}

		this.bloomBright = new PostProcessPass( {
			input: this.rt1.textures,
			frag: bloomBrightFrag,
			uniforms: GLP.UniformsUtils.merge( globalUniforms.time, {
				threshold: {
					type: '1f',
					value: 0.5,
				},
			} ),
			renderTarget: this.rt2
		} );

		this.bloomBlur = [];

		// bloom blur

		let bloomInput: GLP.GLPowerTexture[] = this.rt2.textures;

		for ( let i = 0; i < this.bloomRenderCount; i ++ ) {

			const rtVertical = this.rtBloomVertical[ i ];
			const rtHorizonal = this.rtBloomHorizonal[ i ];

			const resolution = new GLP.Vector();
			this.resolutionBloom.push( resolution );

			this.bloomBlur.push( new PostProcessPass( {
				input: bloomInput,
				renderTarget: rtVertical,
				frag: bloomBlurFrag,
				uniforms: {
					uIsVertical: {
						type: '1i',
						value: true
					},
					uWeights: {
						type: '1fv',
						value: this.guassWeight( this.bloomRenderCount )
					},
					uResolution: {
						type: '2fv',
						value: resolution,
					}
				},
				defines: {
					GAUSS_WEIGHTS: this.bloomRenderCount.toString()
				}
			} ) );

			this.bloomBlur.push( new PostProcessPass( {
				input: rtVertical.textures,
				renderTarget: rtHorizonal,
				frag: bloomBlurFrag,
				uniforms: {
					uIsVertical: {
						type: '1i',
						value: false
					},
					uWeights: {
						type: '1fv',
						value: this.guassWeight( this.bloomRenderCount )
					},
					uResolution: {
						type: '2fv',
						value: resolution,
					}
				},
				defines: {
					GAUSS_WEIGHTS: this.bloomRenderCount.toString()
				} } ) );

			bloomInput = rtHorizonal.textures;

		}

		// composite

		this.composite = new PostProcessPass( {
			input: [ this.rt1.textures[ 0 ] ],
			frag: compositeFrag,
			uniforms: GLP.UniformsUtils.merge( this.commonUniforms, {
				uBloomTexture: {
					value: this.rtBloomHorizonal.map( rt => rt.textures[ 0 ] ),
					type: '1iv'
				},
			} ),
			defines: {
				BLOOM_COUNT: this.bloomRenderCount.toString()
			},
			renderTarget: null
		} );

		// DEBUG
		// this.composite.input = [ param.renderTarget.deferredBuffer.textures[ 0 ] ];

		this.addComponent( "postprocess", new PostProcess( {
			input: param.renderTarget.gBuffer.textures,
			passes: [
				this.lightShaft,
				this.ssr,
				this.ssComposite,
				this.dofCoc,
				this.dofBokeh,
				this.dofComposite,
				this.fxaa,
				this.bloomBright,
				...this.bloomBlur,
				this.composite,
			] } )
		);

		// events

		this.on( 'notice/sceneCreated', ( root: Entity ) => {

			lookAt.setTarget( root.getEntityByName( "CameraTarget" ) || null );
			this.dofTarget = root.getEntityByName( 'CameraTargetDof' ) || null;

			this.baseFov = this.cameraComponent.fov;
			this.updateCameraParams( this.resolution );

		} );


		// tmps

		this.tmpVector1 = new GLP.Vector();
		this.tmpVector2 = new GLP.Vector();

	}

	private guassWeight( num: number ) {

		const weight = new Array( num );

		// https://wgld.org/d/webgl/w057.html

		let t = 0.0;
		const d = 100;

		for ( let i = 0; i < weight.length; i ++ ) {

			const r = 1.0 + 2.0 * i;
			let w = Math.exp( - 0.5 * ( r * r ) / d );
			weight[ i ] = w;

			if ( i > 0 ) {

				w *= 2.0;

			}

			t += w;

		}

		for ( let i = 0; i < weight.length; i ++ ) {

			weight[ i ] /= t;

		}

		return weight;

	}

	protected updateImpl( event: ComponentUpdateEvent ): void {

		// dof params

		this.matrixWorld.decompose( this.tmpVector1 );

		if ( this.dofTarget ) {

			this.dofTarget.matrixWorld.decompose( this.tmpVector2 );

		}

		const fov = this.cameraComponent.fov;
		const focusDistance = this.tmpVector1.sub( this.tmpVector2 ).length();
		const kFilmHeight = 0.036;
		const maxCoc = 1 / this.rtDofBokeh.size.y * 6.0;
		const rcpMaxCoC = 1.0 / maxCoc;
		const flocalLength = 0.5 * kFilmHeight / Math.tan( 0.5 * ( fov / 180 * Math.PI ) );
		// let coeff = flocalLength * flocalLength / ( 0.3 * ( focusDistance - flocalLength ) * kFilmHeight * 2 ) * 5.0;
		const coeff = 0.4;
		this.dofParams.set( focusDistance, maxCoc, rcpMaxCoC, coeff );

		// light shaft swap

		let tmp = this.rtLightShaft1;
		this.rtLightShaft1 = this.rtLightShaft2;
		this.rtLightShaft2 = tmp;

		this.lightShaft.renderTarget = this.rtLightShaft1;
		this.ssComposite.uniforms.uLightShaftTexture.value = this.rtLightShaft1.textures[ 0 ];
		this.lightShaft.uniforms.uLightShaftBackBuffer.value = this.rtLightShaft2.textures[ 0 ];

		// ssr swap

		tmp = this.rtSSR1;
		this.rtSSR1 = this.rtSSR2;
		this.rtSSR2 = tmp;

		this.ssr.renderTarget = this.rtSSR1;
		this.ssComposite.uniforms.uSSRTexture.value = this.rtSSR1.textures[ 0 ];
		this.ssr.uniforms.uSSRBackBuffer.value = this.rtSSR2.textures[ 0 ];

	}

	protected resizeImpl( e: ComponentResizeEvent ): void {

		this.resolution.copy( e.resolution );
		this.resolutionInv.set( 1.0 / e.resolution.x, 1.0 / e.resolution.y, 0.0, 0.0 );

		const resolutionHalf = this.resolution.clone().divide( 2 );
		resolutionHalf.x = Math.max( Math.floor( resolutionHalf.x ), 1.0 );
		resolutionHalf.y = Math.max( Math.floor( resolutionHalf.y ), 1.0 );

		this.rt1.setSize( e.resolution );
		this.rt2.setSize( e.resolution );
		this.rt3.setSize( e.resolution );

		this.updateCameraParams( this.resolution );

		let scale = 2;

		for ( let i = 0; i < this.bloomRenderCount; i ++ ) {

			this.resolutionBloom[ i ].copy( e.resolution ).multiply( 1.0 / scale );

			this.rtBloomHorizonal[ i ].setSize( this.resolutionBloom[ i ] );
			this.rtBloomVertical[ i ].setSize( this.resolutionBloom[ i ] );

			scale *= 2.0;

		}

		this.rtLightShaft1.setSize( e.resolution );
		this.rtLightShaft2.setSize( e.resolution );

		this.rtSSR1.setSize( resolutionHalf );
		this.rtSSR2.setSize( resolutionHalf );

		this.rtDofCoc.setSize( resolutionHalf );
		this.rtDofBokeh.setSize( resolutionHalf );
		this.rtDofComposite.setSize( this.resolution );

	}

	private updateCameraParams( resolution: GLP.Vector ) {

		this.cameraComponent.near = 90;
		this.cameraComponent.far = 200;
		this.cameraComponent.aspect = resolution.x / resolution.y;
		this.cameraComponent.fov = this.baseFov + Math.max( 0, 1 / this.cameraComponent.aspect - 1 ) * 2.0;
		this.cameraComponent.updateProjectionMatrix();

	}

}
