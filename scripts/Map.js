define(['maps.core', 'turf', 'leaflet', 'jquery', '@js/core'], (Maps, Turf, L, $) => {
	function CalculateZoom (levels, zoom) {
log(zoom + '::' + levels.join(','))
		if (zoom < levels[1]) {return levels.first}
		if (zoom > levels.last) {return levels.last}
		for (let i=2; i<levels.length; i++) {
			if (zoom < levels[i]) {
log(levels[i-1])
				return levels[i-1]
			}
		}
log(zoom)
		return zoom
	}

	let defaults = {
		apiServer: 'http://localhost:11503',
		featureType: 'geojson',
		zoomLevels: [5, 8, 11, 14, 17]
	}

	L.Map.TTS = L.Map.extend(
		{
			options: defaults,
			initialize: function (element, options = {}) {
				L.Map.prototype.initialize.call(this, element, Extend({}, defaults, options))
			},
			get: function (path, cb) {
				$.get(this.options.apiServer+path, cb)
			}
		}
	)

	L.Map.TTS.addInitHook(function () {
		this.get('/viewer', viewer => {
			this.setView = function(center, zoom, options) {
				return L.Map.prototype.setView.call(this, center, CalculateZoom(viewer.zoomLevels, zoom), options)
			}

			Extend(this.options, viewer.Get('map', {}))
			this.features = {}
			viewer.layers.features.forEach(layer => {
				this.features[layer.name] = L.featureGroup()
			})

			this.tiles = {}
			viewer.layers.tiles.forEach(layer => {
				this.tiles[layer.name] = L.tileLayer(layer.url.startsWith('http') ? layer.url : this.options.apiServer+layer.url, layer.options)
			})

			L.control.layers(this.tiles, this.features).addTo(this)

			this.on('baselayerchange', event => {
				event.layer.on('tileload', event => {
					let tile = new Maps.Tile(event.coords.z-1, event.coords.x, event.coords.y)
					viewer.layers.features.forEach(feature => {
						if (this.options.featureType == 'geojson') {
							this.get(`/features/${feature.name}/${tile.key}.geojson`, geoJson => {
								let _layer = L.geoJSON(geoJson)
								log(geoJson)
								this.features[feature.name].addLayer(_layer)
							})
						} else if (this.options.featureType == 'svg') {

						}
					})

				})
			})
			this.addLayer(this.tiles[viewer.map.defaultTile])
			Object.keys(this.features).forEach(layer => {
				this.addLayer(this.features[layer])
			})
			this.setView(viewer.map.center, viewer.map.zoom)
		})

	})

})
