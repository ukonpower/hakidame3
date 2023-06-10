import * as GLP from 'glpower';

import { Camera, CameraParam } from '..';

export type RenderCameraTarget = {
	gBuffer: GLP.GLPowerFrameBuffer,
	deferredBuffer: GLP.GLPowerFrameBuffer,
	forwardBuffer: GLP.GLPowerFrameBuffer,
}

export interface RenderCameraParam extends CameraParam {
	renderTarget:RenderCameraTarget
}

export class RenderCamera extends Camera {

	public renderTarget: RenderCameraTarget;

	constructor( param: RenderCameraParam ) {

		super( param );

		this.renderTarget = param.renderTarget;

	}

}
