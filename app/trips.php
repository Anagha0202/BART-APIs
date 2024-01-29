<?php // Trips Page

    require __DIR__.'/functions.php';

    $request_uri = explode('/', parse_url("from trips".$_SERVER['REQUEST_URI'], PHP_URL_PATH));
    $src_station = $request_uri[5];
    $dest_station = $request_uri[7];

    $trips_endpoint = 'https://api.bart.gov/api/sched.aspx?cmd=depart&orig='.$src_station.'&dest='.$dest_station.'&key=MW9S-E7SL-26DU-VV8V';

    $bartData = load_data($trips_endpoint);

    $xml = simplexml_load_string($bartData);
    $json = json_encode((array) $xml);

    // $json = json_decode($json, true);
    echo $json;

