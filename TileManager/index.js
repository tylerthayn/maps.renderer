require(['/scripts/maps.core.js', '/scripts/turf.js', '/scripts/leaflet.js', 'jquery', '@js/core', 'style!/styles/maps.tile.manager.css'], (Maps, Turf, L, $) => {

	let _path = location.pathname.split('/')
	let tile = null

	if (_path.length == 3) {
		tile = new Maps.Tile(_path.pop())
	} else if (_path.length > 3) {
		tile = new Maps.Tile(_path[2], _path[3], _path[4])
	}


	//$('div.TileManager').css('width', (innerWidth - innerHeight)+'px')


	//let size = eval($('input.Size')[0].value)
	$('img').attr('src', `/tiles/${$('select.Style')[0].value}/${tile.slippy[0]}/${tile.slippy[1]}/${tile.slippy[2]}`)
	//$('img').attr('width', innerHeight/4)
	//$('img').attr('height', innerHeight/4)

	$('span.TileKey').text(tile.key)
	$('span.Slippy').text('/'+tile.slippy.join('/'))
	$('span.TileCenter').text(tile.bounds.center.join(', '))
	$('span.TileBounds').text(tile.bounds.join(', '))


	/*
	$('input.Size').on('change', (event) => {
		let size = eval(event.target.value)
		$('img').attr('width', size)
		$('img').attr('height', size)
	})
	*/

	$('select.Style').on('change', () => {
		$('img').attr('src', `/tiles/${$('select.Style')[0].value}/${tile.slippy[0]}/${tile.slippy[1]}/${tile.slippy[2]}`)
	})

	$('input[type=checkbox]').on('change', (event) => {
		alert($(event.target).data('feature'))
	})

$(() => {

	//let $tile = {
	$("div.Tile").draggable({
		containment: "document"
	})
	$("div.Tile" ).resizable({
		handles: 'n, s, w, e, ne, se',
		aspectRatio: 16 / 9,
		maxHeight: innerHeight * 0.90,
		maxWidth: innerWidth * 0.50,
		minHeight: 125,
		minWidth: 250
	})
	//}
})
})
