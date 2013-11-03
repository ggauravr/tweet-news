<?php

if($_GET['q'] != ''){
  $getQuery = '?q=%23'.urlencode($_GET['q']);  
  $url = 'https://api.twitter.com/1.1/search/tweets.json'.$getQuery;

// $url = 'https://api.twitter.com/1.1/statuses/user_timeline.json?count=100&screen_name=twitterapi';

  $options = array(
      'http' => array(
          'method' => 'GET',
          'header' => 'Authorization: Bearer AAAAAAAAAAAAAAAAAAAAAPEcUQAAAAAAdlMqHKIwXIg4S4tyviSIepy%2FzlU%3Df6FnvB64S3TV1Eu1mqylXvLEsuFlfkPmfQy7tQ4TZ5QmkS4vyP',
          'protocol_version' => 1.1,
      ),
  );

  // print_r($options);

  $context = stream_context_create($options);
  $result = file_get_contents($url, false, $context);

  echo $result;

  return;
}


?>


<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
    <meta charset="utf-8">
    <title>Reverse Geocoding</title>
    <style>
      html, body, #map-canvas {
        height: 100%;
        margin: 0px;
        padding: 0px
      }
      #panel {
        position: absolute;
        top: 5px;
        left: 50%;
        margin-left: -180px;
        z-index: 5;
        background-color: #fff;
        padding: 5px;
        border: 1px solid #999;
      }

      #map-canvas{
      	float : right;
      	height : 50%;
      	width : 50%;
      }
    </style>
    <script type="text/javascript" src="http://code.jquery.com/jquery-1.10.2.min.js"></script>
    <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false"></script>
    <script type="text/javascript" src="/scripts/app.js"></script>
    
    <style>
      #panel {
        position: absolute;
        top: 5px;
        left: 50%;
        margin-left: -180px;
        width: 350px;
        z-index: 5;
        background-color: #fff;
        padding: 5px;
        border: 1px solid #999;
      }
      #latlng {
        width: 225px;
      }
    </style>
  </head>
  <body>
    <div id="panel">
      <input id="latlng" type="text" value="40.714224,-73.961452">
      <input type="button" value="Reverse Geocode" onclick="codeLatLng()">
    </div>
    <div id="map-canvas"></div>
    <input type="text" id="longitude" />
    <ul id="results">
    	
    </ul>
  </body>
</html>