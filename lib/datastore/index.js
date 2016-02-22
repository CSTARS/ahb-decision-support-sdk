var events = require('events').EventEmitter;
var rest = require('../rest');


function DataStore() {
  this.parcels = []; // all parcels in current range
  this.selectedParcels = []; // selected parcels in current range
  // weather by parcel id
  this.weather = {};
  // soil by parcel id
  this.soil = {};

  this.lat = 0;
  this.lng = 0;
  this.radius = 0;

  this.events = new events();
  this.rest = rest;

  this.getParcels = function(lat, lng, radius, callback, updatesHandler) {
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
    }.bind(this), updatesHandler);
  };

  this.randomizeSelected = function(percent) {
    this.selectPercent = percent;

    this.selectedParcels = [];
    this.parcels.forEach(function(parcel){
      this.selectedParcels.push(parcel);
    }.bind(this));

    var removeCount = Math.floor(this.selectedParcels.length * percent);
    var index;
    for( var i = 0; i < removeCount; i++ ) {
      index = Math.floor(Math.random() * this.selectedParcels.length-1);
      this.selectedParcels.splice(index, 1);
    }
  };

  this.on = function(e, fn) {
    this.events.on(e, fn);
  };
}

require('./weather')(DataStore);
require('./soil')(DataStore);

module.exports = DataStore;
