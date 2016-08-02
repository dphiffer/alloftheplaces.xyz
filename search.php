<?php

include 'config.php';

$path = $_SERVER['REQUEST_URI'];
$url = "https://search.mapzen.com/v1$path";
$rsp = get($url);

extract($rsp); // Set $body, $status, $content_type

if ($status == 200) {
	$search_results = json_decode($body, 'as hash');
	$q = rawurlencode($_GET['text']);
	$extras = rawurlencode('geom:latitude,geom:longitude,geom:bbox');
	$url = "https://whosonfirst.mapzen.com/api/rest/?method=whosonfirst.places.search&q=$q&extras=$extras&access_token=$wof_api_token";
	$rsp = get($url);
	$wof_results = json_decode($rsp['body'], 'as hash');

	foreach ($wof_results['results'] as $wof) {
		$gid = "whosonfirst:{$wof['wof:placetype']}:{$wof['wof:id']}";
		array_unshift($search_results['features'], array(
			'type' => 'Feature',
			'geometry' => array(
				'type' => 'Point',
				'coordinates' => array(
					$wof['geom:longitude'],
					$wof['geom:latitude']
				)
			),
			'properties' => array(
				'id' => $wof['wof:id'],
				'gid' => $gid,
				'layer' => $wof['wof:placetype'],
				'source' => "whosonfirst",
				'source_id' => $wof['wof:id'],
				'name' => $wof['wof:name'],
				'label' => $wof['wof:name']
			),
			'bbox' => $wof['geom:bbox']
		));
	}
	$body = json_encode($search_results);
}

if ($status == 200) {
	$status .= ' OK';
} else {
	$status .= ' Hmmm';
}

header("HTTP/1.0 $status");
header("Content-Type: $content_type");
echo $body;

function get($url) {
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_HEADER, 0);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	$body = curl_exec($ch);
	$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
	curl_close($ch);

	return array(
		'body' => $body,
		'status' => $status,
		'content_type' => $content_type
	);
}
