<?php // Functions

    function load_data($endpoint) {
        $ch = curl_init();
        
        curl_setopt($ch, CURLOPT_URL, $endpoint);
        curl_setopt($ch, CURLOPT_FAILONERROR, 1);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 500);

        $retVal = curl_exec($ch);
        curl_close($ch);

        return $retVal;
    }