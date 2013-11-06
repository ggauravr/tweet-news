<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
    <meta charset="utf-8">
    <title>#HashAround</title>
    <link href="stylesheets/screen.css" rel="stylesheet" type="text/css">
    
    <?php 
      include_once('ganalytics.php');
    ?>

  </head>
  <body class="clearfix page-help">
    <!-- <div id="panel">
      <input id="latlng" type="text" value="40.714224,-73.961452">
      <input type="button" value="Reverse Geocode" onclick="codeLatLng()">
    </div> -->
    <h2 class="app-name"><a href="/">#HashAround</a></h2>
    <span class="error"></span>
	<div class="container">

		<div>


			<h3>Changing location access permissions in Browsers</h3><br/><br/>

			<ul>
				<li><h4>In Chrome</h4>
					<ol>
						<li>Go to chrome://settings</li>
						<li>Click on Show Advanced Settings</li>
						<li>Navigate to Privacy -> Content Settings</li>
						<li>Go to Location -> Manage Exceptions</li>
						<li>Here you can change the sites allowed to access your location<br/><br/><br/></li>
					</ol>
				</li>
				<li><h4>In Firefox</h4>
					<ol>
						<li>Go to Tools -> Page Info</li>
						<li>Navigate to Permissions Tab and Look for Share Location</li>
						<li>Change the settings for the site you are currently viewing</li>
					</ol>
				</li>
			</ul>

			</div>

	</div>

    <footer class="clearfix">
      <p>
       <!--  <a href="/about-site">About the Site</a>&nbsp;&nbsp;|&nbsp;&nbsp; --><a href="/help">Help</a>
      </p>
      
      <p>Site Designed and Developed by Gaurav Ramesh(<a target="_blank" href="http://twitter.com/ggauravr">@ggauravr</a>)</p>
    </footer>

    <script type="text/javascript" src="http://code.jquery.com/jquery-1.10.2.min.js"></script>
    <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false"></script>
    <script type="text/javascript" src="/scripts/app.js"></script>

  </body>
</html>