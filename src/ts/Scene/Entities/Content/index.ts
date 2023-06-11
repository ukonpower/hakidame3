import * as GLP from 'glpower';

import { Material } from '~/ts/libs/framework/Components/Material';
import { Entity } from '~/ts/libs/framework/Entity';
import { hotGet, hotUpdate } from '~/ts/libs/framework/Utils/Hot';
import contentFrag from './shaders/content.fs';
import { globalUniforms } from '~/ts/Globals';

export class Content extends Entity {

	constructor() {

		super();

		const mat = this.addComponent( "material", new Material( {
			name: "content",
			type: [ "deferred", "shadowMap" ],
			uniforms: GLP.UniformsUtils.merge( globalUniforms.time, globalUniforms.resolution ),
			frag: hotGet( 'contentFrag', contentFrag )
		} ) );

		if ( import.meta.hot ) {

			import.meta.hot.accept( "./shaders/content.fs", ( module ) => {

				if ( module ) {

					mat.frag = hotUpdate( 'content', module.default );
					mat.requestUpdate();

				}

			} );

		}

	}

}
