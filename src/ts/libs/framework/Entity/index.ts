import * as GLP from 'glpower';
import { Material } from '../Components/Material';
import { BuiltInComponents, Component, ComponentResizeEvent, ComponentUpdateEvent } from '../Components';
import { Light } from '../Components/Light';
import { RenderStack } from '../Renderer';
import { Camera } from '../Components/Camera';
import { Geometry } from '../Components/Geometry';
import { GPUCompute } from '../Components/GPUCompute';

export type EntityUpdateEvent = {
	time: number,
	deltaTime: number,
	matrix?: GLP.Matrix,
	renderStack?: RenderStack;
}

export type EntityResizeEvent = {
	resolution: GLP.Vector
}

export class Entity extends GLP.EventEmitter {

	public name: string;
	public uuid: number;

	public position: GLP.Vector;
	public quaternion: GLP.Quaternion;
	public scale: GLP.Vector;

	public matrix: GLP.Matrix;
	public matrixWorld: GLP.Matrix;

	public parent: Entity | null;
	public children: Entity[];
	public components: Map<string, Component>;

	public visible: boolean;

	public userData: any;

	constructor() {

		super();

		this.name = "";
		this.uuid = new Date().getTime() + Math.floor( Math.random() * 1000000 );

		this.position = new GLP.Vector();
		this.quaternion = new GLP.Quaternion( 0.0, 0.0, 0.0, 1.0 );
		this.scale = new GLP.Vector( 1.0, 1.0, 1.0 );

		this.matrix = new GLP.Matrix();
		this.matrixWorld = new GLP.Matrix();

		this.parent = null;
		this.children = [];

		this.components = new Map();

		this.visible = true;

		this.userData = {};

	}

	/*-------------------------------
		Update
	-------------------------------*/

	public update( event: EntityUpdateEvent ) {

		if ( ! event.renderStack ) event.renderStack = {
			camera: [],
			light: [],
			deferred: [],
			forward: [],
			shadowMap: [],
			envMap: [],
			gpuCompute: [],
		};

		if ( ! this.visible ) return event.renderStack;

		const geometry = this.getComponent<Geometry>( 'geometry' );
		const material = this.getComponent<Material>( 'material' );

		if ( geometry && material ) {

			if ( material.visibilityFlag.deferred ) event.renderStack.deferred.push( this );
			if ( material.visibilityFlag.shadowMap ) event.renderStack.shadowMap.push( this );
			if ( material.visibilityFlag.forward ) event.renderStack.forward.push( this );
			if ( material.visibilityFlag.envMap ) event.renderStack.envMap.push( this );

		}

		const camera = this.getComponent<Camera>( 'camera' );

		if ( camera ) {

			event.renderStack.camera.push( this );

		}

		const light = this.getComponent<Light>( 'light' );

		if ( light ) {

			event.renderStack.light.push( this );

		}

		const gpuCompute = this.getComponent<GPUCompute>( "gpuCompute" );

		if ( gpuCompute ) {

			event.renderStack.gpuCompute.push( this );

		}

		// matrix

		if ( ! event.matrix ) event.matrix = new GLP.Matrix();

		this.matrix.setFromTransform( this.position, this.quaternion, this.scale );

		this.matrixWorld.copy( this.matrix ).preMultiply( event.matrix );

		// components

		const childEvent = { ...event } as ComponentUpdateEvent;
		childEvent.entity = this;
		childEvent.matrix = this.matrixWorld;

		this.components.forEach( c => {

			c.update( childEvent );

		} );

		this.updateImpl( event );

		this.emit( "update", [ event ] );

		// children

		for ( let i = 0; i < this.children.length; i ++ ) {

			this.children[ i ].update( childEvent );

		}

		return event.renderStack;

	}

	protected updateImpl( event:EntityUpdateEvent ) {
	}

	/*-------------------------------
		Resize
	-------------------------------*/

	public resize( event: EntityResizeEvent ) {

		this.components.forEach( c => {

			const cEvent = event as ComponentResizeEvent;
			cEvent.entity = this;

			c.resize( cEvent );

		} );

		this.resizeImpl( event );

		this.emit( "resize", [ event ] );

		for ( let i = 0; i < this.children.length; i ++ ) {

			this.children[ i ].resize( event );

		}

	}

	protected resizeImpl( event:EntityResizeEvent ) {
	}

	/*-------------------------------
		SceneGraph
	-------------------------------*/

	public add( entity: Entity ) {

		if ( entity.parent ) {

			entity.parent.remove( entity );

		}

		entity.parent = this;

		this.children.push( entity );

	}

	public remove( entity: Entity ) {

		this.children = this.children.filter( c => c.uuid != entity.uuid );

	}

	/*-------------------------------
		Components
	-------------------------------*/

	public addComponent<T extends Component>( name: BuiltInComponents, component: T ) {

		const prevComponent = this.components.get( name );

		if ( prevComponent ) {

			prevComponent.setEntity( null );

		}

		component.setEntity( this );

		this.components.set( name, component );

		return component;

	}

	public getComponent<T extends Component>( name: BuiltInComponents ): T | undefined {

		return this.components.get( name ) as T;

	}

	public removeComponent( name: string ) {

		const component = this.components.get( name );

		this.components.delete( name );

		return component;

	}

	/*-------------------------------
		API
	-------------------------------*/

	public getEntityByName( name: string ) : Entity | undefined {

		if ( this.name == name ) {

			return this;

		}

		for ( let i = 0; i < this.children.length; i ++ ) {

			const c = this.children[ i ];

			const entity = c.getEntityByName( name );

			if ( entity ) {

				return entity;

			}

		}

		return undefined;

	}

	/*-------------------------------
		Event
	-------------------------------*/

	public notice( eventName: string, opt?: any ) {

		this.emit( "notice/" + eventName, [ opt ] );


	}

	public noticeRecursive( eventName: string, opt?: any ) {

		this.notice( eventName, opt );

		for ( let i = 0; i < this.children.length; i ++ ) {

			const c = this.children[ i ];

			c.noticeRecursive( eventName, opt );

		}

	}

	/*-------------------------------
		Dispose
	-------------------------------*/

	public dispose() {

		this.emit( "dispose" );

		this.parent && this.parent.remove( this );

		this.children.forEach( c => c.parent = null );

		this.components.forEach( c => c.setEntity( null ) );

	}

}
