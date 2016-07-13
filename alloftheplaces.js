
var marker, router, curr_marker;
var auto_costing = true;
var map_options = {
	scene: '/lib/walkabout/walkabout-style-more-labels.yaml',
	//zoomControl: false,
	scrollWheelZoom: false
};
var is_mobile = (window.innerWidth < 472);
var bounds_tl = is_mobile ? [15, 200] : [320, 30];
var bounds_br = is_mobile ? [15, 15]  : [30, 30];

var routing_tabs = '<div class="routing-tabs">' +
                   '<span class="routing-tab routing-tabs-pedestrian" data-costing="pedestrian">walk</span>' +
                   '<span class="routing-tab routing-tabs-bicycle" data-costing="bicycle">bike</span>' +
                   '<span class="routing-tab routing-tabs-multimodal" data-costing="multimodal">transit</span>' +
                   '<span class="routing-tab routing-tabs-auto" data-costing="auto">drive</span>' +
                   '<br class="clear">' +
                   '</div>';

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
	var wof_name = wof.properties['wof:name'];

	var wof_links = [];

	if (wof.properties['addr:website']) {
		var url = wof.properties['addr:website'];
		if (! url.match(/^http/)) {
			url = 'http://' + url;
		}
		wof_links.push('<a href="' + url + '">Website</a>');
	} else if (wof.properties['sg:website']) {
		var url = wof.properties['sg:website'];
		if (! url.match(/^http/)) {
			url = 'http://' + url;
		}
		wof_links.push('<a href="' + url + '">Website</a>');
	}

	wof_links.push('<a href="https://whosonfirst.mapzen.com/spelunker/id/' + id + '/">Spelunker</a>');
	if (wof.properties['wof:repo']) {
		var path = 'data/' + mapzen.whosonfirst.data.id2relpath(id);
		if (wof.properties['wof:repo'] == 'whosonfirst-data') {
			wof_links.push('<a href="https://github.com/whosonfirst/whosonfirst-data/tree/master/' + path + '">GitHub</a>');
		} else {
			wof_links.push('<a href="https://github.com/whosonfirst-data/' + wof.properties['wof:repo'] + '/tree/master/' + path + '">GitHub</a>');
		}
	}

	if (wof.properties['wof:concordances'] &&
	    wof.properties['wof:concordances']['4sq:id']) {
		wof_links.push('<a href="https://foursquare.com/v/' + wof.properties['wof:concordances']['4sq:id'] + '/">Foursquare</a>');
	}

	var wof_links_list_items = '';
	$.each(wof_links, function(i, link) {
		wof_links_list_items += '<li>' + link + '</li>';
	});

	var popup = '<h4>' + wof_name + '</h4>' + address +
	            '<div class="buttons">' +
	            '<button class="btn btn-mapzen btn-directions">Directions</button>' +
	            '<div class="dropdown">' +
	            '<button class="btn btn-default dropdown-toggle" type="button" id="wof-links" data-toggle="dropdown" aria-haspopup="true">' +
	            'Links <span class="caret"></span>' +
	            '</button>' +
	            '<ul class="dropdown-menu" aria-labelledby="wof-links">' +
	            wof_links_list_items +
	            '</ul>' +
	            '</div>' +
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
	if (wof.geometry && wof.geometry.type != 'Point') {
		var layer = L.geoJson(wof, {
			style: {
				"color": "#ff0066",
				"weight": 2,
				"opacity": 1,
				"fillColor": "#ff69b4",
				"fillOpacity": 0.6
			}
		});
		layer.addTo(map);
	}
}

function get_directions(dest_pos) {

	$('#map').addClass('loading');
	var just_loaded = true;

	navigator.geolocation.watchPosition(function(pos) {
		if (just_loaded) {
			map.closePopup();
			$('#map').removeClass('loading');
		}
		just_loaded = false;

		if (! router) {
			create_router(pos, dest_pos);
		}
		var latlng = [
			pos.coords.latitude,
			pos.coords.longitude
		];
		if (! curr_marker) {
			curr_marker = L.marker(latlng, {
				icon: L.divIcon({
					className: 'icon icon-marker icon-marker-position',
					iconSize: [42, 42],
					iconAnchor: [21, 21],
					popupAnchor: [0, 0]
				})
			}).addTo(map);
			map.setView(latlng, 16);
		}
		curr_marker.setLatLng(latlng);
	});
}

function create_router(start_pos, dest_pos) {
	start_pos = L.latLng(
		start_pos.coords.latitude,
		start_pos.coords.longitude
	);
	dest_pos = L.latLng(dest_pos.latitude, dest_pos.longitude);
	var api_key = $(document.body).data('routing-api-key');
	var dist = start_pos.distanceTo(dest_pos);

	var router_options = {
		costing_options: {
			transit: {
				use_bus: 0.5,
				use_rail: 0.6,
				use_transfers: 0.4
			}
		}
	};

	if (window.localStorage && window.localStorage.costing) {
		router_options.costing = window.localStorage.costing;
	} else if (dist < 1609) {
		router_options.costing = 'pedestrian';
	} else {
		router_options.costing = 'multimodal';
	}

	router = L.Routing.control({
		waypoints: [start_pos, dest_pos],
		router: L.Routing.mapzen(api_key, router_options),
		formatter: new L.Routing.MapzenFormatter({
			units: 'imperial'
		}),
		summaryTemplate: '<div class="start">Directions to <strong>' + wof_name + '</strong></div><div class="info {costing}">{time}, {distance}</div>' + routing_tabs,
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
			styles: get_line_style(router_options.costing)
		},
		collapsible: true
	}).setPosition('topleft').addTo(map);

	router.on('routesfound', function(e) {
		$(document.body).addClass('routing');
		var costing = router.getRouter().options.costing;
		setTimeout(function() {
			$('.routing-tabs .selected').removeClass('selected');
			$('.routing-tabs .routing-tabs-' + costing).addClass('selected');
		}, 0);
	});

	router.on('routingerror', function(e) {
		if (e && e.error && e.error.message) {

			if (auto_costing &&
			    e.error.message == 'Cannot reach destination - too far from a transit stop') {
				router.getRouter().options.costing = 'auto';
				router.options.lineOptions.styles = get_line_style('auto');
				router.route();
				return;
			}

			$('.leaflet-routing-alternatives-container').html(
				'<div class="leaflet-routing-alt">' +
				'<div class="start">Directions to <strong>' + wof_name + '</strong></div>' +
				'<div class="info">Could not find a route</div>' +
				routing_tabs +
				'<div class="routing-error">' + e.error.message + '</div>' +
				'</div>'
			);

			var costing = router.getRouter().options.costing;
			$('.routing-tabs .routing-tabs-' + costing).addClass('selected');
		}
	});

	$('#map').click(function(e) {
		if ($(e.target).hasClass('routing-tab')) {
			auto_costing = false;
			var costing = $(e.target).data('costing');
			$('.routing-tabs .selected').removeClass('selected');
			$(e.target).addClass('selected');
			router.getRouter().options.costing = costing;
			router.options.lineOptions.styles = get_line_style(costing);
			router.route();
			$('.leaflet-routing-alt .info').html('<div class="loading"><div class="loading-spinner-02"></div> Loading route</div>');
			if (window.localStorage) {
				window.localStorage.costing = costing;
			}
		}
	});

	// Adapted from https://mapzen.com/resources/projects/turn-by-turn/demo/demo.js

	// Adjust padding for fitBounds()
	// ==============================
	//
	// See this discussion: https://github.com/perliedman/leaflet-routing-machine/issues/60
	// We override Leaflet's default fitBounds method to use our padding options by
	// default. Thus, LRM calls fitBounds() as is. Additionally, any other scripts
	// that call for fitBounds() can take advantage of the same padding behaviour.
	map.origFitBounds = map.fitBounds;
	map.fitBounds = function (bounds, options) {
		map.origFitBounds(bounds, {
			// Left padding accounts for the narrative window.
			// Top padding accounts for the floating section navigation bar.
			// These conditions apply only when the viewport breakpoint is at
			// desktop screens or higher. Otherwise, assume that the narrative
			// window is not present, and that the section navigation is
			// condensed, so less padding is required on mobile viewports.
			paddingTopLeft: bounds_tl,
			// Bottom and right padding accounts only for slight
			// breathing room, in order to prevent markers from appearing
			// at the very edge of maps.
			paddingBottomRight: bounds_br,
		});
	};

	// Adjust offset for panTo()
	// ==============================
	map.origPanTo = map.panTo;
	// In LRM, coordinate is array format [lat, lng]
	map.panTo = function (coordinate) {
		var offset_x = Math.round((bounds_tl[0] - bounds_br[0]) / 2);
		var offset_y = Math.round((bounds_tl[1] - bounds_br[1]) / 2);
		var x = map.latLngToContainerPoint(coordinate).x - offset_x;
		var y = map.latLngToContainerPoint(coordinate).y - offset_y;
		var point = map.containerPointToLatLng([x, y]);
		map.origPanTo(point);
	};
}

function get_line_style(costing) {
	if (costing == 'pedestrian' ||
	    costing == 'multimodal') {
		return [
			{ color: 'white', opacity: 0.8, weight: 10, dashArray: [1, 10] },
			{ color: '#15c7ff', opacity: 1, weight: 6, dashArray: [1, 10] }
		];
	} else if (costing == 'bicycle') {
		return [
			{ color: 'white', opacity: 0.8, weight: 10, dashArray: [1, 10] },
			{ color: '#0eaf4f', opacity: 1, weight: 6, dashArray: [1, 10] }
		];
	} else {
		return [
			{ color: 'white', opacity: 0.8, weight: 10 },
			{ color: '#ff69b4', opacity: 1, weight: 6 }
		];
	}
}
