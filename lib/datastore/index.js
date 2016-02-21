var events = require('events').EventEmitter;
var rest = require('../rest');


function DataStore() {
  this.parcels = [];
  // weather by parcel id
  this.weather = {};
  // soil by parcel id
  this.soil = {};

  this.lat = 0;
  this.lng = 0;
  this.radius = 0;

  this.events = new events();
  this.rest = rest;

  this.getParcels = function(lat, lng, radius, callback) {
    this.lat = lat;
    this.lng = lng;
    this.radius = radius;

    rest.parcels.get(lat, lng, radius, function(err, features){
      if( err ) {
        if( callback ) callback(err);
        return;
      }

      this.parcels = features;
      if( callback ) callback(null, features);
      this.events.emit('parcels-updated', features);
    }.bind(this));
  };

  this.on = function(e, fn) {
    this.events.on(e, fn);
  };
}

require('./weather')(DataStore);
require('./soil')(DataStore);

module.exports = DataStore;
