<?php // Trips Page

    require __DIR__.'/functions.php';

    $trips_endpoint = 'https://api.bart.gov/api/route.aspx?cmd=routes&key=MW9S-E7SL-26DU-VV8V';

    $request_uri = explode('/', parse_url("from trips".$_SERVER['REQUEST_URI'], PHP_URL_PATH));
    $src_station = $request_uri[5];
    $dest_station = $request_uri[7];

    // $src_station = 'daly';
    // $dest_station = 'lake';
    $source_station_endpoint = 'https://api.bart.gov/api/sched.aspx?cmd=stnsched&orig='.$src_station.'&key=MW9S-E7SL-26DU-VV8V';

    $bartData = load_data($source_station_endpoint);

    $xml = simplexml_load_string($bartData);
    $json = json_encode((array) $xml);

    $json = json_decode($json, true);
    $routes_info = $json['station']['item'];
    $routes = array();

    // print_r($json['station']['item']);

    foreach($routes_info as $route) {
        array_push($routes, $route["@attributes"]['line']);
    }
    $unique_routes = array_unique($routes);
    // print_r($unique_routes);
    // print_r("\n-------------------------------------------\n");

    $route_info = array();
    foreach($unique_routes as $eachRoute) {
        $route_digit = str_replace("ROUTE ", "", $eachRoute);
        $route_info_endpoint = 'https://api.bart.gov/api/route.aspx?cmd=routeinfo&route='.$route_digit.'&key=MW9S-E7SL-26DU-VV8V';

        // print_r($route_info_endpoint);

        $eachRouteData = load_data($route_info_endpoint);
        $routeXml = simplexml_load_string($eachRouteData);
        $routeJson = json_encode((array) $routeXml);
        $routeJson = json_decode($routeJson, true);

        $stations_for_route = $routeJson['routes']['route']['config']['station'];

        if (in_array(strtoupper($dest_station), $stations_for_route)){
            array_push($route_info, $routeJson);
        }
    }
    // print_r($route_info);

    // print_r("Count of routes = ". count($route_info));
    echo json_encode($route_info);