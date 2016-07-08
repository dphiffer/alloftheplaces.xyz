
var marker, router;
var map_options = {
	scene: '/lib/walkabout/walkabout-style-more-labels.yaml',
	zoomControl: false,
	scrollWheelZoom: false
};

/*var geocoder = L.Mapzen.geocoder($(document.body).data('search-api-key'));
geocoder.addTo(map);
geocoder.on('select', function(e) {
  console.log(e.feature);
});*/

if ($('#map').data('latlng')) {
	var coords = $('#map').data('latlng').split(',');
	var lat = parseFloat(coords[0]);
	var lng = parseFloat(coords[1]);
	map_options.center = [lat, lng];
	map_options.zoom = 14;
} else if ($('#map').data('bbox')) {
	var coords = $('#map').data('bbox').split(',');
	var bbox = [
		[parseFloat(coords[1]), parseFloat(coords[0])],
		[parseFloat(coords[3]), parseFloat(coords[2])]
	];
} else {
	$.get('https://ip.dev.mapzen.com/?raw=1', function(rsp) {
		if (! rsp.geom_bbox) {
			map.setView([40.70531, -74.009], 16);
			return;
		}
		var coords = rsp.geom_bbox.split(',');
		var bbox = [
			[parseFloat(coords[1]), parseFloat(coords[0])],
			[parseFloat(coords[3]), parseFloat(coords[2])]
		];
		map.fitBounds(bbox);
	});
}

var map = L.Mapzen.map('map', map_options);
if (bbox) {
	map.fitBounds(bbox);
}

var zoom = new L.Control.Zoom({
	position: 'bottomright'
}).addTo(map);

L.Mapzen.bug({
	name: 'Who’s On First',
	link: 'https://alloftheplaces.xyz',
	tweet: '@alloftheplaces',
	repo: 'https://github.com/whosonfirst/whosonfirst-www-alloftheplaces'
});

var locator = L.Mapzen.locator();
locator.setPosition('bottomright');
locator.addTo(map);

//L.Mapzen.hash({
//	map: map
//});

if ($('#map').data('latlng')) {
	var coords = $('#map').data('latlng').split(',');
	var lat = parseFloat(coords[0]);
	var lng = parseFloat(coords[1]);
	marker = L.marker([lat, lng], {
		icon: L.divIcon({
			className: 'icon icon-marker icon-marker-destination',
			iconSize: [26, 43],
			iconAnchor: [13, 43],
			popupAnchor: [0, -43]
		})
	}).addTo(map);
	var address = '';
	if ($('meta[name=address]').length > 0) {
		var address = $('meta[name=address]').attr('content');
	}
	var id = $('meta[name=id]').attr('content');
	var popup = '<h4>' + document.title + '</h4>' + address +
	            '<div class="buttons">' +
	            '<button class="btn btn-mapzen btn-directions">Directions</button>' +
	            '<a class="btn btn-transparent btn-wof" href="https://whosonfirst.mapzen.com/spelunker/id/' + id + '/">WOF record</a>' +
		    '<div class="loading"><div class="loading-spinner-02"></div> Finding your location</div>' +
		    '</div>';
	marker.bindPopup(popup).openPopup();
	$('#map').click(function(e) {
		if ($(e.target).hasClass('btn-directions')) {
			get_directions({
				latitude: lat,
				longitude: lng
			});
		}
	});
}

function get_directions(dest_pos) {

	var curr_marker;
	$('#map').addClass('loading');

	navigator.geolocation.getCurrentPosition(function(start_pos) {
		map.closePopup();
		$('#map').removeClass('loading');
		if (! router) {
			create_router(start_pos, dest_pos);
		} else {
			router.setWaypoints([
				L.latLng(start_pos.coords.latitude, start_pos.coords.longitude),
				L.latLng(dest_pos.latitude, dest_pos.longitude)
			]);
		}
		var start_latlng = [
			start_pos.coords.latitude,
			start_pos.coords.longitude
		];
		var curr_marker = L.marker(start_latlng, {
			icon: L.divIcon({
				className: 'icon icon-marker icon-marker-position',
				iconSize: [42, 42],
				iconAnchor: [21, 21],
				popupAnchor: [0, 0]
			})
		}).addTo(map);
		//map.setView(start_latlng, 16);
		var watch = navigator.geolocation.watchPosition(function(curr_pos) {
			var curr_latlng = [
				curr_pos.coords.latitude,
				curr_pos.coords.longitude
			];
			curr_marker.setLatLng(curr_latlng);
		});
	});
}

function create_router(start_pos, dest_pos) {
	var api_key = $(document.body).data('routing-api-key');
	router = L.Routing.control({
		waypoints: [
			L.latLng(start_pos.coords.latitude, start_pos.coords.longitude),
			L.latLng(dest_pos.latitude, dest_pos.longitude)
		],
		router: L.Routing.mapzen(api_key, {
			costing: 'multimodal',
			costing_options: {
				"transit": {
					use_bus: 0.5,
					use_rail: 0.6,
					use_transfers: 0.4
				}
			}
		}),
		formatter: new L.Routing.mapzenFormatter(),
		summaryTemplate: '<div class="start">Directions to <strong>' + document.title + '</strong></div><div class="info {costing}">{time}, {distance}</div>',
		fitSelectedRoutes: true,
		routeWhileDragging: false,
		addWaypoints: false,
		routeLine: function (route, options) {
			return L.Routing.mapzenLine(route, options);
		},
		createMarker: function(i, wp, n) {
			return null;
		},
		pointMarkerStyle: {
			radius: 5,
			color: '#000',
			fillColor: '#fff',
			opacity: 1,
			fillOpacity: 1
		},
		lineOptions: {
			styles: [
				{ color: 'white', opacity: 0.8, weight: 10, dashArray: [1, 10] },
				{ color: '#15c7ff', opacity: 1, weight: 6, dashArray: [1, 10] }
			]
		}
	}).setPosition('topleft').addTo(map);

	router.on('routingerror', function(e) {
		console.log('routingerror', e);
		if (e && e.error && e.error.message) {
			$('.leaflet-routing-alternatives-container').html(
				'<div class="leaflet-routing-alt">' +
				'<div class="start">Directions to <strong>' + document.title + '</strong></div>' +
				'<div class="routing-error">' + e.error.message + '</div>' +
				'</div>'
			);
		}
	});
}
