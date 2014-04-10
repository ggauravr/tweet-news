
var geocoder;
var map;
var infowindow = new google.maps.InfoWindow();
var marker;
function initialize() {
  geocoder = new google.maps.Geocoder();


  if(navigator.geolocation){

    navigator.geolocation.getCurrentPosition(showMap);
    
  }

  function showMap(position){
    console.log(position);
  }

  var latlng = new google.maps.LatLng(40.730885,-73.997383);
  var mapOptions = {
    zoom: 8,
    center: latlng,
    mapTypeId: 'roadmap'
  }


  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

  google.maps.event.addListener(map,'click',function(e){
        console.log(e);

        var latitude = e.latLng.lb,
            longitude = e.latLng.mb;

        console.log(latitude, longitude);

        document.getElementById('latlng').value = latitude+","+longitude;

    });
}

function codeLatLng() {
  var input = document.getElementById('latlng').value;
  var latlngStr = input.split(',', 2);
  var lat = parseFloat(latlngStr[0]);
  var lng = parseFloat(latlngStr[1]);
  var latlng = new google.maps.LatLng(lat, lng);

  var tmpl_list = '<li>{text}<br/>by user {username}</li>';

  geocoder.geocode({'latLng': latlng}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      if (results[1]) {
        map.setZoom(11);
        marker = new google.maps.Marker({
            position: latlng,
            map: map
        });

        var place = results[1].formatted_address,
            place_array = place.split(','),
            city = place_array[0],
            state = place_array[1],
            country = place_array[2];

        console.log(place);
        console.log(city, state, country);

        $.ajax({
          type : 'GET',
          url : '/index.php?q='+city,
          headers : {
            'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAAPEcUQAAAAAAdlMqHKIwXIg4S4tyviSIepy%2FzlU%3Df6FnvB64S3TV1Eu1mqylXvLEsuFlfkPmfQy7tQ4TZ5QmkS4vyP',
            'protocol_version' : 1.1,
          },
          dataType : 'json',
          // data : {
          //   'grant_type' : 'client_credentials'
          // },
          success : function(response){
            // console.log(response);
            // response = { searhc_metadata, statuses }

            var list = "", tmpl,
                statuses = response.statuses;

            for(var i in statuses){

              item = statuses[i];

              console.log(item);

              tmpl = tmpl_list;

              tmpl = tmpl.replace(/{text}/, item.text);
              tmpl = tmpl.replace(/{username}/, item.user.screen_name);

              list += tmpl;
            }

            $('#results').html(list);

          }
        });

        infowindow.setContent(results[1].formatted_address);
        infowindow.open(map, marker);
      } else {
        alert('No results found');
      }
    } else {
      alert('Geocoder failed due to: ' + status);
    }
  });



}

google.maps.event.addDomListener(window, 'load', initialize);