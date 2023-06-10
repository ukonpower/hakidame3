import * as GLP from 'glpower';

import { Camera, CameraParam } from "../Camera";
import { gl } from '~/ts/Globals';
import { ShadowMapCamera } from '../Camera/ShadowMapCamera';

export type LightType = 'directional' | 'spot'

export interface LightParam extends Omit<CameraParam, 'renderTarget'> {
	type: LightType;
	intensity?: number;
	color?: GLP.Vector;
	useShadowMap?: boolean;
	angle?: number;
	blend?: number;
	distance?: number;
	decay?: number;
}

export class Light extends ShadowMapCamera {

	public type: LightType;

	// common

	public color: GLP.Vector;
	public intensity: number;

	// spot

	public angle: number;
	public blend: number;
	public distance: number;
	public decay: number;

	constructor( param: LightParam ) {

		param.far = param.far ?? 100;

		super( { ...param, renderTarget: param.useShadowMap ? new GLP.GLPowerFrameBuffer( gl ).setTexture( [ new GLP.GLPowerTexture( gl ) ] ).setSize( new GLP.Vector( 512, 512 ) ) : null } );

		this.type = param.type;

		this.color = param.color ? param.color.clone() : new GLP.Vector( 1.0, 1.0, 1.0, 0.0 );
		this.intensity = param.intensity ?? 1;

		// spot

		this.angle = param.angle ?? 50;
		this.blend = param.blend ?? 1;
		this.distance = param.distance ?? 30;
		this.decay = param.decay ?? 2;

		this.updateProjectionMatrix();

	}

	public updateProjectionMatrix(): void {

		this.fov = this.angle / Math.PI * 180;

		super.updateProjectionMatrix();

	}

}
