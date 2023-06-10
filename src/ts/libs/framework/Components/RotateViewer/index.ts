import * as GLP from 'glpower';
import { Component, ComponentUpdateEvent } from '..';

export class RotateViewer extends Component {

	public target: GLP.Vector;
	public rotBasePos: GLP.Vector;
	public rotSpeed: number;

	private quaternion: GLP.Quaternion;
	private matrix: GLP.Matrix;

	constructor() {

		super();

		this.target = new GLP.Vector( 0, 0, 0, 0 );
		this.rotBasePos = new GLP.Vector( 0.0, 5.0, 20.0 );
		this.rotSpeed = 1.0;

		this.quaternion = new GLP.Quaternion();
		this.matrix = new GLP.Matrix();

	}

	protected updateImpl( event: ComponentUpdateEvent ): void {

		const entity = event.entity;

		this.quaternion.setFromEuler( { x: 0, y: event.deltaTime / Math.PI * this.rotSpeed, z: 0 } );
		this.matrix.identity().applyQuaternion( this.quaternion );

		this.rotBasePos.applyMatrix3( this.matrix );

		entity.position.copy( this.target );
		entity.position.add( this.rotBasePos );

	}


}
