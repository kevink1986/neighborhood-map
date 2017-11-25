// Data model with all locations
var locations = [
    {
        title: 'Rotterdam central station',
        location: {
            lat: 51.924482,
            lng: 4.469478
        }
    },
    {
        title: 'Cube Houses',
        location: {
            lat: 51.920158,
            lng: 4.490702
        }
    },
    {
        title: 'Diergaarde Blijdorp',
        location: {
            lat: 51.927354,
            lng: 4.449141
        }
    },
    {
        title: 'Erasmusbrug',
        location: {
            lat: 51.909004,
            lng: 4.487123
        }
    },
    {
        title: 'Maritime Museum Rotterdam',
        location: {
            lat: 51.917526,
            lng: 4.482227
        }
    },
    {
        title: 'Erasmus University',
        location: {
            lat: 51.917520,
            lng: 4.525585
        }
    }
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

    infoWindow = new google.maps.InfoWindow({
        maxWidth: 200
    });

    bounds = new google.maps.LatLngBounds();

    ko.applyBindings(new ViewModel());
}

// Location model
var Location = function(data) {
    var self = this;

    this.title = data.title;
    this.position = data.location;

    this.visible = ko.observable(true);

    // Create a marker per location
    this.marker = new google.maps.Marker({
        position: this.position,
        title: this.title,
        animation: google.maps.Animation.DROP
    });

    self.markers = ko.computed(function () {
        // Set markers and adjust bounds
        if(self.visible() === true) {
            self.marker.setMap(map);
            bounds.extend(self.marker.position);
            map.fitBounds(bounds);
        } else {
            self.marker.setMap(null);
        }
    });

    // Add onClick event to open infoWindow for each marker
    this.marker.addListener('click', function() {
        populateInfoWindow(this, infoWindow);
        map.panTo(this.getPosition());
        toggleBounce(this);
    });

    // Show item on the map when it is selected in the list in the sidebar
    this.selectLocation = function(clickedLocation) {
        google.maps.event.trigger(self.marker, 'click');
    };

    // This function populates the infoWindow when the marker is clicked. Only one infoWindow
    // can be opened at the same time.
    function populateInfoWindow(marker, infowindow) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
            // Clear the infowindow content
            infowindow.setContent('');
            infowindow.marker = marker;

            // Romove marker if infoWindow is closed
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });

            // Create the infowindow content for this marker
            var windowContent = '<h4>' + marker.title + '</h4>';

            // load wikipedia data
            var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.title + '&format=json&callback=wikiCallback';
            var wikiRequestTimeout = setTimeout(function(){
                infowindow.setContent(windowContent);
                infowindow.open(map, marker);
            }, 8000);

            // AJAX request to load data from Wikipedia
            $.ajax({
                url: wikiUrl,
                dataType: "jsonp",
                jsonp: "callback",
                success: function( response ) {
                    var description = '<p>' + response[2][0] + '</p>';
                    var url = '<p><a target="_blank" href="' + response[3] + '">More info</a></p>';
                    var ref = '<p><small>This information is provided by <a href="http://en.wikipedia.org">Wikipedia</a></small></p>';

                    windowContent = windowContent + description + url + ref;

                    // Add content from Wikipedia to the infoWindow
                    infowindow.setContent(windowContent);

                    // Open the infowindow on the correct marker
                    infowindow.open(map, marker);

                    // Show only the location title if wikipedia does't respond
                    clearTimeout(wikiRequestTimeout);
                }
            });

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

    // Toggle sidebar to show or hide the sidebar on a small screen
    this.toggleSidebar = function() {
        $('.sidebar').toggleClass('active');
    };

    // List of all locations that meet the filter condition. The filter is
    // converted to a lowercase string. This filter string is compared
    // with the title of the location. All locations that contain the
    // filter string are shown.
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

// This function shows an error message when google maps cannot be loaded.
function mapsError() {
    $('#errorModal').modal('show');
}

