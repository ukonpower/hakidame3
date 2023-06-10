import * as GLP from 'glpower';

import { Component, ComponentUpdateEvent } from '..';
import { Entity } from '../../Entity';
import { Camera } from '../Camera';

export class LookAt extends Component {

	private target: Entity | null;

	private up: GLP.Vector;
	private entityWorldPos: GLP.Vector;
	private targetWorldPos: GLP.Vector;

	constructor() {

		super();

		this.target = null;
		this.entityWorldPos = new GLP.Vector();
		this.targetWorldPos = new GLP.Vector();
		this.up = new GLP.Vector( 0.0, 1.0, 0.0 );

	}

 	public setTarget( target: Entity | null ) {

		this.target = target;

	}

	protected setEntityImpl( entity: Entity | null ): void {

		this.emit( "setEntity" );

		const onUpdate = this.calcMatrix.bind( this );

		if ( entity ) {

			entity.on( 'notice/sceneUpdated', onUpdate );

		}

		this.once( "setEntity", () => {

			if ( entity ) {

				entity.off( 'notice/sceneUpdated', onUpdate );

			}

		} );

	}

	private calcMatrix() {

		if ( this.entity && this.target ) {

			this.entity.matrixWorld.decompose( this.entityWorldPos );
			this.target.matrix.decompose( this.targetWorldPos );

			this.entity.matrixWorld.lookAt( this.entityWorldPos, this.targetWorldPos, this.up );

			const camera = this.entity.getComponent<Camera>( 'camera' );

			if ( camera ) {

				camera.viewMatrix.copy( this.entity.matrixWorld ).inverse();

			}

		}

	}

}
