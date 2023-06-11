import * as GLP from 'glpower';
import { Component, ComponentUpdateEvent } from '..';
import { Entity, EntityUpdateEvent } from '../../Entity';
import { Camera } from '../Camera';

export class ShakeViewer extends Component {

	private shakeMatrix: GLP.Matrix;
	private shakeQua: GLP.Quaternion;

	private cameraComponent?: Camera;

	constructor() {

		super();

		this.shakeMatrix = new GLP.Matrix();
		this.shakeQua = new GLP.Quaternion();

	}

	protected setEntityImpl( entity: Entity | null ): void {

		this.emit( "setEntity" );

		const onUpdate = this.calcMatrix.bind( this );

		if ( entity ) {

			entity.on( 'notice/sceneTick', onUpdate );
			this.cameraComponent = entity.getComponent( 'camera' );

		} else {

			this.cameraComponent = undefined;

		}

		this.once( "setEntity", () => {

			if ( entity ) {

				entity.off( 'notice/sceneTick', onUpdate );

			}

		} );


	}

	private calcMatrix( event: EntityUpdateEvent ) {


		if ( this.entity ) {

			let shake = 0.008;

			if ( this.cameraComponent ) {

				shake *= this.cameraComponent.fov / 50.0;

			}

			this.shakeQua.setFromEuler( { x: Math.sin( event.time * 2.0 ) * shake, y: Math.sin( event.time * 2.5 ) * shake, z: 0 } );

			this.shakeMatrix.identity().applyQuaternion( this.shakeQua );


			this.entity.matrixWorld.multiply( this.shakeMatrix );

			const camera = this.entity.getComponent<Camera>( 'camera' );

			if ( camera ) {

				camera.viewMatrix.copy( this.entity.matrixWorld ).inverse();

			}

		}

	}


}
