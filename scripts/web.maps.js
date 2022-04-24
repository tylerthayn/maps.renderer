require(['maps.core', 'turf', 'leaflet', 'jquery', 'Map', '@js/core', 'style!@css/leaflet', 'style!@css/maps', 'style!styles/default.css'], (Maps, Turf, L, $) => {

	$.get('configs.json', configs => {
		log(configs)
		let map = new L.Map.TTS($('.Map')[0], configs.map)
		window.map = map
	})

})
