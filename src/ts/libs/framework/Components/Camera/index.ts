import * as GLP from 'glpower';

import { Component, ComponentResizeEvent, ComponentUpdateEvent } from "..";

export interface CameraParam {
	fov?: number;
	near?: number;
	far?: number;
}

export class Camera extends Component {

	public projectionMatrix: GLP.Matrix;
	public viewMatrix: GLP.Matrix;
	// public renderTarget: CameraRenderTarget;

	public fov: number;
	public aspect: number;
	public near: number;
	public far: number;

	constructor( param: CameraParam ) {

		super();

		param = param || {};

		this.viewMatrix = new GLP.Matrix();
		this.projectionMatrix = new GLP.Matrix();

		// this.renderTarget = param.renderTarget;

		this.fov = param.fov || 50;
		this.near = param.near || 0.01;
		this.far = param.far || 1000;
		this.aspect = 1.0;

		this.updateProjectionMatrix();

	}

	public updateProjectionMatrix() {

		this.projectionMatrix.perspective( this.fov, this.aspect, this.near, this.far );

	}

	protected updateImpl( event: ComponentUpdateEvent ): void {

		this.viewMatrix.copy( event.entity.matrixWorld ).inverse();

	}

}
