<?php // Stations Page

    // echo '<h1>Stations page</h1>';
    require __DIR__.'/functions.php';


    // echo "File called";
    $stations_endpoint = 'https://api.bart.gov/api/stn.aspx?cmd=stns&key=MW9S-E7SL-26DU-VV8V';

    $bartData = load_data($stations_endpoint);

    $xml = simplexml_load_string($bartData);
    $json = json_encode((array) $xml);
    // $json = json_decode($json, true);


    // print_r($json["stations"]);
    echo $json;