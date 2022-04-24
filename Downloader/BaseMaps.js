define(['jquery', '@js/core'], ($, L) => {
	window.$ = $
	window.L = L


	$(() => {

		$.get('/configs?builder=true', configs => {
			window.configs = configs

			configs.layers.tiles.forEach(style => {
				$('div.Tiles').append($(`<div class="Checkbox"><input type="checkbox" checked>${style}</input></div>`))
			})

		})

	})

})

