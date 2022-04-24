require(['maps.core', 'turf', 'leaflet', 'jquery', '@js/core', 'style!@css/leaflet', 'style!@css/maps', 'style!styles/default.css'], (Maps, Turf, L, $) => {

	function CalculateZoom (levels, zoom) {
		if (zoom < levels[1]) {return levels.first}
		if (zoom > levels.last) {return levels.last}
		for (let i=2; i<levels.length; i++) {
			if (zoom < levels[i]) {
				return levels[i-1]
			}
		}
		return zoom
	}

	let center = [38.66861892205284, -111.96167326188639]

	$.get('configs.json', configs => {

		if (location.search != '') {
			let data = location.search.replace('?', '').split('&').forEach(item => {
				if (item.split('=')[0] == 'center') {
					configs.map.center = item.split('=')[1].replace('[', '').replace(']', '').split(',').map(c=>parseFloat(c))
				}
				if (item.split('=')[0] == 'place') {
					configs.map.center = Maps.places[item.split('=')[1]].reverse()
				}
			})
		}
		window.layers = layers = {tiles: {}, features: {}}

		configs.layers.features.forEach(layer => {
			layers.features[layer.name] = L.featureGroup()
		})

		configs.layers.tiles.forEach(layer => {
			layers.tiles[layer.name] = L.tileLayer(layer.url.startsWith('http') ? layer.url : configs.apiServer+layer.url, layer.options)
		})

		Object.keys(layers.tiles).forEach(style => {
			layers.tiles[style].on('tileload', function (event) {
				let tile = new Maps.Tile(event.coords.z-1, event.coords.x, event.coords.y)
				Object.keys(layers.features).forEach(type => {
					log(type)
/*
						if (tile.zoom >= layer.Get('options.minZoom', configs.map.minZoom)) {
							try {
								let url = layer.url.replace('{key}', tile.key).replace('{ext}', configs.formats.feature)+'?overwrite=true'
								$.get(url, res => {
									try {
										let _layer = {}
										if (configs.formats.feature == 'svg') {
											_layer = L.svgOverlay($(res)[0], [[tile.bounds.lat.min, tile.bounds.lon.min], [tile.bounds.lat.max, tile.bounds.lon.max]], {className: 'Overlay'})
										} else if (configs.formats.feature == 'geojson') {
		log(res)
											_layer = L.geoJSON(res)
										}
										layers.features[layer.name].addLayer(_layer)
									} catch (e) {
										console.log(`error1: ${url}\n`+e.toString())
									}
								})
							} catch (e) {
								console.log(`error2: ${url}`+e.toString())
							}

						}
*/

				})
			})
		})


		configs.map.layers = layers.tiles[configs.map.defaultTile]

		let map = L.map($('.Map')[0], configs.map)
		window.Map = map

		map.setView = function(center, zoom, options) {
			return L.Map.prototype.setView.call(this, center, CalculateZoom(configs.zoomLevels, zoom), options)
		}

		L.control.layers(layers.tiles, layers.features).addTo(map)
		//L.control.TileGrid({position: 'topright'}).addTo(map)




	})
})
/*
			window.layers = layers = {tiles: {}, features: {}}

			_layers.features.forEach(layer => {
				layers.features[layer.name] = L.featureGroup()
			})

			_layers.tiles.forEach(layer => {
				layers.tiles[layer.name] = L.tileLayer(layer.url, layer.options)
				layers.tiles[layer.name].on('tileload', function (event) {
					let tile = new Maps.Tile(event.coords.z-1, event.coords.x, event.coords.y)
					configs.layers.features.forEach(layer => {
						if (tile.zoom >= layer.Get('options.minZoom', configs.map.minZoom)) {
							try {
								let url = layer.url.replace('{key}', tile.key).replace('{ext}', configs.formats.feature)+'?overwrite=true'
								$.get(url, res => {
									try {
										let _layer = {}
										if (configs.formats.feature == 'svg') {
											_layer = L.svgOverlay($(res)[0], [[tile.bounds.lat.min, tile.bounds.lon.min], [tile.bounds.lat.max, tile.bounds.lon.max]], {className: 'Overlay'})
										} else if (configs.formats.feature == 'geojson') {
		log(res)
											_layer = L.geoJSON(res)
										}
										layers.features[layer.name].addLayer(_layer)
									} catch (e) {
										console.log(`error1: ${url}\n`+e.toString())
									}
								})
							} catch (e) {
								console.log(`error2: ${url}`+e.toString())
							}

						}

					})

				})
			})



		})

	})

})

	/*

	window.layers = layers = {tiles: {}, features: {}}

	configs.layers.features.forEach(layer => {
		layers.features[layer.name] = L.featureGroup()
		//layers.features[layer.name].on('layerremove', (event) => {})
	})
	configs.layers.tiles.forEach(layer => {
		layers.tiles[layer.name] = L.tileLayer(layer.url, layer.options)
		layers.tiles[layer.name].on('tileload', function (event) {
			let tile = new Maps.Tile(event.coords.z-1, event.coords.x, event.coords.y)
			configs.layers.features.forEach(layer => {
				if (tile.zoom >= layer.Get('options.minZoom', configs.map.minZoom)) {
					try {
						let url = layer.url.replace('{key}', tile.key).replace('{ext}', configs.formats.feature)+'?overwrite=true'
						$.get(url, res => {
							try {
								let _layer = {}
								if (configs.formats.feature == 'svg') {
									_layer = L.svgOverlay($(res)[0], [[tile.bounds.lat.min, tile.bounds.lon.min], [tile.bounds.lat.max, tile.bounds.lon.max]], {className: 'Overlay'})
								} else if (configs.formats.feature == 'geojson') {
log(res)
									_layer = L.geoJSON(res)
								}
								layers.features[layer.name].addLayer(_layer)
							} catch (e) {
								console.log(`error1: ${url}\n`+e.toString())
							}
						})
					} catch (e) {
						console.log(`error2: ${url}`+e.toString())
					}

				}

			})

		})
	})
	configs.map.layers = layers.tiles[configs.map.defaultTile]

	var map = L.map(
		$('.Map')[0],
		configs.map
	)

	//window._layers = _layers = Layers(map)
	window.Map = map


	map.setView = function(center, zoom, options) {
		return L.Map.prototype.setView.call(this, center, CalculateZoom(configs.zoomLevels, zoom), options)
	}



	L.control.layers(layers.tiles, layers.features).addTo(map)
	//L.control.TileGrid({position: 'topright'}).addTo(map)

	$('.leaflet-control-layers-overlays input.leaflet-control-layers-selector').each((i, e) => {$(e).trigger('click')})

	})
*/

