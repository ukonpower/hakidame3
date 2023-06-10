import * as GLP from 'glpower';
import { blidge } from '~/ts/Globals';
import { Entity } from '~/ts/libs/framework/Entity';
import { BLidger } from '~/ts/libs/framework/Components/BLidger';
import { RenderCamera } from '~/ts/libs/framework/Components/Camera/RenderCamera';

import SceneData from './scene/scene.json';
import { router } from './router';

export class Carpenter extends GLP.EventEmitter {

	private root: Entity;
	private blidgeRoot: Entity | null;
	private camera: Entity;
	private entities: Map<string, Entity>;

	// frame

	private playing: boolean;
	private playTime: number;

	constructor( root: Entity, camera: Entity ) {

		super();

		this.root = root;
		this.camera = camera;
		this.entities = new Map();

		// state

		this.playing = false;
		this.playTime = 0;

		// blidge

		this.blidgeRoot = null;

		blidge.on( 'sync/scene', this.onSyncScene.bind( this ) );

		blidge.on( 'sync/timeline', ( frame: GLP.BLidgeFrame ) => {
		} );

		if ( process.env.NODE_ENV == "development" ) {

			blidge.connect( 'ws://localhost:3100' );

			blidge.on( 'error', () => {

				blidge.loadScene( SceneData as any );

			} );

		} else {

			blidge.loadScene( SceneData as any );

		}

	}

	private onSyncScene( blidge: GLP.BLidge ) {

		const timeStamp = new Date().getTime();

		const _ = ( node: GLP.BLidgeNode ): Entity => {

			const entity: Entity = node.type == 'camera' ? this.camera : ( this.entities.get( node.name ) || router( node ) );

			if ( node.type == 'camera' ) {

				const cameraParam = node.param as GLP.BLidgeCameraParam;
				const renderCamera = this.camera.getComponent<RenderCamera>( "camera" )!;
				renderCamera.fov = cameraParam.fov;
				renderCamera.updateProjectionMatrix();

			}

			entity.addComponent( "blidger", new BLidger( node ) );

			node.children.forEach( c => {

				const child = _( c );

				entity.add( child );

			} );

			this.entities.set( entity.name, entity );

			entity.userData.updateTime = timeStamp;

			return entity;

		};

		const newBLidgeRoot = blidge.root && _( blidge.root );

		if ( newBLidgeRoot ) {

			if ( this.blidgeRoot ) {

				this.root.remove( this.blidgeRoot );

			}

			this.blidgeRoot = newBLidgeRoot;

			this.root.add( this.blidgeRoot );

		}

		// remove

		this.entities.forEach( item => {

			if ( item.userData.updateTime != timeStamp ) {

				const parent = item.parent;

				if ( parent ) {

					parent.remove( item );

				}

				item.dispose();
				this.entities.delete( item.name );

			}

		} );

		// blidger

		if ( this.blidgeRoot ) {

			this.blidgeRoot.noticeRecursive( "sceneCreated", this.blidgeRoot );

		}

	}

}
