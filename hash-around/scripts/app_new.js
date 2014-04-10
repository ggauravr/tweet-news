var APP = APP || {};

APP.Maps = (function() {

	var

		mapOptions = {
			zoom: 8,
			center: null,
			mapTypeId: 'roadmap'
		},

		map = null,

		marker = null,

		geocoder = new google.maps.Geocoder(),

		init = function(currentLocation) {

			map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

			bindClick();

		},

		bindClick = function() {

			google.maps.event.addListener(map, 'click', function(evt) {
				APP.Main.update(evt);
			});

		},

		getLocation = function() {

		},

		update = function(currentLocation) {

			var currentPlaceMarker;

			// update the clicked place to be the map's center
			mapOptions.center = new google.maps.LatLng(currentLocation.latitude, currentLocation.longitude);

			// will be called only the very first time
			if (!map) {
				init(currentLocation);
			}

			// update center of the map
			// clear all the markers, and create a new one
			map.setCenter(mapOptions.center);

			currentPlaceMarker = new google.maps.Marker({
				map: map,
				position: mapOptions.center
			});

			if (marker) {
				marker.setMap(null);
			}

			marker = currentPlaceMarker;

			// call geocoder API only if the location is changed, not on every interval call
			if (APP.Main.hasLocationChanged()) {
				
				// get formatted address, via reverse geocoding, then get tweets
				geocoder.geocode({
					latLng: mapOptions.center
				}, function(results, status) {

					// prepare the address.. call get tweets
					if (status == google.maps.GeocoderStatus.OK) {

						var places = results[0].formatted_address.split(','),
							length = places.length,
							place = length > 2 ? isNaN(places[length - 3]) ? places[length - 3] : places[length - 2] : places[length - 2];

						APP.UI.update(place);

						// update the UI with the new location name
						APP.Tweets.get(place, {
							reset: true
						});

					} else {
						alert('GeoCoder Error.. ' + status);
					}
				});
			} else {
				APP.Tweets.get('');
			}


		}

	return {
		init: init,
		update: update
	}

})();

APP.Tweets = (function() {

	var
	interval = 25000,
		intervalID = null,

		resetInterval = function() {
			clearInterval(intervalID);
			intervalID = null;
		},

		getTweets = function(place, param) {

			if (place) {
				APP.UI.update(place);
			}

			if (param && param.reset) {
				resetInterval();
			}

			APP.UI.render();

			var callee = arguments.callee,
				promiseTweets = $.ajax({
					url: getBaseURL() + getQueryParams(),
					type: 'GET',
					dataType: 'json',
					headers: {
						'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAAPEcUQAAAAAAdlMqHKIwXIg4S4tyviSIepy%2FzlU%3Df6FnvB64S3TV1Eu1mqylXvLEsuFlfkPmfQy7tQ4TZ5QmkS4vyP',
						'protocol_version': 1.1,
					}
				});

			promiseTweets.done(function(results) {
				// console.log('Tweets');
				// console.log(results);

				APP.UI.render(results.statuses);

				if (!intervalID) {
					intervalID = setInterval(callee, interval);
				}

			});

		},

		getQueryParams = function() {

			var query = '?count=10&data=1';

			if (APP.UI.getType() == 'about') {
				query += '&q=' + APP.UI.getPlace()
			} else {
				query += '&latitude=' + APP.Main.getCurrentLocation().latitude + '&longitude=' + APP.Main.getCurrentLocation().longitude;
			}

			return query;
		},

		getBaseURL = function() {
			return '/index.php'
		};

	return {
		get: getTweets
	}

})()

APP.Templates = {
	tweetsLoading : '<li class="loading">Loading Tweets.. Please Wait</li>',
	tweet: '<li class="tweet">{text} \
				<br/>\
				by\
				<span class="username">{username}</span>\
			</li>\
			',
	tweetFail: '<li class="tweet">Nothing happening here.. Try some other place ! :)</li>',

	tweetLink: '<a target="_blank" href="{match}">{match}</a>',
	hashLink: '<a target="_blank" href="http://www.twitter.com/search?src=hash&q=%23{hash}" class="hashtag">{match}</a>'
};

APP.Regex = {
	hash: '#[\\w]+',
	link: '(http:\\/\\/[^\\s\\)\\(]+)'
}

APP.UI = (function() {

	var
		type = 'about',
		place = '',

		bindEvents = function() {

			$('.main-navigation li').click(function(e) {
				type = this.getAttribute('id');

				console.log(e, type);

				$('.selected-tab').removeClass('selected-tab');
				$(this).addClass('selected-tab');

				updateLocation(place);

				APP.Tweets.get('', {
					reset: true
				});

			});

			$('.arrow').click(function(e){

				var $this = $(this),
						$mapCanvas = $('#map-canvas');

				if($this.hasClass('showing')){
					$this.removeClass('showing').text('Map');
					$mapCanvas.removeClass('in-view');	
				}
				else{
					$this.addClass('showing').text('Hide')
					$mapCanvas.addClass('in-view');
				}

				
			});

		},

		updateLocation = function(location) {
			place = location;

			$('.keyword').text(type + ' ' + place);
		},

		getType = function() {
			return type;
		},

		getPlace = function() {
			return place;
		},

		renderTweets = function(results) {

			var list = '',
				text,
				i, j, item, tmpl, matches, regex, hash, temp;

			// while loading tweets, before ajax results are fetched

			if(!results){
				list = APP.Templates.tweetsLoading;
				$('#results').html(list);
				return;
			}

			// if no tweets about/around the given place
			if (!results.length) {
				list = APP.Templates.tweetFail;
			} else {
				for (i in results) {

					item = results[i];
					text = item.text;

					tmpl = APP.Templates.tweet;

					matches = text.match(new RegExp(APP.Regex.link, "g"));
					
					for (j in matches) {
						regex = new RegExp(matches[j], "g");
						text = text.replace(regex, APP.Templates.tweetLink.replace(/{match}/g, matches[j]));

					}

					matches = text.match(new RegExp(APP.Regex.hash, "g"));
					for (j in matches) {
						regex = new RegExp(matches[j], "g");
						hash = matches[j].slice(1, matches[j].length);
						text = text.replace(regex, APP.Templates.hashLink.replace(/{match}/g, matches[j]).replace(/{hash}/g, hash));

					}

					tmpl = tmpl.replace(/{text}/, text);
					tmpl = tmpl.replace(/{username}/, item.user.screen_name);

					list += tmpl;
				}

			}

			$('#results').html(list);

		};

	return {
		bindEvents: bindEvents,
		update: updateLocation,
		getType: getType,
		getPlace: getPlace,
		render: renderTweets
	}

})()

APP.Main = (function() {

	/*
		Default : Mountain View, California

		latitude : '37.3894',
        longitude : '-122.0819'
	*/

	var
	isLocationChanged = true,

		defaultLocation = {
			coords: {

				latitude: '37.3894',
				longitude: '-122.0819'

			}

		},

		lastLocation = {
			latitude: null,
			longitude: null
		},

		currentLocation = {
			latitude: null,
			longitude: null
		},

		updateLocation = function(position) {

			if (!position) {
				position: defaultLocation
			}

			// if(position){

			lastLocation.latitude = currentLocation.latitude;
			lastLocation.longitude = currentLocation.longitude;

			if (position.coords) {
				currentLocation.latitude = position.coords.latitude;
				currentLocation.longitude = position.coords.longitude;
			} else if (position.latLng) {
				currentLocation.latitude = position.latLng.lat();
				currentLocation.longitude = position.latLng.lng();
			}

			isLocationChanged = true;
			if (lastLocation.latitude == currentLocation.latitude &&
				lastLocation.longitude == currentLocation.longitude
			) {
				isLocationChanged = false;
			}
			// }

			APP.Maps.update(currentLocation);
		},

		handleGeoLocationError = function(error) {
			/*handle error message*/
			updateLocation();
		},

		init = function() {

			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(updateLocation, handleGeoLocationError);
			} else {

			}

			APP.UI.bindEvents();
		}

	return {
		init: init,
		update: updateLocation,
		hasLocationChanged: function() {
			return isLocationChanged;
		},
		getCurrentLocation: function() {
			return currentLocation;
		}
	}

})();

APP.Main.init();