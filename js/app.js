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

    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('333333');
    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    var highlightedIcon = makeMarkerIcon('FF0000');

    // Create a marker per location, and put into markers array
    this.marker = new google.maps.Marker({
        position: this.position,
        title: this.title,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon
    });

    self.marker.setMap(map);
    bounds.extend(self.marker.position);
    map.fitBounds(bounds);

    // Create an onclick even to open an indowindow at each marker
    this.marker.addListener('click', function() {
        map.panTo(this.getPosition());
    });

    // Two event listeners - one for mouseover, one for mouseout,
    // to change the colors back and forth.
    this.marker.addListener('mouseover', function() {
        this.setIcon(highlightedIcon);
    });
    this.marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
    });

    // show item info when selected from list
    this.show = function(location) {
        google.maps.event.trigger(self.marker, 'click');
    };
};

// ViewModel code
var ViewModel = function() {
    var self = this;

    this.filterInput = ko.observable('');
    this.markerArray = ko.observableArray([]);

    //Add all initial locations from the data model to the empty observable array
    locations.forEach(function(locationItem) {
        self.markerArray.push( new Location(locationItem) );
    });
};


// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}