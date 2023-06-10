import * as GLP from 'glpower';

import { Component } from "..";

export type GeometryParam = {
}

type Attribute = {
	array: GLP.TArrayBuffer;
	size: number;
	buffer?: GLP.GLPowerBuffer
	opt?: GLP.AttributeOptions,
}

type DefaultAttributeName = 'position' | 'uv' | 'normal' | 'index';

export class Geometry extends Component {

	public count: number;
	public attributes: Map<string, Attribute >;
	public needsUpdate: Map<GLP.GLPowerVAO, boolean>;

	constructor() {

		super();

		this.count = 0;
		this.attributes = new Map();
		this.needsUpdate = new Map();

	}

	public setAttribute( name: DefaultAttributeName | ( string & {} ), array: GLP.TArrayBuffer, size: number, opt?: GLP.AttributeOptions ) {

		this.attributes.set( name, {
			array,
			size,
			opt,
		} );

		this.updateVertCount();

		return this;

	}

	public getAttribute( name: DefaultAttributeName | ( string & {} ) ) {

		return this.attributes.get( name );

	}

	private updateVertCount() {

		const keys = Object.keys( this.attributes );

		this.count = keys.length > 0 ? Infinity : 0;

		this.attributes.forEach( ( attribute, name ) => {

			if ( name != 'index' ) {

				this.count = Math.min( attribute.array.length / attribute.size, this.count );

			}

		} );

	}

	public createBuffer( power: GLP.Power ) {

		this.attributes.forEach( ( attr, key ) => {

			attr.buffer = power.createBuffer().setData( attr.array, key == 'index' ? "ibo" : 'vbo' );

		} );

	}

}
