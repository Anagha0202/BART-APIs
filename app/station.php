<?php // Station

    require __DIR__.'/functions.php';

    $request_uri = explode('/', parse_url("from trips".$_SERVER['REQUEST_URI'], PHP_URL_PATH));

    $station_abbr = $request_uri[5];
    $station_endpoint = 'https://api.bart.gov/api/stn.aspx?cmd=stninfo&orig=' . $station_abbr . '&key=MW9S-E7SL-26DU-VV8V';

    $bartData = load_data($station_endpoint);

    $xml = simplexml_load_string($bartData);
    $json = json_encode((array) $xml);

    echo $json; 