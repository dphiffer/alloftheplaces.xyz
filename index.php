<?php

if (! file_exists(__DIR__ . '/config.php')) {
	die("Please move config-example.php to config.php");
}
require_once __DIR__ . '/config.php';

$title = 'All of the Places';

if (preg_match('/^\/(\d+)/', $_SERVER['REQUEST_URI'], $matches)) {
	$id = $matches[1];
	$path = '';
	for ($i = 0; $i < strlen("$id"); $i += 3) {
		$path .= substr("$id", $i, 3) . '/';
	}
	$path .= "$id.geojson";
	if (file_exists(__DIR__ . "/cache/$path")) {
		$json = file_get_contents(__DIR__ . "/cache/$path");
	} else {
		$wof_url = "https://whosonfirst.mapzen.com/data/$path";
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $wof_url);
		curl_setopt($ch, CURLOPT_HEADER, 0);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		$json = curl_exec($ch);
		curl_close($ch);
		if (is_writable(__DIR__ . "/cache")) {
			mkdir(dirname(__DIR__ . "/cache/$path"), 0755, true);
			file_put_contents(__DIR__ . "/cache/$path", $json);
		}
	}
	$wof = json_decode($json, 'as hash');
	$props = $wof['properties'];
	if (! empty($props['wof:name'])) {
		$title = $props['wof:name'];
	} else {
		$title = "Place $id";
	}
	if (! empty($props['geom:bbox'])) {
		$bbox = $props['geom:bbox'];
	}
	if (! empty($props['geom:latitude']) &&
	    ! empty($props['geom:longitude'])) {
		$latlng = "{$props['geom:latitude']},{$props['geom:longitude']}";
	}
	if (! empty($props['addr:full'])) {
		$address = $props['addr:full'];
	}
}

?>
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<title><?php echo htmlentities($title); ?></title>
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<link rel="stylesheet" href="https://mapzen.com/js/mapzen.css">
		<link rel="stylesheet" href="https://mapzen.com/common/styleguide/styles/styleguide.css">
		<link rel="stylesheet" href="/lrm-mapzen/dist/leaflet.routing.mapzen.css">
		<link rel="stylesheet" href="/alloftheplaces.css">
		<meta name="id" content="<?php echo htmlentities($props['wof:id']); ?>">
		<?php if (! empty($address)) { ?>
		<meta name="address" content="<?php echo htmlentities($address); ?>">
		<?php } ?>
		<script src="https://mapzen.com/js/mapzen.min.js"></script>
	</head>
	<body data-search-api-key="<?php echo htmlentities($search_api_key); ?>" data-routing-api-key="<?php echo htmlentities($routing_api_key); ?>">
		<div id="map"<?php

			if (! empty($bbox)) {
				echo ' data-bbox="' . htmlentities($bbox) . '"';
			}

			if (! empty($latlng)) {
				echo ' data-latlng="' . htmlentities($latlng) . '"';
			}

		?>></div>
		<script src="https://mapzen.com/common/styleguide/scripts/mapzen-styleguide.min.js"></script>
		<script src="/jquery-3.0.0.min.js"></script>
		<script src="/leaflet-routing-machine/dist/leaflet-routing-machine.min.js"></script>
		<script src="/lrm-mapzen/dist/lrm-mapzen.min.js"></script>
		<script src="/alloftheplaces.js"></script>
	</body>
</html>
