import * as GLP from 'glpower';

import { Camera, CameraParam } from '..';
import { ComponentUpdateEvent } from '../..';

export interface ShadowMapCameraParam extends CameraParam {
	renderTarget: GLP.GLPowerFrameBuffer | null,
}

export class ShadowMapCamera extends Camera {

	public renderTarget: GLP.GLPowerFrameBuffer | null;
	private viewMatrixOffset: GLP.Quaternion;

	constructor( param: ShadowMapCameraParam ) {

		super( param );

		this.renderTarget = param.renderTarget;
		this.viewMatrixOffset = new GLP.Quaternion().setFromEuler( { x: - Math.PI / 2, y: 0, z: 0 } );

	}

	protected updateImpl( event: ComponentUpdateEvent ): void {

		this.viewMatrix.copy( event.entity.matrixWorld ).applyQuaternion( this.viewMatrixOffset ).inverse();

	}

}
