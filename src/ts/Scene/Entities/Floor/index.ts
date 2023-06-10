import * as GLP from 'glpower';

import { Material } from '~/ts/libs/framework/Components/Material';
import { Entity } from '~/ts/libs/framework/Entity';
import { hotGet, hotUpdate } from '~/ts/libs/framework/Utils/Hot';
import floorFrag from './shaders/floor.fs';
import { globalUniforms } from '~/ts/Globals';

export class Floor extends Entity {

	constructor() {

		super();

		const mat = this.addComponent( "material", new Material( {
			name: "floor",
			type: [ "deferred", "shadowMap" ],
			uniforms: GLP.UniformsUtils.merge( globalUniforms.time ),
			frag: hotGet( 'floorFrag', floorFrag )
		} ) );

		if ( import.meta.hot ) {

			import.meta.hot.accept( "./shaders/floor.fs", ( module ) => {

				if ( module ) {

					mat.frag = hotUpdate( 'floor', module.default );
					mat.requestUpdate();

				}

			} );

		}

	}

}
