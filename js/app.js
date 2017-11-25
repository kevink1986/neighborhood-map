// Data Model with all locations
var locations = [
    {title: 'Vroezenpark', location: {lat: 51.9312578, lng: 4.4512105}},
    {title: 'Bokaal', location: {lat: 51.9224774, lng: 4.4861631}},
    {title: 'Witte de Withstraat', location: {lat: 51.91571, lng: 4.4752851}},
    {title: 'Erasmusbrug', location: {lat: 51.909004, lng: 4.4849287}},
    {title: 'De Kuip', location: {lat: 51.8939035, lng: 4.5209414}},
    {title: 'Erasmus University', location: {lat: 51.91752, lng: 4.523391}}
];

// Global variables
var map;
var infoWindow;
var bounds;

// Initialize the Google map
function initMap() {
    // Constructor to create a new map JS object.
    // Coordinates of Rotterdam in The Netherlands
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 51.9254108, lng: 4.4730667},
        zoom: 13,
        mapTypeControl: false
    });

    infoWindow = new google.maps.InfoWindow();
    bounds = new google.maps.LatLngBounds();

    ko.applyBindings(new ViewModel());
}

// Location model
var Location = function(data) {
    var self = this;

    this.title = data.title;
    this.position = data.location;

    this.visible = ko.observable(true);

    // Create a marker per location, and put into markers array
    this.marker = new google.maps.Marker({
        position: this.position,
        title: this.title,
        animation: google.maps.Animation.DROP
    });

    self.filterMarkers = ko.computed(function () {
        // Set markers and adjust bounds
        if(self.visible() === true) {
            self.marker.setMap(map);
            bounds.extend(self.marker.position);
            map.fitBounds(bounds);
        } else {
            self.marker.setMap(null);
        }
    });

    // Create an onclick even to open an indowindow at each marker
    this.marker.addListener('click', function() {
        populateInfoWindow(this, infoWindow);
        map.panTo(this.getPosition());
        toggleBounce(this);
    });

    // show item info when selected from list
    this.show = function(location) {
        google.maps.event.trigger(self.marker, 'click');
    };
};

// ViewModel code
var ViewModel = function() {
    var self = this;

    // Knockout variables
    this.filterInput = ko.observable('');
    this.markerArray = ko.observableArray([]);

    // Add all initial locations from the data model to the empty observable array
    locations.forEach(function(locationItem) {
        self.markerArray.push( new Location(locationItem) );
    });

    // locations viewed on map
    this.locationList = ko.computed(function() {
        var filter = self.filterInput().toLowerCase();
        if (filter) {
            return ko.utils.arrayFilter(self.markerArray(), function(location) {
                var str = location.title.toLowerCase();
                var result = str.includes(filter);
                location.visible(result);
                return result;
            });
        } else {
            self.markerArray().forEach(function(location) {
                location.visible(true);
            });
        }
        return self.markerArray();
    }, self);
};

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        // Clear the infowindow content to give the streetview time to load.
        infowindow.setContent('');
        infowindow.marker = marker;

        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });

        // Create the infowindow content for this marker
        infowindow.setContent('<h4>' + marker.title + '</h4>');

        // load wikipedia data
        var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.title + '&format=json&callback=wikiCallback';
        var wikiRequestTimeout = setTimeout(function(){
            $wikiElem.text("failed to get wikipedia resources");
        }, 8000);

        $.ajax({
            url: wikiUrl,
            dataType: "jsonp",
            jsonp: "callback",
            success: function( response ) {
                var articleList = response[1];

                for (var i = 0; i < articleList.length; i++) {
                    articleStr = articleList[i];
                    var url = 'http://en.wikipedia.org/wiki/' + articleStr;
                    $wikiElem.append('<li><a href="' + url + '">' + articleStr + '</a></li>');
                };

                clearTimeout(wikiRequestTimeout);
            }
        });

        // Open the infowindow on the correct marker.
        infowindow.open(map, marker);
    }
}


// This function makes a marker on the map bounce
function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            marker.setAnimation(null);
        }, 2100);
    }
}



// This function shows an error message when google maps cannot be loaded.
function mapsError() {
    $('#errorModal').modal('show')
}
