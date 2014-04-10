<?php

$data = array('grant_type' => 'client_credentials');
$data = http_build_query($data);
/*$options =
    array("http"=>
      array(
        "method" => "POST",
        "header" => array(
            'Authorization' => 'Basic ' .  'OUZCVDZJTGhMYTY3cExrUDR0RmVsZzpUQ0JwMzhZV2FmQWVmdTdCRVFTWnhseWdyZUhWM09tQkRaWmlMMHhj',
            'Content-Type' => 'application/x-www-form-urlencoded;charset=UTF-8'
          ),
        "content" => $data
      )
    );*/

$encodedAccessToken = 'OUZCVDZJTGhMYTY3cExrUDR0RmVsZzpUQ0JwMzhZV2FmQWVmdTdCRVFTWnhseWdyZUhWM09tQkRaWmlMMHhj';

$options = array(
    'http' => array(
        'method' => 'POST',
        'header' => 'Authorization: Basic '.$encodedAccessToken."\nContent-Type: application/x-www-form-urlencoded;charset=UTF-8",
        'content' => 'grant_type=client_credentials',
        'protocol_version' => 1.1,
    ),
);

    $url = 'https://api.twitter.com/oauth2/token';
$getField = '?q=sagharbor';
$requestMethod = 'POST';

$context = stream_context_create($options);
// $result = file_get_contents($url, false, $context);

// $result = json_decode($result);

$bearer_token = base64_encode($result->access_token);

if($_GET['q'] != ''){
  $getQuery = '?q=%23'.$_GET['q'];  
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
}

// print '<pre>';
//   print_r(json_decode($result));
// print '</pre>';


// exit;

$settings = array(
    'oauth_access_token' => "17061245-U6KxdNvKuVlIRe9s75tS2tcbQ19IKSSw8FNwlo7f0",
    'oauth_access_token_secret' => "Kdqja998xW7dRzzosvvN6bkGRwPddnxiJTHES1WC2qW97",
    'consumer_key' => "9FBT6ILhLa67pLkP4tFelg",
    'consumer_secret' => "TCBp38YWafAefu7BEQSZxlygreHV3OmBDZZiL0xc"
);

?>

<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
    <meta charset="utf-8">
    <title>Reverse Geocoding</title>
      <script type="text/javascript" src="http://code.jquery.com/jquery-1.10.2.min.js"></script>
    
  <script type="text/javascript">
  console.log($);
    
    $.ajax({
      type : 'GET',
      url : '/index.php?q=columbus',
      headers : {
        'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAAPEcUQAAAAAAdlMqHKIwXIg4S4tyviSIepy%2FzlU%3Df6FnvB64S3TV1Eu1mqylXvLEsuFlfkPmfQy7tQ4TZ5QmkS4vyP',
        'protocol_version' : 1.1,
      },
      // data : {
      //   'grant_type' : 'client_credentials'
      // },
      success : function(response){
        console.log(response);
      }
      
    });


    </script>
  </head>
  <body>
  <p>dsdfdf</p> 
  </body>
  </html>