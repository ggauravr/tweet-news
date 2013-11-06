
var geocoder;
var map;
var infowindow = new google.maps.InfoWindow();
var marker, markers = [], refreshRate = 25000;

var count = 10;

var timeID;

var latitude, longitude, type;

var isZoomed = false;

var tmpl_list = '<li class="tweet">{text}<br/>by <span class="username">{username}</span></li>';

function initialize() {


  $('.about').on('click', function(e){

    $('.selected-tab').removeClass('selected-tab');

    $(this).addClass('selected-tab');

    type = 'about';
    getTweets(latitude, longitude, 'about');
    
  });

  $('.around').on('click',function(e){

    $('.selected-tab').removeClass('selected-tab');
    $(this).addClass('selected-tab');


    console.log('around clicked');

    type = 'around';
    getTweets(latitude, longitude, 'around');

    return false;
  });

  $('.trends').click(function(e){ 

  });

  geocoder = new google.maps.Geocoder();


   if(navigator.geolocation){

    navigator.geolocation.getCurrentPosition(showMap, error_callback);
    
  }
  else{
    // 37.3894° N, 122.0819° W - mountain view
    error_callback();
  }

  function error_callback(){
    $('.error').text('(Please allow this site to access your location to show stuffs happening around you !)');
    showMap({
      coords : {
        latitude : '37.3894',
        longitude : '-122.0819'
      }
    });
  }

  function showMap(position){
    console.log(position);

    latitude  = position.coords.latitude;
    longitude = position.coords.longitude;


    var latlng = new google.maps.LatLng(latitude,longitude);
    console.log(latlng);

    var mapOptions = {
      zoom: 8,
      center: latlng,
      mapTypeId: 'roadmap'
    }


   map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    google.maps.event.addListener(map,'click',function(e){
        
          latitude = e.latLng.lb || e.latLng.nb;
          longitude = e.latLng.mb  || e.latLng.ob;

          
          clearInterval(timeID);
          timeID = null;

          // document.getElementById('latlng').value = latitude+","+longitude;

          // type = 'about';
          getTweets(latitude, longitude, type);

          return false;

      });


    // getTweets(latitude, longitude, 'about');
    $('.about').click();
  }

  function getTweets(lat, lng, type){

      if(!timeID){
        timeID = setInterval(refreshTweets, refreshRate);
      }

      console.log("get tweets called", type);

      var latlng = new google.maps.LatLng(lat, lng);

      console.log('geocode being called');

      geocoder.geocode({'latLng': latlng}, function(results, status) {

        console.log("geocode being returned");

        if (status == google.maps.GeocoderStatus.OK) {
          if (results[1]) {

            if(!isZoomed){
              map.setZoom(11);  
            }
            

            isZoomed = true;
            
            for(var i in markers){
              markers[i].setMap(null);
            }

            marker = new google.maps.Marker({
                position: latlng,
                map: map
            });

            markers.push(marker);

            var place = results[1].formatted_address,
                place_array = place.split(','),
                length = place_array.length,
                city = length-3 >= 0 ? isNaN(parseInt(place_array[length-3])) ? place_array[length-3] : place_array[length-2] : place_array[length-1],
                state = place_array[1],
                country = place_array[2],
                query = '';

            console.log(place);
            console.log(city, state, country);

             if(type == 'about'){
                // $('.caption').text('what people are saying ');
                $('.keyword').text('about '+city);
                query = '?data=1&q='+city+'&count='+count;
              }
              else if(type == 'around'){
                // $('.caption').text('what people are saying in ');
                $('.keyword').text('around '+city);
                query = '?data=1&latitude='+lat+'&longitude='+lng+'&count='+count;
              }
              else if(type == 'trends'){

              }

            // $('.keyword').text(city);
            $('#results').html('loading..');

            $.ajax({
              type : 'GET',
              url : '/index.php'+query,
              headers : {
                'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAAPEcUQAAAAAAdlMqHKIwXIg4S4tyviSIepy%2FzlU%3Df6FnvB64S3TV1Eu1mqylXvLEsuFlfkPmfQy7tQ4TZ5QmkS4vyP',
                'protocol_version' : 1.1,
              },
              dataType : 'json',
              // data : {
              //   'grant_type' : 'client_credentials'
              // },
              success : function(response){
                console.log(response);
                // response = { searhc_metadata, statuses }

                var list = "", tmpl,
                    statuses = response.statuses;

                if(!response.statuses.length){
                  list = '<li class="tweet">Nothing going on here ! Try some other happening place :) </li>';
                }

                else{
                  for(var i in statuses){

                  item = statuses[i];

                  // console.log(item);

                  tmpl = tmpl_list;

                  var matches = item.text.match(/(http:\/\/[^\s)()]+)/g);
                  var regex, hash;

                  for(var i in matches){
                    regex = new RegExp(matches[i]);

                    item.text = item.text.replace(regex, '<a target="_blank" href="'+matches[i]+'">'+matches[i]+'</a>');

                  } 

                  matches = item.text.match(/#[^\s]+/g);
                  for(var i in matches){
                    regex = new RegExp(matches[i]);
                    hash = matches[i].slice(1, matches[i].length);
                    item.text = item.text.replace(regex, '<a target="_blank" href="http://www.twitter.com/search?src=hash&q=%23'+hash+'" class="hashtag">'+matches[i]+'</a>');

                  }

                  tmpl = tmpl.replace(/{text}/, item.text);
                  tmpl = tmpl.replace(/{username}/, item.user.screen_name);

                  list += tmpl;
                }
  
                }
                
                $('#results').html(list);

              }
            });
            

            // if(count == 10){
            //   count = 1;
            // }

            // return false;

            // infowindow.setContent(results[1].formatted_address);
            // infowindow.open(map, marker);
          } else {
            alert('No results found');
          }
        } else {
          alert('Geocoder failed due to: ' + status);
        }
      });

    }

    function refreshTweets(){
      // count = 1;
      getTweets(latitude, longitude, type);
    }

  // timeID = setInterval(refreshTweets, refreshRate);
}

initialize();
// google.maps.event.addDomListener(window, 'load', initialize);