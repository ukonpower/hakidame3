import * as GLP from 'glpower';

import { Entity } from "~/ts/libs/framework/Entity";
import { Content } from '../Entities/Content';
import { TraficLines } from '../Entities/TraficLines';
import { Rings } from '../Entities/Rings';

export const router = ( node: GLP.BLidgeNode ) => {

	// object

	if ( node.name == "Content" ) {

		return new Content();

	} else if ( node.name == "Rings" ) {

		return new Rings();

	}

	// material

	if ( node.material.name == "TraficLines" ) {

		return new TraficLines();

	}

	return new Entity();

};
