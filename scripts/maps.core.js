(function (factory) {
	if (typeof define === 'function' && define.amd) {
		define(['turf', '@js/core'], (Turf) => {
			return factory(Turf, null, null)
		})
	} else if (typeof module === 'object' && module.exports) {
		require('@tyler.thayn/js.core')
		module.exports = factory(require('@turf/turf'), require('https'), require('geojson-stream'))
	} else {
		fetch('https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js').then(res=>res.text()).then(eval).finally(() => {
			fetch('https://cdn.jsdelivr.net/npm/@tyler.thayn/js.core@0.6.2/dist/core.js').then(res=>res.text()).then(eval).finally(() => {
				window.Maps = factory(turf, null, null)
			})
		})
	}
}(function (Turf, https, geojsonStream) {

	/* https://github.com/datalyze-solutions/globalmaptiles */
	let GlobalMercator = new ((function () {const pi_div_360=Math.PI/360;const pi_div_180=Math.PI/180;const pi_div_2=Math.PI/2;const pi_4=4*Math.PI;const pi_2=2*Math.PI;const pi=Math.PI;const _180_div_pi=180/Math.PI;class GlobalMercator{constructor(){this.tileSize=256;this.initialResolution=6378137*pi_2/this.tileSize;this.originShift=6378137*pi_2/2}LatLonToMeters(lat,lon){let mx=lon*this.originShift/180;let my=Math.log(Math.tan((90+lat)*pi_div_360))/pi_div_180;return{mx:mx,my:my=my*this.originShift/180}}MetersToLatLon(mx,my){let lon=mx/this.originShift*180;let lat=my/this.originShift*180;return{lat:lat=_180_div_pi*(2*Math.atan(Math.exp(lat*pi_div_180))-pi_div_2),lon:lon}}MetersToPixels(mx,my,zoom){var res=this.Resolution(zoom);return{px:(mx+this.originShift)/res,py:(my+this.originShift)/res}}Resolution(zoom){return this.initialResolution/Math.pow(2,zoom)}TileBounds(tx,ty,zoom){let minx,miny,maxx,maxy;return{minx:minx=this.PixelsToMeters(tx*this.tileSize,ty*this.tileSize,zoom).mx,miny:miny=this.PixelsToMeters(tx*this.tileSize,ty*this.tileSize,zoom).my,maxx:maxx=this.PixelsToMeters((tx+1)*this.tileSize,(ty+1)*this.tileSize,zoom).mx,maxy:maxy=this.PixelsToMeters((tx+1)*this.tileSize,(ty+1)*this.tileSize,zoom).my}}PixelsToMeters(px,py,zoom){var res;return{mx:px*(res=this.Resolution(zoom))-this.originShift,my:py*res-this.originShift}}PixelsToTile(px,py){return{tx:Math.round(Math.ceil(px/this.tileSize)-1),ty:Math.round(Math.ceil(py/this.tileSize)-1)}}PixelsToRaster(px,py,zoom){return{x:px,y:(this.tileSize<<zoom)-py}}LatLonToTile(lat,lon,zoom){var meters=this.LatLonToMeters(lat,lon);var pixels=this.MetersToPixels(meters.mx,meters.my,zoom);return this.PixelsToTile(pixels.px,pixels.py)}MetersToTile(mx,my,zoom){var pixels=this.MetersToPixels(mx,my,zoom);return this.PixelsToTile(pixels.px,pixels.py)}GoogleTile(tx,ty,zoom){return{tx:tx,ty:Math.pow(2,zoom)-1-ty}}QuadKey(tx,ty,zoom){let quadKey='';ty=2**zoom-1-ty;for(let i=zoom;i>0;i--){let digit=0;let mask=1<<i-1;0!=(tx&mask)&&(digit+=1);0!=(ty&mask)&&(digit+=2);quadKey+=digit.toString()}return quadKey}QuadKeyToTile(quadKey){let tx=0;let ty=0;let zoom=quadKey.length;for(let i=0;i<zoom;i++){let bit=zoom-i;let mask=1<<bit-1;'1'===quadKey[zoom-bit]&&(tx|=mask);'2'==quadKey[zoom-bit]&&(ty|=mask);if('3'==quadKey[zoom-bit]){tx|=mask;ty|=mask}}return{tx:tx,ty:ty=2**zoom-1-ty,zoom:zoom}}};return GlobalMercator})())()


	/**
	* Creates an Range.
	* @class {array} Range
	* @param {number} min
	* @param {number} max
	* @returns {Range}
	*/
	function Range (min, max) {
		let range = [ min < max ? min : max, min < max ? max : min ]

		/** @member {number} Range#min */
		Object.defineProperty(range, 'min', {enumerable: true, get: () => {return range[0]}})

		/** @member {number} Range#max */
		Object.defineProperty(range, 'max', {enumerable: true, get: () => {return range[1]}})

		/** @member {number} Range#center */
		Object.defineProperty(range, 'center', {enumerable: true, get: () => {return (range[1] - range[0]) / 2 + range[0]}})

		/** @member {number} Range#span */
		Object.defineProperty(range, 'span', {enumerable: true, get: () => {return Math.abs(Math.abs(range[1]) - Math.abs(range[0]))}})

		return range
	}


	/**
	* Creates an (x,y,z) Point.
	* @exports Point
	* @class {Array.number} Point
	* @param {number} x
	* @param {number} y
	* @param {number} [z]
	* @returns {Point}
	*/
	function Point (x, y, z = 0) {
		let point = [x, y, z]

		/** @member {number} Point#x */
		Object.defineProperty(point, 'x', {get: () => {return point[0]}, enumerable: true})

		/** @member {number} Point#y */
		Object.defineProperty(point, 'y', {get: () => {return point[1]}, enumerable: true})

		/** @member {Number} Point#z */
		Object.defineProperty(point, 'z', {get: () => {return point[2]}, enumerable: true})

		/**
		* @function ToCoordinate
		* @memberof Point
		* @instance
		* @returns {Coordinate}
		*/
		Object.defineProperty(point, 'ToCoordinate', {enumerable: true, value: function () {
			let coordinate = GlobalMercator.MetersToLatLon(this.x, this.y)
			return new Coordinate(coordinate.lon, coordinate.lat, this.z)
		}})

		return point
	}


	/**
	* Creates an (lon, lat, ele) Coordinate.
	* @exports Coordinate
	* @class {Array.number} Coordinate
	* @param {number} lon
	* @param {number} lat
	* @param {number} [ele=0]
	* @returns {Coordinate}
	*/
	function Coordinate (lon, lat, ele = 0) {
		let coordinate = [lon, lat, ele]

		/** @member {number} Coordinate#lon */
		Object.defineProperty(coordinate, 'lon', {get: () => {return coordinate[0]}, enumerable: true})

		/** @member {number} Coordinate#lat */
		Object.defineProperty(coordinate, 'lat', {get: () => {return coordinate[1]}, enumerable: true})

		/** @member {number} Coordinate#ele */
		Object.defineProperty(coordinate, 'ele', {get: () => {return coordinate[2]}, enumerable: true})

		/** @function ToPoint
		* @memberof Coordinate
		* @instance
		* @returns {Point} */
		Object.defineProperty(coordinate, 'ToPoint', {enumerable: true, value: function () {
			let point = GlobalMercator.LatLonToMeters(this.lat, this.lon)
			return new Point(point.mx, point.my, this.ele)
		}})

		return coordinate
	}

	/**
	* @function LonLat
	* @memberof Coordinate
	* @param {number} lon
	* @param {number} lat
	* @param {number} [ele=0]
	* @returns {Coordinate}
	* @static */
	Object.defineProperty(Coordinate, 'LonLat', {enumerable: true, value: Coordinate})

	/**
	* @function LatLon
	* @memberof Coordinate
	* @param {number} lat
	* @param {number} lon
	* @param {number} [ele=0]
	* @returns {Coordinate}
	* @static */
	Object.defineProperty(Coordinate, 'LatLon', {enumerable: true, value: (lat, lon, ele) => {
		return new Coordinate(lon, lat, ele)
	}})


	/**
	* @class CoordinateBounds
	* @alias Bounds.Coordinate
	* @param {Number|Coordinate} minlon - Min Coordinate or min lon value
	* @param {Number|Coordinate} minlat - Max Coordinate or min lat value
	* @param {Number} [maxlon] - max lon value
	* @param {Number} [maxlat] - max lat value
	* @returns {CoordinateBounds}
	*/
	function CoordinateBounds (minlon, minlat, maxlon, maxlat) {
		let bounds = []
		if (minlon instanceof Coordinate && minlat instanceof Coordinate) {
			bounds = [
				Math.min(minlon.lon, minlat.lon),
				Math.min(minlon.lat, minlat.lat),
				Math.max(minlon.lon, minlat.lon),
				Math.max(minlon.lat, minlat.lat)
			]
		} else {
			bounds = [
				Math.min(minlon, maxlon),
				Math.min(minlat, maxlat),
				Math.max(minlon, maxlon),
				Math.max(minlat, maxlat)
			]
		}

		/** @member {Number} CoordinateBounds#minlon */
		Object.defineProperty(bounds, 'minlon', {enummerable: true, get: () => {return bounds[0]}})

		/** @member {Number} CoordinateBounds#minlat */
		Object.defineProperty(bounds, 'minlat', {enummerable: true, get: () => {return bounds[1]}})

		/** @member {Number} CoordinateBounds#maxlon */
		Object.defineProperty(bounds, 'maxlon', {enummerable: true, get: () => {return bounds[2]}})

		/** @member {Number} CoordinateBounds#maxlat */
		Object.defineProperty(bounds, 'maxlat', {enummerable: true, get: () => {return bounds[3]}})

		/** @member {Coordinate} CoordinateBounds#min */
		Object.defineProperty(bounds, 'min', {enumerable: true, get: () => {return new Coordinate(bounds.minlon, bounds.minlat)}})

		/** @member {Coordinate} CoordinateBounds#max */
		Object.defineProperty(bounds, 'max', {enumerable: true, get: () => {return new Coordinate(bounds.maxlon, bounds.maxlat)}})

		/** @member {Range} CoordinateBounds#lon */
		Object.defineProperty(bounds, 'lon', {enumerable: true, get: () => {return new Range(bounds.minlon, bounds.maxlon)}})

		/** @member {Range} CoordinateBounds#lat */
		Object.defineProperty(bounds, 'lat', {enumerable: true, get: () => {return new Range(bounds.minlat, bounds.maxlat)}})

		/** @member {Coordinate} CoordinateBounds#center */
		Object.defineProperty(bounds, 'center', {enumerable: true, get: () => {
			return new Coordinate(bounds.lon.center, bounds.lat.center)
		}})

		Object.defineProperty(bounds, 'polyString', {enumerable: true, get: () => {
			let poly = [
				bounds.min.lat.toFixed(5),
				bounds.min.lon.toFixed(5),

				bounds.min.lat.toFixed(5),
				bounds.max.lon.toFixed(5),

				bounds.max.lat.toFixed(5),
				bounds.max.lon.toFixed(5),

				bounds.max.lat.toFixed(5),
				bounds.min.lon.toFixed(5)
			]
			return poly.join(' ')
		}})

		/**
		* @function Position
		* @memberof CoordinateBounds
		* @param {Coordinate|Coordinate[]} coordinate
		* @returns {Coordinate|Coordinate[]}
		*/
		Object.defineProperty(bounds, 'Position', {enumerable: true, value: function (coordinate) {
			if (Array.isArray(coordinate) && Array.isArray(coordinate[0])) {
				let positions = []
				coordinate.forEach(c => {
					positions.push(bounds.position(c))
				})
				return positions
			}

			if (Reflect.has(coordinate, 'lon') && Reflect.has(coordinate, 'lat')) {
				return new Coordinate(
					(coordinate.lon - bounds.minlon) / (bounds.maxlon - bounds.minlon),
					(coordinate.lat - bounds.minlat) / (bounds.maxlat - bounds.minlat)
				)
			}
			if (Array.isArray(coordinate)) {
				return new Coordinate(
					(coordinate[0] - bounds.minlon) / (bounds.maxlon - bounds.minlon),
					(coordinate[1] - bounds.minlat) / (bounds.maxlat - bounds.minlat)
				)
			}
		}})

		Object.defineProperty(bounds, 'AsPolygon', {get: () => {
			return new Turf.polygon([[
				[bounds.min.lat.toFixed(5), bounds.min.lon.toFixed(5)],
				[bounds.min.lat.toFixed(5), bounds.max.lon.toFixed(5)],
				[bounds.max.lat.toFixed(5), bounds.max.lon.toFixed(5)],
				[bounds.max.lat.toFixed(5), bounds.min.lon.toFixed(5)],
				[bounds.min.lat.toFixed(5), bounds.min.lon.toFixed(5)]
			]])
		}})

		Object.defineProperty(bounds, 'Clip', {value: (feature) => {
			if (feature.type == 'FeatureCollection') {
				let clipped = {type: 'FeatureCollection', features: []}
				feature.features.forEach(f => {
					if (Turf.getType(f) == 'Point') {
						if (Turf.booleanPointInPolygon(f, bounds.AsPolygon)) {
							clipped.features.push(f)
						}
					} else {
						let c = Turf.bboxClip(f, bounds)
						if (Turf.getCoords(c).length > 0) {
							clipped.features.push(c)
						}
					}
				})
				return clipped
			} else {
				return Turf.bboxClip(feature, bounds)
			}
		}})

		Object.defineProperty(bounds, 'Tiles', {value: (zoom = 13) => {
			let tiles = []
			let min = new Tile(bounds.min, zoom)
			let max = new Tile(bounds.max, zoom)

			for (var y = max.slippy[2]; y<= min.slippy[2]; y++) {
				let row = []
				for (var x = min.slippy[1]; x<= max.slippy[1]; x++) {
					row.push(new Tile(zoom, x, y))
				}
				tiles.push(row)
			}
			return tiles
		}})


		return bounds
	}



	/**
	* @class PointBounds
	* @param {Number|Point} minx - Min Point or min x value
	* @param {Number|Point} miny - Max Point or min y value
	* @param {Number} [maxx] - max x value
	* @param {Number} [maxy] - max y value
	*/
	function PointBounds (minx, miny, maxx, maxy) {
		let bounds = []
		if (minx instanceof Point && miny instanceof Point) {
			bounds = [
				Math.min(minx.x, miny.x),
				Math.min(minx.y, miny.y),
				Math.max(minx.x, miny.x),
				Math.max(minx.y, miny.y)
			]
		} else {
			bounds = [
				Math.min(minx, maxx),
				Math.min(miny, maxy),
				Math.max(minx, maxx),
				Math.max(miny, maxy)
			]
		}

		/** @member {Number} PointBounds#minx */
		Object.defineProperty(bounds, 'minx', {enummerable: true, get: () => {return bounds[0]}})

		/** @member {Number} PointBounds#miny */
		Object.defineProperty(bounds, 'miny', {enummerable: true, get: () => {return bounds[1]}})

		/** @member {Number} PointBounds#maxx */
		Object.defineProperty(bounds, 'maxx', {enummerable: true, get: () => {return bounds[2]}})

		/** @member {Number} PointBounds#maxy */
		Object.defineProperty(bounds, 'maxy', {enummerable: true, get: () => {return bounds[3]}})

		/** @member {Point} PointBounds#min */
		Object.defineProperty(bounds, 'min', {enumerable: true, get: () => {return new Point(bounds.minx, bounds.miny)}})

		/** @member {Point} PointBounds#max */
		Object.defineProperty(bounds, 'max', {enumerable: true, get: () => {return new Point(bounds.maxx, bounds.maxy)}})

		/** @member {Range} PointBounds#x */
		Object.defineProperty(bounds, 'x', {enumerable: true, get: () => {return new Range(bounds.minx, bounds.maxy)}})

		/** @member {Range} PointBounds#y */
		Object.defineProperty(bounds, 'y', {enumerable: true, get: () => {return new Range(bounds.miny, bounds.maxy)}})

		/** @member {Point} PointBounds#center */
		Object.defineProperty(bounds, 'center', {enumerable: true, get: () => {
			return new Point(
				bounds.minx + (bounds.maxx - bounds.minx)/2,
				bounds.miny + (bounds.maxy - bounds.miny)/2
			)
		}})


		/**
		* @function Position
		* @memberof PointBounds
		* @param {Point|Point[]} point
		* @returns {Point|Point[]}
		*/
		Object.defineProperty(bounds, 'Position', {enumerable: true, value: function (point) {
			if (Array.isArray(point) && Array.isArray(point[0])) {
				let positions = []
				point.forEach(p => {
					positions.push(bounds.position(p))
				})
				return positions
			}

			if (Reflect.has(point, 'c') && Reflect.has(point, 'y')) {
				return new Point(
					(point.x - bounds.minx) / (bounds.maxx - bounds.minx),
					(point.y - bounds.miny) / (bounds.maxy - bounds.miny)
				)
			}
			if (Array.isArray(point)) {
				return new Point(
					(point[0] - bounds.minx) / (bounds.maxx - bounds.minx),
					(point[1] - bounds.miny) / (bounds.maxy - bounds.miny)
				)
			}
		}})

		return bounds
	}



	/**
	* @class CoordinateBounds
	* @alias Bounds.Coordinate
	* @param {Number|Coordinate} minlon - Min Coordinate or min lon value
	* @param {Number|Coordinate} minlat - Max Coordinate or min lat value
	* @param {Number} [maxlon] - max lon value
	* @param {Number} [maxlat] - max lat value
	* @returns {CoordinateBounds}
	*/
	function Bounds (minlon, minlat, maxlon, maxlat) {
		let bounds = []
		if (minlon instanceof Coordinate && minlat instanceof Coordinate) {
			bounds = [
				Math.min(minlon.lon, minlat.lon),
				Math.min(minlon.lat, minlat.lat),
				Math.max(minlon.lon, minlat.lon),
				Math.max(minlon.lat, minlat.lat)
			]
		} else {
			bounds = [
				Math.min(minlon, maxlon),
				Math.min(minlat, maxlat),
				Math.max(minlon, maxlon),
				Math.max(minlat, maxlat)
			]
		}

		/** @member {Number} CoordinateBounds#minlon */
		Object.defineProperty(bounds, 'minlon', {enummerable: true, get: () => {return bounds[0]}})

		/** @member {Number} CoordinateBounds#minlat */
		Object.defineProperty(bounds, 'minlat', {enummerable: true, get: () => {return bounds[1]}})

		/** @member {Number} CoordinateBounds#maxlon */
		Object.defineProperty(bounds, 'maxlon', {enummerable: true, get: () => {return bounds[2]}})

		/** @member {Number} CoordinateBounds#maxlat */
		Object.defineProperty(bounds, 'maxlat', {enummerable: true, get: () => {return bounds[3]}})

		/** @member {Coordinate} CoordinateBounds#min */
		Object.defineProperty(bounds, 'min', {enumerable: true, get: () => {return new Coordinate(bounds.minlon, bounds.minlat)}})

		/** @member {Coordinate} CoordinateBounds#max */
		Object.defineProperty(bounds, 'max', {enumerable: true, get: () => {return new Coordinate(bounds.maxlon, bounds.maxlat)}})

		/** @member {Range} CoordinateBounds#lon */
		Object.defineProperty(bounds, 'lon', {enumerable: true, get: () => {return new Range(bounds.minlon, bounds.maxlon)}})

		/** @member {Range} CoordinateBounds#lat */
		Object.defineProperty(bounds, 'lat', {enumerable: true, get: () => {return new Range(bounds.minlat, bounds.maxlat)}})

		/** @member {Coordinate} CoordinateBounds#center */
		Object.defineProperty(bounds, 'center', {enumerable: true, get: () => {
			return new Coordinate(bounds.lon.center, bounds.lat.center)
		}})

		Object.defineProperty(bounds, 'polyString', {enumerable: true, get: () => {
			let poly = [
				bounds.min.lat.toFixed(5),
				bounds.min.lon.toFixed(5),

				bounds.min.lat.toFixed(5),
				bounds.max.lon.toFixed(5),

				bounds.max.lat.toFixed(5),
				bounds.max.lon.toFixed(5),

				bounds.max.lat.toFixed(5),
				bounds.min.lon.toFixed(5)
			]
			return poly.join(' ')
		}})

		/**
		* @function Position
		* @memberof CoordinateBounds
		* @param {Coordinate|Coordinate[]} coordinate
		* @returns {Coordinate|Coordinate[]}
		*/
		Object.defineProperty(bounds, 'Position', {enumerable: true, value: function (coordinate) {
			if (Array.isArray(coordinate) && Array.isArray(coordinate[0])) {
				let positions = []
				coordinate.forEach(c => {
					positions.push(bounds.Position(c))
				})
				return positions
			}

			if (Reflect.has(coordinate, 'lon') && Reflect.has(coordinate, 'lat')) {
				return [
					(coordinate.lon - bounds.minlon) / (bounds.maxlon - bounds.minlon),
					(coordinate.lat - bounds.minlat) / (bounds.maxlat - bounds.minlat)
				]
			}
			if (Array.isArray(coordinate)) {
				return [
					(coordinate[0] - bounds.minlon) / (bounds.maxlon - bounds.minlon),
					(coordinate[1] - bounds.minlat) / (bounds.maxlat - bounds.minlat)
				]
			}
		}})

		Object.defineProperty(bounds, 'AsPolygon', {get: () => {
			return new Turf.polygon([[
				[bounds.min.lat.toFixed(5), bounds.min.lon.toFixed(5)],
				[bounds.min.lat.toFixed(5), bounds.max.lon.toFixed(5)],
				[bounds.max.lat.toFixed(5), bounds.max.lon.toFixed(5)],
				[bounds.max.lat.toFixed(5), bounds.min.lon.toFixed(5)],
				[bounds.min.lat.toFixed(5), bounds.min.lon.toFixed(5)]
			]])
		}})

		Object.defineProperty(bounds, 'Clip', {value: (feature) => {
			if (feature.type == 'FeatureCollection') {
				let clipped = {type: 'FeatureCollection', features: []}
				feature.features.forEach(f => {
					if (Turf.getType(f) == 'Point') {
						if (Turf.booleanPointInPolygon(f, bounds.AsPolygon)) {
							clipped.features.push(f)
						}
					} else {
						let c = Turf.bboxClip(f, bounds)
						if (Turf.getCoords(c).length > 0) {
							clipped.features.push(c)
						}
					}
				})
				return clipped
			} else {
				return Turf.bboxClip(feature, bounds)
			}
		}})

		Object.defineProperty(bounds, 'Tiles', {value: (zoom = 13) => {
			let tiles = []
			let min = new Tile(bounds.min, zoom)
			let max = new Tile(bounds.max, zoom)

			for (var y = max.slippy[2]; y<= min.slippy[2]; y++) {
				let row = []
				for (var x = min.slippy[1]; x<= max.slippy[1]; x++) {
					row.push(new Tile(zoom, x, y))
				}
				tiles.push(row)
			}
			return tiles
		}})


		return bounds
	}



	let maxZoom = 20
	let TileSizes = [40075017, 20037508, 10018754, 5009377.1, 2504688.5, 1252344.3, 626172.1, 313086.1, 156543, 78271.5, 39135.8, 19567.9, 9783.94, 4891.97, 2445.98, 1222.99, 611.496, 305.748, 152.874, 76.437, 38.2185, 19.10926, 9.55463, 4.777315, 2.3886575]
	function lon2tile(lon,zoom){return Math.floor((lon+180)/360*Math.pow(2,zoom))}
	function lat2tile(lat,zoom){return Math.floor((1-Math.log(Math.tan(lat*Math.PI/180)+1/Math.cos(lat*Math.PI/180))/Math.PI)/2*Math.pow(2,zoom))}
	function tile2lon(x,z){return x/Math.pow(2,z)*360-180}
	function tile2lat(y,z){var n=Math.PI-2*Math.PI*y/Math.pow(2,z);return 180/Math.PI*Math.atan(.5*(Math.exp(n)-Math.exp(-n)))}

	function SlippyToQuadKey (z, x, y) {
		return GlobalMercator.QuadKey(x, Math.pow(2, z) - y - 1, z)
	}
	function QuadKeyToSlippy (key) {
		let tile = GlobalMercator.QuadKeyToTile(key)
		let _bounds = GlobalMercator.TileBounds(tile.tx, tile.ty, tile.zoom)
		let sw = GlobalMercator.MetersToLatLon(_bounds.minx, _bounds.miny)
		let ne = GlobalMercator.MetersToLatLon(_bounds.maxx, _bounds.maxy)
		let bounds = [sw.lon, sw.lat, ne.lon, ne.lat]
		let center = [(bounds[2] - bounds[0]) / 2 + bounds[0], (bounds[3] - bounds[1]) / 2 + bounds[1]]
		return [tile.zoom, lon2tile(center[0],tile.zoom), lat2tile(center[1], tile.zoom)]
	}



	/**
	* @class Tile
	* @example
	* new Tile(quadkey)
	* @example
	* //Coordinates
	* new Tile(new Coordinate(lon, lat), zoom)
	* new Tile([lon, lat], zoom)
	* @example
	* //Slippy
	* new Tile(z, x, y)
	*/
	function Tile () {
		let tile = null
		if (arguments.length == 1) {
			tile = GlobalMercator.QuadKeyToTile(arguments[0])
		}
		if (arguments.length == 2) {
			if (Reflect.has(arguments[0], 'lon') && Reflect.has(arguments[0], 'lat')) {
				tile = GlobalMercator.LatLonToTile(arguments[0].lat, arguments[0].lon, arguments[1] < Tile.maxZoom ? arguments[1] : Tile.maxZoom)
			} else if (Array.isArray(arguments[0])) {
				tile = GlobalMercator.LatLonToTile(arguments[0][1], arguments[0][0], arguments[1] < Tile.maxZoom ? arguments[1] : Tile.maxZoom)
			}
			tile.zoom = arguments[1] < Tile.maxZoom ? arguments[1] : Tile.maxZoom
		}
		if (arguments.length == 3) {
			tile = GlobalMercator.QuadKeyToTile(SlippyToQuadKey.apply(null, arguments))
		}

		/** @member {number} x
		* @memberof Tile.prototype */
		this.x = tile.tx

		/** @member {number} y
		* @memberof Tile.prototype */
		this.y = tile.ty

		/** @member {number} zoom
		* @memberof Tile.prototype */
		this.zoom = tile.zoom

		/** @member {string} key
		* @memberof Tile.prototype */
		this.key = GlobalMercator.QuadKey(this.x, this.y, this.zoom)

		/** @member {number[]} slippy
		* @memberof Tile.prototype */
		this.slippy = QuadKeyToSlippy(this.key)

		let bounds = GlobalMercator.TileBounds(this.x, this.y, this.zoom)
		let min = GlobalMercator.MetersToLatLon(bounds.minx, bounds.miny)
		let max = GlobalMercator.MetersToLatLon(bounds.maxx, bounds.maxy)

		//if (typeof module === 'object' && module.exports) {
		//	Bounds = require('./Bounds')
		//}
		this.bounds = new Bounds(min.lon, min.lat, max.lon, max.lat)

		//Object.defineProperty(this, 'Features', {enumerable: true, get: () => {
		//	return Overpass(`[out:json];\nnwr(poly:"${this.bounds.polyString}");\n(._;<<;);out meta;`)
		//}})

		this.query = `nwr(poly:"${this.bounds.min.lat.toFixed(5)} ${this.bounds.min.lon.toFixed(5)} ${this.bounds.min.lat.toFixed(5)} ${this.bounds.max.lon.toFixed(5)} ${this.bounds.max.lat.toFixed(5)} ${this.bounds.max.lon.toFixed(5)} ${this.bounds.max.lat.toFixed(5)} ${this.bounds.min.lon.toFixed(5)}")`

		this.Query = function (s, out) {
			let query = `nwr(poly:"${this.bounds.min.lat.toFixed(5)} ${this.bounds.min.lon.toFixed(5)} ${this.bounds.min.lat.toFixed(5)} ${this.bounds.max.lon.toFixed(5)} ${this.bounds.max.lat.toFixed(5)} ${this.bounds.max.lon.toFixed(5)} ${this.bounds.max.lat.toFixed(5)} ${this.bounds.min.lon.toFixed(5)}");\n`
			if (typeof s === 'string') {
				query += `(\n\t${s}\n);`
			}
			query += typeof out !== 'undefined' ? `out ${out};` : `out;`
			return Overpass(query)
		}

		this.QuerySync = function (s) {
			return Overpass.Sync(s)
		}

		this.ImageUrl = function (token, style = 'satellite-v9', w = 1024, h = 1024) {
			return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/[${this.bounds.map(b=>{return b.toFixed(8)}).join(',')}]/${w}x${h}@2x?access_token=${token}`
		}

		Object.defineProperty(this, 'Neighbor', {enumerable: true, value: function (x = 1, y = 0) {
			return new Tile(new Coordinate(
				this.bounds.center.lon + (this.bounds.lon.span * x),
				this.bounds.center.lat + (this.bounds.lat.span * y)
			), this.zoom)
		}})

		Object.defineProperty(this, 'subTiles', {enumerable: true, value: function (zoom = 20) {
			let subTiles = []
			let SubTiles = (key) => {
				if (key.length > zoom - 1) {
					subTiles.push(key+'0')
					subTiles.push(key+'1')
					subTiles.push(key+'2')
					subTiles.push(key+'3')
				} else {
					SubTiles(key+'0')
					SubTiles(key+'1')
					SubTiles(key+'2')
					SubTiles(key+'3')
				}
			}
			SubTiles(this.key)
			return subTiles
		}})

		return this
	}

	/**
	* @var {number[]} Sizes
	* @memberof Tile
	* @static */
	Object.defineProperty(Tile, 'Sizes', {enumerable: true, value: TileSizes})


	Object.defineProperty(Tile, 'maxZoom', {enumerable: true, get: () => {return maxZoom}, set: (v) => {maxZoom = v}})


	function Feature (feature) {

		Define(feature, 'classes', [], true)
		Define(feature, 'parent', null)


		Define(feature, 'ToSvg', (width, height, bounds, styles) => {
			let svgHeader = '', svgFooter = ''
			if (typeof bounds === 'undefined') {
				svgHeader = `<svg width="${width}" height="${height}">\n`
				svgFooter = `</svg>`
				bounds = new Bounds(...Turf.bbox(feature))
			}

			let svg = '', pixels = null
			if (Turf.getType(feature) == 'Point') {
				pixels = Pixels(bounds, width, height, [Turf.getCoords(feature)])
				let radius = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 12, 13, 14, 15, 16, 17 ,18]

				svg =  `\t<g class="${feature.classes.join(' ')}" id="${feature.id}">\n`
				svg += `\t\t<circle cx="${pixels[0][0]}" cy="${pixels[0][1]}" r="10" />\n`
				svg += `\t</g>\n`
				return svgHeader + svg + svgFooter
			}

			if (Turf.getType(feature) == 'LineString') {
				pixels = Pixels(bounds, width, height, Turf.getCoords(feature))

				//let d = `M${pixels[0][0]} ${pixels[0][1]}`
				//pixels.slice(1).forEach(pixel => {d += ` L${pixel[0]} ${pixel[1]}`})

				//svg =  `\t<g class="${feature.classes.join(' ')}" id="${feature.id}">\n`
				//svg += `\t\t<path d="${d} z" />\n`
				//svg += `\t</g>\n`

				svg =  `\t<g class="${feature.classes.join(' ')}" id="${feature.id}">\n`
				svg += `\t\t<polyline points="${pixels.map(p => p.join(',')).join(' ')}" />\n`
				svg += `\t</g>\n`

				return svgHeader + svg + svgFooter
			}

			if (Turf.getType(feature) == 'Polygon') {
				svg =  `\t<g class="${feature.classes.join(' ')}" id="${feature.id}">\n`
				let coords = Turf.getCoords(feature)
				coords.forEach(row => {
					pixels = Pixels(bounds, width, height, row)
					let d = `M${pixels[0][0]} ${pixels[0][1]}`
					pixels.slice(1).forEach(pixel => {d += ` L${pixel[0]} ${pixel[1]}`})
					svg += `\t\t<path d="${d} z" />\n`
				})
				svg += `\t</g>\n`
				return svgHeader + svg + svgFooter
			}

		})


	}

	function Pixels (bounds, width, height, coords) {
		return bounds.Position(coords).map(c => {
			return [
				Math.round(c[0] * width),
				height - Math.round(c[1] * height)
			]
		})
	}


	let zoomSizes = [1.4210854715202004e-14,85.0511287798066,66.51326044311185,40.979898069620155,19.03685253618199,9.02773583159518,4.382008936549958,2.157307093443052,1.0871452583600885,0.5414570853770542,0.27125841520654603,0.13549685878253115,0.06778153175958579,0.0338824921674572,0.016943314747734917,0.008472174510430364,0.004235957974749738,0.0021180113079424245,0.001059013734057146,0.00052950888704828,0.00026475494851752046]
	function GetZoom(bounds) {
		for (var i = 0; i<zoomSizes.length; i++) {
			if ((bounds.lat.span/zoomSizes[i]) < 1.1 && bounds.lat.span/zoomSizes[i] > 0.9) {
				return i
			}
		}
		return -1
	}

	function FeatureCollection (collection) {
		if (typeof collection === 'undefined') {
			collection = {type: 'FeatureCollection', features: []}
		}

		Define(collection, 'classes', [])
		Define(collection, 'parent', null)

		Reflect.has(collection, 'features') && collection.features.forEach(feature => {
			Feature(feature)
			feature.parent = collection
		})

		Define(collection, 'Bounds', {get: () => {
			return new Bounds(...Turf.bbox(collection))
		}})


		Define(collection, 'Add', (feature) => {
			Feature(feature)
			feature.parent = collection
			collection.features.push(feature)
			return collection
		})

		Define(collection, 'ApplyRules', (rules) => {
			rules.forEach(rule => {
				rule(collection)
			})
			collection.features.forEach(feature => {
				rules.forEach(rule => {
					rule(feature)
				})
			})
		})

		Define(collection, 'ToSvg', (bounds, width = 1024, height = 1024, styles) => {
			if (bounds == null) {
				bounds = collection.Bounds
			}
			let svg = `<svg viewBox="0 0 ${width} ${height}" class="${collection.classes.join(' ')}" data-zoom="${GetZoom(bounds)}" data-bounds="${bounds.join(',')}" xmlns="http://www.w3.org/2000/svg">\n`
			collection.features.forEach(feature => {
				svg += feature.ToSvg(width, height, bounds, styles)
			})
			svg += `</svg>\n`

			return svg
		})


		return collection
	}



	/*
	https://opendata.gis.utah.gov/datasets/utah-major-streams-statewide/api
	https://opendata.gis.utah.gov/datasets/utah-major-lakes/explore?location=38.557685%2C-111.831301%2C-1.00
	https://opendata.gis.utah.gov/datasets/utah-springs-nhd/explore?location=38.591871%2C-111.929682%2C-1.00
	https://opendata.gis.utah.gov/datasets/utah-streams-nhd/explore
	*/

	let ArcGIS = {
		DefaultParams: {
			where: '1=1',
			geometry: null,
			f: 'geojson',
			resultOffset: 0,
			resultRecordCount: 1000,
			outFields: '*',
			geometryType: 'esriGeometryEnvelope',
			idsOnly: false,
			outSR: '4326',
			inSR: '4326',
			spatialRel: 'esriSpatialRelEnvelopeIntersects'
		}
	}

	ArcGIS.Query = function (url, params, cb = null) {
		let qs = Object.keys(params).filter(key => params[key] != null).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&')
		if (!Reflect.has(params, 'resultOffset')) {params.resultOffset = 0}

		return new Promise((resolve, reject) => {
			if (https != null && geojsonStream != null) {
				/* NodeJs */
	log(`${url}?${qs}`)
				https.get(`${url}?${qs}`, res => {
					if (res.statusCode !== 200) {return reject(new Error('Request Failed.\n' + `Status Code: ${res.statusCode}`))}
					res.setEncoding('utf8')
					let data = '', count = 0
					if (cb != null) {
						res.pipe(geojsonStream.parse((feature, index) => {
							count = index
							cb(Feature(feature), index)
						}))
					} else {
						res.on('data', chunk => {data += chunk.toString()})
					}
					res.on('end', () => {
						if (cb != null) {
							if (count > 0 && !Reflect.has(params, 'resultRecordCount')) {
								params.resultOffset += count
								ArcGIS.Query(url, params, cb).then(resolve).catch(reject)
							} else {
								resolve()
							}
						} else {
							let collection = JSON.parse(data)
							//if (collection.Get('features.length', 0) > 0 && collection.Get('features.length', 0) == params.resultRecordCount) {
							if (collection.Get('properties.exceededTransferLimit', false) === true) {
								params.resultOffset += collection.features.length
								ArcGIS.Query(url, params, cb).then((_collection) => {
									_collection.features.forEach(feature => {collection.features.push(feature)})
									resolve(FeatureCollection(collection))
								}).catch(reject)
							} else {
								resolve(FeatureCollection(collection))
							}
						}
					})
				})
			} else {
				/* Browser */
				fetch(url).then(res => res.text()).then(res => {
					let collection = JSON.parse(res)
					if (cb != null) {
						collection.features.forEach(feature => {cb(Feature(feature))})
					}
					if (collection.Get('properties.exceededTransferLimit', false) === true) {
						params.resultOffset += params.resultRecordCount
						ArcGIS.Query(url, params, cb).then(_collection => {
							_collection.features.forEach(feature => {collection.features.push(feature)})
							resolve(FeatureCollection(collection))
						}).catch(reject)
					} else {
						resolve(FeatureCollection(collection))
					}
				}).catch(reject)
			}
		})
	}

	ArcGIS.Lakes = function () {
		let params = Extend({}, ArcGIS.DefaultParams, typeof arguments[0] === 'object' ? arguments[0] : {})
		let cb = arguments[0] instanceof Function ? arguments[0] : arguments[1] instanceof Function ? arguments[1] : null
		return ArcGIS.Query(`https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/UtahMajorLakes/FeatureServer/0/query`, params, cb)
	}

	ArcGIS.LandOwnership = function () {
		let params = Extend({}, ArcGIS.DefaultParams, typeof arguments[0] === 'object' ? arguments[0] : {})
		let cb = arguments[0] instanceof Function ? arguments[0] : arguments[1] instanceof Function ? arguments[1] : null
		return ArcGIS.Query(`https://gis.trustlands.utah.gov/server/rest/services/Ownership/UT_SITLA_Ownership_LandOwnership_WM/FeatureServer/0/query`, params, cb)
	}

	ArcGIS.Rivers = function () {
		let params = Extend({}, ArcGIS.DefaultParams, typeof arguments[0] === 'object' ? arguments[0] : {})
		let cb = arguments[0] instanceof Function ? arguments[0] : arguments[1] instanceof Function ? arguments[1] : null
		return ArcGIS.Query(`https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/UtahMajor_Streams/FeatureServer/0/query`, params, cb)
	}

	ArcGIS.Roads = function () {
		let params = Extend({}, ArcGIS.DefaultParams, typeof arguments[0] === 'object' ? arguments[0] : {})
		let cb = arguments[0] instanceof Function ? arguments[0] : arguments[1] instanceof Function ? arguments[1] : null
		return ArcGIS.Query(`https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/UtahRoads/FeatureServer/0/query`, params, cb)
	}

	ArcGIS.Springs = function () {
		let params = Extend({}, ArcGIS.DefaultParams, typeof arguments[0] === 'object' ? arguments[0] : {})
		let cb = arguments[0] instanceof Function ? arguments[0] : arguments[1] instanceof Function ? arguments[1] : null
		return ArcGIS.Query(`https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/SpringsNHDHighRes/FeatureServer/0/query`, params, cb)
	}

	ArcGIS.Streams = function () {
		let params = Extend({}, ArcGIS.DefaultParams, typeof arguments[0] === 'object' ? arguments[0] : {})
		let cb = arguments[0] instanceof Function ? arguments[0] : arguments[1] instanceof Function ? arguments[1] : null
		return ArcGIS.Query(`https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/UtahStreamsNHD/FeatureServer/0/query`, params, cb)
	}

	ArcGIS.Trails = function () {
		let params = Extend({}, ArcGIS.DefaultParams, typeof arguments[0] === 'object' ? arguments[0] : {})
		let cb = arguments[0] instanceof Function ? arguments[0] : arguments[1] instanceof Function ? arguments[1] : null
		return ArcGIS.Query(`https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/TrailsAndPathways/FeatureServer/0/query`, params, cb)
	}




	return {
		GlobalMercator: GlobalMercator,
		Range: Range,
		Point: Point,
		Coordinate: Coordinate,
		CoordinateBounds: CoordinateBounds,
		PointBounds: PointBounds,
		Bounds: Bounds,
		Tile: Tile,
		GeoJSON: {
			Feature: Feature,
			FeatureCollection: FeatureCollection
		},
		ArcGIS: ArcGIS,
		places: {
			wellington: [-110.71962810251048, 39.542261798019354],
			monroe: [-111.96167326188639, 38.66861892205284],
			elkridge: [-109.70704609997087, 37.811229292647965],
			manti: [-111.47544793317083, 39.13270748076158],
			boulder: [-111.62114655087278, 38.052962526014134]
		}
	}





}))

