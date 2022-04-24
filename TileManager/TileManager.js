define(['jquery', 'turf', 'leaflet', 'maps.core', 'Layer.js', 'Svg', 'jquery-ui', '@js/core', 'style!TileManager.css', 'style!/styles/default.css'], ($, Turf, L, Maps, Layer, Svg) => {
	window.Maps = Maps
	window.Turf = Turf
	window.Svg = Svg

	$('div.Tile').width(innerHeight)
	$('div.Tile').height(innerHeight)


	function TileManager (tileId) {
		let $this = this
		Object.Extensions.EventEmitter(this)

		this.layers = []
		let currentLayer = 0
		Define(this.layers,'current',{get:()=>this.layers[currentLayer],set:v=>{currentLayer=v;this.emit('layer-change',this.layers[v])}});
		this.layers.push = function (e) {
			let index = Array.prototype.push.call(this, e) - 1
			let button = $(`<li><a class="dropdown-item" href="#" data-index="${index}">${e.name}</a></li>`)
			button.on('click', event => {this.current = index})
			$('#LayersSelect ul').append(button)
			$('div.Tile').append(e.e)
			if (this.length == 1) {this.current = index}
			return this
		}
		this.on('layer-change', function () {
			$('#LayersSelect button').text(this.layers.current.name)
			$('#LayerGeoJSON').text(JSON.stringify(this.layers.current.featureCollection, null, 4))
		})
		$('#GeoJSONControls .dropdown-menu li').on('click', event => {
			Maps.ArcGIS[$(event.target).data('feature')]({geometry: this.tile.bounds.join(',')}).then(features => {
				this.layers.current.featureCollection = features
			})

		})

		let tile = null
		this.Define('tile',{get:()=>tile,set:v=>{tile=v.includes('/')?new Maps.Tile(...v.split('/').map(n=>parseInt(n))):new Maps.Tile(v);this.emit('tile-change');this.UpdateUi()}})
		this.Define('baseMap',{get:()=>$('select.BaseMap.Style')[0].value,set:v=>{$('select.BaseMap.Style')[0].value=v;this.UpdateUi();}})

		this.tile = tileId
		//this.AddLayer('default')

		$.get(`/features/streams/${tile.slippy.join('/')}?svg`, svg => {
			this.AddLayer(new Layer.Svg(tile, 'Streams', svg))
			$.get(`/features/rivers/${tile.slippy.join('/')}?svg`, svg => {
				this.AddLayer(new Layer.Svg(tile, 'Rivers', svg))
				$.get(`/features/springs/${tile.slippy.join('/')}?svg`, svg => {
					this.AddLayer(new Layer.Svg(tile, 'Springs', svg))
					$.get(`/features/lakes/${tile.slippy.join('/')}?svg`, svg => {
						this.AddLayer(new Layer.Svg(tile, 'Lakes', svg))
						$.get(`/features/roads/${tile.slippy.join('/')}?svg`, svg => {
							this.AddLayer(new Layer.Svg(tile, 'Roads', svg))
							$.get(`/features/trails/${tile.slippy.join('/')}?svg`, svg => {
								this.AddLayer(new Layer.Svg(tile, 'Trails', svg))
								$.get(`/features/landownership/${tile.slippy.join('/')}?svg&type=private&type=tribal`, svg => {
									this.AddLayer(new Layer.Svg(tile, 'LandOwnership', svg))
								})
								$('#LayerGeoJSON').on('change', event => {
									this.layers.current.featureCollection = $('#LayerGeoJSON')[0].value
								})
							})
						})
					})
				})
			})
		})


		return this
	}

	TileManager.prototype.UpdateUi = function () {
		$('img.Tile').attr('src', `/tiles/${this.baseMap}/${this.tile.slippy[0]}/${this.tile.slippy[1]}/${this.tile.slippy[2]}`)
		$('.tab-content[data-tab="Tile"] > div.Property').each((i, e) => {
			log($(e).data('key'))
			$(e).find('span').text(this.tile.Get($(e).data('key'), 'n/a'))
		})


	}

	TileManager.prototype.Layer = function () {
		return new Layer(...arguments)
	}

	TileManager.prototype.AddLayer = function () {
		let layer = arguments[0] instanceof Layer.Svg ? arguments[0] : arguments[0] instanceof Layer.GeoJSON ? arguments[0] : new Layer(this.tile, ...arguments)
		this.layers.push(layer)
	}

	$(() => {



	})


	let params = {}
	location.search.replace('?', '').split('&').forEach(param => {params[decodeURIComponent(param.split('=')[0].trim())] = decodeURIComponent(param.split('=')[1].trim())})
	let manager = new TileManager(params.tile)

	$(() => {
		$('select.BaseMap.Style').on('change', event => {manager.UpdateUi()})
		$('.navbar a').on('click', event => {
			$('.tab-content').removeClass('active')
			$(`.tab-content[data-tab="${$(event.target).data('tab')}"]`).addClass('active')
			$('.navbar a').removeClass('active')
			$(event.target).addClass('active')
		})

		$("div.Tile").draggable({
			containment: ".Main"
		})
		$("div.Tile" ).resizable({
			handles: 'n, s, w, e, ne, se',
			aspectRatio: 1,
			maxHeight: innerHeight,
			maxWidth: innerWidth,
			minHeight: 250,
			minWidth: 250
		})
		$('#LayersControl i').on('click', event => {
			if ($(event.target).data('action') == 'add') {
				manager.AddLayer(prompt('Layer Name'))
			}
		})
	})

	return manager
})

