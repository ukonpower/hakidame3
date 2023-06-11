import * as GLP from 'glpower';

import { Component, ComponentUpdateEvent } from "..";
import { Entity } from '../../Entity';
import { blidge } from '~/ts/Globals';
import { Light } from '../Light';
import { CubeGeometry } from '../Geometry/CubeGeometry';
import { SphereGeometry } from '../Geometry/SphereGeometry';
import { Material } from '../Material';

export class BLidger extends Component {

	public node: GLP.BLidgeNode;

	private rotationOffsetX: number;

	private curvePosition?: GLP.FCurveGroup;
	private curveRotation?: GLP.FCurveGroup;
	private curveScale?: GLP.FCurveGroup;
	private curveHide?: GLP.FCurveGroup;

	private uniforms: GLP.Uniforms;
	private uniformCurves: {name: string, curve: GLP.FCurveGroup}[];

	constructor( node: GLP.BLidgeNode ) {

		super();

		this.node = node;

		this.rotationOffsetX = 0;

		if ( this.node.type == "camera" ) {

			this.rotationOffsetX = - Math.PI / 2;

		}

		this.curvePosition = blidge.getCurveGroup( node.animation.position );
		this.curveRotation = blidge.getCurveGroup( node.animation.rotation );
		this.curveScale = blidge.getCurveGroup( node.animation.scale );
		this.curveHide = blidge.getCurveGroup( node.animation.hide );

		// uniforms

		this.uniforms = {};
		this.uniformCurves = [];

		const keys = Object.keys( node.material.uniforms );

		for ( let i = 0; i < keys.length; i ++ ) {

			const name = keys[ i ];
			const accessor = node.material.uniforms[ name ];
			const curve = blidge.curveGroups.find( curve => curve.name == accessor );

			if ( curve ) {

				this.uniformCurves.push( {
					name: name,
					curve: curve
				} );

				this.uniforms[ name ] = {
					type: '4fv',
					value: curve.value
				};

			}

		}

	}

	protected setEntityImpl( entity: Entity | null, prevEntity: Entity | null ): void {

		if ( entity ) {

			entity.name = this.node.name;

			// transform

			entity.position.copy( this.node.position );

			entity.quaternion.setFromEuler( {
				x: this.node.rotation.x + this.rotationOffsetX,
				y: this.node.rotation.y,
				z: this.node.rotation.z,
			}, 'YZX' );

			entity.scale.copy( this.node.scale );

			// geometry

			if ( this.node.type == 'cube' ) {

				const cubeParam = this.node.param as any;

				entity.addComponent( 'geometry', new CubeGeometry( cubeParam.x, cubeParam.y, cubeParam.z ) );

			} else if ( this.node.type == 'sphere' ) {

				const sphereParam = this.node.param as any;
				entity.addComponent( 'geometry', new SphereGeometry( sphereParam.r ) );

			}

			// base material

			if ( entity.getComponent( "geometry" ) && ! entity.getComponent( "material" ) ) {

				entity.addComponent( "material", new Material( { type: [ "deferred", "shadowMap" ] } ) );

			}

			// light

			if ( this.node.type == "light" ) {

				const lightParam = this.node.param as GLP.BLidgeLightParam;

				entity.addComponent( 'light', new Light( {
					...lightParam,
					color: new GLP.Vector().copy( lightParam.color ),
					useShadowMap: lightParam.shadowMap,
				} ) );

			}

		}

	}

	protected updateImpl( event: ComponentUpdateEvent ): void {

		const entity = event.entity;
		const frame = blidge.frame.current;

		if ( this.curvePosition ) {

			const position = this.curvePosition.setFrame( frame ).value;

			if ( this.curvePosition.getFCurve( 'x' ) ) {

				entity.position.x = position.x;

			}

			if ( this.curvePosition.getFCurve( 'y' ) ) {

				entity.position.y = position.y;

			}

			if ( this.curvePosition.getFCurve( 'z' ) ) {

				entity.position.z = position.z;

			}

		}

		if ( this.curveRotation ) {

			const rot = {
				x: this.node.rotation.x,
				y: this.node.rotation.y,
				z: this.node.rotation.z,
			};

			const rotValue = this.curveRotation.setFrame( frame ).value;

			if ( this.curveRotation.getFCurve( 'x' ) ) {

				rot.x = rotValue.x;

			}

			if ( this.curveRotation.getFCurve( 'y' ) ) {

				rot.y = rotValue.y;

			}

			if ( this.curveRotation.getFCurve( 'z' ) ) {

				rot.z = rotValue.z;

			}

			entity.quaternion.setFromEuler( {
				x: rot.x + this.rotationOffsetX,
				y: rot.y,
				z: rot.z
			}, 'YZX' );

		}

		if ( this.curveScale ) {

			const scaleValue = this.curveScale.setFrame( frame ).value;

			if ( this.curveScale.getFCurve( 'x' ) ) {

				entity.scale.x = scaleValue.x;

			}

			if ( this.curveScale.getFCurve( 'y' ) ) {

				entity.scale.y = scaleValue.y;

			}

			if ( this.curveScale.getFCurve( 'z' ) ) {

				entity.scale.z = scaleValue.z;

			}

		}

		if ( this.curveHide ) {

			entity.visible = this.curveHide.setFrame( frame ).value.x < 0.5;

		}

		for ( let i = 0; i < this.uniformCurves.length; i ++ ) {

			const curve = this.uniformCurves[ i ];
			this.uniforms[ curve.name ].value = curve.curve.setFrame( frame ).value;

		}

	}

	public onCompleteSyncScene() {
	}

}
