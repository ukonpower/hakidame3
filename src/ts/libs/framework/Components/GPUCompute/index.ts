import * as GLP from 'glpower';

import { Component } from '..';
import { GPUComputePass } from '../GPUComputePass';

export interface GPUComputeParam {
	input?: GLP.GLPowerTexture[];
	passes: GPUComputePass[];
}

export class GPUCompute extends Component {

	public passes: GPUComputePass[];

	constructor( param: GPUComputeParam ) {

		super();

		this.passes = param.passes;

	}

}
