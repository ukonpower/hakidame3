import * as GLP from 'glpower';

import { Entity } from "~/ts/libs/framework/Entity";
import { Content } from '../Entities/Content';
import { TraficLines } from '../Entities/TraficLines';

export const router = ( node: GLP.BLidgeNode ) => {

	if ( node.name == "Content" ) {

		return new Content();

	} else if ( node.material.name == "TraficLines" ) {

		return new TraficLines();

	}

	return new Entity();

};
