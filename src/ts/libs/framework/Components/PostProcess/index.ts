import * as GLP from 'glpower';

import { Component } from '..';
import { PostProcessPass } from '../PostProcessPass';

export interface PostProcessParam {
	input?: GLP.GLPowerTexture[];
	passes: PostProcessPass[];
}

export class PostProcess extends Component {

	public passes: PostProcessPass[];

	constructor( param: PostProcessParam ) {

		super();

		this.passes = param.passes;

	}

}
