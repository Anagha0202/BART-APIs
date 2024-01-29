<?php

// echo $_SERVER['REQUEST_URI'];
$request_uri = explode('/', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$request_uri_page = $request_uri[3];
// print_r("And the per page=".$request_uri_page);
 
if ($request_uri_page === '') {
	
	$route = '/index.html';

}elseif ( $request_uri_page === 'stations' || $request_uri_page === 'stations/') {
	
	$route = '/stations.php';
	
} elseif ($request_uri_page === 'trips' || $request_uri_page === 'trips/') {
	
	$route = '/trips.php';
	
} elseif ($request_uri_page === 'station' || $request_uri_page === 'station/') {
	
	$route = '/station.php';
	
} else {
	
	$route = '/404.php';
	
}

require __DIR__ . $route;
