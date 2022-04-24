define(['jquery', 'turf', 'leaflet', 'maps.core', 'jquery-ui', '@js/core'], ($, Turf, L, Maps) => {

	function GeoJSONLayer (tile, name = '', features = {}, styles = {}) {
		Object.Extensions.EventEmitter(this)

		this.e = $(`<div class="Overlay SVG">`)

		this.Define('name', {
			get: () => {
				return name
			},
			set: (v) => {
				name = v
				this.emit('name-change', v)
			}
		})

		this.Define('featureCollection', {
			get: () => {
				return features
			},
			set: (v) => {
				features = Maps.GeoJSON.FeatureCollection(typeof v === 'string' ? JSON.parse(v) : v)
				this.emit('features-change')
			}
		})

		this.on('features-change', event => {
			this.e.children().each((index, child) => {child.remove()})

			let svg = this.featureCollection.ToSvg(tile.bounds)
			log(svg)
			this.e.append($(svg))
		})

		//this.style = style

		return this
	}

	function SVGLayer (tile, name = '', svg) {
		Object.Extensions.EventEmitter(this)

		this.e = $(svg)

		this.Define('name', {
			get: () => {
				return name
			},
			set: (v) => {
				name = v
				this.emit('name-change', v)
			}
		})


		return this
	}



	return {GeoJSON: GeoJSONLayer, Svg: SVGLayer}

})

