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
  this.poplarPrice = 24;

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

      // set a center point
      this.parcels.forEach(function(parcel){
        this.getPointForFeature(parcel);
      }.bind(this));

      if( callback ) callback(null, features);
      this.events.emit('parcels-updated', features);
    }.bind(this), updatesHandler);
  };

  this.getCropTypes = function(callback) {
    rest.cropType.getAll(this.parcels, function(err, resp){
      if( err ) {
        if( callback ) callback(err);
        return;
      }

      // join crop type to geojson
      var parcels = this.parcels;
      resp.forEach(function(item){
        for( var i = 0; i < parcels.length; i++ ) {
          if( parcels[i].properties.PolyID === item.geojson.properties.PolyID ) {
            // TODO: do this w/ the budget stuff, not here
            item.crop.total = item.crop.price * item.crop.yield * parcels[i].properties.GISAcres * parcels[i].properties.PotentiallySuitPctOfParcel * 14;

            parcels[i].properties.ucd.crop = item.crop;


            break;
          }
        }
      });

      if( callback ) callback();
      this.events.emit('crop-types-updated');
    }.bind(this));
  };

  this.getTransportation = function(callback) {
    var stop = [this.lat, this.lng];


    var startingPoints = [];
    this.parcels.forEach(function(parcel){
      var start = parcel.properties.ucd.center;
      start = [start[1], start[0]];
      startingPoints.push(start);
    }.bind(this));

    rest.transportation.getAll(startingPoints, stop, function(err, resp){
      if( err ) {
        if( callback ) callback(err);
        return;
      }
      resp = resp.body;

      if( resp.error ) {
        return console.log(resp.message);
      }

      this.network = {};
      resp.network.features.forEach(function(feature){
        this.network[feature.properties.id] = feature;
      }.bind(this));

      this.networkUse = resp.use;
      this.maxNetworkUse = 1;
      for( var key in this.networkUse ) {
        if( this.networkUse[key] > this.maxNetworkUse ) {
          this.maxNetworkUse = this.networkUse[key];
        }
      }

      for( var i = 0; i < resp.paths.features.length; i++ ) {
        this.parcels[i].properties.ucd.transportation = resp.paths.features[i];
      }

      if( callback ) callback();
      this.events.emit('transportation-updated');
    }.bind(this));
  };

  this.getNetworkPath = function(feature) {
    var collections = {
      type : 'FeatureCollection',
      features : []
    };

    feature.properties.path.forEach(function(id){
      collection.features.push(this.network[id]);
    }.bind(this));

    return collection;
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

  this.resetSelectedParcels = function() {
    this.selectedParcels = [];
  };

  this.selectParcels = function() {
    this.resetSelectedParcels();

    this.parcels.forEach(function(parcel){
      if( !parcel.properties.ucd.harvest ) return;
      var poplarTotal = parcel.properties.ucd.harvest.totalHarvest * this.poplarPrice;

      if( poplarTotal > parcel.properties.ucd.crop.total ) {
        this.selectParcel(parcel);
      }
    }.bind(this));
  };

  this.selectParcel = function(parcel) {
    if( this.selectedParcels.indexOf(parcel) === -1 ) {
      this.selectedParcels.push(parcel);
    }
  };

  // help for getting a useful point from a feature.
  // currently just using the first point in the polygon
  this.getPointForFeature = function(feature) {
    var coords;
    if( feature.geometry.type === 'Polygon' ) {
      coords = feature.geometry.coordinates[0];
    } else if ( feature.geometry.type === 'MultiPolygon' ) {
      coords = feature.geometry.coordinates[0][0];
    }

    if( coords ) {
      var lng = 0; lat = 0;
      for( var i = 0; i < coords.length; i++ ) {
        lng += coords[i][0];
        lat += coords[i][1];
      }
      lng = lng / coords.length;
      lat = lat / coords.length;
      feature.properties.ucd.center = [lng, lat];
      return feature.properties.ucd.center;
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
