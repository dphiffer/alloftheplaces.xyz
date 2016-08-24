<?php

if (! file_exists(__DIR__ . '/config.php')) {
	die("Please move config-example.php to config.php");
}
require_once __DIR__ . '/config.php';

$title = 'All of the Places';
$json = 'null';

if (preg_match('/^\/([^?]+)/', $_SERVER['REQUEST_URI'], $matches)) {

	$id = $matches[1];
	$json = get_place_json($id);
	if (empty($json)) {
		include 'error.html';
		exit;
	}
	$place = json_decode($json, 'as hash');
	$props = $place['properties'];
	if (! empty($props['wof:name'])) {
		$title = "{$props['wof:name']} | All of the Places";
	} else if (! empty($props['name'])) {
		$title = "{$props['name']} | All of the Places";
	} else {
		$title = "Place $id | All of the Places";
	}
	if (! empty($props['geom:bbox'])) {
		$bbox = $props['geom:bbox'];
	} else if (! empty($props['bbox'])) {
		$bbox = $props['bbox'];
	}
	if (! empty($props['geom:latitude']) &&
	    ! empty($props['geom:longitude'])) {
		$latlng = "{$props['geom:latitude']},{$props['geom:longitude']}";
	}
	if (! empty($props['addr:full'])) {
		$address = $props['addr:full'];
	} else if (! empty($props['sg:address'])) {
		$address = $props['sg:address'];
		if (! empty($props['sg:city'])) {
			$address .= ", {$props['sg:city']}";
		}
		if (! empty($props['sg:province'])) {
			$address .= ", {$props['sg:province']}";
		}
		if (! empty($props['sg:postcode'])) {
			$address .= " {$props['sg:postcode']}";
		}
	}
} else if (! empty($_GET['place'])) {
	$json = get_place_json($_GET['place']);
	header('Content-Type: application/json');
	echo $json;
	exit;
}

function get_place_json($id) {
	if (is_numeric($id)) {
		return get_wof_json($id);
	} else if (preg_match('/^whosonfirst:[^:]+:(\d+)$/', $id, $matches)) {
		$wof_id = intval($matches[1]);
		return get_wof_json($wof_id);
	} else {
		$json = get_pelias_json($id);
		$result = json_decode($json, 'as hash');
		return json_encode($result['features'][0], JSON_PRETTY_PRINT);
	}
}

function get_wof_json($id) {
	$path = '';
	for ($i = 0; $i < strlen("$id"); $i += 3) {
		$path .= substr("$id", $i, 3) . '/';
	}
	$path .= "$id.geojson";
	$url = "https://whosonfirst.mapzen.com/data/$path";

	return get_json($path, $url);
}

function get_pelias_json($id) {
	global $search_api_key;
	$path = md5($id) . '.geojson';
	$url = "https://search.mapzen.com/v1/place?ids=$id&api_key=$search_api_key";

	return get_json($path, $url);
}

function get_json($path, $url) {
	global $source_url;

	$cache_path = __DIR__ . "/cache/$path";
	$cache_expiry = time() - 7200;
	$source_url = $url;

	if (file_exists($cache_path) &&
	    filemtime($cache_path) > $cache_expiry &&
	    strpos($_SERVER['REQUEST_URI'], 'nocache') === false) {
		$json = file_get_contents(__DIR__ . "/cache/$path");
	} else {
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_HEADER, 0);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		$json = curl_exec($ch);
		$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

		if ($status > 299) {
			include 'error.html';
			exit;
		}

		curl_close($ch);
		if (is_writable(__DIR__ . "/cache") &&
		    $status == 200) {
			if (! file_exists(dirname($cache_path))) {
				mkdir(dirname($cache_path), 0755, true);
			}
			file_put_contents($cache_path, $json);
		}
	}
	return $json;
}

?>
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<title><?php echo htmlentities($title); ?></title>
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<link rel="stylesheet" href="/lib/bootstrap/css/bootstrap.min.css">
		<link rel="stylesheet" href="https://mapzen.com/js/mapzen.css">
		<link rel="stylesheet" href="https://mapzen.com/common/styleguide/styles/styleguide.css">
		<link rel="stylesheet" href="/lib/lrm-mapzen/dist/leaflet.routing.mapzen.css">
		<link rel="stylesheet" href="/alloftheplaces.css">
		<link rel="shortcut icon" href="https://mapzen.com/common/styleguide/images/favicon.ico">
<?php if (! empty($props['wof:id'])) { ?>
		<meta name="id" content="<?php echo htmlentities($props['wof:id']); ?>">
<?php } ?>
<?php if (! empty($props['gid'])) { ?>
		<meta name="id" content="<?php echo htmlentities($props['gid']); ?>">
<?php } ?>
<?php if (! empty($source_url)) { ?>
		<meta name="source_url" content="<?php echo htmlentities($source_url); ?>">
<?php } ?>
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
		<script>

		var wof = <?php echo $json; ?>;

		</script>
		<script src="/lib/jquery.min.js"></script>
		<script src="/lib/bootstrap/js/bootstrap.min.js"></script>
		<script src="https://mapzen.com/common/styleguide/scripts/mapzen-styleguide.min.js"></script>
		<script src="/lib/leaflet-routing-machine/dist/leaflet-routing-machine.min.js"></script>
		<script src="/lib/lrm-mapzen/dist/lrm-mapzen.js"></script>
		<script src="/lib/mapzen.whosonfirst.data.js"></script>
		<script src="/alloftheplaces.js"></script>
		<?php if (! empty($google_analytics_ua)) { ?>

		<script>(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

		ga('create', '<?php echo $google_analytics_ua; ?>', 'auto');
		ga('send', 'pageview');

		</script>

		<?php } ?>
	</body>
</html>
