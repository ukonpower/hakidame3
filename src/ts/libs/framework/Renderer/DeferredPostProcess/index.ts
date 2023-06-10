import * as GLP from 'glpower';
import { gl, power } from "~/ts/Globals";
import { PostProcess } from "../../Components/PostProcess";
import { PostProcessPass } from "../../Components/PostProcessPass";
import { RenderCameraTarget } from '../../Components/Camera/RenderCamera';
import deferredShadingFrag from './shaders/deferredShading.fs';
import { ComponentResizeEvent } from '../../Components';

export class DeferredPostProcess extends PostProcess {

	private shading: PostProcessPass;
	public rtDeferredShading: GLP.GLPowerFrameBuffer;

	constructor() {

		// shading

		const rtShading = new GLP.GLPowerFrameBuffer( gl, { disableDepthBuffer: true } );
		rtShading.setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR, generateMipmap: false } ),
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR, generateMipmap: false } )
		] );

		const shading = new PostProcessPass( {
			frag: deferredShadingFrag,
			renderTarget: rtShading,
		} );

		super( { passes: [
			shading,
		] } );

		this.shading = shading;

		this.rtDeferredShading = rtShading;

	}

	protected resizeImpl( e: ComponentResizeEvent ): void {

		this.rtDeferredShading.setSize( e.resolution );

	}

	public setRenderTarget( renderTarget: RenderCameraTarget ) {

		this.shading.input = renderTarget.gBuffer.textures;
		this.shading.renderTarget = renderTarget.deferredBuffer;

	}

}
