import * as GLP from 'glpower';

import { Entity } from "~/ts/libs/framework/Entity";
import { Content } from '../Entities/Content';
import { DustParticles } from '../Entities/DustParticles';
import { Floor } from '../Entities/Floor';
import { FluidParticles } from '../Entities/FluidParticles';

export const router = ( node: GLP.BLidgeNode ) => {

	if ( node.name == "Content" ) {

		return new Content();

	} else if ( node.name == "DustParticles" ) {

		return new DustParticles();

	} else if ( node.name == "Ring" ) {

		return new FluidParticles();

	} else if ( node.name == "Floor" ) {

		return new Floor();

	}

	return new Entity();

};
