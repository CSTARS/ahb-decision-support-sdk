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
      this.selectedParcels = [];

      if( callback ) callback(null, features);
      this.events.emit('parcels-updated', features);
    }.bind(this), updatesHandler);
  };

  this.getCropTypes = function(callback) {
    rest.cropType.getAll(this.selectedParcels, function(err, resp){
      if( err ) {
        if( callback ) callback(err);
        return;
      }

      // join crop type to geojson
      var selected = this.selectedParcels;
      resp.forEach(function(item){
        for( var i = 0; i < selected.length; i++ ) {
          if( selected[i].properties.PolyID === item.geojson.properties.PolyID ) {
            selected[i].properties.ucd.cropType = item.crop;
            selected[i].properties.ucd.cropYield = item.yeild;
            break;
          }
        }
      });

      if( callback ) callback();
    }.bind(this));
  };

  this.getTransportation = function(callback) {
    var stop = [this.lat, this.lng];

    var ids = {};
    var startingPoints = [];

    this.selectedParcels.forEach(function(parcel){
      var start = this.getPointForFeature(parcel);
      start = [start[1], start[0]];
      startingPoints.push(start);
      ids[start.join('-')+'-'+stop.join('-')] = parcel;
    }.bind(this));

    rest.transportation.getAll(startingPoints, stop, function(err, resp){
      if( err ) {
        if( callback ) callback(err);
        return;
      }

      // join via id lookup
      resp.forEach(function(item){
        if( !ids[item.id] ) return;
        ids[item.id].properties.ucd.transportation = item.transportation;
      });

      if( callback ) callback();
    }.bind(this));
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

  // help for getting a useful point from a feature.
  // currently just using the first point in the polygon
  this.getPointForFeature = function(feature) {
    if( feature.geometry.type === 'Polygon' ) {
      return feature.geometry.coordinates[0][0];
    } else if ( feature.geometry.type === 'MultiPolygon' ) {
      return feature.geometry.coordinates[0][0][0];
    }
    throw(new Error('Unsupported feature type'));
  };

  this.on = function(e, fn) {
    this.events.on(e, fn);
  };
}

require('./weather')(DataStore);
require('./soil')(DataStore);

module.exports = DataStore;
